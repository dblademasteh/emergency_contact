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

# Normalize file modes: deploy flows on the NAS (tarball extracts as root) can
# leave context files unreadable (mode 000), which breaks the non-root runner.
RUN chmod -R a+rX /app

# drizzle-kit reads DATABASE_URL from the shell env (set at runtime via
# docker-compose). A placeholder keeps config loading happy during build.
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder}

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
COPY --from=builder /app/db ./db
COPY --from=builder /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

USER nextjs
EXPOSE 3000

# Apply migrations on boot, then start the production server.
CMD ["sh", "-c", "npx drizzle-kit migrate && npm run start"]
