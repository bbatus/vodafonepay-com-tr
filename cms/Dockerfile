# Multi-stage build for the Payload CMS service — mirrors the root Dockerfile's
# pattern so both services in this repo build/deploy the same way.

# Alpine base — far fewer OS packages than Debian slim means far fewer
# OS-level CVEs (confirmed via Trivy: Debian slim carried 21 HIGH + 7
# CRITICAL OS findings on this exact image).
ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS dependencies

# Native deps (sharp, etc.) expect glibc-compatible shims on Alpine's musl libc.
RUN apk add --no-cache libc6-compat

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
# `next build` (via @payloadcms/next's withPayload) evaluates payload.config.ts
# at build time to generate the admin panel/type output, and that evaluation
# gets baked into the standalone server bundle — confirmed live: with a
# placeholder here, the RUNTIME container kept signing/verifying JWTs against
# this build-time value regardless of the real PAYLOAD_SECRET passed via
# docker-compose's `environment:` at container start, so every login
# succeeded but every subsequent request's signature check silently failed
# ("logged in but every write 403s with an empty user"). These must be the
# SAME real secret used at runtime — pass them as build args (falls back to a
# placeholder only for builds that don't care about a working admin panel,
# e.g. CI image-scanning).
ARG PAYLOAD_SECRET="build-time-placeholder"
ARG REVALIDATE_SECRET="build-time-placeholder"
ARG PREVIEW_SECRET="build-time-placeholder"
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV REVALIDATE_SECRET=${REVALIDATE_SECRET}
ENV PREVIEW_SECRET=${PREVIEW_SECRET}

RUN npm run build

FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The `node:24-alpine` tag floats, so a stale local pull can ship an
# already-outdated Alpine openssl package (libcrypto3/libssl3) even though
# upstream has since published a patched apk (confirmed via Trivy: HIGH/MEDIUM
# CVEs against libcrypto3/libssl3 on this image). Force the latest patch
# release here in the final stage so the shipped image always carries the
# current fix, independent of when the base layer was last pulled.
RUN apk update && apk upgrade --no-cache libcrypto3 libssl3

COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# npm is never invoked at runtime (only `node server.js` runs here) but the
# base image ships it anyway; its bundled deps carry their own CVEs
# (confirmed via Trivy: brace-expansion, tar, undici, ip-address). Drop it.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

USER node

EXPOSE 3000

CMD ["node", "server.js"]
