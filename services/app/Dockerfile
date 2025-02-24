# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ py3-pip

# Copy only package files first
COPY package.json ./

# Install dependencies without frozen-lockfile
RUN yarn install --network-timeout 600000

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Set build environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DISABLE_ESLINT_PLUGIN=true

# Copy deps from previous stage and source files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN yarn build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_SHARP_PATH=/app/node_modules/sharp

# Install only production dependencies
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Start the server
CMD ["node", "server.js"]