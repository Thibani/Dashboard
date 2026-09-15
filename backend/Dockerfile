# ---- base -----------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# ---- deps (installs all deps, incl. dev, needed for build & dev mode) -----
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- development (hot reload via ts-node-dev / nodemon) -------------------
FROM deps AS development
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]

# ---- build (compiles TypeScript -> dist) -----------------------------------
FROM deps AS build
COPY . .
RUN npm run build

# ---- production (slim runtime image, prod deps only) -----------------------
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
