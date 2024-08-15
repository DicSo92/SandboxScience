import { appURL, appName, appDescription } from './constants/index'

export default defineNuxtConfig({
    devtools: {
        enabled: true,
        timeline: {
            enabled: false,
        },
    },
    modules: [
        '@vueuse/nuxt',
        '@unocss/nuxt',
        '@pinia/nuxt',
        '@nuxtjs/color-mode',
        "@nuxtjs/seo",
        "@nuxt/eslint"
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
        enable: false, // Because 'Nuxt version >=3.10.3 is required but currently using 3.9.3' (need nuxt upgrade)
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

    nitro: {
        esbuild: {
            options: {
                target: 'esnext',
            },
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
})