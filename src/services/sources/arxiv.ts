import { XMLParser } from 'fast-xml-parser';
import { RawSignal } from '../../types';

function sha1(input: string): string {
  // Node 18+ has crypto.subtle in web, but for Node scripts we can fall back to a simple hash.
  // Use a lightweight JS implementation to avoid Node 'crypto' import in web bundles.
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

export async function fetchArxiv(max: number = 40): Promise<RawSignal[]> {
  const search = encodeURIComponent('cat:cs.AI OR cat:cs.CL OR cat:cs.LG OR cat:stat.ML');
  const base = `https://export.arxiv.org/api/query?search_query=${search}&sortBy=submittedDate&sortOrder=descending&max_results=${max}`;

  const parseXml = (xml: string): RawSignal[] => {
    const parser = new XMLParser({ ignoreAttributes: false });
    const feed: any = parser.parse(xml);
    const entries: any[] = feed?.feed?.entry ? (Array.isArray(feed.feed.entry) ? feed.feed.entry : [feed.feed.entry]) : [];
    return entries.map((e) => {
      const title: string = (e.title || '').toString().replace(/\s+/g, ' ').trim();
      const link = Array.isArray(e.link)
        ? (e.link.find((l: any) => l['@_type'] === 'text/html')?.['@_href'] || e.link[0]['@_href'])
        : e.link?.['@_href'];
      const publishedAt: string = e.published || e.updated || new Date().toISOString();
      const authors = Array.isArray(e.author) ? e.author.map((a: any) => a.name).join(', ') : e.author?.name;

      const id = sha1(`arxiv|${link}|${title}`);
      return {
        id,
        source: 'arxiv',
        title,
        url: link,
        author: authors,
        summary: (e.summary || '').toString().trim(),
        tags: ['research'],
        publishedAt,
        metadata: {
          arxivId: e.id,
          categories: e.category,
        },
      } as RawSignal;
    });
  };

  // 1) Direct
  try {
    const res = await fetch(base, { redirect: 'follow' as RequestRedirect });
    if (res.ok) {
      const xml = await res.text();
      const out = parseXml(xml);
      if (out.length === 0) console.warn('[ingest] arXiv parsed 0 entries (direct)');
      return out;
    }
    console.warn('[ingest] arXiv direct fetch not OK:', res.status, res.statusText);
  } catch (e) {
    console.warn('[ingest] arXiv direct fetch failed', e);
  }

  // 2) AllOrigins
  try {
    const proxied = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(base)}`);
    if (proxied.ok) {
      const xml = await proxied.text();
      const out = parseXml(xml);
      if (out.length === 0) console.warn('[ingest] arXiv parsed 0 entries (allorigins)');
      return out;
    }
  } catch (e) {
    console.warn('[ingest] arXiv allorigins failed', e);
  }

  // 3) Jina Reader mirror
  try {
    const jina = `https://r.jina.ai/${base}`;
    const jr = await fetch(jina);
    if (jr.ok) {
      const xml = await jr.text();
      const out = parseXml(xml);
      if (out.length === 0) console.warn('[ingest] arXiv parsed 0 entries (jina)');
      return out;
    }
  } catch (e) {
    console.warn('[ingest] arXiv jina failed', e);
  }

  console.warn('[ingest] arXiv returned no results after all fallbacks');
  return [];
}


