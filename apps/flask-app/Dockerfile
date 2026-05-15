# Використовуємо легку базову версію Python
FROM python:3.9-alpine

# Створюємо робочу папку
WORKDIR /app

# Копіюємо список залежностей і встановлюємо їх
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо сам код
COPY app.py .

# Відкриваємо порт 8080
EXPOSE 8080

# Запускаємо додаток
CMD ["python", "app.py"]
