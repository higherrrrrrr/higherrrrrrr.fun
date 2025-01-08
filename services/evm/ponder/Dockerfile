# Base Image
FROM node:20-bullseye-slim AS base

WORKDIR /app

COPY package.json .
COPY package-lock.json .

# Install deps
FROM base AS dependencies
RUN npm install

# Runtime
FROM base AS runtime
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
CMD ["npx", "ponder", "start"]
