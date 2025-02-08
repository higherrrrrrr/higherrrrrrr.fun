FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add python3 make g++ libc6-compat

# Install dependencies first (for better caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000 --prefer-offline

# Copy source code in order of change frequency (least to most frequent)
COPY next.config.js .
COPY public ./public
COPY data ./data
COPY utils ./utils
COPY app ./app

# Set build environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    DISABLE_ESLINT_PLUGIN=true

# Build the app
RUN yarn build

# Start the server
CMD ["yarn", "start"]