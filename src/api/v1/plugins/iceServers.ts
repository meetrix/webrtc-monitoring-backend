import crypto from 'crypto';
import axios from 'axios';

import { get } from 'lodash';

async function iceServersFromSecret(
  iceServersConfig: any,
  timestamp: number = Date.now()
) {
  const time = Math.ceil(timestamp / 1000);
  const expiry = 8400;
  const username = `${time + expiry}`;

  const { secret } = iceServersConfig;
  const hash = crypto
    .createHmac('sha1', secret)
    .update(username)
    .digest('base64');

  const iceServer = {
    username,
    credential: hash,
    urls: [iceServersConfig.uri] as string[],
  };
  const config = { iceServers: [iceServer] };
  return config;
}

async function iceServersFromFetch(iceServersConfig: any) {
  const { url, method, headers, body, extract } = iceServersConfig;

  const result = (await axios.request({ url, method, headers, data: body }))
    .data;

  // extract = path to iceServers array
  const iceServers = extract ? get(result, extract, null) : result;
  if (Array.isArray(iceServers.iceServers)) {
    return { iceServers };
  }
  return { iceServers: [iceServers] };
}

export const createTurnConfig = async (
  iceServersConfig: any
): Promise<RTCConfiguration> => {
  if (!iceServersConfig && !iceServersConfig.mode) {
    return null;
  }

  switch (iceServersConfig.mode) {
    case 'static': {
      return {
        iceServers: iceServersConfig.iceServers,
      } as unknown as RTCConfiguration;
    }
    case 'shared-secret': {
      return iceServersFromSecret(iceServersConfig);
    }
    case 'url': {
      try {
        return iceServersFromFetch(iceServersConfig);
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    default: {
      return null;
    }
  }
};
