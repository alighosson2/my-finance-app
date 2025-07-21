import { Router } from 'express';
import { TaxController } from '../controllers/TaxController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();
const taxController = new TaxController();

// Apply authentication middleware to all routes
router.use(authenticate);

// ===== TAX RECORD MANAGEMENT =====

// Create new tax record
router.post('/', asyncHandler(taxController.createTaxRecord));

// Get all tax records for user
router.get('/', asyncHandler(taxController.getAllTaxRecords));

// Get available tax years
router.get('/years', asyncHandler(taxController.getTaxYears));

// Get tax record by specific year
router.get('/year/:year', asyncHandler(taxController.getTaxRecordByYear));

// Get tax record by ID
router.get('/:id', asyncHandler(taxController.getTaxRecord));

// Update tax record
router.put('/:id', asyncHandler(taxController.updateTaxRecord));

// Delete tax record
router.delete('/:id', asyncHandler(taxController.deleteTaxRecord));

// ===== TAX CALCULATIONS =====

// Calculate tax estimate (without saving)
router.post('/calculate', asyncHandler(taxController.calculateTaxEstimate));

// Refresh tax calculations for existing record
router.post('/year/:year/refresh', asyncHandler(taxController.refreshCalculations));

// ===== TAX REPORTS =====

// Generate comprehensive tax report
router.get('/year/:year/report', asyncHandler(taxController.generateTaxReport));

export default router; 