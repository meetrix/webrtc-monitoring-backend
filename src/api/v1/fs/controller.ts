import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { v4 as uuid } from 'uuid';

const FOUR_HOURS = 1 * 60 * 60 * 4;

import {
  FileDocument, FileSystemEntityDocument, FileType, FolderDocument, FolderType
} from '../../../models/FileSystemEntity';
import { SharedContent } from '../../../models/SharedContent';
import { User } from '../../../models/User';
import { deleteRecordings, getPlayUrl } from '../../../util/s3';
import { detectCycles, filterDescendants, isExpiringSoon, suggestName } from './util';

// Fetch flat file system - GET /
export const fetchFileSystem = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    const fileSystem = req.user.fileSystem || [] as Types.DocumentArray<FileSystemEntityDocument>;

    const filesExpiringSoon = req.user.fileSystem
      .filter(f => f.type === 'File' && f.provider.startsWith('S3'))
      .filter(f => isExpiringSoon((f as FileDocument).url)) as FileDocument[];

    // Update signed URLs
    if (filesExpiringSoon.length > 0) {
      await Promise.all(filesExpiringSoon.map(async f => {
        f.url = await getPlayUrl(f.providerKey);
        return;
      }));
      res.status(200).json({
        success: true, data: { fileSystem: (await req.user.save()).fileSystem }
      });
    } else {
      res.status(200).json({ success: true, data: { fileSystem } });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

const makeFileSystemEntityCreator = (type: 'File' | 'Folder') => async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    const name = req.body.name as string;
    const parentId = req.body.parentId || null;
    // Name and parentId (null for root level) must be defined
    if (!name || typeof name !== 'string' || name.length <= 0) {
      res.status(400).json({ success: false, error: `${type} name must be provided.` });
      return;
    }

    // The fileSystem might not be defined; Fix it
    if (!req.user.fileSystem) {
      req.user.fileSystem = [] as Types.DocumentArray<FileSystemEntityDocument>;
    }

    const parent = parentId
      ? req.user.fileSystem.find((f) => f.type === 'Folder' && f._id.toString() === parentId)
      : null;
    // Only check undefined because null means orphan/root
    if (parent === undefined) {
      res.status(400).json({ success: false, error: `Parent ${type} not found.` });
      return;
    }

    const provider = parent
      ? parent.provider
      : (['IDB', 'S3', 'S3:plugin'].includes(req.body.provider) ? req.body.provider : 'IDB');

    // Check whether the parent folder already contains a file or folder by the same name
    if (req.user.fileSystem
      .filter((f) => f.name === name && f.parentId === parentId && f.provider === provider)
      .length > 0) {

      res.status(400).json({ success: false, error: 'File/folder already exists.' });
      return;
    }

    let entityData: { [x: string]: number | string } = { type, name, parentId, provider };

    if (type === 'File') {
      // To add a file, size and providerKey are required
      const { description, size, providerKey } = req.body;
      if (!size || typeof size !== 'number' || size < 0) {
        res.status(400).json({ success: false, error: 'Invald file size provided.' });
        return;
      }
      if (!providerKey || typeof providerKey !== 'string') {
        res.status(400).json({ success: false, error: 'ProviderKey is mandatory.' });
        return;
      }

      entityData = { ...entityData, description, size, providerKey };
    }

    req.user.fileSystem.push(entityData);
    const entity = (await req.user.save())
      .fileSystem.find((f) => f.name === name && f.parentId === parentId);

    res.status(201).json({ success: true, data: { [type.toLowerCase()]: entity } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

// Create a folder - POST /
export const createFolder = makeFileSystemEntityCreator('Folder');

const makeFileSystemEntityUpdator = (type: 'File' | 'Folder') => async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    // No file system defined yet
    if (!req.user.fileSystem) {
      res.status(404).json({ success: false, error: `No such source ${type} exists.` });
      return;
    }

    const { id } = req.params;

    const source = req.user.fileSystem.id(id);
    // File or folder does not exist or type mismatch
    if (!source || source.type !== type) {
      res.status(404).json({ success: false, error: `No such source ${type} exists.` });
      return;
    }

    const { name, parentId } = req.body;
    const shouldRename = !!name && typeof name === 'string';
    const shouldMove = parentId === null || !!parentId && typeof parentId === 'string';

    const folders = req.user.fileSystem
      .filter((f) => f.type === 'Folder' && f.provider === source.provider) as FolderType[];

    if (shouldMove) {
      // Cycle detection and destination folder validations are not needed when moving into root folder
      if (parentId !== null) {
        // Destination folder must exist
        const destination = folders.find((d) => d._id.toString() === parentId);
        if (!destination) {
          res.status(400).json({ success: false, error: 'No such destination folder exists.' });
          return;
        }

        // Cycle detection only needed if moving a folder
        if (type === 'Folder') {
          const cyclesDetected = detectCycles(folders, source._id.toString(), parentId);
          if (cyclesDetected) {
            res.status(400).json({
              success: false,
              error: 'Cannot move a folder into itself or its children.'
            });
            return;
          }
        }
      }

      // The new parent folder shouldn't have a file/folder with the same name (or new name if given)
      const nameExists = req.user.fileSystem
        .filter((f) => f.name === (shouldRename ? name : source.name) && f.parentId === parentId)
        .length > 0;
      if (nameExists) {
        res.status(400).json({
          success: false,
          error: `Destination folder already contains a ${type} by the same name: ${name || source.name}.`
        });
        return;
      }

      if (shouldRename) {
        source.name = name;
      }

      source.parentId = parentId;
    } else if (shouldRename) {
      // The parent folder shouldn't have a file/folder with the provided name; tolerate same file
      const nameExists = req.user.fileSystem
        .filter((f) => f.name === name && f.parentId === source.parentId && f._id != source._id)
        .length > 0;
      if (nameExists) {
        res.status(400).json({
          success: false,
          error: `Destination folder already contains a folder by the same name: ${name}.`
        });
        return;
      }

      source.name = name;
    }

    if (type === 'File' && !!req.body.description) {
      (source as FileDocument).description = req.body.description;
    }

    const entity = (await req.user.save())
      .fileSystem.find((f) => f._id.toString() === source._id.toString());

    res.status(200).json({ success: true, data: { [type.toLowerCase()]: entity } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

// Update folder details, move folders around - POST /:id
export const updateFolder = makeFileSystemEntityUpdator('Folder');

const deleteFilesFromProvider = async (files: FileType[]): Promise<void> => {
  const awsKeys = files.filter((f) => f.provider.startsWith('S3')).map((f) => f.providerKey);
  if (awsKeys.length > 0) {
    await deleteRecordings(awsKeys);
  }
};

const makeFileSystemEntityDeleter = (type: 'File' | 'Folder') => async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    // No file system defined yet
    if (!req.user.fileSystem) {
      res.status(404).json({ success: false, error: 'No such folder exists.' });
      return;
    }

    const { id } = req.params;

    const source = req.user.fileSystem.id(id);
    // File/Folder does not exist
    if (!source || source.type !== type) {
      res.status(404).json({ success: false, error: `No such ${type} exists.` });
      return;
    }

    let deletedFiles: FileType[] = [];
    let deletedFolders: FolderType[] = [];

    if (type === 'Folder') {
      const { files, folders } = filterDescendants(
        req.user.fileSystem.filter((f) => f.provider === source.provider),
        source as FolderType
      );

      await deleteFilesFromProvider(files);

      req.user.fileSystem.pull(...files);
      req.user.fileSystem.pull(...folders);

      deletedFiles = files;
      deletedFolders = folders;
    } else if (type === 'File') {
      await deleteFilesFromProvider([source as FileDocument]);

      deletedFiles = [source as FileDocument];

      req.user.fileSystem.pull(source);
    }

    const fileSystem = (await req.user.save()).fileSystem;

    res.status(200).json({ success: true, data: { fileSystem, deletedFiles, deletedFolders } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

// Delete folder, and its contents - DELETE /:id
export const deleteFolder = makeFileSystemEntityDeleter('Folder');

export const uploadFile = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    const file: Express.Multer.File & { key?: string }
      = (req.files as unknown as Express.Multer.File[])[0];

    const fileObj: FileType = {
      _id: file.originalname,
      type: 'File',
      parentId: null,
      name: req.body.name || '',
      provider: 'S3',
      providerKey: file.key,
      description: req.body.description || '',
      // Need another API call for file size
      size: file.size,
      // And another for signed URL
      url: await getPlayUrl(file.key),
    };

    // Create file here; no validations done
    req.user.fileSystem.push(fileObj);

    res.status(200).json({
      success: true,
      data: {
        file: (await req.user.save()).fileSystem.id(file.originalname)
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const getSharedFiles = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: 'No id provided.' });
      return;
    }

    const sharedContent = await SharedContent.findById(id);
    if (!SharedContent) {
      res.status(404).json({ success: false, error: 'Shared content not found.' });
      return;
    }

    const owner = await User.findById(sharedContent.ownerId);
    const files = owner.fileSystem
      .filter((f) => sharedContent.entityIds.includes(f._id))
      .filter((f) => f.type === 'File' && f.provider.startsWith('S3')) as FileDocument[];

    const sharedFiles = await Promise.all(
      files.map(async (f) => {
        return {
          _id: f._id,
          name: f.name,
          size: f.size,
          description: f.description,
          url: await getPlayUrl(f.providerKey, FOUR_HOURS),
          createdAt: f.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        owner: owner.profile.name || '',
        sharedFiles
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const shareFiles = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    if (!req.user.fileSystem) {
      res.status(404).json({ success: false, error: 'No such source files exist.' });
      return;
    }

    const { entityIds }: { entityIds: string[] } = req.body;
    // N.B.: Currently supports only a single file
    if (!entityIds || !Array.isArray(entityIds) || entityIds.length < 1) {
      res.status(400).json({ success: false, error: 'No files provided.' });
      return;
    }
    const file: FileSystemEntityDocument = req.user.fileSystem.id(entityIds[0]);
    if (file.type !== 'File') {
      res.status(400).json({ success: false, error: 'Only files are supported.' });
      return;
    }

    const sharedContentDocument = new SharedContent({
      _id: uuid(),
      ownerId: req.user._id,
      entityIds: [file._id]
    });

    await sharedContentDocument.save();

    res.status(200).json({ success: true, data: { id: sharedContentDocument._id } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

// Create a file - POST /
export const createFile = makeFileSystemEntityCreator('File');

// Update a file (rename, move, change description) - POST /:id
export const updateFile = makeFileSystemEntityUpdator('File');

export const moveManyFiles = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    // No file system defined yet
    if (!req.user.fileSystem) {
      res.status(404).json({ success: false, error: 'No such source files exist.' });
      return;
    }

    const { fileIds, folderId }: { fileIds: string[]; folderId: string } = req.body;

    let provider: 'S3' | 'S3:plugin' | 'IDB' | null;
    if (folderId !== null) {
      const destination = req.user.fileSystem.id(folderId) as FolderDocument;
      if (!destination || destination.type !== 'Folder') {
        res.status(400).json({ success: false, error: 'No such destination folder exists.' });
        return;
      }
      provider = destination.provider;
    } else {
      provider = null;
    }

    const candidateFiles = fileIds
      .map(req.user.fileSystem.id, req.user.fileSystem)
      // Only files, from the same provider, those are not already in the target folder. 
      // TODO Should we notify about the excluded? 
      .filter((f) =>
        !!f && f.type === 'File' && f.parentId !== folderId && (!provider || f.provider === provider)
      ) as FileDocument[];

    const childrenNamesAtDestination = req.user.fileSystem
      .filter((f) => f.parentId === folderId)
      .map((f) => f.name);

    candidateFiles.forEach((f) => {
      f.parentId = folderId;
      f.name = suggestName(f.name, childrenNamesAtDestination);
      childrenNamesAtDestination.push(f.name);
    });

    const fileSystem = (await req.user.save()).fileSystem;

    res.status(200).json({ success: true, data: { fileSystem } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

// Delete a file, and its contents - DELETE /:id
export const deleteFile = makeFileSystemEntityDeleter('File');

export const deleteManyFiles = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    // No file system defined yet
    if (!req.user.fileSystem) {
      res.status(404).json({ success: false, error: 'No such files exist.' });
      return;
    }

    const { fileIds }: { fileIds: string[] } = req.body;

    const candidateFiles = fileIds
      .map(req.user.fileSystem.id, req.user.fileSystem)
      // Only files, from the same provider. 
      .filter((f) =>
        !!f && f.type === 'File' && f.provider.startsWith('S3')
      ) as FileDocument[];

    await deleteFilesFromProvider(candidateFiles);

    req.user.fileSystem.pull(...candidateFiles);
    const fileSystem = (await req.user.save()).fileSystem;

    res.status(200).json({ success: true, data: { fileSystem, deletedFiles: candidateFiles } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

// Migrate from locally-saved (Indexed DB filesystem) to MongoDB-saved FS
export const migrate = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // The fileSystem might not be defined; Fix it
    if (!req.user.fileSystem) {
      req.user.fileSystem = [] as Types.DocumentArray<FileSystemEntityDocument>;
    }

    const added = req.user.fileSystem.addToSet(...req.body.fileSystem);

    res.status(200).json({
      success: true,
      data: { added, fileSystem: (await req.user.save()).fileSystem }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

export const getSettings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: req.user?.fileSystemSettings ?? { cloudSync: false },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { cloudSync } = req.body;
    req.user.fileSystemSettings = { cloudSync };

    res.status(200).json({
      success: true,
      data: (await req.user?.save()).fileSystemSettings,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};