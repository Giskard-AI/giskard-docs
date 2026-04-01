import { defineMiddleware } from 'astro:middleware';
import redirectMap from './redirects.json';

const redirects: Record<string, string> = redirectMap;

export const onRequest = defineMiddleware((context, next) => {
	const { pathname } = context.url;

	// Skip raw markdown endpoints — handled by API route
	if (pathname.endsWith('.md')) {
		return next();
	}

	// Redirect trailing slashes to their canonical version (without slash).
	// Skip the root path "/" since it's already canonical.
	if (pathname !== '/' && pathname.endsWith('/')) {
		const canonical = pathname.slice(0, -1) + context.url.search;
		return context.redirect(canonical, 301);
	}

	// Legacy URL redirect: strip .html extensions and look up redirect map
	let cleaned = pathname;

	// Step 1: /path/index.html or /path/index.html/ → /path
	cleaned = cleaned.replace(/\/index\.html\/?$/, '');

	// Step 2: /path.html or /path.html/ → /path
	cleaned = cleaned.replace(/\.html\/?$/, '');

	// Step 3: look up in redirect map
	if (cleaned !== pathname) {
		// URL was cleaned — check if the cleaned path has a redirect
		const target = redirects[cleaned];
		if (target) {
			return context.redirect(target, 301);
		}
		// No redirect mapping, but URL had .html — redirect to cleaned version
		return context.redirect(cleaned || '/', 301);
	}

	// URL had no .html but might still be an old path in the redirect map
	const target = redirects[pathname];
	if (target) {
		return context.redirect(target, 301);
	}

	return next();
});
