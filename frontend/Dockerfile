# Usa la imagen base de Node.js
FROM node:22-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

# Habilitar Corepack para usar Yarn 3+
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

COPY . .

RUN yarn install

ARG NEXT_PUBLIC_BASE_API_KEY
ENV NEXT_PUBLIC_BASE_API_KEY=${NEXT_PUBLIC_BASE_API_KEY}
ENV NEXT_PUBLIC_BASE_URL="https://coinbase-attestation.zk-access.xyz"
ENV NEXT_PUBLIC_BACKEND_URL="https://api.coinbase-attestation.zk-access.xyz"

RUN yarn build

# Etapa 2: Production
FROM node:22-slim

# -- Add curl and any other needed utilities
RUN apt-get update && apt-get install -y curl

WORKDIR /app

RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

# Copy only essential files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/yarn*.lock ./
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js


EXPOSE 3001

CMD ["yarn", "start", "-p", "3001"]