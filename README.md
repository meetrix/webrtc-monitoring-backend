# WebRTC Monitoring Backend

Webrtc monitor backend developed developed top of nodejs and docker
Bootstrapped from [meetrix/node-typescript-auth-backend](https://gitlab.com/meetrix/general/project-templates/node-typescript-auth-backend).

## Project can be run on following OS

1. Ubuntu
2. MacOS
3. Windows

## Prerequisites

The following pre-requisites should be setup through your terminal on your development machine. Please refer to tool installation guides by the developers to set these up. 

1. Git
2. Docker

## Getting started

0. Set VSCode's Typescript import module specifier for the workspace to `relative` for more information have a look [here](#import-path-quirks)

1. Run these commands

   ```shell

   # Copy the .env.example contents into the .env
   cat .env.example > .env

   # Start services

   npm run services-up

   # Create admin user (For the first time). Refer setup commands in package.json for more information. (Make sure to change MONGO_HOST=localhost MONGO_PORT=27025 in env before run below commands. you have to revert those envs to default after ran these commands)

   npm run setup-create-admin
   npm run setup-generate-admin-token

   # Check whether the api is running

   http://localhost:9100/v1/spec
   ```

## Using OpenAPI Spec

1. Go to [http://localhost:9100/v1/spec]
2. Click `Authorize` and add a token `Bearer <YOUR_TOKEN>`
3. Execute any API

## Using cli commands

1. Make sure you are running all the containers with `docker-compose up`
2. Make sure you have install `ts-node` globally with `npm install -g ts-node`
3. `cd cli-tools`
4. `cat .env.example > .env` this will copy `.env` file that allows local node processes to connect to docker mongo
5. Make sure to change MONGO_HOST=localhost MONGO_PORT=27025 in env before run below commands. you have to revert those envs to default after ran these commands
6. Help: `ts-node cli-tools/user-create.ts --help`
7. Create user : `ts-node cli-tools/user-create.ts -e dev@meetrix.io -p dev12345 -r admin`
8. Get token: `ts-node cli-tools/user-get-token.ts -e dev@meetrix.io -v 48h`
9. Register plugin `ts-node cli-tools/plugin-create -e dev@meetrix.io -d meetrix.io`
10. Generate token for plugin `ts-node cli-tools/plugin-get-token.ts -d 'meetrix.io'`


## Socket Connection

1. `npm run setup-generate-plugin-token`
2. Use this token in `auth.token` in `socket.io-client` connection options

```js
{
    url: 'http://localhost:9100',
    options: {
      path: '/stats/',
      auth: {
        token: 'xxxx'
}
```

## Show MongoDB collections

Go to [http://mongo.localhost:8087/](http://mongo.localhost:8087/)

## Running tests

To run the tests simply use `npm test`. If you want to use jest `watch mode` use `npm run watch-test`.
