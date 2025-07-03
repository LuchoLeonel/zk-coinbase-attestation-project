# Etapa 1: Build
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && apt-get clean && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare yarn@3.2.3 --activate

COPY . .

RUN yarn config set nodeLinker node-modules
RUN yarn install

ARG VITE_PUBLIC_BASE_API_KEY
ENV VITE_PUBLIC_BASE_API_KEY=${VITE_PUBLIC_BASE_API_KEY}

RUN yarn build

# Etapa 2: Runtime
FROM node:22-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && apt-get clean && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare yarn@3.2.3 --activate

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn config set nodeLinker node-modules
RUN yarn install

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./

EXPOSE 3001

CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "5173"]
