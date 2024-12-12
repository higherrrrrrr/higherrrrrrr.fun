
FROM python:3.11.11-alpine

# Set working directory
WORKDIR /app

RUN apt-get update && apt-get install -y git

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