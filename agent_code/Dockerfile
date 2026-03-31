# ./agent_code/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Assuming you have a requirements.txt file for your dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# This example assumes you have a 'main.py' with a FastAPI app instance named 'app'.
CMD ["python", "app.py"]

