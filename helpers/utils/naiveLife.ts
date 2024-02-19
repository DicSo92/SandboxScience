// const neighbourCellsMap: Int8Array = new Int8Array([
//     -1, -1,  0, -1,  1, -1,
//     -1,  0,         1,  0,
//     -1,  1,  0,  1,  1,  1
// ])
// const aliveNeighbours = (x: number, y: number, maxNeighbours: number, cellsArray: any, rows: number, cols: number, EDGEMODE: number): number => {
//     let numNeighbours = 0;
//     for (let i = 0; i < neighbourCellsMap.length; i += 2) {
//         const dx = neighbourCellsMap[i];
//         const dy = neighbourCellsMap[i + 1];
//         if (isCellAlive(x + dx, y + dy, cellsArray, rows, cols)) {
//         // if (isCellAlive(x + dx, y + dy)) {
//             numNeighbours++;
//             if (numNeighbours > maxNeighbours) break;
//         }
//     }
//     return numNeighbours;
// }

let aliveNeighbours: (x: number, y: number, maxNeighbours: number, cellsArray: Int32Array[], rows: number, cols: number) => number
const aliveNeighboursDead = (x: number, y: number, maxNeighbours: number, cellsArray: Int32Array[], rows: number, cols: number): number => {
    let numNeighbours = 0;
    for (let dy = -1; dy <= 1; dy++) {
        const newY = y + dy
        if (newY < 0 || newY >= rows) continue
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const newX = x + dx
            if (newX >= 0 && newX < cols && cellsArray[newX][newY] === 1) {
                numNeighbours++
                if (numNeighbours > maxNeighbours) return numNeighbours
            }
        }
    }
    // worse performance with this code (but not much, -1% slower on average, 5% slower at worst, 1% faster at best, 1% slower on average)
    // for (let dy = -1; dy <= 1; dy++) {
    //     for (let dx = -1; dx <= 1; dx++) {
    //         if (dx === 0 && dy === 0) continue
    //         const newX = x + dx
    //         const newY = y + dy
    //         if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && cellsArray[newX][newY] === 1) { // if inside the grid and alive
    //             numNeighbours++
    //             if (numNeighbours > maxNeighbours) return numNeighbours
    //         }
    //     }
    // }
    return numNeighbours;
}
const aliveNeighboursAlive = (x: number, y: number, maxNeighbours: number, cellsArray: Int32Array[], rows: number, cols: number): number => {
    let numNeighbours = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const newX = x + dx
            const newY = y + dy
            if (newX < 0 || newX >= cols || newY < 0 || newY >= rows || cellsArray[newX][newY] === 1) { // if outside the grid or alive
                numNeighbours++
                if (numNeighbours > maxNeighbours) return numNeighbours
            }
        }
    }
    return numNeighbours
}

const aliveNeighboursMirror = (x: number, y: number, maxNeighbours: number, cellsArray: Int32Array[], rows: number, cols: number): number => {
    let numNeighbours = 0;
    for (let dy = -1; dy <= 1; dy++) {
        // const newY: number = (y + dy + rows) % rows // maybe faster here (not really noticeable)
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue

            // modulo operator is slower than bitwise operator (5-9% slower) but works with any number (rows and cols)
            const newX: number = (x + dx + cols) % cols // opposite x on the grid
            const newY: number = (y + dy + rows) % rows // opposite y on the grid

            // // bit-wise operator is faster than modulo operator (5-9% faster) but only works with powers of 2 (rows and cols)
            // const newX = (x + dx + cols) & (cols - 1) // opposite x on the grid with bitwise operator
            // const newY = (y + dy + rows) & (rows - 1) // opposite y on the grid with bitwise operator

            if (cellsArray[newX][newY] === 1) {
                numNeighbours++
                if (numNeighbours > maxNeighbours) return numNeighbours
            }
        }
    }
    return numNeighbours
}
const initAliveNeighboursFunc = (EDGEMODE: number) => {
    if (EDGEMODE === 0) { // Dead Mode
        aliveNeighbours = aliveNeighboursDead
    } else if (EDGEMODE === 1) { // Alive Mode
        aliveNeighbours = aliveNeighboursAlive
    } else if (EDGEMODE === 2) { // Mirror Mode
        aliveNeighbours = aliveNeighboursMirror
    } else {
        console.log('EDGEMODE not found')
    }
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

export { aliveNeighbours, pixelToCell, initAliveNeighboursFunc }