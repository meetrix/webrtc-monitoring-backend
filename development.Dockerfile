FROM node:12-bullseye-slim

ENV PORT=9100
RUN apt-get -y update
RUN apt-get install -y git 
RUN npm install -g typescript pm2
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN cd node_modules/@meetrix/webrtc-monitoring-common-lib/node_modules/@peermetrics/webrtc-stats && npm install && npm run build && cd ../../../ && npm run build
RUN cd node_modules/@peermetrics/webrtc-stats && npm install && npm run build

EXPOSE 9100

CMD [ "npm", "run", "start" ]
