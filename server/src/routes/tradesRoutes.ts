import { Router } from 'express';
import { fetchTrades, ingestNow, listLatestTrades } from '../controllers/tradesController';


const tradesRouter = Router();


// REST endpoints
tradesRouter.get('/', listLatestTrades);
tradesRouter.post('/ingest', ingestNow); // optional manual trigger
tradesRouter.get('/fetch', fetchTrades)

export default tradesRouter;