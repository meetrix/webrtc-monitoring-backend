# WebRTC Monitoring Backend

Bootstrapped from [meetrix/node-typescript-auth-backend](https://gitlab.com/meetrix/general/project-templates/node-typescript-auth-backend).

## Getting started

Set VSCode's Typescript import module specifier for the workspace to `relative` for more information have a look [here](#import-path-quirks)

```shell

# Copy the .env.example contents into the .env
cat .env.example > .env

# Start services

npm run services-up

# Create admin user (For the first time). Refer setup commands in package.json for more information

npm run setup

# Run (development mode) the API
npm start

# Check whether the api is running

http://localhost:8081/v1/spec
```

To build the project in VS Code press `cmd + shift + b`. You can also run tasks using the command pallet (`cmd + shift + p`) and select `Tasks: Run Task` > `npm: start` to run `npm start` for you.

## Using OpenAPI Spec

1. Go to [http://localhost:8081/v1/spec]
2. Click `Authorize` and add a token `Bearer <YOUR_TOKEN>`
3. Execute any API

## Using cli commands

1. Make sure you are running all the containers with `docker-compose up`
2. Make sure you have install `ts-node` globally with `npm install -g ts-node`
3. `cd cli-tools`
4. `cat .env.dist > .env` this will copy `.env` file that allows local not processes to connect to docker mongo
5. Help: `ts-node cli-tools/user-create.ts --help`
6. Create user : `ts-node cli-tools/user-create.ts -e dev@meetrix.io -p dev12345 -r admin`
7. Get token: `ts-node cli-tools/user-get-token.ts -e dev@meetrix.io -v 48h`
8. Register plugin `ts-node cli-tools/plugin-create -e dev@meetrix.io -d meetrix.io`
9. Generate token for plugin `ts-node cli-tools/plugin-get-token.ts -d 'meetrix.io'`

## OpenAPI Spec

Api spec is written with [openAPI 2.0](https://editor.swagger.io)
Use `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRldkBtZWV0cml4LmlvIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjQwNTExNTYzLCJleHAiOjE3MjY5MTE1NjMsInN1YiI6IjYxYzZmMjY2Yzc1OTIwMzBkYmM1YjdhMCJ9.9UZSBzIS-JCkF487Sfx3ZRxaoKKM6PxMD37TAn_MoNg` for authentication

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

## Auth 2.0

1. [Google auth](https://developers.google.com/identity/sign-in/web/sign-in)

## Show MongoDB collections

Go to [http://mongo.localhost:8081/](http://mongo.localhost:8081/)

## Running tests

To run the tests simply use `npm test`. If you want to use jest `watch mode` use `npm run watch-test`.

## Redis
