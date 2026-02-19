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

EXPOSE 3009

CMD ["npm", "run", "dev"]

# ==================== PROD ====================
FROM base AS production

RUN npm ci --only=production

COPY . .

EXPOSE 3009

HEALTHCHECK --interval=15s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3009/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]