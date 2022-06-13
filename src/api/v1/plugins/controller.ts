import { Request, Response } from 'express';
import { SESSION_SECRET } from '../../../config/secrets';

import { Plugin, PluginDocument } from '../../../models/Plugin';
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
    const plugin = await Plugin.findById(req.params.id);
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
      data: sanitize(newPlugin),
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
 * @returns JWT Token
 */
export const getJwtToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
