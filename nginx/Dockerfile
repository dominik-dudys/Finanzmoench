# Stage 1: Frontend bauen
FROM node:24-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: nginx mit dem fertigen Build ausliefern
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html