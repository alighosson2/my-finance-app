"use strict";
/*
// debug/oauth-debug.ts - Standalone OAuth debugging script
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import axios from 'axios';

// Your actual credentials from .env
const CONSUMER_KEY = 'nkge30syvowexkcr2hzsbwavywgznhxby022wjh1';
const CONSUMER_SECRET = '3unvpi3wsv232e1cijazvorv1jtb30omodztorms';
const BASE_URL = 'https://apisandbox.openbankproject.com';
const CALLBACK_URL = 'http://localhost:3000/callback';

// Create OAuth instance exactly like OBP expects
const oauth = new OAuth({
  consumer: {
    key: CONSUMER_KEY,
    secret: CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string: string, key: string): string {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

async function debugOAuthFlow() {
  console.log('🔍 Starting OAuth Debug Session');
  console.log('================================');
  
  // Step 1: Verify credentials
  console.log('📋 Credentials Check:');
  console.log('- Consumer Key:', CONSUMER_KEY);
  console.log('- Consumer Secret:', CONSUMER_SECRET ? '[PRESENT]' : '[MISSING]');
  console.log('- Base URL:', BASE_URL);
  console.log('- Callback URL:', CALLBACK_URL);
  console.log('');
  
  // Step 2: Test different request formats
  const testCases = [
    {
      name: 'Standard OAuth Request',
      request: {
        url: `${BASE_URL}/oauth/initiate`,
        method: 'POST' as const,
        data: {
          oauth_callback: CALLBACK_URL
        }
      }
    },
    {
      name: 'Empty Data OAuth Request',
      request: {
        url: `${BASE_URL}/oauth/initiate`,
        method: 'POST' as const,
        data: {}
      }
    },
    {
      name: 'No Data OAuth Request',
      request: {
        url: `${BASE_URL}/oauth/initiate`,
        method: 'POST' as const
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log('-------------------');
    
    try {
      // Generate OAuth authorization
      const authData = oauth.authorize(testCase.request);
      console.log('Generated OAuth Parameters:');
      console.log(JSON.stringify(authData, null, 2));
      
      const header = oauth.toHeader(authData);
      console.log('Authorization Header:');
      console.log(header.Authorization);
      
      // Try the actual request
      console.log('\n🌐 Making actual request...');
      
      const axiosConfig = {
        method: 'POST' as const,
        url: testCase.request.url,
        headers: {
          ...header,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'OAuth-Debug/1.0'
        },
        data: `oauth_callback=${encodeURIComponent(CALLBACK_URL)}`,
        timeout: 15000,
        validateStatus: (status: number) => status < 500
      };
      
      const response = await axios(axiosConfig);
      
      console.log(`✅ Response Status: ${response.status}`);
      console.log(`📥 Response Data: ${response.data}`);
      
      if (response.status === 200) {
        const params = new URLSearchParams(response.data);
        const oauth_token = params.get('oauth_token');
        const oauth_token_secret = params.get('oauth_token_secret');
        
        if (oauth_token && oauth_token_secret) {
          console.log('🎉 SUCCESS! Tokens received:');
          console.log(`- oauth_token: ${oauth_token}`);
          console.log(`- oauth_token_secret: ${oauth_token_secret}`);
          return { oauth_token, oauth_token_secret };
        }
      }
      
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Data: ${error.response.data}`);
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
  
  // Step 3: Test signature base string manually
  console.log('🔧 Manual Signature Generation Test');
  console.log('===================================');
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const parameters = {
    oauth_callback: CALLBACK_URL,
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0'
  };
  
  // Create signature base string manually
  const paramString = Object.keys(parameters)
    .sort()
    .map(key => `${key}=${encodeURIComponent(parameters[key as keyof typeof parameters])}`)
    .join('&');
  
  const baseString = `POST&${encodeURIComponent(`${BASE_URL}/oauth/initiate`)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(CONSUMER_SECRET)}&`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  
  console.log('Manual signature calculation:');
  console.log('- Timestamp:', timestamp);
  console.log('- Nonce:', nonce);
  console.log('- Parameter String:', paramString);
  console.log('- Base String:', baseString);
  console.log('- Signing Key:', signingKey);
  console.log('- Signature:', signature);
  
  return null;
}

// Additional helper to test with OBP's exact requirements
async function testOBPSpecificFormat() {
  console.log('\n🏦 Testing OBP-Specific Format');
  console.log('==============================');
  
  try {
    // Some OAuth providers are picky about parameter ordering and encoding
    const oauth = new OAuth({
      consumer: {
        key: CONSUMER_KEY,
        secret: CONSUMER_SECRET,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string: string, key: string): string {
        console.log('🔍 Signature Base String:', base_string);
        console.log('🔍 Signing Key:', key);
        const signature = crypto.createHmac('sha1', key).update(base_string).digest('base64');
        console.log('🔍 Generated Signature:', signature);
        return signature;
      },
    });
    
    const request = {
      url: `${BASE_URL}/oauth/initiate`,
      method: 'POST' as const,
      data: {
        oauth_callback: CALLBACK_URL
      }
    };
    
    const authData = oauth.authorize(request);
    const header = oauth.toHeader(authData);
    
    console.log('Final OAuth Header:', header.Authorization);
    
    // Test with minimal headers
    const response = await axios({
      method: 'POST',
      url: request.url,
      headers: {
        'Authorization': header.Authorization,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: `oauth_callback=${encodeURIComponent(CALLBACK_URL)}`,
      timeout: 15000
    });
    
    console.log('✅ OBP Response:', response.status, response.data);
    
  } catch (error: any) {
    console.log('❌ OBP Test Failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  await debugOAuthFlow();
  await testOBPSpecificFormat();
}

// Export for use in your application
export { debugOAuthFlow, testOBPSpecificFormat, runAllTests };

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}*/ 
//# sourceMappingURL=oauth-debug.js.map