# Development stage
FROM oven/bun:1.1.29 as development

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .

# Install localtunnel globally with bun
RUN bun install -g localtunnel

CMD ["sh", "-c", "bun run dev & bun x lt --port 3000 --subdomain threads-bot-api"]

# Production stage
FROM oven/bun:1.1.29 as production

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun run build

# Install localtunnel globally with bun
RUN bun install -g localtunnel

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "bun run start:prod & bun x lt --port 3000 --subdomain threads-bot-api"] 