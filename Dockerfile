# ---- Build stage -------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Runtime stage -------------------------------------------------------------
# Nitro bundles everything the server needs into .output — no node_modules required.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
