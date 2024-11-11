# Development stage
FROM oven/bun:1.1.29 as development

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .

# Install localtunnel
RUN bun add -g localtunnel

CMD ["sh", "-c", "bun run dev & lt --port 3000 --subdomain threads-bot-api"]

# Production stage
FROM oven/bun:1.1.29 as production

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun run build

# Install localtunnel
RUN bun add -g localtunnel

ENV NODE_ENV=production
EXPOSE 3000

# Start both the application and localtunnel
CMD ["sh", "-c", "bun run start:prod & lt --port 3000 --subdomain threads-bot-api"] 