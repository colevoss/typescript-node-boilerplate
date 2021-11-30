
# =====================================
# Build Step
# =====================================
FROM node:16 as build

ARG NODE_ENV=production
ENV CI=true
ENV NODE_ENV=${NODE_ENV}

# Install latest npm version
RUN npm i -g npm@latest

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY ./scripts ./scripts

RUN npm ci --production=false

# Build Typescript App
COPY . .
RUN npm run build

# =====================================
# Run Step
# =====================================
FROM node:16-slim

WORKDIR /app

# Intstall prod dependencies
COPY --from=build /app/package*.json ./
COPY ./scripts/prepare.js ./scripts/prepare.js

ENV CI=true

RUN npm ci --production

COPY --from=build /app/build ./build

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Use non-priv `node` user
# @see https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#non-root-user
USER node

EXPOSE 8080

CMD ["node", "./build/index.js"]