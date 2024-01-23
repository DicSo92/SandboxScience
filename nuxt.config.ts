// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: [
        '@vueuse/nuxt',
        '@unocss/nuxt',
        ['@pinia/nuxt', {autoImports: ['defineStore']}],

    ],

    css: [
        '@unocss/reset/tailwind.css', // Maybe need @unocss/reset package
    ],
    features: {
        // For UnoCSS
        inlineStyles: false,
    },

    alias: {
        pinia: process.env.NODE_ENV === 'production' ? '/node_modules/pinia/dist/pinia.mjs' : '/node_modules/@pinia/nuxt/node_modules/pinia/dist/pinia.mjs',
    },
})