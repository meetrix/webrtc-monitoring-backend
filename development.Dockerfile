FROM node:12.16

ENV PORT=9100
RUN npm install -g typescript pm2
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

EXPOSE 9100

CMD [ "npm", "run", "start" ]
