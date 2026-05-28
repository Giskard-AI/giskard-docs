// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";
import starlight from "@astrojs/starlight";

import mermaid from "astro-mermaid";
import starlightAutoSidebar from "starlight-auto-sidebar";
import starlightImageZoom from "starlight-image-zoom";

// https://astro.build/config
export default defineConfig({
    site: 'https://docs.giskard.ai',
    trailingSlash: 'never',

    integrations: [
        starlight({
            favicon: '/favicon.ico',
            title: 'Giskard Documentation',
            logo: {
                light: './src/assets/logo.png',
                dark: './src/assets/logo_dark.png',
                alt: 'Giskard',
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
                // Overview sidebar
                {
                    label: 'Overview',
                    items: [
                        { slug: 'index', label: 'Welcome to Giskard' },
                        { slug: 'start/comparison', label: 'Open Source vs Hub' },
                        { slug: 'start/enterprise-trial', label: 'Request your enterprise trial' },
                        {
                            label: 'Knowledge Glossary',
                            collapsed: true,
                            items: [{ autogenerate: { directory: 'start/glossary', collapsed: true } }],
                        },
                        { label: 'Contact us ↗', link: 'https://www.giskard.ai/contact', attrs: { target: '_blank' } },
                        { label: 'Blog ↗', link: 'https://www.giskard.ai/knowledge-categories/blog', attrs: { target: '_blank' } },
                    ],
                },
                // Hub UI sidebar
                {
                    label: 'Hub UI',
                    items: [{ autogenerate: { directory: 'hub/ui', collapsed: false } }],
                },
                // Hub SDK sidebar
                {
                    label: 'Hub SDK',
                    items: [{ autogenerate: { directory: 'hub/sdk', collapsed: false } }],
                },
                // Open Source sidebar
                {
                    label: 'Get Started',
                    items: [
                        { label: 'Giskard Library', slug: 'oss' },
                        { slug: 'oss/agent-skills', label: 'Agent Skills' },
                        { slug: 'oss/contributing', label: 'Contributing' },
                    ]
                },
                {
                    label: 'Checks',
                    items: [{ autogenerate: { directory: 'oss/checks', collapsed: false } }],
                },
            ],
            routeMiddleware: './src/routeData.ts',
            expressiveCode: {
                themes: ['catppuccin-mocha', 'catppuccin-latte'],
                styleOverrides: {
                    borderRadius: '0.5rem',
                },
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
                starlightAutoSidebar(),
                starlightImageZoom(),
            ]
        }),
        mermaid(),
    ],

    vite: {
        plugins: [tailwindcss()],
    },

    adapter: cloudflare(),
});
