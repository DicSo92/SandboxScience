<template>
    <section flex flex-col justify-center h-full overflow-hidden relative>
        <SidebarLeft v-model="particleLife.sidebarLeftOpen">
            <template #controls>
            </template>
            <template #default>
                <div h-full px-2 flex flex-col>
                    <div flex justify-between items-end mb-1>
                        <p>World Settings</p>
                        <div rounded-lg border-2 border-white style="width: 72px;">
                            <div i-tabler-badge-3d style="font-size: 30px" class="-my-1"></div>
                        </div>
                    </div>
                    <hr>
                    <div grid grid-cols-2 gap-4 mt-3 mb-2>
                        <ToggleSwitch label="Grid" v-model="particleLife.hasGrid" :disabled="!particleLife.hasWalls"/>
                        <ToggleSwitch label="Walls" v-model="particleLife.hasWalls" />
                        <ToggleSwitch label="Cells" v-model="particleLife.hasCells" />
                        <ToggleSwitch label="Circle Shape" v-model="particleLife.isCircle" />
                    </div>
                    <div overflow-auto flex-1 class="scrollableArea">
                        <Collapse label="Matrix Settings">
                            <MatrixSettings
                                @updateRulesMatrix="updateRulesMatrixValue"
                                @updateMinMatrix="updateMinMatrixValue"
                                @updateMaxMatrix="updateMaxMatrixValue">
                            </MatrixSettings>
                        </Collapse>
                        <Collapse label="World Settings" opened mt-2>
                            <RangeInput input label="Particle Number" :min="particleLife.numColors" :max="20000" :step="10" v-model="particleLife.numParticles" />
                            <RangeInput input label="Color Number" :min="1" :max="20" :step="1" v-model="particleLife.numColors" mt-2 />
                            <RangeInput input label="Particle Size" :min="1" :max="20" :step="1" v-model="particleLife.particleSize" mt-2 />
                            <RangeInput input label="Depth Limit" :min="0" :max="1000" :step="1" v-model="particleLife.depthLimit" mt-2 />
                        </Collapse>
                        <Collapse label="Force Settings" opened mt-2>
                            <RangeInput input label="Repel Force" :min="0.01" :max="4" :step="0.01" v-model="particleLife.repel" />
                            <RangeInput input label="Force Factor" :min="0.01" :max="2" :step="0.01" v-model="particleLife.forceFactor" mt-2 />
                            <RangeInput input label="Friction Factor" :min="0" :max="1" :step="0.01" v-model="particleLife.frictionFactor" mt-2 />
                        </Collapse>
                        <Collapse label="Randomizer Settings" mt-2>
                            <RangeInput input label="Min. Radius" :min="1" :max="particleLife.maxRadius" :step="1" v-model="particleLife.minRadius" />
                            <RangeInput input label="Max. Radius" :min="particleLife.minRadius" :max="256" :step="1" v-model="particleLife.maxRadius" mt-2 />
                            <hr border-gray-500 mt-3>
                            <RangeInputMinMax input label="Min. Radius Range" :min="0" :max="100" :step="1" v-model="particleLife.minRadiusRange" mt-2 />
                            <RangeInput input label="Max. Radius Range Offset" :min="1" :max="particleLife.maxRadiusRangeMax" :step="1" v-model="particleLife.maxRadiusRangeOffset" mt-2 />
                            <RangeInput input label="Max. Radius Range Max" :min="particleLife.minRadiusRange[1] + particleLife.maxRadiusRangeOffset" :max="300" :step="1" v-model="particleLife.maxRadiusRangeMax" mt-2 />
                        </Collapse>
                        <Collapse label="3D Depth Settings" mt-2>
                            <div grid grid-cols-2 gap-4>
                                <ToggleSwitch label="Depth Size" v-model="particleLife.hasDepthSize" />
                                <ToggleSwitch label="Depth Opacity" v-model="particleLife.hasDepthOpacity" />
                            </div>
                            <RangeInput input label="Min. Opacity" :min="0" :max="Math.min(1, particleLife.maxOpacity)" :step="0.01" v-model="particleLife.minOpacity" mt-2 />
                            <RangeInput input label="Max. Opacity" :min="particleLife.minOpacity" :max="2" :step="0.01" v-model="particleLife.maxOpacity" mt-2 />
                        </Collapse>
                        <Collapse label="Cells Settings" mt-2>
                            <RangeInput input label="Cell Group Size" :min="0" :max="100" :step="1" v-model="particleLife.cellGroupSize" />
                            <RangeInput input label="Cell Size Factor" :min="1" :max="2" :step="0.01" v-model="particleLife.cellSizeFactor" mt-2 />
                        </Collapse>
                    </div>
                </div>
            </template>
        </SidebarLeft>
        <canvas ref="lifeCanvas" id="lifeCanvas" @contextmenu.prevent w-full h-full></canvas>
        <div absolute top-0 right-0 flex flex-col items-end text-right pr-1>
            <div class="inline-grid grid-cols-2 gap-x-4">
                <div>Fps</div>
                <div>{{ fps }}</div>
                <div>Cells</div>
                <div>{{ cellCount }}</div>
                <div>Process</div>
                <div>{{ Math.round(executionTime) }}</div>
            </div>
            <Memory />
        </div>
        <div absolute bottom-0 w-full flex justify-center items-center="">
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="regenerateLife">
                <div i-game-icons-perspective-dice-six-faces-random text-xl></div>
            </div>
            <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="particleLife.hasCells = !particleLife.hasCells">
                <div i-tabler-circle text-xl></div>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MatrixSettings from "~/components/particle-life/MatrixSettings.vue";
import RulesMatrix from "~/components/particle-life/RulesMatrix.vue";
import Memory from "~/components/particle-life/Memory.vue";
export default defineComponent({
    components: { MatrixSettings, RulesMatrix, Memory },
    setup() {
        definePageMeta({ layout: 'life' })
        const particleLife = useParticleLifeStore()

        // Define canvas and context for drawing
        let lifeCanvas: HTMLCanvasElement | undefined
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        let animationFrameId: number | null = null

        // Define the reactive variables for the game state
        const fps = useFps()
        const cellCount = ref<number>(0)
        const executionTime = ref<number>(0)
        const isRunning = ref<boolean>(true)

        // Define color list and rules matrix for the particles
        let currentColors: number[] = [] // Current colors for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color

        // Define world properties
        let numParticles: number = particleLife.numParticles // Number of particles
        let numColors: number = particleLife.numColors // Number of colors to be used
        let particleSize: number = particleLife.particleSize // Size of the particles at zoomFactor = 1
        let depthLimit: number = particleLife.depthLimit // Maximum Z axis depth (0 means almost 2D because there is friction with the walls && can be negative)
        let isCircle: boolean = particleLife.isCircle // Enable circular shape for the particles
        let hasGrid: boolean = particleLife.hasGrid // Enable grid
        let hasCells: boolean = particleLife.hasCells // Enable cells
        let hasWalls: boolean = particleLife.hasWalls // Enable walls X and Y for the particles
        let hasDepthSize: boolean = particleLife.hasDepthSize // Enable depth size effect
        let hasDepthOpacity: boolean = particleLife.hasDepthOpacity // Enable depth opacity effect
        let maxOpacity: number = particleLife.maxOpacity // Maximum opacity when hasDepthOpacity is enabled
        let minOpacity: number = particleLife.minOpacity // Depth effect will be stronger with lower opacity
        let cellGroupSize: number = particleLife.cellGroupSize // Minimum number of particles to be considered a group (0 to visualize all cells)

        // Define force properties
        let repel: number = particleLife.repel // repel force for particles that are too close to each other (can't be 0)
        let forceFactor: number = particleLife.forceFactor // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 1 is no friction)
        let zoomFactor: number = 1 // Zoom level
        let cellSizeFactor: number = particleLife.cellSizeFactor // Adjust the cell size based on the particle size

        let currentMinRadius: number = 0 // Max value between all colors min radius
        let currentMaxRadius: number = 0 // Max value between all colors max radius (for cell size)

        // Define depth limits for randomly placed particles
        const minZDepthRandomParticle: number = depthLimit * 0.2 // The minimum Z-depth for randomly placed particles, in percentage of the depthLimit
        const maxZDepthRandomParticle: number = depthLimit * 0.45 // The maximum Z-depth for randomly placed particles, in percentage of the depthLimit
        const screenMultiplierForGridSize: number = 2.5 // Multiplier for the grid size based on the screen size

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
            lifeCanvas = document.getElementById('lifeCanvas') as HTMLCanvasElement
            ctx = lifeCanvas?.getContext('2d') || undefined
            handleResize()
            initLife()
            if (!isRunning.value) simpleDrawParticles()
            animationFrameId = requestAnimationFrame(update) // Start the game loop

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
                lastPointerX = e.x - lifeCanvas!.getBoundingClientRect().left
                lastPointerY = e.y - lifeCanvas!.getBoundingClientRect().top
            })
            useEventListener(lifeCanvas, ['mousemove'], (e) => {
                pointerX = e.x - lifeCanvas!.getBoundingClientRect().left
                pointerY = e.y - lifeCanvas!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    if (particleLife.isLockedPointer) return // Prevent canvas dragging if the pointer is locked
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
            canvasWidth = lifeCanvas!.width = lifeCanvas!.clientWidth
            canvasHeight = lifeCanvas!.height = lifeCanvas!.clientHeight
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
            setRulesMatrix(makeRandomRulesMatrix())
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
            console.table(minRadiusMatrix)
            console.table(maxRadiusMatrix)
            console.table(rulesMatrix)
        }
        function regenerateLife() {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)

            initColors()
            initParticles()
            setRulesMatrix(makeRandomRulesMatrix())
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())

            if (!isRunning.value) simpleDrawParticles()
            animationFrameId = requestAnimationFrame(update) // Start the game loop
        }
        function initColors() {
            currentColors = [];
            for (let i = 0; i < numColors; ++i) {
                // currentColors.push(i)
                currentColors.push(i * 360 / numColors) // HSL color (precalculated)
            }
            particleLife.currentColors = currentColors
        }
        function initParticles() {
            for (let i = 0; i < numParticles; ++i) {
                colors[i] = Math.floor(Math.random() * numColors)
                const newPositions = getRandomPositions()
                positionX[i] = newPositions.x
                positionY[i] = newPositions.y
                positionZ[i] = newPositions.z
            }
        }
        function makeRandomRulesMatrix() {
            let matrix: number[][] = []
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    matrix[i].push(Number((Math.random() * 2 - 1).toFixed(4)))
                }
            }
            return matrix
        }
        function makeRandomMinRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = particleLife.minRadiusRange[0]
            const max: number = particleLife.minRadiusRange[1]
            let maxRandom: number = min
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                    if (random > maxRandom) {
                        maxRandom = random
                    }
                }
            }
            currentMinRadius = maxRandom
            return matrix
        }
        function makeRandomMaxRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = currentMinRadius + particleLife.maxRadiusRangeOffset
            const max: number = particleLife.maxRadiusRangeMax
            let maxRandom: number = min
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                    if (random > maxRandom) {
                        maxRandom = random
                    }
                }
            }
            currentMaxRadius = maxRandom
            return matrix
        }
        function getRandomPositions() {
            return {
                x: Math.random() * gridWidth,
                y: Math.random() * gridHeight,
                z: Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle
            }
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
            executionTime.value = performance.now() - startExecutionTime
            animationFrameId = requestAnimationFrame(update)
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
                const radius = currentMaxRadius / (2 / cellSizeFactor) * zoomFactor

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
        function getForce(ruleFactor: number, colorMinRadius: number, colorMaxRadius: number, distance: number) {
            if (distance < colorMinRadius) {
                return (repel / colorMinRadius) * distance - repel
            } else if (distance > colorMaxRadius) {
                return 0
            } else {
                let mid = (colorMinRadius + colorMaxRadius) / 2
                let slope = ruleFactor / (mid - colorMinRadius)
                return -(slope * Math.abs(distance - mid)) + ruleFactor
            }
        }

        // For Loop Optimized
        function processRules() {
            const cellSize = currentMaxRadius * cellSizeFactor
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
                        const neighborY = cellY + offsetY
                        for (let offsetX = -1; offsetX <= 1; offsetX++) {
                            const neighborX = cellX + offsetX
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

                                const colorA = colors[indexA]
                                const colorB = colors[indexB]
                                const colorMaxRadius = maxRadiusMatrix[colorA][colorB]

                                if (distance < colorMaxRadius) {
                                    const force = getForce(rulesMatrix[colorA][colorB], minRadiusMatrix[colorA][colorB], colorMaxRadius, distance)

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

                // Bounce off the walls
                if (hasWalls) {
                    if (positionX[i] > gridWidth || positionX[i] < 0) {
                        positionX[i] -= velocityX[i]
                        velocityX[i] *= -1.2
                    }
                    if (positionY[i] > gridHeight || positionY[i] < 0) {
                        positionY[i] -= velocityY[i]
                        velocityY[i] *= -1.2
                    }
                }
                // Bounce off the depth limit
                if (positionZ[i] > depthLimit || positionZ[i] < 0) {
                    positionZ[i] -= velocityZ[i]
                    velocityZ[i] *= -1.2
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
            ctx!.strokeStyle = 'rgba(128, 128, 128, 0.8)'
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
        // -------------------------------------------------------------------------------------------------------------
        function updateNumParticles(newNumParticles: number) {
            if (newNumParticles === numParticles) return // Skip if the number of particles is the same
            if (newNumParticles < numParticles) { // Remove particles
                colors = colors.slice(0, newNumParticles)
                positionX = positionX.slice(0, newNumParticles)
                positionY = positionY.slice(0, newNumParticles)
                positionZ = positionZ.slice(0, newNumParticles)
                velocityX = velocityX.slice(0, newNumParticles)
                velocityY = velocityY.slice(0, newNumParticles)
                velocityZ = velocityZ.slice(0, newNumParticles)
            } else { // Add particles
                const newColors = new Int32Array(newNumParticles)
                const newPositionX = new Float32Array(newNumParticles)
                const newPositionY = new Float32Array(newNumParticles)
                const newPositionZ = new Float32Array(newNumParticles)
                const newVelocityX = new Float32Array(newNumParticles).fill(0)
                const newVelocityY = new Float32Array(newNumParticles).fill(0)
                const newVelocityZ = new Float32Array(newNumParticles).fill(0)
                for (let i = 0; i < newNumParticles; i++) {
                    if (i < numParticles) {
                        newColors[i] = colors[i]
                        newPositionX[i] = positionX[i]
                        newPositionY[i] = positionY[i]
                        newPositionZ[i] = positionZ[i]
                        newVelocityX[i] = velocityX[i]
                        newVelocityY[i] = velocityY[i]
                        newVelocityZ[i] = velocityZ[i]
                    } else {
                        newColors[i] = Math.floor(Math.random() * numColors)
                        const newPositions = getRandomPositions()
                        newPositionX[i] = newPositions.x
                        newPositionY[i] = newPositions.y
                        newPositionZ[i] = newPositions.z
                    }
                }
                colors = newColors
                positionX = newPositionX
                positionY = newPositionY
                positionZ = newPositionZ
                velocityX = newVelocityX
                velocityY = newVelocityY
                velocityZ = newVelocityZ
            }
            numParticles = newNumParticles // Update the number of particles
            if (!isRunning.value) simpleDrawParticles() // Redraw the particles if the game is not running
        }
        function updateNumColors(newNumColors: number) {
            if (newNumColors === numColors) return // Skip if the number of colors is the same
            if (newNumColors < numColors) { // Remove colors
                removeFromMatrix(newNumColors)
                colors = colors.map((color) => color % newNumColors)
            } else { // Add colors
                addToMatrix(newNumColors)
                for (let i = 0; i < numParticles; i++) {
                    colors[i] = Math.floor(Math.random() * newNumColors)
                }
            }
            numColors = newNumColors // Update the number of colors
            initColors() // Reinitialize the colors (currentColors)
            if (!isRunning.value) simpleDrawParticles() // Redraw the particles if the game is not running
        }
        function addToMatrix(newNumColors: number) {
            const newRulesMatrix: number[][] = []
            const newMinRadiusMatrix: number[][] = []
            const newMaxRadiusMatrix: number[][] = []

            for (let i = 0; i < newNumColors; i++) {
                if (i < numColors) { // Copy the existing rules for the existing colors
                    newRulesMatrix.push(rulesMatrix[i])
                    newMinRadiusMatrix.push(minRadiusMatrix[i])
                    newMaxRadiusMatrix.push(maxRadiusMatrix[i])
                } else { // Set new rules for the new colors
                    newRulesMatrix.push([])
                    newMinRadiusMatrix.push([])
                    newMaxRadiusMatrix.push([])
                }
                for (let j = 0; j < newNumColors; j++) {
                    if (i < numColors && j < numColors) { // Copy the existing rules for the existing colors
                        newRulesMatrix[i][j] = rulesMatrix[i][j]
                        newMinRadiusMatrix[i][j] = minRadiusMatrix[i][j]
                        newMaxRadiusMatrix[i][j] = maxRadiusMatrix[i][j]
                    } else { // Set new rules for the new colors
                        newRulesMatrix[i][j] = Number((Math.random() * 2 - 1).toFixed(4)) // Set a random rule between -1 and 1

                        // Set a random min radius between the range
                        const minRandom = Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                        newMinRadiusMatrix[i][j] = minRandom
                        if (minRandom > currentMinRadius) currentMinRadius = minRandom

                        // Set a random max radius between the range
                        const min = minRandom + particleLife.maxRadiusRangeOffset
                        const maxRandom = Math.floor(Math.random() * (particleLife.maxRadiusRangeMax - min + 1) + min)
                        newMaxRadiusMatrix[i][j] = maxRandom
                        if (maxRandom > currentMaxRadius) currentMaxRadius = maxRandom
                    }
                }
            }
            setRulesMatrix(newRulesMatrix)
            setMinRadiusMatrix(newMinRadiusMatrix)
            setMaxRadiusMatrix(newMaxRadiusMatrix)

            console.table(maxRadiusMatrix)
        }
        function removeFromMatrix(newNumColors: number) {
            const newRulesMatrix: number[][] = []
            const newMinRadiusMatrix: number[][] = []
            const newMaxRadiusMatrix: number[][] = []

            for (let i = 0; i < newNumColors; i++) {
                newRulesMatrix.push(rulesMatrix[i].slice(0, newNumColors)) // Truncate the row to the new size
                newMinRadiusMatrix.push(minRadiusMatrix[i].slice(0, newNumColors)) // Truncate the row to the new size
                newMaxRadiusMatrix.push(maxRadiusMatrix[i].slice(0, newNumColors)) // Truncate the row to the new size
            }
            setRulesMatrix(newRulesMatrix)
            setMinRadiusMatrix(newMinRadiusMatrix)
            setMaxRadiusMatrix(newMaxRadiusMatrix)

            console.table(maxRadiusMatrix)
        }
        function setRulesMatrix(newRules: number[][]) {
            rulesMatrix = newRules
            particleLife.rulesMatrix = rulesMatrix
        }
        function setMaxRadiusMatrix(newMaxRadius: number[][]) {
            maxRadiusMatrix = newMaxRadius
            particleLife.maxRadiusMatrix = maxRadiusMatrix
        }
        function setMinRadiusMatrix(newMinRadius: number[][]) {
            minRadiusMatrix = newMinRadius
            particleLife.minRadiusMatrix = minRadiusMatrix
        }
        function updateRulesMatrixValue(x: number, y: number, value: number) {
            particleLife.rulesMatrix[x][y] = value
            rulesMatrix[x][y] = value
        }
        function updateMinMatrixValue(x: number, y: number, value: number) {
            particleLife.minRadiusMatrix[x][y] = value
            minRadiusMatrix[x][y] = value
            currentMinRadius = minRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity)
        }
        function updateMaxMatrixValue(x: number, y: number, value: number) {
            particleLife.maxRadiusMatrix[x][y] = value
            maxRadiusMatrix[x][y] = value
            currentMaxRadius = maxRadiusMatrix.reduce((max, row) => Math.max(max, ...row), -Infinity)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function watchAndDraw(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value);
                if (!isRunning.value) simpleDrawParticles();
            });
        }
        watch(() => particleLife.numParticles, (value) => updateNumParticles(value))
        watch(() => particleLife.numColors, (value) => updateNumColors(value))
        watchAndDraw(() => particleLife.particleSize, (value: number) => particleSize = value)
        watchAndDraw(() => particleLife.depthLimit, (value: number) => depthLimit = value)
        watchAndDraw(() => particleLife.hasWalls, (value: boolean) => {
            hasWalls = value
            particleLife.hasGrid = value
        })
        watchAndDraw(() => particleLife.hasGrid, (value: boolean) => hasGrid = value)
        watchAndDraw(() => particleLife.hasCells, (value: boolean) => hasCells = value)
        watchAndDraw(() => particleLife.isCircle, (value: boolean) => isCircle = value)
        watchAndDraw(() => particleLife.hasDepthSize, (value: boolean) => hasDepthSize = value)
        watchAndDraw(() => particleLife.hasDepthOpacity, (value: boolean) => hasDepthOpacity = value)
        watchAndDraw(() => particleLife.minOpacity, (value: number) => minOpacity = value)
        watchAndDraw(() => particleLife.maxOpacity, (value: number) => maxOpacity = value)
        watchAndDraw(() => particleLife.cellGroupSize, (value: number) => cellGroupSize = value)
        watchAndDraw(() => particleLife.repel, (value: number) => repel = value)
        watchAndDraw(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndDraw(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)
        watchAndDraw(() => particleLife.cellSizeFactor, (value: number) => cellSizeFactor = value)
        // -------------------------------------------------------------------------------------------------------------
        onBeforeUnmount(() => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
        })

        return {
            lifeCanvas, particleLife,
            fps, cellCount, executionTime,
            updateRulesMatrixValue, updateMinMatrixValue, updateMaxMatrixValue, regenerateLife
        }
    }
})
</script>

<style scoped>
canvas {
    background: black;
}
.scrollableArea {
    scrollbar-color: #a5a5a5 transparent;
    scrollbar-width: none;
}
/*
.scrollableArea::-webkit-scrollbar {
    width: 8px;
}

.scrollableArea::-webkit-scrollbar-track {
    background-color: #e4e4e4;
    border-radius: 100px;
}

.scrollableArea::-webkit-scrollbar-thumb {
    background-color: #d4aa70;
    border-radius: 100px;
}
*/

</style>