FROM node:24-bookworm-slim AS base
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
