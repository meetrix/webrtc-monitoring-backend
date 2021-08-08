import { Request, Response } from 'express';

import { Plugin } from '../../../models/Plugin';
import { User } from '../../../models/User';
import { getSubscriptionStatus, signPluginToken } from '../../../util/auth';

export const init = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.key || req.params.key === 'undefined') {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const plugin = await Plugin.findById(req.params.key);
    if (!plugin) {
      res
        .status(401)
        .json({ success: false, error: 'No such key registered.' });
      return;
    }

    const user = await User.findById(plugin.ownerId);
    if (!user) {
      res.status(401).json({ success: false, error: 'No plugin owner found.' });
      return;
    }

    // Doing this without the authorization middleware since the function is invoked by an anonymous user
    if (
      !user.features.plugin &&
      (user.package !== 'PREMIUM' ||
        getSubscriptionStatus(user).subscriptionStatus !== 'active')
    ) {
      res
        .status(403)
        .json({ success: false, error: 'Forbidden (no valid subscription).' });
      return;
    }

    const token = signPluginToken(plugin);
    res.status(200).json({ success: true, data: { token } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const setup = async (req: Request, res: Response): Promise<void> => {
  try {
    let plugin = await Plugin.findOne({ ownerId: req.user._id });
    if (!plugin) {
      plugin = await new Plugin({
        ownerId: req.user._id,
        website: req.body.website,
      }).save();
      res.status(201).json({ success: true, data: plugin });
    } else {
      plugin.website = req.body.website;
      plugin.save();
      res.status(200).json({ success: true, data: plugin });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const getPlugin = async (req: Request, res: Response): Promise<void> => {
  try {
    const plugin = await Plugin.findOne({ ownerId: req.user._id });
    if (plugin) {
      res.status(200).json({ success: true, data: plugin });
    } else {
      res
        .status(404)
        .json({ success: false, error: 'Please setup the plugin first.' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};
