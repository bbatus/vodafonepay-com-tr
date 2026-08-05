# Multi-stage build for the Payload CMS service — mirrors the root Dockerfile's
# pattern so both services in this repo build/deploy the same way.

ARG NODE_VERSION=24.14.1-slim

FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
  npm install --no-audit --no-fund

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
# A DATABASE_URI isn't needed to produce the build output, but Payload's config
# loader expects the var to be present; a dummy value is fine at build time.
ENV DATABASE_URI="postgres://build:build@localhost:5432/build"
ENV PAYLOAD_SECRET="build-time-placeholder"

RUN npm run build

FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
