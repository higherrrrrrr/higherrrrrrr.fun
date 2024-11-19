FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./
COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build

EXPOSE 3000
ENV PORT 3000

CMD ["yarn", "start"]