import { appDescription, appName, appURL } from './constants/index'

// Compute the base path for static assets (GitHub Pages project site).
// NUXT_APP_BASE_URL is set in CI (e.g. "/particle-life/"); defaults to "/" locally.
const appBase = (process.env.NUXT_APP_BASE_URL || '/').replace(/\/+$/, '')
const assetPath = (file: string) => `${appBase}/${file}`

export default defineNuxtConfig({
    devtools: {
        enabled: false,
        timeline: {
            enabled: false,
        },
    },
    gtag: {
        enabled: process.env.NODE_ENV === 'production' && !!process.env.NUXT_PUBLIC_GTAG_ID,
        id: process.env.NUXT_PUBLIC_GTAG_ID, // G-XXXXXXXXXX
    },
    modules: [
        '@vueuse/nuxt',
        '@unocss/nuxt',
        '@pinia/nuxt',
        "@nuxtjs/seo",
        "@nuxt/eslint",
        'floating-vue/nuxt',
        'nuxt-gtag',
    ],

    site: {
        url: appURL,
        name: appName,
        description: appDescription,
        defaultLocale: 'en',
    },
    app: {
        head: {
            titleTemplate: '%s %separator %siteName', // Default
            templateParams: {
                separator: '•', // '-', '·', '—', '•'
            },
            htmlAttrs: {
                lang: 'en',
            },
            link: [
                { rel: 'icon', href: assetPath('favicon.ico?v=1'), sizes: 'any' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', href: assetPath('favicon-16x16.png?v=1') },
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: assetPath('favicon-32x32.png?v=1') },
                { rel: 'apple-touch-icon', sizes: '180x180', href: assetPath('apple-touch-icon.png?v=1') },
                { rel: 'manifest', href: assetPath('site.webmanifest?v=1') },
                { rel: 'mask-icon', type: 'image/svg+xml', href: assetPath('safari-pinned-tab.svg?v=1'), color: '#264653' },
                { rel: 'shortcut icon', href: assetPath('favicon.ico?v=1') },
            ],
            meta: [
                { name: 'author', content: 'DicSo92' },
                { property: 'og:site_name', content: appName },
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: appName },
                { name: 'twitter:description', content: appDescription },
                { name: 'twitter:site', content: '@SandboxScience' },
                { name: 'twitter:image:alt', content: '@SandboxScience' },
                { name: 'msapplication-TileColor', content: '#264653' },
                { name: 'theme-color', content: '#264653' },
                { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            ],
        },
        // seoMeta: {
        //     author: 'DicSo92',
        //     ogSiteName: appName,
        //     twitterTitle: appName,
        //     twitterDescription: appDescription,
        //     twitterCard: 'summary_large_image',
        //     twitterSite: '@SandboxScience',
        //     twitterImageAlt: '@SandboxScience',
        //     msapplicationTileColor: '#264653',
        //     themeColor: '#264653',
        //     appleMobileWebAppStatusBarStyle: 'black-translucent',
        // },
    },
    seo: {
        redirectToCanonicalSiteUrl: false,
    },
    schemaOrg: {
        identity: {
            type: 'Organization',
            name: 'DicSo92 - Sandbox Science',
            url: 'https://github.com/DicSo92',
            logo: 'https://avatars.githubusercontent.com/u/33453944?v=4',
            sameAs: [
                'https://github.com/DicSo92/SandboxScience',
                'https://github.com/DicSo92',
                'https://sandbox-science.com',
            ],
        },
    },
    ogImage: {
        enabled: false,
        defaults: {
            cacheMaxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
    },

    experimental: {
        typedPages: true,
    },

    linkChecker: {
        enabled: true,
        debug: true,
    },

    sitemap: {
        zeroRuntime: true,
    },

    robots: {
        // @nuxtjs/seo cannot auto-generate robots.txt when app.baseURL is set
        // (GitHub Pages project site). Serve a static public/robots.txt instead.
        robotsTxt: false,
    },

    nitro: {
        esbuild: {
            options: {
                target: 'esnext',
            },
        },
        prerender: {
            crawlLinks: false,
            routes: ['/', '/about', '/particle-life', '/game-of-life', '/hash-life', '/sitemap.xml', '/robots.txt'], // Pre-render routes
            ignore: [],
        },
        compressPublicAssets: {
            gzip: true,
            brotli: true,
        },
        publicAssets: process.env.NODE_ENV === 'production'
            ? [
                    {
                        baseURL: '/assets/fonts',
                        dir: 'public/assets/fonts',
                        maxAge: 60 * 60 * 24 * 365,
                    },
                ]
            : [],
    },

    css: [
        '@unocss/reset/tailwind.css', // Maybe need @unocss/reset package
        '~/assets/scss/main.scss',
    ],

    features: {
        inlineStyles: false, // For UnoCSS
    },

    eslint: {
        config: {
            standalone: false,
        },
    },

    compatibilityDate: '2025-12-18',
})
