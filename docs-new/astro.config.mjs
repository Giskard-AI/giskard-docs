// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

import starlightAutoSidebar from 'starlight-auto-sidebar'

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    site: 'https://docs-v3.giskard.ai',
    trailingSlash: 'never',

    integrations: [
        starlight({
            favicon: '/favicon.ico',
            title: 'Giskard Documentation',
            logo: {
                light: './src/assets/logo.png',
                dark: './src/assets/logo_dark.png',
            },
            customCss: [
                // Load custom styles
                './src/styles/custom.css',
            ],
            social: [
                { label: 'GitHub', href: 'https://github.com/Giskard-AI/giskard-oss', icon: 'github' },
                { label: 'Discord', href: 'https://discord.com/invite/ABvfpbu69R', icon: 'discord' },
            ],
            sidebar: [
                // Hub UI sidebar
                {
                    label: 'Hub UI',
                    autogenerate: { directory: 'hub/ui', collapsed: false },
                },
                // Hub SDK sidebar
                {
                    label: 'Hub SDK',
                    autogenerate: { directory: 'hub/sdk', collapsed: false },
                },
                // Open Source sidebar
                {
                    label: 'Get Started',
                    items: [
                        { label: 'Giskard Library', slug: 'oss' },
                    ]
                },
                {
                    label: 'Checks',
                    autogenerate: { directory: 'oss/checks', collapsed: false },
                },
            ],
            routeMiddleware: './src/routeData.ts',
            expressiveCode: {
                // Configure expressive code if needed, defaults are usually good
                themes: ['dracula', 'github-light'],
            },
            lastUpdated: true,
            components: {
                Head: './src/components/Head.astro',
                Header: './src/components/Header.astro',
                Pagination: './src/components/Pagination.astro',
                MarkdownContent: './src/components/MarkdownContent.astro',
                Sidebar: './src/components/Sidebar.astro',
            },
            plugins: [
                starlightAutoSidebar()
            ]
        }),
        react(),
        tailwind({
            // Disable base styles to avoid conflict with Starlight if needed, 
            // but Starlight's tailwind plugin handles this.
            applyBaseStyles: false,
        }),
    ],

    adapter: cloudflare(),
});