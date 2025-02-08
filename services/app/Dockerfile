FROM node:18

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000 --prefer-offline

# Copy all source files
# Instead of copying individual directories, copy everything
# since we have missing dependencies (components, api, onchain directories)
COPY . .

# Set build environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    DISABLE_ESLINT_PLUGIN=true

# Build the app
RUN yarn build

# Start the server
CMD ["yarn", "start"]