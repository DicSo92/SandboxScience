import type { ICell } from "~/models/interfaces/ICell.interface";

export class Cell implements ICell {
    ctx: CanvasRenderingContext2D | undefined
    x: number
    y: number
    size: number
    isAlive: boolean = false
    nextAlive: boolean = false

    constructor(x: number, y: number, size: number, ctx: CanvasRenderingContext2D | undefined) {
        this.x = x
        this.y = y
        this.size = size
        this.ctx = ctx
    }

    public makeAlive (isInit: boolean = false) {
        if (this.isAlive) {
            console.log(this.x + '-' + this.y + ' alive (cant revive)')
            return
        }
        this.nextAlive = true
        this.isAlive = isInit ? true : this.isAlive
    }
    public kill (isInit: boolean = false) {
        if (!this.isAlive) {
            console.log(this.coordinates.x + '-' + this.coordinates.y + ' not alive (cant remove)')
            return
        }
        this.nextAlive = false
        this.isAlive = isInit ? false : this.isAlive
    }
    public toggle () {
        this.isAlive = !this.isAlive
        this.nextAlive = this.isAlive
    }

    public get coordinates (): { x: number, y: number } {
        return {
            x: this.x * this.size,
            y: this.y * this.size
        }
    }
}