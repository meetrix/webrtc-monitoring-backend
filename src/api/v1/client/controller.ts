import { Response, NextFunction } from 'express';
import { getActiveClientIds } from '../../../util/redis/plugins';
import { Plugin } from '../../../models/Plugin';
import { AuthAwareRequest } from '../../../config/passport';
import logger from '../../../util/logger';

export const getByDomain = async (
  req: AuthAwareRequest,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { domain } = req.params;
    if (!domain) throw new Error('Domain is required');
    // User should own a plugin with this domain;
    // TODO: this could be a security loop hole if another user creates plugin with the same domain. Refine this
    const plugin = await Plugin.findOne({
      ownerId: req.user.id,
      domain,
    });

    if (!plugin) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Invalid domain',
      });
    }

    const clientIds = await getActiveClientIds({ domain: plugin.domain });
    const clients = clientIds.map((id) => ({
      clientId: id,
      domain,
    }));
    const result = {
      success: true,
      data: clients,
    };
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
