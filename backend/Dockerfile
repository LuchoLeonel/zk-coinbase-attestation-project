# Etapa 1: Build
FROM node:22-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

RUN apt-get update && apt-get install -y git build-essential python3

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn build

# Etapa 2: Runtime
FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV PORT=5001

EXPOSE 5001

CMD ["yarn", "start"]