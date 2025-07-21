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