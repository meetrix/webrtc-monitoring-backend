import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { SESSION_SECRET } from '../../../config/secrets';

import { IceServerConfig } from '../../../models/ICEServerConfig';
import { Plugin, PluginDocument } from '../../../models/Plugin';
import { createTurnConfig } from './iceServers';
import { signPluginToken } from '../../../util/auth';

// TODO: Usually we don't show the old tokens to the user, but the UI has placeholders right now.
const sanitize = ({
  _id,
  domain,
  createdAt,
}: PluginDocument): {
  _id: string;
  domain: string;
  createdAt: Date;
} => ({ _id, domain, createdAt });

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const plugins = await Plugin.find({
      ownerId: req.user._id,
      revoked: false,
    });

    res.json({
      success: true,
      data: plugins.map(sanitize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Unknown server error.',
    });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    let plugin = await Plugin.findOne({
      ownerId: req.user._id,
      domain: req.body.domain,
      revoked: false,
    });

    if (plugin) {
      res.status(409).json({
        success: false,
        data: sanitize(plugin),
        error: 'App token already exists',
      });
      return;
    }

    plugin = await new Plugin({
      ownerId: req.user._id,
      domain: req.body.domain,
    }).save();
    res.status(201).json({
      success: true,
      data: sanitize(plugin),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const get = async (req: Request, res: Response): Promise<void> => {
  try {
    const plugin = await Plugin.findOne({
      _id: req.params.id,
      revoked: req.query?.revoked === 'true' || false,
    });
    if (!plugin) {
      res.status(404).json({ success: false, error: 'App token not found.' });
      return;
    }
    res.json({
      success: true,
      data: sanitize(plugin),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const revoke = async (req: Request, res: Response): Promise<void> => {
  try {
    const plugin = await Plugin.findByIdAndUpdate(
      req.params.id,
      { $set: { revoked: true } },
      { new: true }
    );

    if (!plugin) {
      res.status(404).json({ success: false, error: 'App token not found.' });
      return;
    }
    res.json({
      success: true,
      data: sanitize(plugin),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const regenerate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    if (!plugin) {
      res.status(404).json({ success: false, error: 'App token not found.' });
      return;
    }

    plugin.revoked = true;
    await plugin.save();

    const synonyms = plugin.synonyms.slice();
    synonyms.push(plugin._id);

    const newPlugin = await new Plugin({
      ownerId: plugin.ownerId,
      domain: plugin.domain,
      synonyms, // Latest token keeps links to all previous tokens
    }).save();
    res.json({
      success: true,
      data: { ...sanitize(newPlugin), synonyms: newPlugin.synonyms },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

/**
 * Generate JWT token for the plugin using a plugin id.
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getJwtToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, error: 'Invalid token.' });
      return;
    }

    const plugin = await Plugin.findById(req.params.id);
    if (!plugin) {
      res.status(404).json({ success: false, error: 'App token not found.' });
      return;
    }

    const token = signPluginToken(plugin, SESSION_SECRET, '12h');
    res.json({
      success: true,
      data: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const getConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await IceServerConfig.findOne({
      pluginId: req.params.id,
    });
    // if (!config) {
    //   res.status(404).json({ success: false, error: 'ICE config not found.' });
    //   return;
    // }

    res.json({
      success: true,
      data: req.user ? config : await createTurnConfig(config),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const setConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const plugin = req.params.id
      ? await Plugin.findById(req.params.id)
      : // TODO: Remove this once we can config turn servers per token
        await Plugin.findOne({
          ownerId: req.user.id,
          revoked: false,
        });
    if (!plugin) {
      res.status(404).json({ success: false, error: 'App token not found.' });
      return;
    }

    let config = await IceServerConfig.findOne({
      pluginId: plugin.id,
    });
    if (!config) {
      config = new IceServerConfig({
        ownerId: req.user.id,
        pluginId: plugin.id,
      });
    } else if (config.mode !== req.body.mode) {
      await config.delete();
      config = new IceServerConfig({
        ownerId: req.user.id,
        pluginId: plugin.id,
      });
    }

    config.set(req.body);
    await config.save();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};
