# Pulsewave Server: private family music server
# Build from the repository root:  docker build -f server/Dockerfile -t pulsewave-server .
FROM node:22.11.0-alpine3.20
LABEL org.opencontainers.image.title="Pulsewave Server" \
      org.opencontainers.image.description="Private family music server for Pulsewave. Created by Ryan Ocbina Barnal." \
      org.opencontainers.image.source="https://github.com/ryanbarnal/pulsewave" \
      org.opencontainers.image.licenses="GPL-3.0-only"
ENV NODE_ENV=production PORT=8095 MUSIC_DIR=/music DATA_DIR=/data WEB_DIR=/app/web
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server/server.mjs ./
COPY web/ /app/web/
VOLUME ["/data"]
EXPOSE 8095
HEALTHCHECK --interval=60s --timeout=5s CMD wget -qO- http://127.0.0.1:8095/api/info >/dev/null || exit 1
CMD ["node", "server.mjs"]
