# Stage 1: Build the app
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (leveraging cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY tsconfig*.json ./
COPY src ./src/
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine AS production

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy generated prisma client and prisma schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user and switch to it
USER node

EXPOSE 3000

CMD ["node", "dist/main"]
