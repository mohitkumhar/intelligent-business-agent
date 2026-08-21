-- Deterministic test dataset for the Intelligent Business Agent.
-- Every figure here is chosen so a test query has ONE verifiable correct answer.
-- Reference "today" = 2026-08-21.  Last complete month = July 2026.

BEGIN;

TRUNCATE decision_outcomes, decisions, business_health_scores, alerts,
         daily_transactions, financial_records, products, employees,
         users, roles, businesses RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------- business
INSERT INTO businesses
  (business_id, business_name, industry_type, owner_name, monthly_target_revenue, risk_appetite)
VALUES
  ('816f4134-042b-40a3-a753-a12b2c967a80',
   'Sharma Electronics', 'Retail', 'Rakesh Sharma', 500000.00, 'Medium');

INSERT INTO roles (role_id, business_id, role_name)
VALUES (1, '816f4134-042b-40a3-a753-a12b2c967a80', 'Owner');

-- --------------------------------------------------- monthly financials
-- Story: revenue flat ~450k while expenses climb 300k -> 490k.
-- Profit turns NEGATIVE from Jun 2026. Cash falls 360k (Dec) -> 140k (Jul).
INSERT INTO financial_records
  (business_id, month, year, total_revenue, total_expenses, net_profit, cash_balance, loans_due)
VALUES
  ('816f4134-042b-40a3-a753-a12b2c967a80',  9, 2025, 400000, 300000,  100000, 250000, 150000),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 10, 2025, 420000, 320000,  100000, 265000, 145000),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 11, 2025, 480000, 350000,  130000, 300000, 140000),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 12, 2025, 560000, 400000,  160000, 360000, 135000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  1, 2026, 430000, 380000,   50000, 340000, 130000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  2, 2026, 410000, 385000,   25000, 320000, 125000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  3, 2026, 450000, 400000,   50000, 310000, 120000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  4, 2026, 440000, 420000,   20000, 280000, 115000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  5, 2026, 455000, 445000,   10000, 240000, 110000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  6, 2026, 460000, 470000,  -10000, 195000, 105000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  7, 2026, 448000, 490000,  -42000, 140000, 100000),
  ('816f4134-042b-40a3-a753-a12b2c967a80',  8, 2026, 210000, 250000,  -40000,  98000,  95000);

-- ------------------------------------------------------------- employees
-- 6 Active, monthly payroll exactly 160,000.  2 Left.
INSERT INTO employees (business_id, name, role, salary, status) VALUES
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Anil Verma',    'Sales Executive', 25000, 'Active'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Priya Nair',    'Sales Executive', 25000, 'Active'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Suresh Iyer',   'Store Manager',   30000, 'Active'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Kavita Singh',  'Cashier',         22000, 'Active'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Ramesh Gupta',  'Delivery Staff',  18000, 'Active'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Neha Sharma',   'Accountant',      40000, 'Active'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Vikram Rao',    'Sales Executive', 24000, 'Left'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Deepa Menon',   'Cashier',         21000, 'Left');

-- -------------------------------------------------------------- products
-- "Laptop Pro 14" is deliberately sold BELOW cost (-3,000/unit).
-- "Smartphone A15" has a razor-thin 500/unit (3.4%) margin.
INSERT INTO products (business_id, product_name, cost_price, selling_price, stock_quantity) VALUES
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'LED TV 43 inch',    18000, 21000, 12),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Bluetooth Speaker',  1200,  1500, 80),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Smartphone A15',    14000, 14500, 25),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Washing Machine',   22000, 27000,  5),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Air Conditioner',   28000, 31000,  2),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Laptop Pro 14',     55000, 52000,  3);

-- ------------------------------------------------------- past decisions
-- The ₹50,000 Instagram campaign LOST ₹32,000. This is the ground truth the
-- agent must cite when asked about spending on ads again.
INSERT INTO decisions
  (decision_id, business_id, decision_text, decision_type, decision_score, risk_level, success_probability, status, created_at)
VALUES
  (1, '816f4134-042b-40a3-a753-a12b2c967a80',
   'Spend ₹50,000 on an Instagram ad campaign for festive season',
   'Marketing', 42.00, 'High', 35.00, 'Approved', '2026-05-05'),
  (2, '816f4134-042b-40a3-a753-a12b2c967a80',
   'Hire 2 additional sales executives at ₹25,000/month each',
   'Hiring', 78.00, 'Medium', 72.00, 'Approved', '2025-11-10'),
  (3, '816f4134-042b-40a3-a753-a12b2c967a80',
   'Increase product prices by 8% across all categories',
   'Pricing', 51.00, 'Medium', 48.00, 'Approved', '2026-03-15'),
  (4, '816f4134-042b-40a3-a753-a12b2c967a80',
   'Open a second outlet in Jaipur with ₹8,00,000 setup cost',
   'Expansion', 30.00, 'High', 25.00, 'Modified', '2026-08-01');

INSERT INTO decision_outcomes (decision_id, actual_result, profit_impact, notes, evaluated_at) VALUES
  (1, 'Campaign underperformed. ₹50,000 spent, only ₹18,000 attributable sales.',
      -32000, 'Reach was high but conversion was 0.4%. Audience targeting was too broad.', '2026-06-05'),
  (2, 'Both hires retained. Added roughly ₹85,000 net profit over 6 months.',
       85000, 'Sales coverage improved on weekends.', '2026-05-10'),
  (3, 'Lost 6% of repeat customers. Net effect negative.',
      -15000, 'Price-sensitive segment moved to a competitor.', '2026-05-20');

-- ----------------------------------------------------------- daily txns
-- JULY 2026: expenses sum to exactly 490,000; revenue to exactly 448,000.
INSERT INTO daily_transactions (business_id, transaction_date, type, category, amount, description) VALUES
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-05', 'Expense', 'Salaries',           160000, 'July payroll'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-03', 'Expense', 'Inventory Purchase', 180000, 'Stock refill - TVs and phones'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-01', 'Expense', 'Rent',                45000, 'Shop rent July'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-12', 'Expense', 'Marketing',           50000, 'Instagram + local paper ads'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-08', 'Expense', 'Utilities',           25000, 'Electricity and internet'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-20', 'Expense', 'Logistics',           30000, 'Delivery van fuel and maintenance'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-06', 'Revenue', 'Sales',              128000, 'Week 1 counter sales'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-13', 'Revenue', 'Sales',              105000, 'Week 2 counter sales'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-20', 'Revenue', 'Sales',               98000, 'Week 3 counter sales'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-07-27', 'Revenue', 'Sales',              117000, 'Week 4 counter sales'),
-- AUGUST 2026 (1-21, partial): expenses 250,000; revenue 210,000.
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-08-05', 'Expense', 'Salaries',           160000, 'August payroll'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-08-02', 'Expense', 'Inventory Purchase',  40000, 'Small stock top-up'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-08-01', 'Expense', 'Rent',                45000, 'Shop rent August'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-08-09', 'Expense', 'Utilities',            5000, 'Electricity part payment'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-08-07', 'Revenue', 'Sales',              112000, 'Week 1 counter sales'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', '2026-08-14', 'Revenue', 'Sales',               98000, 'Week 2 counter sales');

-- ----------------------------------------------------------- alerts
INSERT INTO alerts (business_id, alert_type, severity, message, status, created_at) VALUES
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Cash Flow',   'High',   'Cash balance dropped below ₹1,00,000 for the first time in 12 months.', 'Active',   '2026-08-10'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Expense',     'High',   'Expenses have exceeded revenue for 3 consecutive months.',            'Active',   '2026-08-05'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Inventory',   'Medium', 'Air Conditioner stock down to 2 units.',                              'Active',   '2026-08-12'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Margin',      'Medium', 'Laptop Pro 14 is selling below cost price.',                           'Active',   '2026-07-28'),
  ('816f4134-042b-40a3-a753-a12b2c967a80', 'Cash Flow',   'Low',    'Loan instalment of ₹5,000 processed.',                                 'Resolved', '2026-06-15');

-- ------------------------------------------------- business health score
INSERT INTO business_health_scores
  (business_id, cash_score, profitability_score, growth_score, cost_control_score, risk_score, overall_score, calculated_at)
VALUES
  ('816f4134-042b-40a3-a753-a12b2c967a80', 35.00, 28.00, 45.00, 30.00, 62.00, 38.00, '2026-08-20');

COMMIT;
