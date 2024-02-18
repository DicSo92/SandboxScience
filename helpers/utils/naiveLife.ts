// const neighbourCellsMap: number[][] = [
//     [-1, -1], [0, -1], [1, -1],
//     [-1, 0],           [1, 0],
//     [-1, 1],  [0, 1],  [1, 1]
// ]
//
// const aliveNeighbours = (x: number, y: number, maxNeighbours: number) => {
//     let numNeighbours = 0
//     for (let i = 0; i < neighbourCellsMap.length; i++) {
//         const [dx, dy] = neighbourCellsMap[i]
//         if (isCellAlive(x + dx, y + dy)) {
//             numNeighbours++
//             if (numNeighbours > maxNeighbours) break // Stop the loop if the number of neighbours is greater than the maximum number of neighbours
//         }
//     }
//     return numNeighbours;
// }

const neighbourCellsMap: Int8Array = new Int8Array([
    -1, -1,  0, -1,  1, -1,
    -1,  0,         1,  0,
    -1,  1,  0,  1,  1,  1
])

const aliveNeighbours = (x: number, y: number, maxNeighbours: number, cellsArray: any, rows: number, cols: number, EDGEMODE: string): number => {
    let numNeighbours = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const newX = (x + dx + cols) % cols
            const newY = (y + dy + rows) % rows
            numNeighbours += cellsArray[newX][newY] === 1 ? 1 : 0
            // numNeighbours += isCellAlive(newX, newY, cellsArray, rows, cols, EDGEMODE) ? 1 : 0
            if (numNeighbours > maxNeighbours) return numNeighbours
        }
    }
    return numNeighbours;
}

// const aliveNeighbours = (x: number, y: number, maxNeighbours: number): number => {
//     let numNeighbours = 0;
//     for (let i = 0; i < neighbourCellsMap.length; i += 2) {
//         const dx = neighbourCellsMap[i];
//         const dy = neighbourCellsMap[i + 1];
//         if (isCellAlive(x + dx, y + dy)) {
//             numNeighbours++;
//             if (numNeighbours > maxNeighbours) break;
//         }
//     }
//     return numNeighbours;
// }

const isCellAlive = (x: number, y: number, cellsArray: any, rows: number, cols: number, EDGEMODE: string): boolean => {
    // Dead / Alive Mode
    if (EDGEMODE === 'dead' || EDGEMODE === 'alive') {
        if (x < 0 || x >= cols || y < 0 || y >= rows) { // if outside the grid
            return EDGEMODE === 'alive'
        }
        return cellsArray[x][y] === 1
    }
    // Mirror Mode
    if (EDGEMODE === 'mirror') {
        const newX: number = (x + cols) % cols // opposite x on the grid
        const newY: number = (y + rows) % rows // opposite y on the grid

        return cellsArray[newX][newY] === 1
    }
    console.log('EDGEMODE not found')
    return false
}

const XYToIndex = (x: number, y: number, cols: number) => {
    return x + (y * cols)
}

const pixelToCell = (x: number, y: number, colx: number, rowx: number, size: number) => {
    return {
        x: Math.floor((x - colx) / size),
        y: Math.floor((y - rowx) / size)
    }
}

export { aliveNeighbours, pixelToCell }