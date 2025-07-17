import { Response } from 'express';
import { BankService } from '../services/BankService';
import { CreateBankTokenDto } from '../model/Bankmodel';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';
import { AuthRequest } from '../config/types';

export class BankController {
  constructor(private bankService: BankService) {}

  connectBankAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const dto: Omit<CreateBankTokenDto, 'user_id'> = req.body;
    
    const token = await this.bankService.connectBankAccount(userId, dto);
    res.status(201).json(token.toJSON());
  });

  getBankConnections = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const tokens = await this.bankService.getUserBankTokens(userId);
    res.json(tokens.map(t => t.toJSON()));
  });

  revokeBankConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    await this.bankService.revokeBankToken(userId, tokenId);
    res.status(204).send();
  });

  getBankToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    const token = await this.bankService.getTokenById(tokenId);
    if (token.user_id !== userId) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json(token.toJSON());
  });

  updateBankToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    // Verify token belongs to user
    const existingToken = await this.bankService.getTokenById(tokenId);
    if (existingToken.user_id !== userId) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const token = await this.bankService.updateToken(tokenId, req.body);
    res.json(token.toJSON());
  });
}