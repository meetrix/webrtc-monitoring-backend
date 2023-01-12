FROM node:12-bullseye-slim as base

ENV PORT=9100
RUN apt-get -y update
RUN apt-get install -y git 
RUN npm install -g typescript pm2 ts-node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN cd node_modules/@meetrix/webrtc-monitoring-common-lib/node_modules/@peermetrics/webrtc-stats && npm install && npm run build && cd ../../../ && npm run build
RUN cd node_modules/@peermetrics/webrtc-stats && npm install && npm run build
COPY . .
RUN npm run build

WORKDIR /usr/src/app/dist

EXPOSE 9100

CMD ["pm2-runtime", "server.js"]
