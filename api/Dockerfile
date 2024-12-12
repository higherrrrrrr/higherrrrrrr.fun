FROM python:3.11.11-alpine

# Set working directory
WORKDIR /app

# Update package index and install git
RUN apk update && apk add --no-cache git

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Cloud Run will provide PORT environment variable
ENV PORT=5000

# Run gunicorn
CMD ["gunicorn", "--bind", ":$PORT", "app:app"]
