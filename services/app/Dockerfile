FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000 --prefer-offline

# Copy all source files
COPY . .

# Set build environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    DISABLE_ESLINT_PLUGIN=true \
    NEXT_SHARP_PATH=/app/node_modules/sharp

# Install additional dependencies needed for sharp
RUN apk add --no-cache python3 make g++

# Rebuild sharp for alpine
RUN npm rebuild sharp

# Build the app
RUN yarn build

# Start the server
CMD ["yarn", "start"]