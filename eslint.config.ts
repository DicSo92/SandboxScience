import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
    antfu({
        unocss: true,
        formatters: false,
        ignores: ['.github/**'],
        stylistic: {
            indent: 4, // 4, or 'tab'
        },
        rules: {
            // 'comma-dangle': ['error', 'never'],
            "vue/block-order": ["error", {
                order: ["template", "script", "style"],
            }],
            "style/quotes": ["off"], // default 'single'
            // The simulation components use compact switch/case blocks
            // (`case X: stmt; break`) and multi-declaration lines as an
            // established idiom; splitting 300+ of them is low-value churn.
            "style/max-statements-per-line": "off",
            // The renderer components (ParticleLife*) are large setup() bodies full of
            // mutually-referencing `const fn = () => {}` consts that are only *invoked*
            // after setup completes (in rAF/event callbacks), so the references are safe.
            // This rule cannot tell a later-running callback reference apart from a real
            // TDZ read, and reordering ~240 const definitions across 4k-line files is high-
            // risk churn for no safety gain. Disabled project-wide on that basis.
            "ts/no-use-before-define": "off",
            // This is an interactive simulation tool; status/debug logging
            // (key presses, GIF progress, GPU caps, pointer-lock notices) is
            // intentional. Allow the standard console methods instead of forcing
            // everything through warn/error.
            'no-console': ['error', { allow: ['log', 'info', 'warn', 'error', 'debug', 'table'] }],
            // Kebab-case event names (update-rule, switch-renderer) are the Vue
            // convention for DOM events; don't force camelCase.
            'vue/custom-event-name-casing': 'off',
            // process.env is standard in Nuxt/Node config files.
            'node/prefer-global/process': 'off',
            // Vue 3 supports fragments (multiple root elements).
            'vue/no-multiple-template-root': 'off',
            // `new Array(n)` is clear intent; not worth forcing Array.from().
            'unicorn/no-new-array': 'off',
            // Exporting mutable bindings is a common pattern for shared state.
            'import/no-mutable-exports': 'off',
            'regexp/no-dupe-disjunctions': 'off',
        },
    }),
)
