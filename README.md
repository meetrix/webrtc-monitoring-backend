# ScreenApp Auth Backend

Bootstrapped from [feredean/node-api-starter](https://github.com/feredean/node-api-starter).
Which is bootstrapped from [sahat/hackathon-starter](https://github.com/sahat/hackathon-starter).
Please refer the original projects for additional information.

## Getting started

Set VSCode's Typescript import module specifier for the workspace to `relative` for more information have a look [here](#import-path-quirks)

```shell

# Copy the .env.example contents into the .env
cat .env.example > .env

# Run (development mode) the API
docker-compose up

# Check whther the api is running

http://localhost:8081/v1/spec
```

To build the project in VS Code press `cmd + shift + b`. You can also run tasks using the command pallet (`cmd + shift + p`) and select `Tasks: Run Task` > `npm: start` to run `npm start` for you.

## OpenAPI Spec

Api spec is written with [openAPI 2.0](https://editor.swagger.io)

## Auth 2.0

1. [Google auth](https://developers.google.com/identity/sign-in/web/sign-in)

## Show mongodb collections

Go to [http://mongo.localhost:8081/](http://mongo.localhost:8081/)

## Next Steps

1. We have to bring in social logins from `Hackathon starter` to this project

## Environment variables

For how environment variables are imported and exported have a look in [src/config/secrets](src/config/secrets.ts). Here you can also change the `requiredSecrets` or the way `mongoURI` is constructed if for example you wish to use username/password when connecting to mongo in the development environment.

| Name                  | Description                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
|                       | The session secret is used to sign the JWT tokens                                                                                     |
| SESSION_SECRET        | A quick way to generate a secret: `node -e "console.log(require('crypto').randomBytes(256).toString('base64'));"`                     |
|                       | The mongo host and port are not necessarily taken from the `.env` file they can be provided by the deployment environment such as k8s |
| MONGO_HOST            | mongo host                                                                                                                            |
| MONGO_PORT            | mongo port                                                                                                                            |
| MONGO_DATABASE        | name of the database                                                                                                                  |
| MONGO_USERNAME        | mongo user - not used for development, required for production                                                                        |
| MONGO_PASSWORD        | mongo user's password - not used for development, required for production                                                             |
|                       | Facebook credentials used for sign in with Facebook - currently not implemented                                                       |
| FACEBOOK_ID           | Facebook ID                                                                                                                           |
| FACEBOOK_SECRET       | Facebook Secret                                                                                                                       |
|                       | Sendgrid credentials used by the `nodemailer` package in forgot/reset password functionality                                          |
| SENDGRID_USER         | Sendgrid account user name                                                                                                            |
| SENDGRID_PASSWORD     | Sendgrid account password                                                                                                             |
|                       | AWS user used for uploading files to s3 with `AmazonS3FullAccess` Policy                                                              |
| AWS_ACCESS_KEY     | AWS Access key ID                                                                                                                     |
| AWS_ACCESS_KEY_SECRET | AWS Access key secret                                                                                                                 |
|                       | This will be used to create a REGEX that will block origins that don't match                                                          |
| CORS_REGEX            | use `localhost:\d{4}$` for development and `domain\.tld$` for production                                                              |  |

# Debugging

Debugging TypeScript requires source maps to be enabled in `tsconfig.json`:

```json
"compilerOptions" {
    "sourceMap": true
}
```

In `.vscode` folder you can find the `launch.json` file. Here you can find the configuration that tells VS Code how to attach the debugger to the node process.

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach Debugger to Process ID",
  "processId": "${command:PickProcess}",
  "protocol": "inspector"
}
```

Once this configuration is added make sure that either the app is running (`npm run watch`) or tests are running in debug mode (`npm run watch-test-debugger`). Now add breakpoints, hit `F5`, select the process you want to attach the debugger to and you're ready to go!

# Testing

This project uses [Jest](https://facebook.github.io/jest/). When writing tests that interact with mongoose keep [this](https://mongoosejs.com/docs/jest.html) in mind.

## Integration tests and jest

When writing integration tests that use a shared resource (a database for example) you need to keep in mind that jest will test separate files in parallel which will lead to tests interfering with each other. For example lets say you want to test that `GET /v1/account/` will return a user you inserted just before you made the call. In another file you need to create a user in order to test something else. If you use the same database it is possible that `GET /v1/account/` will sometimes return one user (the one inserted in the test) and other times return multiple users (that got inserted by other tests).

In order to avoid this you have some options:

- Keep all the tests that use a shared resource in the same file
- Get [really creative](https://stackoverflow.com/a/52029468/1906892) with your setup
- Use the option `--runInBand` to force all the tests to run serially in the current process
- Set up the tests in such a way that each file uses a separate database

After running into issue with all the other options I decided to move all the tests into one file.

## Configure Jest

In order to properly load modules in the test suites a new `test/tsconfig.json` file is needed.

In `jest.config.js` you can find `setupFilesAfterEnv: ["./test/setup.ts"]` where the test environment variables are set. In the setup file you can also find the `initMongo` and `disconnectMongo` helper functions. They are used to connect/disconnect to the test database and empty the database before starting a test. The Typescript compilation to JS will happen in memory using the `test/tsconfig.json` file.

## Running tests

To run the tests simply use `npm test`. If you want to use jest `watch mode` use `npm run watch-test`.

## Linting

This year [Palantir has announced](https://medium.com/palantir/tslint-in-2019-1a144c2317a9) the deprecation of TSLint.

> In order to avoid bifurcating the linting tool space for TypeScript, we therefore plan to deprecate TSLint and focus our efforts instead on improving ESLint’s TypeScript support.

This project is using `ESLint` with `typescript-eslint/recommended` settings.

## VSCode Extensions

- [VS Code ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)

# Dependencies

## `production`

| Package           | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| aws-sdk           | Amazon Web Services SDK - used to connect to s3                         |
| bcrypt            | A library to help you hash passwords.                                   |
| body-parser       | Express 4 middleware.                                                   |
| compression       | Express 4 middleware.                                                   |
| cors              | Express middleware that can be used to enable CORS with various options |
| dotenv            | Loads environment variables from .env file.                             |
| express           | Node.js web framework.                                                  |
| fbgraph           | Facebook Graph API library.                                             |
| jsonwebtoken      | An implementation of JSON Web Tokens.                                   |
| lodash            | General utility library.                                                |
| mongoose          | MongoDB ODM.                                                            |
| morgan            | HTTP request logger middleware                                          |
| multer            | Middleware for handling multipart/form-data                             |
| nodemailer        | Node.js library for sending emails.                                     |
| passport          | Simple and elegant authentication library for node.js                   |
| passport-facebook | Sign-in with Facebook plugin.                                           |
| passport-local    | Sign-in with Username and Password plugin.                              |
| uuid              | Simple, fast generation of RFC4122 UUIDS.                               |
| validator         | A library of string validators and sanitizers.                          |
| winston           | Logging library                                                         |

## `development`

| Package           | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| @types            | Dependencies in this folder are `.d.ts` files used to provide types                   |
| concurrently      | Utility that manages multiple concurrent tasks. Used with npm scripts                 |
| eslint            | Linter for JavaScript and TypeScript files                                            |
| jest              | Testing library for JavaScript                                                        |
| nodemon           | Utility that automatically restarts node process on code changes                      |
| npm-check-updates | Upgrades package.json dependencies to the latest versions, ignoring specified version |
| supertest         | HTTP assertion library                                                                |
| ts-jest           | A preprocessor with sourcemap support to help use TypeScript with Jest                |
| typescript        | JavaScript compiler/type checker that boosts JavaScript productivity                  |

If you're the type of person that likes to live life on the bleeding edge feel free to use `npm run check-deps`

# Resources

This section is a list of resources for building an API that can be useful in certain situations

- If you are unsure what format your API's JSON responses should have take a look at this [specification](https://jsonapi.org/) and see if it could work for your project.
- [Kong](https://github.com/Kong/kong) is a cloud-native, fast, scalable, and distributed Microservice Abstraction Layer (also known as an API Gateway, API Middleware or in some cases Service Mesh). It boasts a lot of cool [features](https://github.com/Kong/kong#features) and of course works with [kubernetes](https://github.com/Kong/kubernetes-ingress-controller)
- RESTful API Modeling Language ([RAML](https://raml.org/)) makes it easy to manage the whole API lifecycle from design to sharing. It's concise - you only write what you need to define - and reusable. It is machine readable API design that is actually human friendly.
- Brought to you by Heroku, [12factor](https://12factor.net/) is a methodology for building software-as-a-service applications