# syntax=docker/dockerfile:1
# Shortly API image — multi-stage build.

# ---- Stage 1: builder — install production dependencies only ----
FROM node:20.18-alpine3.20 AS builder
WORKDIR /app
# Copy dependency manifests first so this layer is cached until they change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Stage 2: runtime — only node_modules + source, no npm cache ----
FROM node:20.18-alpine3.20 AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Run as the unprivileged user shipped with the Node image.
USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1

CMD ["node", "src/server.js"]
