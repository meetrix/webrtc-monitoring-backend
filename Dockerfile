FROM node:12-bullseye-slim as base

ENV PORT=9100
RUN apt-get -y update
RUN apt-get install -y git
RUN git config --global credential.helper store
RUN echo "https://webrtc_monitoring_common_lib_deploy_token_user_staging:cmxDFgHeno_emJ7V91i2@gitlab.com" > ~/.git-credentials
RUN npm install -g typescript pm2 ts-node
WORKDIR /usr/src/app
COPY package*.json ./
COPY *.npmrc ./
RUN npm install
RUN cd node_modules/@peermetrics/webrtc-stats && npm install && npm run build
COPY . .
RUN npm run build

WORKDIR /usr/src/app/dist

EXPOSE 9100

CMD ["pm2-runtime", "server.js"]
