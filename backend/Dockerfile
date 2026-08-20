FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace package manifests
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install workspace dependencies
RUN npm install

# Copy backend source code and Prisma configuration
COPY backend ./backend

# Generate Prisma Client
WORKDIR /app/backend
RUN npx prisma generate

# Build NestJS backend for production
WORKDIR /app
RUN npm run build:backend

FROM node:22-alpine AS runner

WORKDIR /app

# Install openssl for Prisma binary support on alpine
RUN apk add --no-cache openssl

# Copy workspace dependencies and compiled backend code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend ./backend

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

WORKDIR /app/backend

# Run Prisma schema push & database seeding on startup, then start NestJS server
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/src/main.js"]
