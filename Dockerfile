FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install && cd ./server && nom install && cd ../client && npm install && cd ..

COPY . .

RUN npm run build --workspace=client
RUN npm run build --workspace=server

FROM node:22-alpine AS runner

WORKDIR /app
COPY ./entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./package.json

COPY --from=builder /app/client/dist ./dist/public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["./entrypoint.sh"]

