import express from 'express';
import { setupExpress } from './config/express';
import { handleMissing, handleErrors } from './middleware';
import { setupMongoose } from './config/mongoose';
import { setupRoutesV1 } from './config/routes';
import { MONGO_URI } from './config/secrets';

setupMongoose(MONGO_URI);

const app = express();

setupExpress(app);
setupRoutesV1(app);

// TODO: configure CORS
// app.use(
//   cors({
//     origin: true,
//   })
// );
app.use(handleMissing);
app.use(handleErrors);

export default app;
