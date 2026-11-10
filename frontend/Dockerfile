# syntax=docker/dockerfile:1
# Shortly web image — multi-stage build.

# ---- Stage 1: builder — install dev dependencies and build static files ----
FROM node:20.18-alpine3.20 AS builder
WORKDIR /app
# Dependency manifests first so `npm ci` is cached until they change.
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Stage 2: runtime — Nginx serves /dist and proxies /api to the API ----
FROM nginx:1.27.3-alpine AS runtime
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist ./
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
