export interface ICell {
    x: number
    y: number
    size: number
    isAlive: boolean
    nextAlive: boolean
    makeAlive: (isInit?: boolean) => void
    kill: (isInit?: boolean) => void
    toggle: () => void
    coordinates: { x: number, y: number }
}