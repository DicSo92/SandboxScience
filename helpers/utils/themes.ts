function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null
}

function rgbToHex(rgb: number[]) {
    let hex = "0xff"
    for (let i = 0; i < 3; i++) {
        let rgbValue = rgb[i].toString(16)
        if (rgbValue.length === 1) {
            rgbValue = "0" + rgbValue
        }
        hex += rgbValue
    }
    // return parseInt(hex, 16)
    return Number(hex)
}

function interpolateColor(color1: number[], color2: number[], factor: number) {
    const r = Math.round(color1[0] + factor * (color2[0] - color1[0]))
    const g = Math.round(color1[1] + factor * (color2[1] - color1[1]))
    const b = Math.round(color1[2] + factor * (color2[2] - color1[2]))
    return [r, g, b]
}

function generateColorRange(color1: string, color2: string, steps: number) {
    const rgbColor1 = hexToRgb(color1)
    const rgbColor2 = hexToRgb(color2)
    if (!rgbColor1 || !rgbColor2) {
        throw new Error('Invalid color format')
    }
    const colorRange = []
    for (let i = 0; i < steps; i++) {
        const factor = i / (steps - 1)
        const interpolatedColor = interpolateColor(rgbColor1, rgbColor2, factor)
        colorRange.push(rgbToHex(interpolatedColor))
    }
    return colorRange
}

// Two-State themes
const mono = {
    BACKGROUND: '#000000',
    ALIVE: '#ffffff',
    DEAD: '#000000'
}
const blues = {
    BACKGROUND: '#000000',
    ALIVE: '#00ffff',
    ALIVERAMP: '#ffffff',
    DEAD: '#0000ff',
    DEADRAMP: '#00002f'
}
const fire = {
    BACKGROUND: '#000000',
    ALIVE: '#ff9000',
    ALIVERAMP: '#ffff00',
    DEAD: '#A00000',
    DEADRAMP: '#200000'
}
const poison = {
    BACKGROUND: '#000000',
    ALIVE: '#00ffff',
    ALIVERAMP: '#ffffff',
    DEAD: '#008000',
    DEADRAMP: '#001800'
}

const yellow = {
    BACKGROUND: '#002080',
    ALIVE: '#ffff00',
    ALIVERAMP: '#ffffff',
    DEAD: '#800080',
    DEADRAMP: '#002f00'
}

// Multi-State themes



export {
    generateColorRange
}