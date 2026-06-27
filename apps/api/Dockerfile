# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

# --- run stage ---
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3000
# Apply migrations, (re)seed the self-resetting demo, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && (node prisma/seed.js || echo 'seed skipped') && node dist/main.js"]
