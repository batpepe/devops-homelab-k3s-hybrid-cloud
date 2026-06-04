# using a lightweight version of Python
FROM python:3.12-alpine

# Creating a working folder
WORKDIR /app

# Copy the list of dependencies and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the code itself
COPY app.py .

# Open port 8080
EXPOSE 8080

# Launch the app
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:8080", "app:app"]
