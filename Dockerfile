# RadiantPlay production image — multi-stage.
# Stage 1 builds the Vite app on Node 22 (Vite 7 needs 20.19+/22.12+).
# Stage 2 serves the built static files via nginx with SPA fallback.

# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
