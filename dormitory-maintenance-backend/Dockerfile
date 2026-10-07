# =========================
# Stage 1: Build
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Prisma configuration and schema
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate
RUN npx prisma migrate

# Application source
COPY tsconfig*.json ./
COPY src ./src/

# Build application
RUN npm run build


# =========================
# Stage 2: Production
# =========================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Prisma configuration and schema
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma

# Prisma generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Compiled application
COPY --from=builder /app/dist ./dist

# Startup script
COPY docker/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Run as non-root
USER node

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]