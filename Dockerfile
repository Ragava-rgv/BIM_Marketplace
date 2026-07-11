FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build:shared
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build:web
RUN npm run build:api

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/src/main.js"]
