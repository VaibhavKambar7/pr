FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY . .

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

EXPOSE 3001

CMD ["npm", "run", "dev:api"]