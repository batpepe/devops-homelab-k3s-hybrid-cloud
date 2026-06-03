# using a lightweight version of Python
FROM python:3.9-alpine

# Створюємо робочу папку
WORKDIR /app

# Creating a working folder
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the code itself
COPY app.py .

# Open port 8080
EXPOSE 8080

# Запускаємо додаток
CMD ["python", "app.py"]
