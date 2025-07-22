// src/services/OBPDataService.ts - Open Bank Project API Data Fetching Service
import axios, { AxiosResponse } from 'axios';
import { getOAuth, createOAuthRequest } from '../util/OAuthHelper';
import config from '../config';

// OBP API Response Types (based on OBP v4.0.0 API documentation)
export interface OBPAccount {
  id: string;
  label: string;
  bank_id: string;
  account_attributes: Array<{
    name: string;
    type: string;
    value: string;
  }>;
  account_routing: {
    scheme: string;
    address: string;
  };
  account_routings: Array<{
    scheme: string;
    address: string;
  }>;
  tags: Array<{
    value: string;
    date: string;
  }>;
  balance: {
    currency: string;
    amount: string;
  };
  account_type: string;
  owners: Array<{
    id: string;
    provider: string;
    display_name: string;
  }>;
}

export interface OBPTransaction {
  id: string;
  account: {
    id: string;
    bank_id: string;
  };
  counterparty: {
    id: string;
    name: string;
    holder: {
      name: string;
    };
    account: {
      routing: {
        scheme: string;
        address: string;
      };
    };
  };
  details: {
    type: string;
    description: string;
    posted: string;
    completed: string;
    new_balance: {
      currency: string;
      amount: string;
    };
    value: {
      currency: string;
      amount: string;
    };
  };
  metadata: {
    narrative: string;
    comments: Array<{
      id: string;
      value: string;
      date: string;
      user: {
        id: string;
        provider: string;
        display_name: string;
      };
    }>;
    tags: Array<{
      id: string;
      value: string;
      date: string;
      user: {
        id: string;
        provider: string;
        display_name: string;
      };
    }>;
    images: Array<{
      id: string;
      label: string;
      url: string;
      date: string;
      user: {
        id: string;
        provider: string;
        display_name: string;
      };
    }>;
    where: {
      latitude: number;
      longitude: number;
      date: string;
      user: {
        id: string;
        provider: string;
        display_name: string;
      };
    };
  };
}

export interface OBPAccountsResponse {
  accounts: OBPAccount[];
}

export interface OBPTransactionsResponse {
  transactions: OBPTransaction[];
}

// Service for interacting with OBP API
export class OBPDataService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.openBank.baseUrl;
  }

  /**
   * Makes an authenticated request to OBP API using OAuth 1.0a
   */
  private async makeOAuthRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    accessToken: string,
    accessTokenSecret: string,
    data?: any
  ): Promise<T> {
    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;

      // Create OAuth signed request
      const requestData = createOAuthRequest(fullUrl, method, data || {});

      // Get OAuth helper to generate signature
      const oauth = getOAuth();

      // Create token object for signing
      const token = {
        key: accessToken,
        secret: accessTokenSecret
      };

      // Generate OAuth header
      const authHeader = oauth.toHeader(
        oauth.authorize(requestData, token)
      );

      console.info(`🔗 Making OBP API request to: ${endpoint}`);

      const response: AxiosResponse<T> = await axios({
        method: method,
        url: fullUrl,
        headers: {
          'Authorization': authHeader.Authorization,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'MyFinance360/1.0'
        },
        data: method !== 'GET' ? data : undefined,
        timeout: 30000,
        validateStatus: (status) => status < 500
      });

      if (response.status !== 200) {
        throw new Error(`OBP API returned status ${response.status}: ${JSON.stringify(response.data)}`);
      }

      console.info(`✅ OBP API request successful: ${endpoint}`);
      return response.data;

    } catch (error: any) {
      console.error(`❌ OBP API request failed for ${endpoint}:`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`OBP API request failed: ${error.message}`);
    }
  }

  /**
   * Fetch all accounts for the authenticated user
   */
  async fetchAccounts(accessToken: string, accessTokenSecret: string): Promise<OBPAccount[]> {
    try {
      console.info('🏦 Fetching accounts from OBP API...');

      const response = await this.makeOAuthRequest<OBPAccountsResponse>(
        '/obp/v4.0.0/my/accounts',
        'GET',
        accessToken,
        accessTokenSecret
      );

      console.info(`✅ Fetched ${response.accounts.length} accounts from OBP`);
      return response.accounts;

    } catch (error) {
      console.error('❌ Failed to fetch accounts from OBP:', error);
      throw error;
    }
  }

  /**
   * Fetch transactions for a specific account
   */
  async fetchTransactions(
    accountId: string,
    bankId: string,
    accessToken: string,
    accessTokenSecret: string,
    limit: number = 100
  ): Promise<OBPTransaction[]> {
    try {
      console.info(`💰 Fetching transactions for account ${accountId} from OBP API...`);

      const endpoint = `/obp/v4.0.0/my/accounts/${accountId}/transactions?limit=${limit}`;

      const response = await this.makeOAuthRequest<OBPTransactionsResponse>(
        endpoint,
        'GET',
        accessToken,
        accessTokenSecret
      );

      console.info(`✅ Fetched ${response.transactions.length} transactions from OBP`);
      return response.transactions;

    } catch (error) {
      console.error(`❌ Failed to fetch transactions for account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch account details by ID
   */
  async fetchAccountDetails(
    accountId: string,
    bankId: string,
    accessToken: string,
    accessTokenSecret: string
  ): Promise<OBPAccount> {
    try {
      console.info(`🔍 Fetching account details for ${accountId} from OBP API...`);

      const response = await this.makeOAuthRequest<OBPAccount>(
        `/obp/v4.0.0/my/accounts/${accountId}`,
        'GET',
        accessToken,
        accessTokenSecret
      );

      console.info(`✅ Fetched account details for ${accountId}`);
      return response;

    } catch (error) {
      console.error(`❌ Failed to fetch account details for ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Test the OBP API connection
   */
  async testConnection(accessToken: string, accessTokenSecret: string): Promise<boolean> {
    try {
      console.info('🧪 Testing OBP API connection...');

      // Try to fetch user info as a simple test
      await this.makeOAuthRequest<any>(
        '/obp/v4.0.0/users/current',
        'GET',
        accessToken,
        accessTokenSecret
      );

      console.info('✅ OBP API connection test successful');
      return true;

    } catch (error) {
      console.error('❌ OBP API connection test failed:', error);
      return false;
    }
  }

  /**
   * Map OBP account type to our internal account type enum
   */
  mapAccountType(obpAccountType: string): string {
    const typeMapping: { [key: string]: string } = {
      'CURRENT': 'checking',
      'SAVINGS': 'savings',
      'CREDIT': 'credit_card',
      'INVESTMENT': 'investment',
      'LOAN': 'loan',
      'DEPOSIT': 'savings'
    };

    return typeMapping[obpAccountType.toUpperCase()] || 'other';
  }

  /**
   * Map OBP transaction amount to our transaction type
   */
  mapTransactionType(amount: string): 'income' | 'expense' | 'transfer' {
    const numAmount = parseFloat(amount);

    if (numAmount > 0) {
      return 'income';
    } else if (numAmount < 0) {
      return 'expense';
    } else {
      return 'transfer';
    }
  }

  /**
   * Extract merchant name from OBP transaction
   */
  extractMerchantName(transaction: OBPTransaction): string | null {
    // Try multiple sources for merchant name
    if (transaction.counterparty?.name) {
      return transaction.counterparty.name;
    }

    if (transaction.counterparty?.holder?.name) {
      return transaction.counterparty.holder.name;
    }

    if (transaction.metadata?.narrative) {
      return transaction.metadata.narrative;
    }

    return transaction.details?.description || null;
  }
}
