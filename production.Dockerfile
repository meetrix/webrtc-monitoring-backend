FROM node:12.16

ENV PORT=9100
RUN npm install -g typescript pm2
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

WORKDIR /usr/src/app/dist

EXPOSE 9100

CMD ["pm2-runtime", "server.js"]
