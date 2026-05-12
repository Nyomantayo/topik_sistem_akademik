# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Build untuk production (inject API URL via env)
ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Stage 2: Serve dengan Nginx ─────────────────────────────────────────────
FROM nginx:alpine

# Copy hasil build
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config untuk SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
