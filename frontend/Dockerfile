# Etapa 1: Build
FROM node:22-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

# Instalar dependencias para compilación de paquetes nativos
RUN apt-get update && apt-get install -y python3 make g++ && apt-get clean

COPY . .

# Instalar dependencias
RUN npm install

# Variable de entorno (se toma en tiempo de build)
ARG VITE_PUBLIC_BASE_API_KEY
ENV VITE_PUBLIC_BASE_API_KEY=${VITE_PUBLIC_BASE_API_KEY}

# Build del frontend Vite
RUN npm run build

# Etapa 2: Servidor de producción con static files
FROM node:22-slim

WORKDIR /app

# Instalar un servidor web estático (ej: serve)
RUN npm install -g serve

# Copiar archivos generados y necesarios
COPY --from=builder /app/dist ./dist

# Puerto por defecto
EXPOSE 3001

# Servir la app
CMD ["serve", "dist", "-l", "3001"]