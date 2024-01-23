import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
    {
        unocss: true,
        formatters: true,
        stylistic: {
            indent: 4, // 4, or 'tab'
        },
        rules: {
            // 'comma-dangle': ['error', 'never'],
            "vue/block-order": ["error", {
                order: ["template", "script", "style"],
            }],
            "style/quotes": ["off"], // default 'single'
        },
    },
    nuxt,
)
