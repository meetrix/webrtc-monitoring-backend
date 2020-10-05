import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        swagger: '2.0',
        info: {
            title: 'ScreenApp',
            version: '1.0.0',
        },
        basePath: '/v1',
        // https://github.com/Surnet/swagger-jsdoc/issues/61
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey',
                name: 'Authorization'
            }
        }
    },
    apis: ['./src/api/v1/**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

const router = express.Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec));

export const specRouter = router;
