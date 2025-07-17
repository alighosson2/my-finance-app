// src/types/oauth-1.0a.d.ts
declare module 'oauth-1.0a' {
  interface OAuthRequest {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
  }

  interface OAuthToken {
    key: string;
    secret: string;
  }

  interface OAuthOptions {
    consumer: {
      key: string;
      secret: string;
    };
    signature_method: 'HMAC-SHA1' | 'HMAC-SHA256' | string;
    hash_function(base_string: string, key: string): string;
  }

  interface OAuthHeader {
    Authorization: string;
  }

  class OAuth {
    constructor(options: OAuthOptions);
    authorize(request: OAuthRequest, token?: OAuthToken): any;
    toHeader(oauth_data: any): OAuthHeader;
  }

  export = OAuth;
}
