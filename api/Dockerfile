# Use Python 3.9 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt


# Copy the rest of the application
COPY . .

# Cloud Run will provide PORT environment variable
ENV PORT=5000

# Run gunicorn
CMD exec gunicorn --bind :$PORT app:app