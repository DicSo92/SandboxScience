function hexToBgr(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
        parseInt(result[3], 16),
        parseInt(result[2], 16),
        parseInt(result[1], 16)
    ] : null
}

function bgrToHex(bgr: number[]) {
    let hex = "0xff"
    for (let i = 0; i < 3; i++) {
        let bgrValue = bgr[i].toString(16)
        if (bgrValue.length === 1) {
            bgrValue = "0" + bgrValue
        }
        hex += bgrValue
    }
    // return parseInt(hex, 16)
    return Number(hex)
}

function interpolateColor(color1: number[], color2: number[], factor: number) {
    const b = Math.round(color1[0] + factor * (color2[0] - color1[0]))
    const g = Math.round(color1[1] + factor * (color2[1] - color1[1]))
    const r = Math.round(color1[2] + factor * (color2[2] - color1[2]))
    return [b, g, r]
}

function generateColorRange(color1: string, color2: string, steps: number) {
    const bgrColor1 = hexToBgr(color1)
    const bgrColor2 = hexToBgr(color2)
    if (!bgrColor1 || !bgrColor2) {
        throw new Error('Invalid color format')
    }
    const colorRange = []
    for (let i = 0; i < steps; i++) {
        const factor = i / (steps - 1)
        const interpolatedColor = interpolateColor(bgrColor1, bgrColor2, factor)
        colorRange.push(bgrToHex(interpolatedColor))
    }
    return colorRange
}

// Two-State themes
const themes = [
    {
        name: 'Mono',
        type: 'simple',
        icon: 'i-tabler-contrast',
        category: 'Simple',
        BACKGROUND: '#000000',
        ALIVE: '#ffffff',
        DEAD: '#000000'
    },
    {
        name: 'Inverse',
        type: 'simple',
        icon: 'i-tabler-contrast-filled',
        category: 'Simple',
        BACKGROUND: '#dddddd',
        ALIVE: '#000000',
        DEAD: '#dddddd'
    },
    {
        name: 'Blues',
        type: 'history',
        icon: 'i-tabler-droplet-filled',
        category: 'History',
        BACKGROUND: '#000000',
        ALIVE: '#00ffff',
        ALIVERAMP: '#ffffff',
        DEAD: '#0000ff',
        DEADRAMP: '#00002f'
    },
    {
        name: 'Fire',
        type: 'history',
        icon: 'i-tabler-flame',
        category: 'History',
        BACKGROUND: '#000000',
        ALIVE: '#ff9000',
        ALIVERAMP: '#ffff00',
        DEAD: '#A00000',
        DEADRAMP: '#200000'
    },
    {
        name: 'Poison',
        type: 'history',
        icon: 'i-tabler-skull',
        category: 'History',
        BACKGROUND: '#000000',
        ALIVE: '#00ffff',
        ALIVERAMP: '#ffffff',
        DEAD: '#008000',
        DEADRAMP: '#001800'
    },
    {
        name: 'Arcane',
        type: 'history',
        icon: 'i-tabler-wand',
        category: 'History',
        BACKGROUND: '#002080',
        ALIVE: '#ffff00',
        ALIVERAMP: '#ffffff',
        DEAD: '#800080',
        DEADRAMP: '#002f00'
    },
    {
        name: 'Matrix',
        type: 'simple',
        icon: 'i-tabler-binary-tree',
        category: 'Simple',
        BACKGROUND: '#000000',
        ALIVE: '#00ff41',
        DEAD: '#000000'
    },
    {
        name: 'Blueprint',
        type: 'simple',
        icon: 'i-tabler-ruler-2',
        category: 'Simple',
        BACKGROUND: '#0a2463',
        ALIVE: '#e8e8e8',
        DEAD: '#0a2463'
    },
    {
        name: 'Amber',
        type: 'simple',
        icon: 'i-tabler-lamp',
        category: 'Simple',
        BACKGROUND: '#1a0a00',
        ALIVE: '#ffbf00',
        DEAD: '#1a0a00'
    },
    {
        name: 'Sunset',
        type: 'history',
        icon: 'i-tabler-sunset-2',
        category: 'History',
        BACKGROUND: '#0d0221',
        ALIVE: '#ff6c11',
        ALIVERAMP: '#ffd700',
        DEAD: '#cc2936',
        DEADRAMP: '#1a0510'
    },
    {
        name: 'Ocean',
        type: 'history',
        icon: 'i-tabler-wave-sine',
        category: 'History',
        BACKGROUND: '#000814',
        ALIVE: '#00b4d8',
        ALIVERAMP: '#caf0f8',
        DEAD: '#023e8a',
        DEADRAMP: '#000510'
    },
    {
        name: 'Forest',
        type: 'history',
        icon: 'i-tabler-tree',
        category: 'History',
        BACKGROUND: '#0a0f0a',
        ALIVE: '#80b918',
        ALIVERAMP: '#d4f07a',
        DEAD: '#2d6a4f',
        DEADRAMP: '#081408'
    },
    {
        name: 'Rose',
        type: 'history',
        icon: 'i-tabler-rosette',
        category: 'History',
        BACKGROUND: '#0e0008',
        ALIVE: '#ff69b4',
        ALIVERAMP: '#ffc0e0',
        DEAD: '#c2185b',
        DEADRAMP: '#1a0010'
    },
    {
        name: 'Ice',
        type: 'history',
        icon: 'i-tabler-snowflake',
        category: 'History',
        BACKGROUND: '#020812',
        ALIVE: '#a8dadc',
        ALIVERAMP: '#f1faee',
        DEAD: '#457b9d',
        DEADRAMP: '#051020'
    },
    {
        name: 'Amethyst',
        type: 'history',
        icon: 'i-tabler-diamond',
        category: 'History',
        BACKGROUND: '#0a0015',
        ALIVE: '#b388ff',
        ALIVERAMP: '#e8d0ff',
        DEAD: '#7c4dff',
        DEADRAMP: '#120025'
    },
    {
        name: 'Neon',
        type: 'history',
        icon: 'i-tabler-bolt',
        category: 'History',
        BACKGROUND: '#000000',
        ALIVE: '#39ff14',
        ALIVERAMP: '#f5ff00',
        DEAD: '#ff00ff',
        DEADRAMP: '#1a001a'
    },
    {
        name: 'Lava',
        type: 'history',
        icon: 'i-tabler-mountain',
        category: 'History',
        BACKGROUND: '#0a0000',
        ALIVE: '#ff4500',
        ALIVERAMP: '#ffcc00',
        DEAD: '#8b0000',
        DEADRAMP: '#1a0000'
    },
    {
        name: 'Midnight',
        type: 'history',
        icon: 'i-tabler-moon-stars',
        category: 'History',
        BACKGROUND: '#000010',
        ALIVE: '#e0e0ff',
        ALIVERAMP: '#ffffff',
        DEAD: '#1a1a4e',
        DEADRAMP: '#000008'
    },
    {
        name: 'Coral',
        type: 'history',
        icon: 'i-tabler-seeding',
        category: 'History',
        BACKGROUND: '#050010',
        ALIVE: '#ff7f50',
        ALIVERAMP: '#ffd1b3',
        DEAD: '#e05090',
        DEADRAMP: '#1a0020'
    }
]

// Multi-State themes



export {
    generateColorRange, hexToBgr, bgrToHex, themes
}