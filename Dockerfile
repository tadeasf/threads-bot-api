FROM oven/bun:1.1.29

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the app
RUN bun run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["bun", "run", "start:prod"] 