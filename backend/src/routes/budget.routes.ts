import { Router } from 'express';
import { BudgetController } from '../controllers/BudgetController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();
const budgetController = new BudgetController();

// Apply authentication middleware to all routes
router.use(authenticate);

// ===== BUDGET MANAGEMENT =====

// Create new budget
router.post('/', asyncHandler(budgetController.createBudget));

// Get all budgets for user (with filters and pagination)
router.get('/', asyncHandler(budgetController.getAllBudgets));

// Get active budgets only
router.get('/active', asyncHandler(budgetController.getActiveBudgets));

// Get budget summary/dashboard
router.get('/summary', asyncHandler(budgetController.getBudgetSummary));

// Get budget alerts
router.get('/alerts', asyncHandler(budgetController.getBudgetAlerts));

// Get budget categories
router.get('/categories', asyncHandler(budgetController.getBudgetCategories));

// Get spending analysis by category
router.get('/spending/categories', asyncHandler(budgetController.getSpendingByCategory));

// Get budget recommendations
router.get('/recommendations', asyncHandler(budgetController.getBudgetRecommendations));

// Auto-assign transactions to budgets
router.post('/auto-assign', asyncHandler(budgetController.autoAssignTransactions));

// ===== INDIVIDUAL BUDGET OPERATIONS =====

// Get specific budget by ID
router.get('/:id', asyncHandler(budgetController.getBudget));

// Update budget
router.put('/:id', asyncHandler(budgetController.updateBudget));

// Delete budget
router.delete('/:id', asyncHandler(budgetController.deleteBudget));

// Deactivate budget (soft delete)
router.post('/:id/deactivate', asyncHandler(budgetController.deactivateBudget));

// Get budget spending analysis
router.get('/:id/spending', asyncHandler(budgetController.getBudgetSpending));

export default router; 