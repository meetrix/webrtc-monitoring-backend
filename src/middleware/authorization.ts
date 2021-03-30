import { RequestHandler, NextFunction, Request, Response } from 'express';
import { SUBSCRIPTION_STATUSES, USER_PACKAGES } from '../config/settings';
import { getSubscriptionStatus } from '../util/auth';

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
 * @param subsStatus Subscription status (active, inactive, pending) to activate the feature. 
 * This is to be used in case if the package is expired but technically the user should have 
 * read permissions for whatever they did while having an active package. 
 * @returns whether the request should pass-through
 */
export const hasPackageOrHigher = (pkg: string, subsStatus?: string): RequestHandler => {
  const requiredPackage = USER_PACKAGES.indexOf(pkg);
  const requiredSubsStatus = subsStatus ? SUBSCRIPTION_STATUSES.indexOf(subsStatus) : -1;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return forbid(res);
    }

    const havingPackage = USER_PACKAGES.indexOf(req.user.package);
    if (havingPackage < requiredPackage) {
      return forbid(res);
    }

    if (requiredSubsStatus >= 0) {
      const { subscriptionStatus } = getSubscriptionStatus(req.user);
      const havingStatus = SUBSCRIPTION_STATUSES.indexOf(subscriptionStatus);

      if (havingStatus < requiredSubsStatus) {
        return forbid(res);
      }
    }

    next();
  };
};
