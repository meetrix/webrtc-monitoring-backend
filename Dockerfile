FROM node:12.16 as base

ENV PORT=9100
RUN apt-get -y update
RUN npm install -g typescript pm2 ts-node
WORKDIR /usr/src/app

FROM base as deps

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

WORKDIR /usr/src/app/dist

EXPOSE 9100

CMD ["pm2-runtime", "server.js"]
