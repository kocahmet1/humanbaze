import { XMLParser } from 'fast-xml-parser';
import { RawSignal } from '../../types';

function sha1(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

export const DEFAULT_FEEDS: string[] = [
  // OpenAI
  'https://openai.com/blog/rss',
  // Google AI Blog (DeepMind/Google AI)
  'https://blog.google/technology/ai/rss/',
  // Meta AI
  'https://ai.facebook.com/blog/rss/',
  // Stability AI
  'https://stability.ai/blog/rss.xml',
  // Anthropic (Hugo sites often expose index.xml)
  'https://www.anthropic.com/index.xml',
  // Mistral (may not expose RSS; keep for best-effort)
  'https://mistral.ai/news/index.xml',
];

async function fetchRss(url: string): Promise<RawSignal[]> {
  const tryParse = (xml: string) => {
    const parser = new XMLParser({ ignoreAttributes: false });
    const feed: any = parser.parse(xml);
    const items: any[] = feed?.rss?.channel?.item || feed?.feed?.entry || [];
    const entries = Array.isArray(items) ? items : [items];
    return entries.map((item) => {
      const title = (item.title || '').toString();
      const link = item.link?.['@_href'] || item.link || item.guid || '';
      const publishedAt = item.pubDate || item.published || item.updated || new Date().toISOString();
      return {
        id: sha1(`blog|${url}|${link}|${title}`),
        source: 'blog',
        title,
        url: link,
        author: item.author?.name || item['dc:creator'] || undefined,
        summary: (item.description || item.summary || '').toString().replace(/<[^>]+>/g, ''),
        tags: ['announcement'],
        publishedAt: new Date(publishedAt).toISOString(),
        metadata: { feed: url },
      } as RawSignal;
    });
  };

  try {
    // Direct fetch (may fail due to CORS)
    const res = await fetch(url, { redirect: 'follow' as RequestRedirect });
    if (res.ok) {
      const xml = await res.text();
      return tryParse(xml);
    }
  } catch {}

  try {
    // Fallback via public CORS proxy for dev use
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const proxied = await fetch(proxyUrl);
    if (proxied.ok) {
      const xml = await proxied.text();
      return tryParse(xml);
    }
  } catch {}

  try {
    // Secondary fallback via rss2json (JSON response, permissive CORS; rate-limited)
    const jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const r = await fetch(jsonUrl);
    if (r.ok) {
      const j: any = await r.json();
      if (j?.status === 'ok' && Array.isArray(j.items)) {
        return j.items.map((item: any) => ({
          id: sha1(`blog|${url}|${item.link}|${item.title}`),
          source: 'blog',
          title: item.title,
          url: item.link,
          author: item.author,
          summary: (item.description || '').toString().replace(/<[^>]+>/g, ''),
          tags: ['announcement'],
          publishedAt: new Date(item.pubDate || item.published || Date.now()).toISOString(),
          metadata: { feed: url },
        } as RawSignal));
      }
    }
  } catch {}

  try {
    // Tertiary fallback via Jina Reader proxy (CORS-open plain text mirror)
    const jina1 = `https://r.jina.ai/${url.startsWith('http') ? '' : 'https://'}${url.replace(/^https?:\/\//, '')}`;
    const jr = await fetch(jina1);
    if (jr.ok) {
      const xml = await jr.text();
      return tryParse(xml);
    }
    const jina2 = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    const jr2 = await fetch(jina2);
    if (jr2.ok) {
      const xml = await jr2.text();
      return tryParse(xml);
    }
  } catch {}

  return [];
}

export async function fetchCompanyBlogs(feeds: string[] = DEFAULT_FEEDS): Promise<RawSignal[]> {
  const all: RawSignal[][] = await Promise.all(feeds.map((f) => fetchRss(f)));
  return all.flat();
}


