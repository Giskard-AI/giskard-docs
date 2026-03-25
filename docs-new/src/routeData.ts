import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/**
 * Determines which section a pathname belongs to based on its prefix.
 * Returns the section name (e.g., 'oss', 'hub') or null if no match.
 */
function getCurrentSection(pathname: string): string | null {
	if (pathname === '/' || pathname.startsWith('/start')) return 'overview';
	if (pathname.startsWith('/hub/ui')) return 'hub/ui';
	if (pathname.startsWith('/hub/sdk')) return 'hub/sdk';
	if (pathname.startsWith('/oss')) return 'oss';
	return null;
}

/**
 * Checks if a sidebar entry belongs to the given section.
 * This works by checking if the entry's href (for links) or nested entries (for groups)
 * belong to the section's URL prefix.
 */
function entryBelongsToSection(entry: any, section: string): boolean {
	// The overview section matches hrefs "/", "/start/...", and external links
	if (section === 'overview') {
		if (entry.type === 'link' && entry.href) {
			return entry.href === '/' || entry.href.startsWith('/start') || entry.href.startsWith('https://');
		}
		if (entry.type === 'group' && entry.entries) {
			return entry.entries.some((item: any) => entryBelongsToSection(item, section));
		}
		return false;
	}

	const sectionPrefix = `/${section}`;

	if (entry.type === 'link' && entry.href) {
		return entry.href.startsWith(sectionPrefix);
	}

	if (entry.type === 'group' && entry.entries) {
		return entry.entries.some((item: any) => entryBelongsToSection(item, section));
	}

	return false;
}

export const onRequest = defineRouteMiddleware(async (context, next) => {
	// Wait for other middleware (including plugins like starlight-auto-sidebar) to run first
	await next();
	
	const route = context.locals.starlightRoute;
	if (!route) return;

	const pathname = context.url.pathname ?? '/';
	const currentSection = getCurrentSection(pathname);

	if (!currentSection) {
		// No sidebar for routes that don't belong to any section
		route.sidebar = [];
		route.hasSidebar = false;
	} else {
		// Filter sidebar to only show items for the current section
		route.sidebar = route.sidebar.filter((entry) =>
			entryBelongsToSection(entry, currentSection),
		);
	}

	// Replace the default "Overview" TOC label with the page title
	if (route.toc && route.entry?.data?.title) {
		const topItem = route.toc.items?.find((item: any) => item.slug === '_top');
		if (topItem && topItem.text === 'Overview') {
			topItem.text = route.entry.data.title;
		}
	}
});

