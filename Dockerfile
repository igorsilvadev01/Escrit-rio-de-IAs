FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY editor/ editor/
COPY scripts/build.cjs scripts/build.cjs
RUN npm run build

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates docker.io \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --chown=node:node *.js *.cjs *.css index.html package.json ./
COPY --chown=node:node docs/ docs/
COPY --chown=node:node public-art/ public-art/
COPY --chown=node:node office-logo.svg ./
COPY --chown=node:node scripts/image-smoke.cjs scripts/image-smoke.cjs
COPY --from=build --chown=node:node /app/assets/ assets/
RUN mkdir -p /data && chown node:node /data
ENV NODE_ENV=production FIRMA_HOST=0.0.0.0 FIRMA_DATA_DIR=/data FIRMA_READ_ONLY_ROOT=1
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.cjs"]
