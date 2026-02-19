# ==================== BASE ====================
FROM node:22-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# ==================== DEV ====================
FROM base AS development

RUN npm ci

COPY . .

EXPOSE 3001 50053

CMD ["npm", "run", "dev"]

# ==================== PROD ====================
FROM base AS production

RUN npm ci --only=production

COPY . .

EXPOSE 3001 50053

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "require('net').connect(50053,'localhost').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]