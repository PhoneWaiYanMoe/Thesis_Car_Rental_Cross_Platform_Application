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

EXPOSE 3008

CMD ["npm", "run", "dev"]

# ==================== PROD ====================
FROM base AS production

RUN npm install --omit=dev

COPY . .

EXPOSE 3008

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3008/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]