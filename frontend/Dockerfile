FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace package manifests
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install workspace dependencies
RUN npm install

# Copy frontend application code
COPY frontend ./frontend

# Build argument for production API URL if provided
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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
