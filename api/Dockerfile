FROM python:3.11-slim-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y git

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=5000

CMD ["gunicorn", "--bind", ":$PORT", "app:app"]
