# Dockerfile para Railway - Root directory: /apps/web
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de configuración (ya estamos en apps/web)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código
COPY . .

# Build
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
