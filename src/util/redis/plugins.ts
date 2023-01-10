// import { getStaticClient } from '.';
// import { APP_REDIS_PLUGINS_CLIENT_IDS_ACTIVE } from '../../config/settings';
// import { PluginQueryInformation } from '../../types/app';

// export interface StoredPluginInformationInRedisType
//   extends PluginQueryInformation {
//   domain: string;

//   socketId: string;
// }

// interface GetKeyOptions {
//   domain: string;
//   clientId?: string;
//   socketId?: string;
// }

// /**
//  * Returns the redis key for the plugin. Key is : meetrix.io_c11EnTiD_SoKet1D
//  */
// export const getActivePluginClientskey = ({
//   domain,
// }: GetKeyOptions): string => {
//   return `${APP_REDIS_PLUGINS_CLIENT_IDS_ACTIVE}:${domain}`;
// };
// export const addActivePluginClient = async ({
//   domain,
//   clientId,
// }: GetKeyOptions): Promise<void> => {
//   const redisClient = await getStaticClient();
//   const key = getActivePluginClientskey({ domain });
//   await redisClient.sAdd(key, clientId);
// };

// export const removePluginClient = async ({
//   domain,
//   clientId,
// }: GetKeyOptions): Promise<void> => {
//   const redisClient = await getStaticClient();
//   const key = getActivePluginClientskey({ domain });
//   await redisClient.sRem(key, clientId);
// };

// export const getActiveClientIds = async ({
//   domain,
// }: {
//   domain: string;
// }): Promise<string[]> => {
//   const redisClient = await getStaticClient();
//   const key = getActivePluginClientskey({ domain });
//   // TODO This might be too big to handle. Refactor this later
//   const activeClientIds = await redisClient.sMembers(key);
//   return activeClientIds;
// };
