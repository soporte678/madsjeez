# Dockerfile para Railway
# Cache buster: 2026-04-24-20-10
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Instalar dependencias (sin caché)
RUN npm install --no-cache
RUN cd apps/web && npm install --no-cache

# Copiar todo el código (invalida cache)
COPY . .

# Build
RUN cd apps/web && npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["sh", "-c", "cd apps/web && npm start"]
