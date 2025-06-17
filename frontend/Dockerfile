# Etapa 1: Build
FROM node:22-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

RUN sed -i 's|http://deb.debian.org|http://deb.debian.org|g' /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install

ARG VITE_PUBLIC_BASE_API_KEY
ENV VITE_PUBLIC_BASE_API_KEY=${VITE_PUBLIC_BASE_API_KEY}

RUN npm run build


FROM node:22-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["serve", "dist", "-l", "3001"]