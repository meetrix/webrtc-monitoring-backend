import express from 'express';

import { hasRoleOrHigher } from '../../../middleware';
import { getAll, create, get, revoke, regenerate } from './controller';

const router = express.Router();

router.get('/', hasRoleOrHigher('user'), getAll);
router.post('/', hasRoleOrHigher('user'), create);
router.get('/:id', hasRoleOrHigher('user'), get);
router.delete('/:id', hasRoleOrHigher('user'), revoke);
router.patch('/:id', hasRoleOrHigher('user'), regenerate);

export const pluginRouter = router;
