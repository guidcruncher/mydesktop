# ----------------------------------------
# Stage 1: Build Context
# ----------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
# COPY shared/package.json ./shared/  <-- Uncomment if using shared types

# Install ALL dependencies (Dev deps needed for compilation)
RUN npm install

# Copy source code
COPY . .

# Build Client (Vue)
RUN npm run build --workspace=client

# Build Server (Fastify)
# RUN npm run build --workspace=@my-app/shared <-- Uncomment if using shared types
RUN npm run build --workspace=server

# ----------------------------------------
# Stage 2: Production Runner
# ----------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production node_modules only
COPY --from=builder /app/node_modules ./node_modules
# (Optional: Prune dev dependencies here to save space, but keeping it simple)

# Copy Built Server
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./package.json

# Copy Built Client into the Server's static folder
# We place it in 'dist/public' so fastify-static finds it at path.join(__dirname, 'public')
COPY --from=builder /app/client/dist ./dist/public

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]

