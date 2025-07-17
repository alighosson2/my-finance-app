// src/util/OAuthHelper.ts - Fixed OAuth implementation for OBP
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import config from '../config';

// Standard OAuth 1.0a percent encoding
export function oauthPercentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

export const getOAuth = (): OAuth => {
  return new OAuth({
    consumer: {
      key: config.openBank.consumerKey,
      secret: config.openBank.consumerSecret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string: string, key: string): string {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    },
  });
};

export const createOAuthRequest = (url: string, method: string, data?: any) => {
  return {
    url,
    method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
    data: data || {}
  };
};

export const debugOAuthSignature = (request: any, token?: any) => {
  const oauth = getOAuth();
  
  console.log('🔍 OAuth Debug Info:');
  console.log('- Request URL:', request.url);
  console.log('- Request Method:', request.method);
  console.log('- Request Data:', request.data);
  
  const oauthData = oauth.authorize(request, token);
  const header = oauth.toHeader(oauthData);
  
  console.log('- Generated OAuth Data:', oauthData);
  console.log('- Final Authorization Header:', header.Authorization);
  
  return { oauthData, header };
};
