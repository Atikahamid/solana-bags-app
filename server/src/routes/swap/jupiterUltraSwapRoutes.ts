import { Router } from 'express';
import {
  getUltraSwapOrderHandler,
  executeUltraSwapOrderHandler,
  getUltraBalancesHandler
} from '../../controllers/jupiterUltraSwapController';
import { buyToken, getAllUsersPnl, getPortfolioChart, getUserPnl, getUserPositions, sellToken } from '../../controllers/pnlController';
import jupiterSwapRouter from './jupiterSwapRoutes';
// import { getUserChats } from '../../controllers/chatController';

const jupiterUltraSwapRouter = Router();

/**
 * POST /api/jupiter/ultra/order
 * Get a swap order from Jupiter Ultra API
 */
jupiterUltraSwapRouter.post('/order', getUltraSwapOrderHandler);
 
/**    
 * POST /api/jupiter/ultra/execute
 * Execute a swap order via Jupiter Ultra API
 */
jupiterUltraSwapRouter.post('/execute', executeUltraSwapOrderHandler);
jupiterUltraSwapRouter.post('/buy-pnl', buyToken);
jupiterUltraSwapRouter.post('/sell-pnl', sellToken);
jupiterUltraSwapRouter.get('/get-pnl/:userPrivyId', getUserPnl);
jupiterUltraSwapRouter.get('/get-all-userpnl', getAllUsersPnl);
// jupiterUltraSwapRouter.get('/get-all-userpnl-by-time-metrics', getUsersPnlByTimeMetrics);
jupiterUltraSwapRouter.get('/users/:userPrivyId/positions', getUserPositions);
jupiterUltraSwapRouter.get('/user-chart/:userPrivyId', getPortfolioChart);


/**
 * GET /api/jupiter/ultra/balances
 * Get token balances for a wallet via Jupiter Ultra API
 */
jupiterUltraSwapRouter.get('/balances', getUltraBalancesHandler);

export default jupiterUltraSwapRouter; 