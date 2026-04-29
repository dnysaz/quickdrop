import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const response = await axios.get(url, { timeout: 3000 });
    const html = response.data;
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;
    
    const faviconMatch = html.match(/<link.*?rel=["'](?:shortcut )?icon["'].*?href=["'](.*?)["']/i);
    let favicon = faviconMatch ? faviconMatch[1] : '';
    
    if (favicon && !favicon.startsWith('http')) {
      const urlObj = new URL(url);
      favicon = `${urlObj.protocol}//${urlObj.host}${favicon.startsWith('/') ? '' : '/'}${favicon}`;
    }

    return res.status(200).json({ title, favicon });
  } catch (error) {
    return res.status(200).json({ title: url, favicon: '' }); // Fail gracefully
  }
}
