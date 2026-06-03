import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetWind3,
    presetWebFonts,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'

import fs from 'node:fs/promises'

export default defineConfig({
    shortcuts: [
        ['btn', 'px-4 py-1 rounded inline-block text-white pointer-events-auto cursor-pointer disabled:cursor-default disabled:opacity-40 disabled:pointer-events-none'],
        ['icon-btn', 'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600'],
    ],
    theme: {
        // fontFamily: {
        //     sans: ['Inter', 'sans-serif'],
        // },
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
    extendTheme: (theme) => {
        return {
            ...theme,
            fontSize: {
                ...theme.fontSize,
                '2sm': ['0.938rem', '1.375rem'], // ['15px', '22px']
            },
        }
    },
    safelist: [
        'font-sans',
    ],
    presets: [
        presetWind3(),
        presetAttributify(),
        presetIcons({
            scale: 1.2,
            collections: {
                carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default as any),
                fad: () => import('@iconify-json/fad/icons.json').then(i => i.default as any),
                'game-icons': () => import('@iconify-json/game-icons/icons.json').then(i => i.default as any),
                tabler: () => import('@iconify-json/tabler/icons.json').then(i => i.default as any),
                'lets-icons': () => import('@iconify-json/lets-icons/icons.json').then(i => i.default as any),
                'streamline-flex': () => import('@iconify-json/streamline-flex/icons.json').then(i => i.default as any),
                custom: {
                    icon: () => fs.readFile('./public/icon.svg', 'utf-8'),
                }
            }
        }),
        presetWebFonts({
            provider: {
                name: 'none',
                getImportUrl() {
                    // return 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..800;1,14..32,400;1,14..32,600&display=swap' // Specific weights with optical size and italics
                    return 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap' // All weights with optical size and italics
                    // return 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap' // All weights with italics but no optical size
                },
            },
            fonts: {
                sans: { name: 'Inter' },
            },

            // provider: 'bunny',
            // fonts: {
            //     sans: {
            //         name: 'Inter',
            //         weights: ['400', '400i', '500', '600', '600i', '700', '800'],
            //     },
            // },

            // provider: 'google',
            // fonts: {
            //     // sans: 'Inter:ital,wght@0,400..800;1,400;1,600',
            //     sans: {
            //         name: 'Inter',
            //         // weights: ['400', '400i', '500', '600', '600i', '700', '800'],
            //         weights: ['400..800'],
            //         italic: true
            //     },
            // },

            processors: createLocalFontProcessor({ // This will download the fonts and serve them locally
                cacheDir: 'node_modules/.cache/unocss/fonts', // Directory to cache the fonts
                fontAssetsDir: 'public/assets/fonts', // Directory to save the fonts assets
                fontServeBaseUrl: '/assets/fonts', // Base URL to serve the fonts from the client
            })
        }),
    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup()
    ]
})
