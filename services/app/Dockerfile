# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json yarn.lock ./

# Install dependencies with specific optimizations
RUN yarn install --frozen-lockfile --network-timeout 600000 \
    --prefer-offline \
    --production=false

# Copy only necessary source files
COPY next.config.js .
COPY public ./public
COPY app ./app
COPY utils ./utils
COPY data ./data

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DISABLE_ESLINT_PLUGIN=true

# Build the app
RUN yarn build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true \
    --prefer-offline \
    --network-timeout 600000

# Copy only the necessary built files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set runtime environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Use node directly instead of yarn for smaller footprint
CMD ["node", "server.js"]