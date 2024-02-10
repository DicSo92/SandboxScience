const neighbourCellsMap: number[][] = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
]

const aliveNeighbours = (x: number, y: number) => {
    return neighbourCellsMap.reduce((numNeighbours: number, [dx, dy]) => {
        return numNeighbours + (isCellAlive(x + dx, y + dy) ? 1 : 0);
    }, 0)
}

const isCellAlive = (x: number, y: number): boolean => {
    const game = useGameStore()

    // Dead / Alive Mode
    if (game.EDGEMODE === 'dead' || game.EDGEMODE === 'alive') {
        if (x < 0 || x >= game.cols || y < 0 || y >= game.rows) { // if outside the grid
            return game.EDGEMODE === 'alive'
        }
        return game.cellsArray[XYToIndex(x, y, game.cols)].isAlive
    }
    // Mirror Mode
    if (game.EDGEMODE === 'mirror') {
        const newX: number = (x + game.cols) % game.cols // opposite x on the grid
        const newY: number = (y + game.rows) % game.rows // opposite y on the grid

        return game.cellsArray[XYToIndex(newX, newY, game.cols)].isAlive
    }
    console.log('EDGEMODE not found')
    return false
}

const XYToIndex = (x: number, y: number, cols: number) => {
    return x + (y * cols)
}

const pixelToCell = (x: number, y: number) => {
    const game = useGameStore()

    return {
        x: Math.floor((x - game.colx) / game.size),
        y: Math.floor((y - game.rowx) / game.size)
    }
}

export { aliveNeighbours, XYToIndex, pixelToCell }