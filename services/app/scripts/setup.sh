#!/bin/bash

# Create development directories
mkdir -p data/postgres
mkdir -p data/redis

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker first."
    exit 1
fi

# 2. Start PostgreSQL
docker run -d \
    --name higherrrrrr-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=higherrrrrr \
    -p 5432:5432 \
    -v $(pwd)/data/postgres:/var/lib/postgresql/data \
    postgres:14

# 3. Start Redis
docker run -d \
    --name higherrrrrr-redis \
    -p 6379:6379 \
    -v $(pwd)/data/redis:/data \
    redis:7

# 4. Wait for services to be ready
sleep 5

# 5. Run database migrations
npx prisma migrate dev

# 6. Generate Prisma client
npx prisma generate 