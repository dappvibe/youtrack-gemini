FROM node:20-alpine

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json ./

# Install dependencies including devDependencies (needed for tsx)
RUN npm ci

# Copy source code
COPY . .

# Expose port (default used in server.ts is 3000)
EXPOSE 3000

# Start command
CMD ["npx", "tsx", "src/server.ts"]
