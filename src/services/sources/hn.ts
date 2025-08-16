import { RawSignal } from '../../types';

function sha1(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

export async function fetchHackerNewsAI(max: number = 40): Promise<RawSignal[]> {
  const query = encodeURIComponent('AI OR "large language model" OR LLM OR "deep learning" OR "machine learning"');
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${query}&tags=story&hitsPerPage=${max}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const hits: any[] = data?.hits || [];

  return hits.map((h) => {
    const title = h.title || h.story_title || '';
    const link = h.url || h.story_url || '';
    const publishedAt = h.created_at || new Date().toISOString();
    const id = sha1(`hn|${link}|${title}`);
    return {
      id,
      source: 'hn',
      title,
      url: link,
      author: h.author,
      summary: h._highlightResult?.title?.value?.replace(/<[^>]+>/g, '') || '',
      tags: ['news', 'discussion'],
      publishedAt,
      metadata: { points: h.points || 0, objectID: h.objectID },
    } as RawSignal;
  });
}


