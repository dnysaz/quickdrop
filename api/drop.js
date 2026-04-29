import Redis from 'ioredis';
import { nanoid } from 'nanoid';

let redis;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!redis) {
      if (!process.env.REDIS_URL) {
        throw new Error('REDIS_URL environment variable is missing');
      }
      redis = new Redis(process.env.REDIS_URL);
    }

    const { text, id: client_id } = req.body;
    
    if (!text) {
      if (client_id) {
        await redis.del(client_id);
        return res.status(200).json({ success: true, deleted: true });
      }
      return res.status(400).json({ error: 'Text is required' });
    }

    const id = client_id || nanoid(5);
    await redis.set(id, text, 'EX', 600);
    
    return res.status(200).json({ id });
  } catch (error) {
    console.error('Error in drop.js:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
