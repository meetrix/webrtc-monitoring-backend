import { RequestHandler, NextFunction, Request, Response } from 'express';
import { USER_PACKAGES } from '../config/settings';

const forbid = (res: Response): void => {
  res.status(403).json({
    success: false,
    error: 'forbidden'
  });
};

/**
 * Checks package permissions for authorization. This needs the package to be present in the user
 * object. 
 * @todo Currently we anyway query the database _per request_ but technically this is not 
 * necessary because we use JWT. However, if we choose not to query the database, we have to add the
 * package details to the JWT payload, and also manually query the user object wherever it is needed. 
 * 
 * @param pkg Package where this feature should be enabled
 * @param limited limited package to activate the feature. 
 * This is to be used in case if the package is expired but technically the user should have 
 * read/non-expensive write permissions for whatever they did while having an active package. 
 * @returns whether the request should pass-through
 */
export const hasPackageOrHigher = (pkg: string, allowLimited: boolean = false): RequestHandler => {
  const requiredPackage = USER_PACKAGES.indexOf(pkg);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return forbid(res);
    }

    const havingPackage = Math.max(
      USER_PACKAGES.indexOf(req.user.package) || 0,
      // Check readOnly package only if this is a read operation provided by readonly
      (allowLimited && USER_PACKAGES.indexOf(req.user.limitedPackage)) || 0
    );

    if (havingPackage < requiredPackage) {
      return forbid(res);
    }

    next();
  };
};
