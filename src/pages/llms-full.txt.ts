import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async () => {
	const docs = await getCollection('docs');

	// Sort entries by slug for consistent ordering
	const sorted = docs.sort((a, b) => a.id.localeCompare(b.id));

	const parts: string[] = [
		'# Giskard Documentation — Full Content',
		'',
		'> This file contains the full text of every Giskard documentation page,',
		'> concatenated for LLM consumption. For the page index, see /llms.txt.',
		'> For individual pages as Markdown, append .md to any docs URL.',
		'',
	];

	for (const entry of sorted) {
		const url = entry.id === 'index' ? '/' : `/${entry.id}`;
		parts.push(`${'='.repeat(72)}`);
		parts.push(`# ${entry.data.title}`);
		parts.push(`URL: https://docs.giskard.ai${url}`);
		if (entry.data.description) {
			parts.push(`Description: ${entry.data.description}`);
		}
		parts.push(`${'='.repeat(72)}`);
		parts.push('');
		parts.push(entry.body ?? '');
		parts.push('');
	}

	return new Response(parts.join('\n'), {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
