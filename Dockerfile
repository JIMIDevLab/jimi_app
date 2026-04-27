# syntax=docker/dockerfile:1.6

# ---- Stage 1: build the static Expo Web bundle ------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# The API URL is baked into the JS bundle at build time, so the same Docker
# image is environment-specific. Override per environment:
#   docker compose build --build-arg EXPO_PUBLIC_API_URL=https://api.example.com
ARG EXPO_PUBLIC_API_URL=https://jimi-api.julsql.fr
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .
RUN npm run build:web


# ---- Stage 2: serve the static bundle via nginx -----------------------------
FROM nginx:1.27-alpine AS runtime

# Lightweight curl/wget for healthcheck (alpine ships busybox wget already)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --spider http://localhost/healthz || exit 1
