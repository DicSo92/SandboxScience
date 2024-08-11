import { appDescription } from './constants/index'

export default defineNuxtConfig({
    devtools: {
        enabled: false,
        timeline: {
            enabled: false,
        },
    },
    modules: [
        '@vueuse/nuxt',
        '@unocss/nuxt',
        // ['@pinia/nuxt', { autoImports: ['defineStore'] }],
        '@pinia/nuxt',
        'nuxt-module-eslint-config',
        '@nuxtjs/color-mode',
    ],

    alias: {
        // pinia: process.env.NODE_ENV === 'production' ? '/node_modules/pinia/dist/pinia.mjs' : '/node_modules/@pinia/nuxt/node_modules/pinia/dist/pinia.mjs',
        // pinia: '/node_modules/@pinia/nuxt/node_modules/pinia/dist/pinia.mjs',
    },

    app: {
        head: {
            viewport: 'width=device-width,initial-scale=1',
            link: [
                { rel: 'icon', href: '/favicon.ico?v=1', sizes: 'any' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=1' },
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=1' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png?v=1' },
                { rel: 'manifest', href: '/site.webmanifest?v=1' },
                { rel: 'mask-icon', type: 'image/svg+xml', href: '/safari-pinned-tab.svg?v=1', color: '#264653' },
                { rel: 'shortcut icon', href: '/favicon.ico?v=1' },
            ],
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: appDescription },
                { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
                { name: 'msapplication-TileColor', content: '#264653' },
                { name: 'theme-color', content: '#264653' },
            ],
        },
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
        // For UnoCSS
        inlineStyles: false,
    },

    eslintConfig: {
        setup: false,
    },
})
