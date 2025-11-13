import { Request, Response } from 'express';
import { getLatestTrades, ingestOnceAndBroadcast } from '../services/tradeServices';
import { fetchRecentSwapsFromBirdeye } from '../services/tradeServices';

export async function listLatestTrades(req: Request, res: Response) {
    try {
        const limit = Math.min(Number(req.query.limit || 20), 200);
        const rows = await getLatestTrades(limit);
        res.json({ success: true, items: rows });
    } catch (e: any) {
        console.error('listLatestTrades error:', e?.message || e);
        res.status(500).json({ success: false, error: 'Failed to load trades' });
    }
}


export async function ingestNow(req: Request, res: Response) {
    try {
        const io = (req as any).webSocketService?.io;
        const result = await ingestOnceAndBroadcast(io);
        res.json({ success: true, ...result });
    } catch (e: any) {
        console.error('ingestNow error:', e?.message || e);
        res.status(500).json({ success: false, error: 'Ingest failed' });
    }
}
export async function fetchTrades(req: Request, res: Response) {
    try {
    const data = await fetchRecentSwapsFromBirdeye();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}