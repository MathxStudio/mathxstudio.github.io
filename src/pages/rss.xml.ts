import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function escapeXml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.toString() ?? 'https://example.com').replace(/\/+$/, '');
  const writings = await getCollection('writing', ({ data }) => !data.draft);
  const notes = await getCollection('notes', ({ data }) => !data.draft);

  const items = [
    ...writings.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description ?? '',
      date: entry.data.date,
      url: `${baseUrl}/writing/${entry.id}`,
    })),
    ...notes.map((entry) => ({
      title: entry.data.title,
      description: entry.data.topic ? `Notes · ${entry.data.topic}` : 'Notes',
      date: entry.data.date,
      url: `${baseUrl}/notes/${entry.id}`,
    })),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());

  const xmlItems = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Personal Site</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Mathematics, architecture, photography, and notes.</description>
${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
