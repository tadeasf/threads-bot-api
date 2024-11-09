# Development stage
FROM oven/bun:1.1.29 as development

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1.1.29 as production

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY --from=development /app/dist ./dist
COPY --from=development /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "start:prod"] 