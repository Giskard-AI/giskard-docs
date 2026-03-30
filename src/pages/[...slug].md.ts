import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug || 'index';
	const entry = await getEntry('docs', slug);

	if (!entry) {
		return new Response('Not found', { status: 404 });
	}

	const lines = ['---'];
	if (entry.data.title) lines.push(`title: "${entry.data.title}"`);
	if (entry.data.description) lines.push(`description: "${entry.data.description}"`);
	lines.push('---', '');

	const markdown = lines.join('\n') + (entry.body ?? '');

	return new Response(markdown, {
		status: 200,
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
