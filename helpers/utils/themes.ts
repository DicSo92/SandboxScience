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
        type:  'simple',
        BACKGROUND: '#000000',
        ALIVE: '#ffffff',
        DEAD: '#000000'
    },
    {
        name: 'Inverse',
        type:  'simple',
        BACKGROUND: '#000000',
        ALIVE: '#000000',
        DEAD: '#ffffff'
    },
    {
        name : 'Blues',
        type: 'history',
        BACKGROUND: '#000000',
        ALIVE: '#00ffff',
        ALIVERAMP: '#ffffff',
        DEAD: '#0000ff',
        DEADRAMP: '#00002f'
    },
    {
        name: 'Fire',
        type: 'history',
        BACKGROUND: '#000000',
        ALIVE: '#ff9000',
        ALIVERAMP: '#ffff00',
        DEAD: '#A00000',
        DEADRAMP: '#200000'
    },
    {
        name: 'Poison',
        type: 'history',
        BACKGROUND: '#000000',
        ALIVE: '#00ffff',
        ALIVERAMP: '#ffffff',
        DEAD: '#008000',
        DEADRAMP: '#001800'
    },
    {
        name: 'Yellow',
        type: 'history',
        BACKGROUND: '#002080',
        ALIVE: '#ffff00',
        ALIVERAMP: '#ffffff',
        DEAD: '#800080',
        DEADRAMP: '#002f00'
    }
]

// Multi-State themes



export {
    generateColorRange, hexToBgr, bgrToHex, themes
}