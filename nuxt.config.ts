import { appURL, appName, appDescription } from './constants/index'

export default defineNuxtConfig({
    devtools: {
        enabled: false,
        timeline: {
            enabled: false,
        },
    },
    gtag: {
        enabled: process.env.NODE_ENV === 'production',
        id: process.env.NUXT_PUBLIC_GTAG_ID ?? 'G-XXXXXXXXXX'
    },
    modules: [
      '@vueuse/nuxt',
      '@unocss/nuxt',
      '@pinia/nuxt',
      '@nuxtjs/color-mode',
      "@nuxtjs/seo",
      "@nuxt/eslint",
      'floating-vue/nuxt',
      'nuxt-gtag'
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
            link: [
                { rel: 'icon', href: '/favicon.ico?v=1', sizes: 'any' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png?v=1' },
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=1' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=1' },
                { rel: 'manifest', href: '/site.webmanifest?v=1' },
                { rel: 'mask-icon', type: 'image/svg+xml', href: '/safari-pinned-tab.svg?v=1', color: '#264653' },
                { rel: 'shortcut icon', href: '/favicon.ico?v=1' },
            ],
            meta: [],
        },
        seoMeta: {
            author: 'DicSo92',
            ogSiteName: appName,
            twitterTitle: appName,
            twitterDescription: appDescription,
            twitterCard: 'summary_large_image',
            twitterSite: '@SandboxScience',
            twitterImageAlt: '@SandboxScience',
            msapplicationTileColor: '#264653',
            themeColor: '#264653',
            appleMobileWebAppStatusBarStyle: 'black-translucent',
        },
    },
    seo: {
        redirectToCanonicalSiteUrl: true
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
        }
    },
    ogImage: {
        enabled: false,
        defaults: {
            cacheMaxAgeSeconds: 60 * 60 * 24 * 7 * 1000 // 7 days
        }
    },

    experimental: {
        // when using generate, payload js assets included in sw precache manifest
        // but missing on offline, disabling extraction it until fixed
        payloadExtraction: false,
        typedPages: true,
    },

    linkChecker: {
        enabled: true,
        debug: true
    },

    nitro: {
        esbuild: {
            options: {
                target: 'esnext',
            },
        },
        prerender: {
            crawlLinks: false,
            routes: ['/', '/about', '/particle-life', '/game-of-life', '/hash-life'], // Pre-render routes
            ignore: [],
        },
    },

    css: [
        '@unocss/reset/tailwind.css', // Maybe need @unocss/reset package
        '~/assets/scss/main.scss'
    ],

    colorMode: {
        preference: 'dark', // default value of $colorMode.preference (system)
        fallback: 'dark', // fallback value if not system preference found
        classSuffix: '' // default '-mode',
    },

    features: {
        inlineStyles: false, // For UnoCSS
    },

    eslint: {
        config: {
            standalone: false,
        },
    },

    compatibilityDate: '2024-08-15'
})
