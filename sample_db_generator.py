import psycopg2
import random
from faker import Faker
from datetime import datetime, timedelta
import calendar
import uuid
import os

fake = Faker()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:root@localhost:5432/test_db",
)

# Overwrite for local script execution if it reads the docker string from .env
if "db:5432" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("db:5432", "localhost:5432")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cursor = conn.cursor()

# Attempt to load schema if tables don't exist
cursor.execute("SELECT to_regclass('public.businesses')")
if cursor.fetchone()[0] is None:
    print("Schema missing. Applying company_db_schema.sql...")
    schema_path = os.path.join(os.path.dirname(__file__), "company_db_schema.sql")
    if os.path.exists(schema_path):
        with open(schema_path, "r", encoding="utf-8") as f:
            # psycopg2 cannot execute multiple statements in one call with parameters, 
            # but it can execute a raw script string. We need to commit it.
            cursor.execute(f.read())
        conn.commit()
        print("Schema applied.")
        # Sometimes connection state is messy after executing a massive script.
        # Re-initialize the connection.
        cursor.close()
        conn.close()
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
    else:
        print(f"Warning: {schema_path} not found. Script may fail if tables are missing.")

conn.autocommit = False

# -------------------------------
# HELPER DATA
# -------------------------------
industries = ["Retail", "Food", "Tech", "Healthcare", "Finance"]
risk_levels = ["Low", "Medium", "High"]
revenue_categories = ["Product Sales", "Online Orders", "Subscription", "Services"]
expense_categories = ["Rent", "Salary", "Utilities", "Marketing", "Inventory"]
roles_list = ["Admin", "Manager", "Staff"]
product_names = ["Laptop", "Phone", "Shoes", "Burger", "Medicine", "Software", "Headphones", "Monitor"]
decision_types = ["Marketing", "Hiring", "Pricing", "Expansion"]
alert_types = ["Cash Flow", "Revenue Drop", "High Expense", "Inventory Issue"]

# -------------------------------
# 1. CREATE SINGLE BUSINESS
# -------------------------------
# The backend expects DEFAULT_BUSINESS_ID to be 816f4134-042b-40a3-a753-a12b2c967a80 
business_id = "816f4134-042b-40a3-a753-a12b2c967a80"

# Check if business exists, if not create it
cursor.execute("SELECT business_id FROM businesses WHERE business_id = %s", (business_id,))
if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO businesses (business_id, business_name, industry_type, owner_name, monthly_target_revenue, risk_appetite)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (business_id, "Urban Retail Store", random.choice(industries), fake.name(), 250000, random.choice(risk_levels)))
conn.commit()

# -------------------------------
# 2. ROLES + USERS
# -------------------------------
role_ids = []
for role in roles_list:
    cursor.execute("""
        INSERT INTO roles (business_id, role_name, description)
        VALUES (%s, %s, %s) RETURNING role_id
    """, (business_id, role, f"{role} role"))
    role_id = cursor.fetchone()[0]
    role_ids.append(role_id)
    cursor.execute("""
        INSERT INTO users (business_id, role_id, name, email, password_hash)
        VALUES (%s, %s, %s, %s, %s)
    """, (business_id, role_id, fake.name(), fake.unique.email(), "hashed_password"))
conn.commit()

# -------------------------------
# 3. PRODUCTS
# -------------------------------
product_ids = []
for p_name in product_names:
    cost = random.randint(100, 1000)
    sell = cost + random.randint(50, 500)
    cursor.execute("""
        INSERT INTO products (business_id, product_name, cost_price, selling_price, stock_quantity)
        VALUES (%s, %s, %s, %s, %s) RETURNING product_id
    """, (business_id, p_name, cost, sell, random.randint(10, 200)))
    product_ids.append(cursor.fetchone()[0])
conn.commit()

# -------------------------------
# 4. DEPARTMENTS & EMPLOYEES
# -------------------------------
department_ids = []
for dept in ["Sales", "Engineering", "HR", "Marketing"]:
    cursor.execute("""
        INSERT INTO departments (business_id, name) VALUES (%s, %s) RETURNING department_id
    """, (business_id, dept))
    department_ids.append(cursor.fetchone()[0])

employee_ids = []
for _ in range(8):
    cursor.execute("""
        INSERT INTO employees (business_id, name, role, salary, status)
        VALUES (%s, %s, %s, %s, %s) RETURNING employee_id
    """, (business_id, fake.name(), random.choice(["Sales", "Manager", "Support"]), random.randint(20000, 80000), random.choice(["Active", "Left"])))
    employee_ids.append(cursor.fetchone()[0])

# Assign managers to departments & employees to departments
for dept_id in department_ids:
    cursor.execute("UPDATE departments SET manager_id = %s WHERE department_id = %s", (random.choice(employee_ids), dept_id))

for emp_id in employee_ids:
    cursor.execute("UPDATE employees SET department_id = %s WHERE employee_id = %s", (random.choice(department_ids), emp_id))
conn.commit()

# -------------------------------
# 5. CUSTOMERS & SUPPLIERS
# -------------------------------
customer_ids = []
for _ in range(20):
    cursor.execute("""
        INSERT INTO customers (business_id, name, email, phone, address)
        VALUES (%s, %s, %s, %s, %s) RETURNING customer_id
    """, (business_id, fake.name(), fake.email(), fake.phone_number(), fake.address()))
    customer_ids.append(cursor.fetchone()[0])

for _ in range(5):
    cursor.execute("""
        INSERT INTO suppliers (business_id, name, contact_name, phone, email)
        VALUES (%s, %s, %s, %s, %s)
    """, (business_id, fake.company(), fake.name(), fake.phone_number(), fake.email()))
conn.commit()

# -------------------------------
# 6. ORDERS, INVOICES, PAYMENTS & LOGS
# -------------------------------
start_date = datetime.now() - timedelta(days=90)
for day in range(90):
    current_date = start_date + timedelta(days=day)
    
    # Generate some orders for the day
    for _ in range(random.randint(2, 10)):
        customer_id = random.choice(customer_ids)
        total_amount = 0
        
        cursor.execute("""
            INSERT INTO orders (business_id, customer_id, order_date, status)
            VALUES (%s, %s, %s, 'Completed') RETURNING order_id
        """, (business_id, customer_id, current_date))
        order_id = cursor.fetchone()[0]
        
        # Order items
        for _ in range(random.randint(1, 4)):
            prod_id = random.choice(product_ids)
            qty = random.randint(1, 5)
            # fetch price
            cursor.execute("SELECT selling_price FROM products WHERE product_id = %s", (prod_id,))
            price = cursor.fetchone()[0]
            item_total = float(price) * qty
            total_amount += item_total
            
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, prod_id, qty, price, item_total))
            
            # Inventory log
            cursor.execute("""
                INSERT INTO inventory_logs (product_id, change_quantity, log_type, log_date, description)
                VALUES (%s, %s, 'Sale', %s, 'Sold via order')
            """, (prod_id, -qty, current_date))
        
        # Update order total
        cursor.execute("UPDATE orders SET total_amount = %s WHERE order_id = %s", (total_amount, order_id))
        
        # Invoices and Payments
        cursor.execute("""
            INSERT INTO invoices (order_id, invoice_date, due_date, status)
            VALUES (%s, %s, %s, 'Paid') RETURNING invoice_id
        """, (order_id, current_date, current_date + timedelta(days=30)))
        invoice_id = cursor.fetchone()[0]
        
        cursor.execute("""
            INSERT INTO payments (invoice_id, payment_date, amount, payment_method)
            VALUES (%s, %s, %s, %s)
        """, (invoice_id, current_date, total_amount, random.choice(["Credit Card", "Bank Transfer", "PayPal"])))
        
        # Add to daily_transactions for dashboard compatibility
        cursor.execute("""
            INSERT INTO daily_transactions (business_id, transaction_date, type, category, amount, description)
            VALUES (%s, %s, 'Revenue', 'Product Sales', %s, 'Sale from Order')
        """, (business_id, current_date.date(), total_amount))

    # Generate some expenses in daily_transactions
    for _ in range(random.randint(1, 3)):
        cursor.execute("""
            INSERT INTO daily_transactions (business_id, transaction_date, type, category, amount, description)
            VALUES (%s, %s, 'Expense', %s, %s, 'Daily expense')
        """, (business_id, current_date.date(), random.choice(expense_categories), round(random.uniform(50, 500), 2)))

conn.commit()

# -------------------------------
# 7. FINANCIAL RECORDS (MONTHLY)
# -------------------------------
# Generate 24 months (2 years) of historical financial records instead of just 3
current_date = datetime.now()
for i in range(24):
    # Calculate the month and year by subtracting 'i' months from the current date
    month = current_date.month - i
    year = current_date.year
    while month <= 0:
        month += 12
        year -= 1
        
    revenue = random.randint(150000, 500000)
    expenses = random.randint(80000, 300000)
    cursor.execute("""
        INSERT INTO financial_records (business_id, month, year, total_revenue, total_expenses, net_profit, cash_balance, loans_due)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (business_id, month, year, revenue, expenses, revenue - expenses, random.randint(20000, 100000), random.randint(0, 50000)))
conn.commit()

# -------------------------------
# 8. DECISIONS + OUTCOMES
# -------------------------------
decision_ids = []
for _ in range(15):
    cursor.execute("""
        INSERT INTO decisions (business_id, decision_text, decision_type, decision_score, risk_level, success_probability, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING decision_id
    """, (business_id, fake.sentence(), random.choice(decision_types), round(random.uniform(1, 10), 2), random.choice(risk_levels), round(random.uniform(0, 1), 2), random.choice(["Approved", "Rejected", "Modified"])))
    decision_ids.append(cursor.fetchone()[0])

for d_id in decision_ids:
    cursor.execute("""
        INSERT INTO decision_outcomes (decision_id, actual_result, profit_impact, notes, evaluated_at)
        VALUES (%s, %s, %s, %s, %s)
    """, (d_id, random.choice(["Success", "Failure"]), random.randint(-5000, 20000), fake.sentence(), datetime.now()))
conn.commit()

# -------------------------------
# 9. ALERTS & HEALTH SCORES
# -------------------------------
for _ in range(25):
    cursor.execute("""
        INSERT INTO alerts (business_id, alert_type, severity, message, status)
        VALUES (%s, %s, %s, %s, %s)
    """, (business_id, random.choice(alert_types), random.choice(["Low", "Medium", "High"]), fake.sentence(), random.choice(["Active", "Resolved"])))

for _ in range(15):
    cursor.execute("""
        INSERT INTO business_health_scores (business_id, overall_score, cash_score, profitability_score, growth_score, cost_control_score, risk_score)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (business_id, round(random.uniform(1, 10), 2), round(random.uniform(1, 10), 2), round(random.uniform(1, 10), 2), round(random.uniform(1, 10), 2), round(random.uniform(1, 10), 2), round(random.uniform(1, 10), 2)))

conn.commit()
cursor.close()
conn.close()

print("Data inserted successfully")


