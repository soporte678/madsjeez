# Dockerfile para Railway
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Instalar dependencias
RUN npm install
RUN cd apps/web && npm install

# Copiar todo el código
COPY . .

# Build
RUN cd apps/web && npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["sh", "-c", "cd apps/web && npm start"]
