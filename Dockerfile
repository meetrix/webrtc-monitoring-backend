FROM node:12.16

ENV NODE_ENV=production
ENV PORT=9100
RUN npm install -g typescript
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

WORKDIR /usr/src/app/dist

EXPOSE 9100

CMD ["node", "server.js"]
