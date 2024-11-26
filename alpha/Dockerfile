FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies using yarn
RUN yarn install

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Run in development mode
CMD ["yarn", "dev"]