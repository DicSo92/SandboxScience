<template>
    <section flex flex-col justify-center h-full overflow-hidden relative>
        <canvas ref="lifeCanvas" @contextmenu.prevent w-full h-full></canvas>
        <div absolute top-0 right-0 text-right pr-1>
            <p>Fps: {{ fps }}</p>
            <p>Cells: {{ cellCount }}</p>
            <p>Process: {{ Math.round(executionTime) }}</p>
        </div>
        <div absolute bottom-0 w-full flex justify-center items-center="">
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="toggleHasGrid">
                <div i-tabler-grid-3x3 text-xl></div>
            </div>
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="toggleHasWalls">
                <div i-tabler-square text-xl></div>
            </div>
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="toggleHasCells">
                <div i-tabler-circle text-xl></div>
            </div>
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="toggleHasDepthOpacity">
                <div i-tabler-chart-scatter-3d text-xl></div>
            </div>
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="toggleHasDepthSize">
                <div i-tabler-chart-scatter-3d text-xl></div>
            </div>
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="toggleIsCircle">
                <div i-tabler-grid-dots text-xl></div>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    setup() {
        // Define canvas and context for drawing
        const lifeCanvas = ref<HTMLCanvasElement | undefined>()
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0

        // Define the reactive variables for the game state
        const fps = useFps()
        const cellCount = ref<number>(0)
        const executionTime = ref<number>(0)
        const isRunning = ref<boolean>(true)

        // Define color list and rules matrix for the particles
        const colorList: string[] = ['yellow', 'red', 'green', 'cyan', 'magenta', 'blue', 'white', 'orange', 'purple', 'pink']
        let currentColors: number[] = []
        let rulesMatrix: number[][] = []

        // Define world properties
        const numParticles: number = 8000 // Number of particles
        const particleSize: number = 4 // Size of the particles at zoomFactor = 1
        const numColors: number = 8 // Number of colors to be used
        const depthLimit: number = 240 // Maximum Z axis depth (0 means almost 2D because there is friction with the walls && can be negative)
        let isCircle: boolean = true // Enable circular shape for the particles
        let hasGrid: boolean = true // Enable grid
        let hasCells: boolean = true // Enable cells
        let hasWalls: boolean = false // Enable walls X and Y for the particles
        let hasDepthSize: boolean = true // Enable depth size effect
        let hasDepthOpacity: boolean = false // Enable depth opacity effect
        const maxOpacity = 1 // Maximum opacity when hasDepthOpacity is enabled
        const minOpacity = 0.5 // Depth effect will be stronger with lower opacity
        const cellGroupSize: number = 0 // Minimum number of particles to be considered a group (0 to visualize all cells)

        // Define depth limits for randomly placed particles
        const minZDepthRandomParticle: number = depthLimit * 0.2 // The minimum Z-depth for randomly placed particles, in percentage of the depthLimit
        const maxZDepthRandomParticle: number = depthLimit * 0.45 // The maximum Z-depth for randomly placed particles, in percentage of the depthLimit
        const screenMultiplierForGridSize: number = 2.5 // Multiplier for the grid size based on the screen size

        // Define force properties
        let maxRadius: number = 60 // maximum distance for particles to start attracting
        let minRadius: number = 20 // minimum distance for particles to start repelling
        let repel: number = 1 // repel force for particles that are too close to each other
        let forceFactor: number = 0.4 // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move)
        let frictionFactor: number = 0.6 // Slow down the particles (0 to 1, where 1 is no friction)
        let zoomFactor: number = 1 // Zoom level

        // Define grid properties
        let gridOffsetX: number = 0 // Grid offset X
        let gridOffsetY: number = 0 // Grid offset Y
        let gridWidth: number = 0 // Grid width
        let gridHeight: number = 0 // Grid height
        let endGridX: number = 0 // Position X of the end of the grid
        let endGridY: number = 0 // Position Y of the end of the grid

        // Define arrays for storing the properties of each particle
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y

        // Define the arrays for storing the properties of each particle
        let cells: Map<string, number[]> // Map to store the particles in each cell
        let colors = new Int32Array(numParticles) // Color of each particle
        let positionX = new Float32Array(numParticles) // X position of each particle
        let positionY = new Float32Array(numParticles) // Y position of each particle
        let positionZ = new Float32Array(numParticles) // Z position of each particle
        let velocityX = new Float32Array(numParticles).fill(0) // X velocity of each particle
        let velocityY = new Float32Array(numParticles).fill(0) // Y velocity of each particle
        let velocityZ = new Float32Array(numParticles).fill(0) // Z velocity of each particle

        onMounted(() => {
            ctx = lifeCanvas.value?.getContext('2d') || undefined
            handleResize()
            initLife()
            if (!isRunning.value) simpleDrawParticles()
            requestAnimationFrame(update) // Start the game loop

            onKeyStroke(' ', () => { // Space bar pressed
                console.log('Key Space pressed')
                isRunning.value = !isRunning.value
            })
            onKeyStroke('c', () => { // Space bar pressed
                console.log('Key C pressed')
                centerView()
                if (!isRunning.value) simpleDrawParticles()
            })
            useEventListener('resize', handleResize)
            useEventListener(lifeCanvas, ['mousedown'], (e) => {
                lastPointerX = e.x - lifeCanvas.value!.getBoundingClientRect().left
                lastPointerY = e.y - lifeCanvas.value!.getBoundingClientRect().top
            })
            useEventListener(lifeCanvas, ['mousemove'], (e) => {
                pointerX = e.x - lifeCanvas.value!.getBoundingClientRect().left
                pointerY = e.y - lifeCanvas.value!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    isDragging = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        handleMove()
                    }
                }
                if (e.buttons === 0) {
                    isDragging = false
                }
            })
            useEventListener(lifeCanvas, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    handleZoom(1, pointerX, pointerY)
                } else { // Zoom out
                    handleZoom(-1, pointerX, pointerY)
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            canvasWidth = lifeCanvas.value!.width = lifeCanvas.value!.clientWidth
            canvasHeight = lifeCanvas.value!.height = lifeCanvas.value!.clientHeight
            setEndCoordinates()
        }
        function handleMove() {
            if (isDragging) {
                gridOffsetX += (pointerX - lastPointerX) / zoomFactor
                gridOffsetY += (pointerY - lastPointerY) / zoomFactor
                lastPointerX = pointerX
                lastPointerY = pointerY
                setEndCoordinates()
            }
        }
        function handleZoom(delta: number, x: number, y: number) {
            const oldZoomFactor = zoomFactor
            const zoomIntensity = 0.1
            const zoomDelta = delta * zoomIntensity
            zoomFactor = Math.max(0.1, Math.min(3.2, zoomFactor + zoomDelta))

            // Adjust grid offsets by scaling the cursor position with the ratio of the new and old zoom factors
            // This maintains the cursor's position on the grid during zoom operations
            gridOffsetX -= (x / zoomFactor) * ((zoomFactor / oldZoomFactor) - 1)
            gridOffsetY -= (y / zoomFactor) * ((zoomFactor / oldZoomFactor) - 1)

            console.log(zoomFactor)
            setEndCoordinates()
            if (!isRunning.value) simpleDrawParticles()
        }
        // -------------------------------------------------------------------------------------------------------------
        function initLife() {
            // Set the grid size and zoom factor based on the screen size
            gridWidth = Math.floor(canvasWidth * screenMultiplierForGridSize)
            gridHeight = Math.floor(canvasHeight * screenMultiplierForGridSize)
            zoomFactor /= screenMultiplierForGridSize

            initColors()
            centerView()
            initParticles()
            rulesMatrix = makeRandomMatrix()
            console.table(rulesMatrix)
        }
        function initColors() {
            currentColors = [];
            for (let i = 0; i < numColors; ++i) {
                // currentColors.push(i)
                currentColors.push(i * 360 / numColors) // HSL color (precalculated)
            }
        }
        function initParticles() {
            for (let i = 0; i < numParticles; ++i) {
                colors[i] = Math.floor(Math.random() * numColors)
                positionX[i] = Math.random() * gridWidth
                positionY[i] = Math.random() * gridHeight
                positionZ[i] = Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle
            }
        }
        function makeRandomMatrix() {
            let matrix: number[][] = []
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    matrix[i].push(Math.random() * 2 - 1)
                }
            }
            return matrix
        }
        // -------------------------------------------------------------------------------------------------------------
        function update() {
            const startExecutionTime = performance.now()
            if (isRunning.value) {
                processRules()
                updateParticles()
                if (hasGrid) drawGrid()
                if (hasCells) drawCells()
            } else {
                if (isDragging) simpleDrawParticles()
            }
            const exeTime = performance.now() - startExecutionTime
            executionTime.value = exeTime
            // console.log('Execution time: ', exeTime + 'ms')
            requestAnimationFrame(update)
        }
        function drawCells() {
            cells.forEach((particles, cell) => {
                if (particles.length <= cellGroupSize) return // Detect groups of particles
                let centerX = 0
                let centerY = 0
                // const centerX = particles.reduce((sum, p) => sum + positionX[p], 0)
                // const centerY = particles.reduce((sum, p) => sum + positionY[p], 0)
                for (let p = 0; p < particles.length; p++) {
                    centerX += positionX[particles[p]]
                    centerY += positionY[particles[p]]
                }
                centerX /= particles.length
                centerY /= particles.length

                const drawX = (centerX + gridOffsetX) * zoomFactor
                const drawY = (centerY + gridOffsetY) * zoomFactor
                const radius = maxRadius * zoomFactor

                // Skip if the cell is outside the canvas
                if (drawX < -radius || drawX > canvasWidth + radius || drawY < -radius || drawY > canvasHeight + radius) return

                ctx!.beginPath()
                ctx!.arc(drawX, drawY, radius, 0, Math.PI * 2)
                ctx!.strokeStyle = `hsl(${0}, 100%, 50%, 0.55)`
                ctx!.stroke()
            })


            // Just cell 1,1 for testing
            // const cellKey = `${1},${1}`
            // if (!cells.has(cellKey)) return
            // const cellParticles = cells.get(cellKey)
            // let centerX = 0
            // let centerY = 0
            // for (let p = 0; p < cellParticles!.length; p++) {
            //     centerX += positionX[cellParticles![p]]
            //     centerY += positionY[cellParticles![p]]
            // }
            // centerX /= cellParticles!.length
            // centerY /= cellParticles!.length
            //
            // const drawX = (centerX + gridOffsetX) * zoomFactor
            // const drawY = (centerY + gridOffsetY) * zoomFactor
            //
            // ctx!.beginPath()
            // ctx!.arc(drawX, drawY, maxRadius * zoomFactor, 0, Math.PI * 2)
            // ctx!.strokeStyle = `hsl(${0}, 100%, 50%, 0.55)`
            // ctx!.stroke()
        }
        function drawParticle(x: number, y: number, z: number, color: number, size: number) {
            let depthFactor = 1
            if (hasDepthSize) {
                depthFactor = 1 - z / gridHeight / zoomFactor // Adjust this factor to control the depth effect
            }
            const newSize = size * depthFactor * zoomFactor // Adjust the size based on the depth factor and zoom factor
            if (newSize <= 0) return // Skip if the particle is too small
            const drawX = (x + gridOffsetX) * zoomFactor // Adjust the position X based on the grid offset and zoom factor
            const drawY = (y + gridOffsetY) * zoomFactor // Adjust the position Y based on the grid offset and zoom factor
            if (drawX < 0 || drawX > canvasWidth || drawY < 0 || drawY > canvasHeight) return // Skip if the particle is outside the canvas

            // Handle depth opacity effect
            if (hasDepthOpacity) {
                // Opacity depth effect
                const opacity = depthLimit !== 0 ? maxOpacity - (z / depthLimit) * (maxOpacity - minOpacity) : 1
                ctx!.fillStyle = `hsl(${color}, 100%, 50%, ${opacity})`
            } else {
                // No opacity depth effect
                ctx!.fillStyle = `hsl(${color}, 100%, 50%, 1)`
            }

            // Handle particle drawing
            if (newSize < 2 || !isCircle) { // Draw squares for small particles
                ctx!.fillRect(drawX - newSize / 2, drawY - newSize / 2, newSize, newSize)
            } else { // Draw circles for larger particles
                ctx!.beginPath()
                ctx!.arc(drawX, drawY, newSize / 2, 0, Math.PI * 2)
                ctx!.fill()
            }
        }
        function getForce(ruleFactor: number, distance: number) {
            if (distance < minRadius) {
                return (repel / minRadius) * distance - repel
            } else if (distance > maxRadius) {
                return 0
            } else {
                let mid = (minRadius + maxRadius) / 2
                let slope = ruleFactor / (mid - minRadius)
                return -(slope * Math.abs(distance - mid)) + ruleFactor
            }
        }

        // For Loop Optimized
        function processRules() {
            const cellSize = maxRadius * 2
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < numParticles; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`

                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            // Process each cell
            for (let [cellKey, particles] of cells) {
                const [cellX, cellY] = cellKey.split(',').map(Number)

                // Process each particle in the cell
                for (let i = 0; i < particles.length; i++) {
                    const indexA = particles[i]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]
                    const posZA = positionZ[indexA]

                    // Process each neighboring cell
                    for (let offsetY = -1; offsetY <= 1; offsetY++) {
                        for (let offsetX = -1; offsetX <= 1; offsetX++) {
                            const neighborX = cellX + offsetX
                            const neighborY = cellY + offsetY
                            const neighborKey = `${neighborX},${neighborY}`

                            if (!cells.has(neighborKey)) {
                                continue
                            }
                            const neighbors = cells.get(neighborKey)!

                            // Process each particle in the neighboring cell
                            for (let j = 0; j < neighbors.length; j++) {
                                const indexB = neighbors[j]
                                if (indexA === indexB) continue // Skip if processing the same particle

                                let posXB = positionX[indexB]
                                let posYB = positionY[indexB]
                                const posZB = positionZ[indexB]

                                let distanceX = Math.abs(posXA - posXB)
                                let distanceY = Math.abs(posYA - posYB)
                                let distanceZ = Math.abs(posZA - posZB)

                                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ)
                                if (distance < maxRadius) {
                                    const force = getForce(rulesMatrix[colors[indexA]][colors[indexB]], distance)

                                    distanceX = posXB - posXA
                                    distanceY = posYB - posYA
                                    distanceZ = posZB - posZA

                                    const cos = distanceX / distance
                                    const sin = distanceY / distance
                                    const tan = distanceZ / distance

                                    const newForce = force * (1 / forceFactor)
                                    velocityX[indexA] += cos * newForce
                                    velocityY[indexA] += sin * newForce
                                    velocityZ[indexA] += tan * newForce
                                }
                            }
                        }
                    }
                }
            }
            cellCount.value = cells.size
        }
        function updateParticles() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < numParticles; i++) {
                velocityX[i] *= frictionFactor
                velocityY[i] *= frictionFactor
                velocityZ[i] *= frictionFactor
                positionX[i] += velocityX[i]
                positionY[i] += velocityY[i]
                positionZ[i] += velocityZ[i]

                // // Bounce off the walls X and Y
                if (hasWalls) {
                    if (positionX[i] > gridWidth || positionX[i] < 0) {
                        positionX[i] -= velocityX[i]
                        velocityX[i] *= -1
                    }
                    if (positionY[i] > gridHeight || positionY[i] < 0) {
                        positionY[i] -= velocityY[i]
                        velocityY[i] *= -1
                    }
                }
                // Bounce off the depth limit
                if (positionZ[i] > depthLimit || positionZ[i] < 0) {
                    positionZ[i] -= velocityZ[i]
                    velocityZ[i] *= -1
                }

                drawParticle(positionX[i], positionY[i], positionZ[i], currentColors[colors[i]], particleSize)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function centerView() {
            const centerX = canvasWidth / 2 / zoomFactor - gridOffsetX
            const centerY = canvasHeight / 2 / zoomFactor - gridOffsetY
            const offsetX = gridWidth / 2 - centerX
            const offsetY = gridHeight / 2 - centerY
            gridOffsetX -= offsetX
            gridOffsetY -= offsetY
            setEndCoordinates()
        }
        function simpleDrawParticles() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < numParticles; i++) {
                drawParticle(positionX[i], positionY[i], positionZ[i], currentColors[colors[i]], particleSize)
            }
            if (hasGrid) drawGrid()
            if (hasCells) drawCells()
        }
        function drawGrid() {
            ctx!.beginPath()
            drawHorizontalLine(endGridX, gridOffsetY * zoomFactor) // Draw top line
            drawHorizontalLine(endGridX, (gridOffsetY + gridHeight) * zoomFactor) // Draw bottom line
            drawVerticalLine(gridOffsetX * zoomFactor, endGridY) // Draw left line
            drawVerticalLine((gridOffsetX + gridWidth) * zoomFactor, endGridY) // Draw right line
            ctx!.strokeStyle = 'rgba(255, 255, 255, 0.8)'
            ctx!.lineWidth = 1
            ctx!.stroke()
        }
        function drawHorizontalLine(x: number, y: number) {
            ctx!.moveTo(gridOffsetX * zoomFactor, y)
            ctx!.lineTo(x, y)
        }
        function drawVerticalLine(x: number, y: number) {
            ctx!.moveTo(x, gridOffsetY * zoomFactor)
            ctx!.lineTo(x, y)
        }
        function setEndCoordinates() {
            endGridX = gridOffsetX * zoomFactor + gridWidth * zoomFactor
            endGridY = gridOffsetY * zoomFactor + gridHeight * zoomFactor
        }
        const toggleHasCells = () => hasCells = !hasCells
        const toggleHasGrid = () => hasGrid = !hasGrid
        const toggleIsCircle = () => isCircle = !isCircle
        const toggleHasWalls = () => hasWalls = !hasWalls
        const toggleHasDepthSize = () => hasDepthSize = !hasDepthSize
        const toggleHasDepthOpacity = () => hasDepthOpacity = !hasDepthOpacity


        return {
            lifeCanvas, fps, cellCount, executionTime,
            toggleHasCells, toggleHasGrid, toggleIsCircle, toggleHasWalls, toggleHasDepthSize, toggleHasDepthOpacity
        }
    }
})
</script>

<style scoped>
canvas {
    background: black;
}
</style>