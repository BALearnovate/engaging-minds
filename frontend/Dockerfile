FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace package manifests
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install workspace dependencies
RUN npm install

# Copy frontend application code
COPY frontend ./frontend

# Build React Vite application for production
RUN npm run build:frontend

FROM node:22-alpine AS runner

WORKDIR /app/frontend

# Copy compiled SPA bundle
COPY --from=builder /app/frontend/dist ./dist
COPY --from=builder /app/frontend/package.json ./package.json

EXPOSE 5173

# Serve production SPA on port 5173
CMD ["npx", "--yes", "serve", "-s", "dist", "-l", "5173"]
