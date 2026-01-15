FROM node:22-slim

WORKDIR /app

# install dependencies for native modules, if needed
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3007

CMD ["npm", "run", "dev"]