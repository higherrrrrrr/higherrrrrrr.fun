FROM node:20-alpine

WORKDIR /app

# Install build dependencies and encoding
RUN apk add --no-cache python3 make g++ gcc
RUN npm install -g encoding pino-pretty

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies including dev dependencies
RUN yarn install --production=false

# Copy the rest of the app
COPY . .

# Build the app
RUN yarn build

EXPOSE 3000

# Start the app
CMD ["yarn", "start"]