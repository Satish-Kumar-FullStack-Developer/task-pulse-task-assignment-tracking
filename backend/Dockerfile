FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Generate Prisma client
RUN npm run prisma:generate

EXPOSE 3001

CMD ["npm", "run", "dev"]
