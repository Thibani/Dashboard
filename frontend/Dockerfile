# ---- base -----------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# ---- deps -------------------------------------------------------------
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- development (Vite dev server with hot reload) -------------------------
FROM deps AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- build (compiles to static assets) --------------------------------------
FROM deps AS build
COPY . .
RUN npm run build

# ---- production (static files served by nginx) ------------------------------
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
