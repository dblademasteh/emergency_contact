# ---------- Dependency stage ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prisma.config.ts reads env("DATABASE_URL"), which is unset during `docker build`
# (it's only supplied at runtime via docker-compose). `prisma generate` does not
# connect to the DB, so a placeholder is enough to load the config.
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder}

# Generate the Prisma client for the target platform (ARM64 on the NAS)
RUN npx prisma generate

# Build the Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Runner stage ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs prisma.config.ts ./prisma.config.ts
COPY --chown=nextjs:nodejs tsconfig.json ./tsconfig.json

USER nextjs
EXPOSE 3000

# Migrate on boot, then start the production server.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]