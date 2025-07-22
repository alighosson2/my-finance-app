import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getOAuth, createOAuthRequest } from '../util/OAuthHelper';
import { asyncHandler } from '../middleware/asyncHandler'; // Import your async handler

const router = Router();

// POST /api/admin/obp-data-import
// Body: JSON for OBP sandbox data import
// NOTE: Secure this route for admin/internal use only!
router.post('/obp-data-import', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const url = 'https://apisandbox.openbankproject.com/obp/v5.1.0/sandbox/data-import';

  // Get OBP OAuth credentials from env (or fetch from DB if needed)
  const accessToken = process.env.OBP_ACCESS_TOKEN;
  const accessTokenSecret = process.env.OBP_ACCESS_TOKEN_SECRET;

  if (!accessToken || !accessTokenSecret) {
    res.status(500).json({ 
      error: 'OBP access token and secret must be set in environment variables.' 
    });
    return;
  }

  const oauth = getOAuth();
  const request = createOAuthRequest(url, 'POST', data);

  const oauthData = oauth.authorize(request, {
    key: accessToken,
    secret: accessTokenSecret,
  });
  
  const headers = {
    ...oauth.toHeader(oauthData),
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(url, data, { headers });
    res.json(response.data);
  } catch (error: any) {
    // Enhanced error handling for axios errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status || 500).json({
        error: 'OBP API Error',
        details: error.response.data,
        status: error.response.status
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        error: 'No response received from OBP API',
        details: 'Service unavailable'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({
        error: 'Request setup error',
        details: error.message
      });
    }
  }
}));

export default router;
/*import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getOAuth, createOAuthRequest, debugOAuthSignature } from '../util/OAuthHelper';
import { asyncHandler } from '../middleware/asyncHandler';
import config from '../config';

const router = Router();

// POST /api/admin/obp-data-import
router.post('/obp-data-import', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const url = 'https://apisandbox.openbankproject.com/obp/v5.1.0/sandbox/data-import';
  
  // Validate required OAuth credentials
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = config.openBank;
  
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    res.status(500).json({
      error: 'Missing OBP OAuth credentials',
      details: 'All OAuth environment variables must be set'
    });
    return;
  }
  
  try {
    const oauth = getOAuth();
    
    // Create request object for OAuth signing
    // Important: For POST with JSON body, don't include body in OAuth signature
    const request = createOAuthRequest(url, 'POST');
    
    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    };
    
    // Generate OAuth signature
    const oauthData = oauth.authorize(request, token);
    const authHeader = oauth.toHeader(oauthData);
    
    // Debug OAuth signature generation
    console.log('🔍 Debug OAuth for data import:');
    debugOAuthSignature(request, token);
    
    const headers = {
      'Authorization': authHeader.Authorization,
      'Content-Type': 'application/json',
    };
    
    console.log('📤 Final request:');
    console.log('- URL:', url);
    console.log('- Method: POST');
    console.log('- Headers:', headers);
    console.log('- Body length:', JSON.stringify(data).length);
    
    const response = await axios.post(url, data, { headers });
    
    console.log('✅ OBP Response Status:', response.status);
    res.json(response.data);
    
  } catch (error: any) {
    console.error('❌ OBP API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: 'OBP API Error',
        details: error.response.data,
        status: error.response.status,
        // Include debug info for development
        debug: process.env.NODE_ENV === 'development' ? {
          requestUrl: url,
          requestHeaders: error.config?.headers,
        } : undefined
      });
    } else if (error.request) {
      res.status(503).json({
        error: 'No response received from OBP API',
        details: 'Service unavailable'
      });
    } else {
      res.status(500).json({
        error: 'Request setup error',
        details: error.message
      });
    }
  }
}));

// Additional helper route for testing OAuth signature
router.get('/test-oauth', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const oauth = getOAuth();
    const testUrl = 'https://apisandbox.openbankproject.com/obp/v5.1.0/my/accounts';
    const request = createOAuthRequest(testUrl, 'GET');
    
    const token = {
      key: config.openBank.accessToken,
      secret: config.openBank.accessTokenSecret,
    };
    
    const { oauthData, header } = debugOAuthSignature(request, token);
    
    res.json({
      message: 'OAuth signature test',
      request: {
        url: testUrl,
        method: 'GET'
      },
      oauth: oauthData,
      header: header.Authorization
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'OAuth test failed',
      details: error.message
    });
  }
}));

export default router;*/