# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Baked into the static bundle at build time — the browser calls this URL
# directly, so it must be the host-mapped backend port, not a Docker service name.
ARG VITE_API_URL=http://localhost:8001
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
