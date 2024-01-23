import { appDescription } from './constants/index'

export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: [
        '@vueuse/nuxt',
        '@unocss/nuxt',
        ['@pinia/nuxt', { autoImports: ['defineStore'] }],
        'nuxt-module-eslint-config',
        '@nuxtjs/color-mode',
    ],

    app: {
        head: {
            viewport: 'width=device-width,initial-scale=1',
            link: [
                { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
                { rel: 'icon', type: 'image/svg+xml', href: '/nuxt.svg' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
            ],
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: appDescription },
                { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
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

    alias: {
        pinia: process.env.NODE_ENV === 'production' ? '/node_modules/pinia/dist/pinia.mjs' : '/node_modules/@pinia/nuxt/node_modules/pinia/dist/pinia.mjs',
    },
})
