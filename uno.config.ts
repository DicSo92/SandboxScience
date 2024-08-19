import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetTypography,
    presetUno,
    presetWebFonts,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

import fs from 'node:fs/promises'

export default defineConfig({
    shortcuts: [
        ['btn', 'px-4 py-1 rounded inline-block text-white cursor-pointer disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'],
        ['icon-btn', 'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600'],
    ],
    theme: {
        container: {
            padding: {
                DEFAULT: '1rem',
                sm: '1rem',
                lg: '8rem',
                xl: '12rem',
                '2xl': '16rem',
            },
        },
    },
    presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
            scale: 1.2,
            collections: {
                carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default as any),
                fad: () => import('@iconify-json/fad/icons.json').then(i => i.default as any),
                'game-icons': () => import('@iconify-json/game-icons/icons.json').then(i => i.default as any),
                tabler: () => import('@iconify-json/tabler/icons.json').then(i => i.default as any),

                custom: {
                    icon: () => fs.readFile('./public/icon.svg', 'utf-8'),
                }
            }
        }),
        presetTypography(),
        presetWebFonts({
            fonts: {
                // sans: 'DM Sans',
                // serif: 'DM Serif Display',
                // mono: 'DM Mono'
                sans: 'Inter',
            },
        }),
    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup()
    ]
})
