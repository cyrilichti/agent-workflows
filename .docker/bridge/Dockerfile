FROM node:24-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS base
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN mkdir -p /data /auth /empty && chown node:node /data /auth /empty
COPY --chown=node:node . .
USER node
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.mjs"]

FROM base AS api

FROM base AS codex
USER root
RUN npm install --global @openai/codex@0.159.2 && npm cache clean --force
USER node
ENV CODEX_HOME=/auth
