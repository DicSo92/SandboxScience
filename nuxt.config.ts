// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: [
        '@vueuse/nuxt',
        '@unocss/nuxt',
        ['@pinia/nuxt', { autoImports: ['defineStore'] }],
        'nuxt-module-eslint-config',
        '@nuxtjs/color-mode',
    ],
    alias: {
        pinia: process.env.NODE_ENV === 'production' ? '/node_modules/pinia/dist/pinia.mjs' : '/node_modules/@pinia/nuxt/node_modules/pinia/dist/pinia.mjs',
    },

    experimental: {
        // when using generate, payload js assets included in sw precache manifest
        // but missing on offline, disabling extraction it until fixed
        payloadExtraction: false,
        renderJsonPayloads: true,
        typedPages: true,
    },

    css: [
        '@unocss/reset/tailwind.css', // Maybe need @unocss/reset package
    ],

    colorMode: {
        // preference: 'system', // default value of $colorMode.preference
        fallback: 'dark', // fallback value if not system preference found

        // classSuffix: '-mode',
    },

    features: {
        // For UnoCSS
        inlineStyles: false,
    },

    eslintConfig: {
        setup: false,
    },
})
