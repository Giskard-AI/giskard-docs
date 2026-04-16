import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { execSync } from 'node:child_process';

// Prerender at build time so git is available for lastmod dates
export const prerender = true;

function getLastModified(filePath: string): string | null {
	try {
		const date = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
			encoding: 'utf-8',
			timeout: 5000,
		}).trim();
		return date ? date.split('T')[0] : null;
	} catch {
		return null;
	}
}

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const GET: APIRoute = async () => {
	const siteUrl = 'https://docs.giskard.ai';
	const docs = await getCollection('docs');

	const urls = docs
		.filter((entry) => entry.id !== '404')
		.map((entry) => {
			const path = entry.id === 'index' ? '' : `/${entry.id}`;
			const url = `${siteUrl}${path}`;

			// Try both file path variants (flat and directory-based)
			const lastmod =
				getLastModified(`src/content/docs/${entry.id}.mdx`) ||
				getLastModified(`src/content/docs/${entry.id}.md`) ||
				getLastModified(`src/content/docs/${entry.id}/index.mdx`) ||
				getLastModified(`src/content/docs/${entry.id}/index.md`);

			return { url, lastmod };
		})
		.sort((a, b) => a.url.localeCompare(b.url));

	const urlEntries = urls
		.map(({ url, lastmod }) => {
			const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
			return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmodTag}\n  </url>`;
		})
		.join('\n');

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

	return new Response(sitemap, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
