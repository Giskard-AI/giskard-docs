import { defineMiddleware } from 'astro:middleware';

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

	return next();
});
