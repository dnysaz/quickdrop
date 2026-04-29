import Redis from 'ioredis';

let redis;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!redis) {
      if (!process.env.REDIS_URL) {
        throw new Error('REDIS_URL environment variable is missing');
      }
      redis = new Redis(process.env.REDIS_URL);
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const text = await redis.get(id);
    const ttl = await redis.ttl(id);
    
    if (!text) {
      return res.status(404).json({ error: 'Text expired or not found' });
    }

    return res.status(200).json({ text, ttl });
  } catch (error) {
    console.error('Error in get.js:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
