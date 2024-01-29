import type { ICell } from "~/models/interfaces/ICell.interface";

const surroundings = {
    nw: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index - cols - 1],    // top-left
    n: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index - cols],         // top
    ne: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index - cols + 1],    // top-right
    w: (cellsArray: ICell[], index: number) => cellsArray[index - 1],                          // center-left
    e: (cellsArray: ICell[], index: number) => cellsArray[index + 1],                          // center-right
    so: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index + cols - 1],    // bottom-left
    s: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index + cols],         // bottom
    se: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index + cols + 1],    // bottom-right

    otnw: (cellsArray: ICell[], index: number, rows: number, cols: number) => cellsArray[index + (cols * (rows - 1)) - 1],  // opposite-top-north-west
    otn: (cellsArray: ICell[], index: number, rows: number, cols: number) => cellsArray[index + (cols * (rows - 1))],       // opposite-top-north
    otne: (cellsArray: ICell[], index: number, rows: number, cols: number) => cellsArray[index + (cols * (rows - 1)) + 1],  // opposite-top-north-east
    olnw: (cellsArray: ICell[], index: number) => cellsArray[index - 1],                                                    // opposite-left-north-west
    olw: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index + (cols - 1)],                              // opposite-left-west
    olsw: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index + (cols * 2) - 1],                         // opposite-left-south-west
    orne: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index - (cols * 2) + 1],                         // opposite-right-north-east
    ore: (cellsArray: ICell[], index: number, cols: number) => cellsArray[index - (cols - 1)],                              // opposite-right-east
    orse: (cellsArray: ICell[], index: number) => cellsArray[index + 1],                                                    // opposite-right-south-east
    obsw: (cellsArray: ICell[], index: number, rows: number, cols: number) => cellsArray[index - (cols * (rows - 1)) - 1],  // opposite-bottom-south-west
    obs: (cellsArray: ICell[], index: number, rows: number, cols: number) => cellsArray[index - (cols * (rows - 1))],       // opposite-bottom-south
    obse: (cellsArray: ICell[], index: number, rows: number, cols: number) => cellsArray[index - (cols * (rows - 1)) + 1],  // opposite-bottom-south-east
}

const surroundingsWithMirrorEdges = (cellsArray: ICell[], index: number, rows: number, cols: number) => {
    // check if cell is on the edge
    if (index % cols === 0) {
        // left edge
        return [
            surroundings.n(cellsArray, index, cols),     // top
            surroundings.ne(cellsArray, index, cols),    // top-right
            surroundings.e(cellsArray, index),           // center-right
            surroundings.se(cellsArray, index, cols),    // bottom-right
            surroundings.s(cellsArray, index, cols),     // bottom
            surroundings.olsw(cellsArray, index, cols),  // opposite-left-south-west
            surroundings.olw(cellsArray, index, cols),   // opposite-left-west
            surroundings.olnw(cellsArray, index),        // opposite-left-north-west
        ]
    } else if (index % cols === cols - 1) {
        // right edge
        return [
            surroundings.nw(cellsArray, index, cols),    // top-left
            surroundings.n(cellsArray, index, cols),     // top
            surroundings.w(cellsArray, index),           // center-left
            surroundings.so(cellsArray, index, cols),    // bottom-left
            surroundings.s(cellsArray, index, cols),     // bottom
            surroundings.orne(cellsArray, index, cols),  // opposite-right-north-east
            surroundings.ore(cellsArray, index, cols),   // opposite-right-east
            surroundings.orse(cellsArray, index),        // opposite-right-south-east
        ]
    } else if (index < cols) {
        // top edge
        return [
            surroundings.w(cellsArray, index),           // center-left
            surroundings.e(cellsArray, index),           // center-right
            surroundings.so(cellsArray, index, cols),    // bottom-left
            surroundings.s(cellsArray, index, cols),     // bottom
            surroundings.se(cellsArray, index, cols),    // bottom-right
            surroundings.otnw(cellsArray, index, rows, cols),  // opposite-top-north-west
            surroundings.otn(cellsArray, index, rows, cols),   // opposite-top-north
            surroundings.otne(cellsArray, index, rows, cols),  // opposite-top-north-east
        ]
    } else if (index > (cols * (rows - 1))) {
        // bottom edge
        return [
            surroundings.nw(cellsArray, index, cols),    // top-left
            surroundings.n(cellsArray, index, cols),     // top
            surroundings.ne(cellsArray, index, cols),    // top-right
            surroundings.w(cellsArray, index),           // center-left
            surroundings.e(cellsArray, index),           // center-right
            surroundings.obsw(cellsArray, index, rows, cols),  // opposite-bottom-south-west
            surroundings.obs(cellsArray, index, rows, cols),   // opposite-bottom-south
            surroundings.obse(cellsArray, index, rows, cols),  // opposite-bottom-south-east
        ]
    } else {
        // middle
        return [
            surroundings.nw(cellsArray, index, cols),    // top-left
            surroundings.n(cellsArray, index, cols),     // top
            surroundings.ne(cellsArray, index, cols),    // top-right
            surroundings.w(cellsArray, index),           // center-left
            surroundings.e(cellsArray, index),           // center-right
            surroundings.so(cellsArray, index, cols),    // bottom-left
            surroundings.s(cellsArray, index, cols),     // bottom
            surroundings.se(cellsArray, index, cols),    // bottom-right
        ]
    }
}
const surroundingsWithDeadEdges = (cellsArray: ICell[], index: number, cols: number) => {
    // check if cell is on the edge
    if (index % cols === 0) {
        // left edge
        return [
            surroundings.n(cellsArray, index, cols),     // top
            surroundings.ne(cellsArray, index, cols),    // top-right
            surroundings.e(cellsArray, index),           // center-right
            surroundings.s(cellsArray, index, cols),     // bottom
            surroundings.se(cellsArray, index, cols)     // bottom-right
        ]
    } else if (index % cols === cols - 1) {
        // right edge
        return [
            surroundings.nw(cellsArray, index, cols),    // top-left
            surroundings.n(cellsArray, index, cols),     // top
            surroundings.w(cellsArray, index),           // center-left
            surroundings.so(cellsArray, index, cols),    // bottom-left
            surroundings.s(cellsArray, index, cols)      // bottom
        ]
    } else {
        // middle
        return [
            surroundings.nw(cellsArray, index, cols),    // top-left
            surroundings.n(cellsArray, index, cols),     // top
            surroundings.ne(cellsArray, index, cols),    // top-right
            surroundings.w(cellsArray, index),           // center-left
            surroundings.e(cellsArray, index),           // center-right
            surroundings.so(cellsArray, index, cols),    // bottom-left
            surroundings.s(cellsArray, index, cols),     // bottom
            surroundings.se(cellsArray, index, cols)     // bottom-right
        ]
    }
}

export { surroundings, surroundingsWithMirrorEdges, surroundingsWithDeadEdges }