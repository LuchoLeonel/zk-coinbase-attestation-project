# Etapa 1: Build
FROM node:22-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app


RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

COPY . .

RUN yarn install

ARG VITE_PUBLIC_BASE_API_KEY
ENV VITE_PUBLIC_BASE_API_KEY=${VITE_PUBLIC_BASE_API_KEY}

RUN yarn build


FROM node:22-slim

WORKDIR /app

RUN yarn install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["serve", "dist", "-l", "3001"]