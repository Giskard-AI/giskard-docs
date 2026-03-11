import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/**
 * Determines which section a pathname belongs to based on its prefix.
 * Returns the section name (e.g., 'oss', 'hub') or null if no match.
 */
function getCurrentSection(pathname: string): string | null {
	if (pathname.startsWith('/oss')) return 'oss';
	if (pathname.startsWith('/hub/sdk')) return 'hub/sdk';
	// Add more sections here as needed
	return null;
}

/**
 * Checks if a sidebar entry belongs to the given section.
 * This works by checking if the entry's href (for links) or nested entries (for groups)
 * belong to the section's URL prefix.
 */
function entryBelongsToSection(entry: any, section: string): boolean {
	const sectionPrefix = `/${section}`;
	
	// Check if this is a link entry with an href
	if (entry.type === 'link' && entry.href) {
		return entry.href.startsWith(sectionPrefix);
	}
	
	// Check if this is a group with nested entries
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
});

