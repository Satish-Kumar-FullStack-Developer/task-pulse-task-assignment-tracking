FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

COPY src ./src
COPY tsconfig.json ./

RUN npm run prisma:generate

EXPOSE 3001

CMD ["npm", "run", "dev"]
