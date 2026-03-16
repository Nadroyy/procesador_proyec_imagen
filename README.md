backend/Dockerfile
dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (para construir sharp)
RUN npm ci

# Copiar el resto del código fuente y el archivo de idioma
COPY src/ ./src/
COPY spa.traineddata ./

# No es necesario compilar nada, solo dejar las dependencias listas
# Pero podemos limpiar la cache de npm
RUN npm cache clean --force

# Etapa final para producción (opcional, pero aquí usamos la misma imagen)
FROM node:18-alpine

WORKDIR /app

# Copiar node_modules y código desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/spa.traineddata ./

# Exponer el puerto que usa el backend (por defecto 3000)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "src/app.js"]
2. frontend/Dockerfile
dockerfile
# frontend/Dockerfile
# Etapa 1: Construcción de la aplicación React
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci

# Copiar el código fuente
COPY public/ ./public/
COPY src/ ./src/

# Construir la app (genera la carpeta build)
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos desde la etapa builder
COPY --from=builder /app/build /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Nginx se inicia automáticamente (CMD por defecto)
3. frontend/nginx.conf
nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Manejar rutas de React (SPA)
    location / {
        try_files $uri /index.html;
    }

    # Proxy para las llamadas a la API
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
4. docker-compose.yml
yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mi-procesador-backend
    ports:
      - "3001:3000"   # Mapea puerto 3000 del contenedor al 3001 del host
    environment:
      - PORT=3000
      # Agrega aquí otras variables de entorno si las necesitas
    volumes:
      # Opcional: montar uploads para persistencia (si guardas archivos)
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mi-procesador-frontend
    ports:
      - "3000:80"     # Mapea puerto 80 del contenedor al 3000 del host
    depends_on:
      - backend
    restart: unless-stopped
5. Actualización del README.md (sección Docker)
Puedes agregar esta sección a tu documentación:

markdown
## 🐳 Ejecución con Docker

### Requisitos previos
- Docker y Docker Compose instalados

### Pasos

1. **Clonar o tener el proyecto** con la estructura:
mi-procesador-pagos/
├── backend/
├── frontend/
├── docker-compose.yml
└── ...

text

2. **Construir y levantar los contenedores** (desde la raíz del proyecto):
```bash
docker-compose up --build
Acceder a la aplicación:

Frontend: http://localhost:3000

Backend (API): http://localhost:3001/api/upload (solo para pruebas directas)

Detener los contenedores:

bash
docker-compose down
