<template>
    <section id="mainContainer" relative h-screen flex flex-col justify-center overflow-hidden>
        <SidebarLeft v-model="particleLife.sidebarLeftOpen">
            <template #controls />
            <template #default>
                <div h-full flex flex-col px-2>
                    <div mb-2 flex items-end justify-between px-1>
                        <div flex items-center class="-mb-0.5">
                            <div i-lets-icons-bubble mr-2 text-2xl class="text-[#2a9d8f] -mt-0.5" />
                            <h1 text-lg font-800 tracking-widest class="text-[#dff6f3] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                                Particle Life
                            </h1>
                            <p class="ml-2 justify-center rounded-lg bg-sky-600/20 px-2 py-0.5 text-sky-400 font-bold font-mono uppercase ring-1 ring-sky-500/30">
                                CPU
                            </p>
                        </div>
                        <!--                        <div rounded-lg border-2 border-white style="width: 72px;"> -->
                        <!--                            <div i-tabler-badge-3d style="font-size: 30px" class="-my-1"></div> -->
                        <!--                        </div> -->
                        <ToggleSwitch v-model="particleLife.is3D" inactive-label="2D" label="3D" colorful-label />
                    </div>
                    <hr border-slate-500>
                    <div mt-2 flex-1 overflow-auto class="scrollableArea">
                        <Collapse
                            label="Presets" icon="i-tabler-sparkles text-amber-500"
                            tooltip="Choose predefined configurations to quickly set up your simulation."
                        >
                            <PresetPanel
                                :store="particleLife"
                                @update-colors="updateColors"
                                @update-rules-matrix="updateRulesMatrix"
                                @load-preset="loadPreset"
                            />
                        </Collapse>

                        <Collapse
                            label="Matrix Settings" icon="i-tabler-grid-4x4 text-indigo-500" mt-2
                            tooltip="Modify matrix values by clicking on cells in the grid. <br>
                                  Adjust individual cell values with the slider, or click and drag to change them directly. <br>
                                  Use Ctrl + Click to select multiple cells for group adjustments. <br>
                                  If no cells are selected, the slider will adjust all values."
                        >
                            <MatrixSettings
                                :store="particleLife"
                                @update-rules-matrix="updateRulesMatrixValue"
                                @random-rules-matrix="newRandomRulesMatrix"
                                @update-min-matrix="updateMinMatrixValue"
                                @update-max-matrix="updateMaxMatrixValue"
                                @update-color="updateSingleColor"
                            />
                        </Collapse>
                        <Collapse
                            label="Randomizer Settings" icon="i-game-icons-perspective-dice-six-faces-random text-teal-500" mt-2
                            tooltip="Adjust the parameters for randomizing particle attributes. <br> Configure the ranges for minimum and maximum interaction radii."
                        >
                            <RadiusVisualizer
                                v-model:min-radius-range="particleLife.minRadiusRange"
                                v-model:max-radius-range="particleLife.maxRadiusRange"
                                @randomize-radius="randomizeRadius"
                                @randomize-rules-and-radius="randomizeRulesAndRadius"
                                @randomize-all="regenerateLife"
                            />
                        </Collapse>
                        <Collapse label="World Settings" icon="i-tabler-world-cog text-cyan-500" opened mt-2>
                            <RangeInput
                                v-model="particleLife.numParticles" input
                                label="Particle Number"
                                tooltip="Adjust the total number of particles. <br> More particles may reveal complex interactions but can increase computational demand." :min="0" :max="20000" :step="10"
                            />
                            <RangeInput
                                v-model="particleLife.numColors" input
                                label="Color Number"
                                tooltip="Specify the number of particle colors. <br> Each color interacts with all others, with distinct forces and interaction ranges." :min="1" :max="20" :step="1" mt-2 @update:model-value="setNewNumTypes"
                            />
                            <RangeInput
                                v-model="particleLife.depthLimit" input
                                label="Depth Limit"
                                tooltip="Set the maximum depth for particles. <br> In 3D, particles will bounce back if they exceed this limit." :min="0" :max="1000" :step="1" mt-2
                            />

                            <div mb-2 mt-3 flex items-start justify-between>
                                <p text-gray-300 underline>
                                    Walls Settings :
                                </p>
                                <div flex>
                                    <SelectButton :id="0" v-model="particleLife.wallShape" label="Rectangle" mr-2 />
                                    <SelectButton :id="1" v-model="particleLife.wallShape" label="Circle" :disabled="particleLife.isWallWrap" />
                                </div>
                            </div>

                            <OptionBar
                                v-model="particleLife.wallState" name="wallStateCPU" mb-2 :options="[
                                    { id: 'none', label: 'None' },
                                    { id: 'repel', label: 'Repel' },
                                    { id: 'wrap', label: 'Wrap' }]"
                            />

                            <div mb-1 flex>
                                <SelectButton :id="1" v-model="particleLife.screenMultiplierForGridSize" label="Screen" mr-1.5 />
                                <SelectButton :id="1.5" v-model="particleLife.screenMultiplierForGridSize" label="x1.5" mr-1.5 />
                                <SelectButton :id="2" v-model="particleLife.screenMultiplierForGridSize" label="x2" mr-1.5 />
                                <SelectButton :id="2.5" v-model="particleLife.screenMultiplierForGridSize" label="x2.5" mr-1.5 />
                                <SelectButton :id="3" v-model="particleLife.screenMultiplierForGridSize" label="x3" mr-1.5 />
                                <SelectButton :id="3.5" v-model="particleLife.screenMultiplierForGridSize" label="x3.5" mr-1.5 />
                                <SelectButton :id="4" v-model="particleLife.screenMultiplierForGridSize" label="x4" mr-1.5 />
                                <SelectButton :id="5" v-model="particleLife.screenMultiplierForGridSize" label="x5" />
                            </div>
                            <div v-if="particleLife.wallShape === 0" flex items-center>
                                <p class="mt-1 w-2/3 text-2sm">
                                    Rectangle Size
                                    <TooltipInfo container="#mainContainer" tooltip="Adjust the size of the rectangular area where particles are contained." />
                                </p>
                                <Input v-model="particleLife.gridWidth" label="x" mr-2 @change="updateGridWidth" />
                                <Input v-model="particleLife.gridHeight" label="y" mr-2 @change="updateGridHeight" />
                                <button type="button" btn flex items-center rounded-full p2 bg="zinc-900 hover:#212121" @click="particleLife.linkProportions = !particleLife.linkProportions">
                                    <span :class="particleLife.linkProportions ? 'i-tabler-link' : 'i-tabler-unlink'" text-sm />
                                </button>
                            </div>
                            <div v-else mt-2 flex items-center justify-between>
                                <p class="mt-0.5 w-2/3 text-2sm">
                                    Circle Size
                                    <TooltipInfo container="#mainContainer" tooltip="Adjust the size of the circular area where particles are contained." />
                                </p>
                                <Input v-model="particleLife.gridHeight" label="Diameter" mr-2 @change="updateGridHeight" />
                            </div>
                        </Collapse>
                        <Collapse label="Physics Settings" icon="i-tabler-atom text-fuchsia-500" opened mt-2>
                            <RangeInput
                                v-model="particleLife.repel" input
                                label="Repel Force"
                                tooltip="Adjust the force that repels particles from each other. <br> Higher values increase the separation distance." :min="0.01" :max="4" :step="0.01"
                            />
                            <RangeInput
                                v-model="particleLife.forceFactor" input
                                label="Force Multiplier"
                                tooltip="Scales the interaction forces between particles. <br> Higher values make forces stronger and particles move faster." :min="0.01" :max="2" :step="0.01" mt-2
                            />
                            <RangeInput
                                v-model="particleLife.frictionFactor" input
                                label="Friction"
                                tooltip="Controls how much friction slows particles down. <br> Higher values reduce speed and help stabilize the system." :min="0" :max="1" :step="0.01" mt-2
                            />
                        </Collapse>
                        <Collapse
                            label="Quantum / Electrical" icon="i-tabler-bolt text-lime-400" mt-2
                            tooltip="Experimental particle types that act on the bodies in a 'quantum & electrical' way. <br> <b>Urges</b> each have their own goal (derived from their index) and learn an attract/repel intent. They do NOT push matter directly — they recruit nearby neurons. <br> <b>Neurons</b> are actuators for a single color: within range of an urge they are driven by it and then pull or push only that one color."
                        >
                            <div mb-1 flex items-center justify-between gap-2>
                                <p class="w-2/3 text-2sm">
                                    Enable layer
                                    <TooltipInfo container="#mainContainer" tooltip="Master switch. When off, urges and neurons are removed from the simulation." />
                                </p>
                                <ToggleSwitch v-model="particleLife.isElectricalEnabled" label="On" colorful-label />
                            </div>

                            <RangeInput
                                v-model="particleLife.numUrges" input
                                label="Urge Count"
                                tooltip="Number of urge particles. Each urge is a distinct type with its OWN goal: it acts on color = index % species, and the objective (attract vs repel, density vs fraction) is derived from its index so the population is diverse." :min="0" :max="500" :step="1"
                            />
                            <RangeInput
                                v-model="particleLife.numNeurons" input label="Neuron Count"
                                mt-2
                                tooltip="Number of neuron particles. Each neuron is an actuator for a single color = index % species. It is driven by the urges near it and then pulls or pushes only that one color." :min="0" :max="500" :step="1"
                            />

                            <div mt-2 flex items-center justify-between gap-2>
                                <p class="w-1/3 shrink-0 text-2sm">
                                    Urge Goal Family
                                    <TooltipInfo container="#mainContainer" tooltip="The family of goals each urge is drawn from. Within a family the exact goal (attract vs repel, density vs fraction) still varies per urge by its index." />
                                </p>
                                <SelectInput
                                    v-model="particleLife.metricMode" name="urge-metric-mode-cpu"
                                    class="max-w-full!"
                                    :options="[
                                        { id: 0, name: 'Mixed Density', category: 'Goal' },
                                        { id: 1, name: 'Mixed Fraction', category: 'Goal' },
                                        { id: 2, name: 'Density / Fraction', category: 'Goal' },
                                        { id: 3, name: 'Cycle All', category: 'Goal' },
                                    ]"
                                />
                            </div>

                            <hr my-2 border-gray-500>
                            <RangeInput
                                v-model="particleLife.urgeRadius" input
                                label="Urge Radius"
                                tooltip="Radius over which an urge measures its goal metric, and the range at which a neuron pushes/pulls its color." :min="4" :max="160" :step="1"
                            />
                            <RangeInput
                                v-model="particleLife.neuronRadius" input label="Neuron Radius"
                                mt-2
                                tooltip="Radius (measured from the neuron) within which an urge drives it." :min="4" :max="160" :step="1"
                            />
                            <RangeInput
                                v-model="particleLife.urgeForce" input label="Urge Field Strength"
                                mt-2
                                tooltip="Strength of a neuron's field on its color, scaled by the drive it receives from nearby urges." :min="0" :max="4" :step="0.01"
                            />

                            <hr my-2 border-gray-500>
                            <p class="-mt-0.5" mb-1 text-gray-300 underline>
                                Urge Learning :
                            </p>
                            <RangeInput
                                v-model="particleLife.controlGain" input
                                label="Control Gain"
                                tooltip="Learning rate: how strongly the change in the urge's metric pushes its attract/repel control." :min="0" :max="1" :step="0.005"
                            />
                            <RangeInput
                                v-model="particleLife.controlMax" input label="Control Max"
                                mt-2
                                tooltip="Clamp on an urge's control magnitude (attract +, repel -)." :min="0.1" :max="6" :step="0.1"
                            />

                            <hr my-2 border-gray-500>
                            <RangeInput
                                v-model="particleLife.cohesion" input
                                label="Cohesion"
                                tooltip="How strongly urges and neurons cling to the body and avoid overlapping each other. 0 = they drift freely." :min="0" :max="3" :step="0.01"
                            />

                            <!-- Sense Neurons: sensors that perceive one target color (no actuation) -->
                            <template v-if="particleLife.isElectricalEnabled">
                                <hr my-2 border-gray-500>
                                <p class="-mt-0.5" mb-1 text-gray-300 underline>
                                    Sense Neurons :
                                </p>
                                <RangeInput
                                    v-model="particleLife.numSenseNeurons" input
                                    label="Sense Count"
                                    tooltip="Number of sense neuron particles (sensors). Each senses EXACTLY ONE color = index % species and stores its perception in the particle's signal (magnitude 0–1) and control (bearing, radians) fields. They never push or pull matter." :min="0" :max="500" :step="1"
                                />
                                <RangeInput
                                    v-model="particleLife.senseRadius" input label="Sense Radius"
                                    mt-2
                                    tooltip="Perception radius (world units) shared by all three senses: sight cone range, smell/sound scan disk." :min="4" :max="160" :step="1"
                                />
                                <RangeInput
                                    v-model="particleLife.senseConeHalfAngleDeg" input label="Sight Cone Half-Angle"
                                    mt-2
                                    tooltip="Half-angle of the sight cone in the direction of motion. Sight only counts target-color matter inside this forward cone (magnitude only, no bearing)." :min="1" :max="90" :step="1"
                                />
                                <div mt-2 flex items-center justify-between gap-2>
                                    <p class="w-1/3 shrink-0 text-2sm">
                                        Sense Mode
                                        <TooltipInfo container="#mainContainer" tooltip="Which sense each sense neuron uses. <br> <b>Cycle All</b>: senses cycle sight / smell / sound by index — a diverse population. <br> <b>All Sight</b>: forward cone, magnitude only (nothing behind is seen). <br> <b>All Smell</b>: bearing toward the NEAREST high-density cluster of the target color (near-biased weighting). <br> <b>All Sound</b>: bearing + loudness with NO far/near discrimination (uniform weight)." />
                                    </p>
                                    <SelectInput
                                        v-model="particleLife.senseMode" name="sense-mode-cpu"
                                        class="max-w-full!"
                                        :options="[
                                            { id: 0, name: 'Cycle All', category: 'Sense' },
                                            { id: 1, name: 'All Sight', category: 'Sense' },
                                            { id: 2, name: 'All Smell', category: 'Sense' },
                                            { id: 3, name: 'All Sound', category: 'Sense' },
                                        ]"
                                    />
                                </div>
                            </template>
                        </Collapse>

                        <Collapse
                            label="Urge Inspector" icon="i-tabler-telescope text-sky-400" mt-2
                            tooltip="Read-only telemetry for the Quantum / Electrical layer. Live per-urge control & metric values sampled from CPU state."
                        >
                            <div mb-1 flex items-center justify-between gap-2>
                                <p class="w-2/3 text-2sm">
                                    Live readback
                                    <TooltipInfo container="#mainContainer" tooltip="Samples each urge's control & metric from the simulation arrays every 500 ms." />
                                </p>
                                <ToggleSwitch v-model="urgeInspectorOpen" label="On" colorful-label :disabled="!particleLife.isElectricalEnabled" />
                            </div>

                            <UrgeInspector
                                v-if="urgeInspectorOpen"
                                v-model:selected-id="selectedUrgeId"
                                :stats="urgeStats"
                                :params="electricalParams"
                                :control-max="particleLife.controlMax"
                                :target-colors="colorRgbStrings"
                                :num-types="particleLife.numColors"
                                :objective-label-for="objectiveLabelFor"
                            />
                        </Collapse>

                        <Collapse label="Graphics Settings" icon="i-tabler-photo-cog text-emerald-500" mt-2>
                            <div mb-2 flex items-center justify-between>
                                <p text-gray-300 underline class="-mt-0.5">
                                    General Settings :
                                </p>
                                <ToggleSwitch
                                    v-model="particleLife.isCircle" inactive-label="Circle Shape"
                                    tooltip="Toggle between circular and square particle shapes. <br> Circular particles may slightly impact performance compared to square ones."
                                />
                            </div>

                            <RangeInput
                                v-model="particleLife.particleSize" input
                                label="Particle Size"
                                tooltip="Controls the overall size of the particles in the simulation, allowing you to make them larger or smaller depending on your preference. This setting does not impact performance." :min="1" :max="20" :step="1" mt-2
                            />
                            <hr my-2 border-gray-500>
                            <p mb-2 text-gray-300 underline>
                                3D Settings :
                            </p>
                            <div grid grid-cols-2 gap-4>
                                <ToggleSwitch
                                    v-model="particleLife.hasDepthSize" label="Depth Size"
                                    tooltip="Toggles the effect where particle size changes based on their position along the Z-axis, enhancing 3D depth perception."
                                />
                                <ToggleSwitch
                                    v-model="particleLife.hasDepthOpacity" label="Depth Opacity"
                                    tooltip="Toggles the effect where particle opacity changes based on their position along the Z-axis, enhancing 3D depth perception."
                                />
                            </div>
                            <RangeInput
                                v-model="particleLife.minOpacity" input
                                label="Min. Opacity"
                                tooltip="Set the minimum opacity for depth effect. <br> Lower values enhance perspective, creating a stronger depth effect when depth opacity is enabled." :min="0" :max="Math.min(1, particleLife.maxOpacity)" :step="0.01" mt-2
                            />
                            <RangeInput
                                v-model="particleLife.maxOpacity" input
                                label="Max. Opacity"
                                tooltip="Set the maximum opacity for depth effects. <br> Higher values reduce perspective, creating a subtler depth effect when depth opacity is enabled." :min="particleLife.minOpacity" :max="2" :step="0.01" mt-2
                            />
                        </Collapse>
                        <Collapse
                            label="Debug Tools" icon="i-tabler-bug text-rose-500" mt-2
                            tooltip="Access debugging tools to visualize and refine the simulation. <br> Manage cell boundaries, adjust cell sizes, and control particle groupings to troubleshoot and optimize performance."
                        >
                            <div flex items-center justify-between>
                                <div flex>
                                    <ToggleSwitch
                                        v-model="particleLife.hasCells" label="Show Cells" mr-4
                                        tooltip="Toggle the visibility of cells in the spatial partitioning system. <br> When enabled, cells will be displayed to help visualize particle grouping."
                                    />
                                    <ToggleSwitch
                                        v-model="particleLife.isCellFollow" label="Follow" :disabled="!particleLife.hasCells"
                                        tooltip="Toggle to display cells based on their center relative to all particles within the cell. <br> This helps track groups of particles as you adjust the cell group size."
                                    />
                                </div>
                                <div flex>
                                    <SelectButton :id="0" v-model="particleLife.cellShape" icon="i-tabler-square" mr-2 />
                                    <SelectButton :id="1" v-model="particleLife.cellShape" icon="i-tabler-circle" />
                                </div>
                            </div>

                            <RangeInput
                                v-model="particleLife.cellGroupSize" input
                                label="Cell Group Size"
                                tooltip="Set the minimum number of particles required for a cell to be displayed. <br> At 0, all cells are shown; higher values filter out smaller groups." :min="0" :max="100" :step="1" mt-2
                            />
                            <RangeInput
                                v-model="particleLife.cellSizeFactor" input
                                label="Cell Size Factor"
                                tooltip="Adjust the size of the cells used in the algorithm. <br> At 1, cells match the current max radius; higher values increase cell size. Values below 1 may prevent interactions between neighboring particles." :min="1" :max="2" :step="0.01" mt-2
                            />
                        </Collapse>

                        <Collapse label="Save and Share" icon="i-carbon-save text-yellow-500" mt-2>
                            <div flex>
                                <button type="button" btn flex items-center rounded-full p2 text-sm bg="zinc-900 hover:#212121" @click="toggleCaptureMode('screenshot')">
                                    <span class="i-tabler-photo" mr-1 />
                                    Screenshot
                                </button>
                                <button type="button" btn flex items-center rounded-full p2 bg="zinc-900 hover:#212121" @click="toggleCaptureMode('GIF')">
                                    <span class="i-tabler-gif" text-sm />
                                </button>
                            </div>
                        </Collapse>
                    </div>
                    <div absolute bottom-2 right-0 z-100 class="-mr-px">
                        <button flex items-center border border-gray-400 rounded-l-lg p-1 bg="slate-900/85 hover:slate-950/85" @click="particleLife.sidebarLeftOpen = false">
                            <span i-tabler-chevron-left text-2xl />
                        </button>
                    </div>
                </div>
            </template>
        </SidebarLeft>

        <canvas id="lifeCanvas" h-full w-full cursor-crosshair @contextmenu.prevent />
        <SaveModal :store="particleLife" />
        <ParticleLifeShareOptions v-if="particleLife.isShareOptionsOpen" ref="shareOptions" :get-selected-area-image-data="getSelectedAreaImageData" />

        <div pointer-events-none absolute right-0 top-0 flex flex-col items-end text-right>
            <div flex items-center rounded-bl-xl bg-gray-800 pl-4 pr-1 text-start text-xs style="padding-bottom: 1px; opacity: 75%">
                <div flex>
                    Fps: <div ml-1 min-w-8>
                        {{ fps }}
                    </div>
                </div>
                <div ml-3 flex>
                    Cells: <div ml-1 min-w-8>
                        {{ cellCount }}
                    </div>
                </div>
                <div ml-3 flex>
                    Process: <div ml-1 min-w-7>
                        {{ Math.round(executionTime) }}
                    </div>
                </div>
            </div>
            <!--            <Memory mr-1 /> -->
            <BrushSettings :store="particleLife" pointer-events-auto mr-1 mt-2 />

            <div class="faded-hover-effect" pointer-events-auto mr-1>
                <button
                    type="button" title="Debugger" aria-label="Debugger" bg="#D62839 hover:#DC4151" btn mt-2 aspect-square w-8 flex items-center justify-center rounded-full p1
                    @click="particleLife.hasCells = !particleLife.hasCells"
                >
                    <span text-sm :class="particleLife.hasCells ? 'i-tabler-bug-filled' : 'i-tabler-bug'" />
                </button>
                <button
                    type="button" title="Grid" aria-label="Grid" bg="#212121 hover:#333333" btn mt-2 aspect-square w-8 flex items-center justify-center rounded-full p1
                    :disabled="!particleLife.isWallRepel && !particleLife.isWallWrap" class="disabled:cursor-not-allowed" @click="particleLife.hasGrid = !particleLife.hasGrid"
                >
                    <span text-sm :class="particleLife.hasGrid ? 'i-tabler-bread' : 'i-tabler-bread-off'" />
                </button>
            </div>
        </div>
        <div fixed bottom-2 z-10 flex items-end justify-center class="faded-hover-effect left-1/2 transform -translate-x-1/2">
            <button type="button" name="Randomize" aria-label="Randomize" btn mx-1 flex items-center rounded-full p2 bg="#094F5D hover:#0B5F6F" @click="regenerateLife">
                <span i-game-icons-perspective-dice-six-faces-random />
            </button>
            <button type="button" name="Toggle 3D" aria-label="Toggle 3D" btn mx-1 flex items-center rounded-full p2 bg="#E45C3A hover:#E76F51" @click="particleLife.is3D = !particleLife.is3D">
                <span text-sm font-700 style="line-height: normal">{{ particleLife.is3D ? '2D' : '3D' }}</span>
            </button>
            <button type="button" name="Zoom Out" aria-label="Zoom Out" btn mx-1 flex items-center rounded-full p2 bg="#212121 hover:#333333" @click="handleZoom(-1, lifeCanvas!.clientWidth / 2, lifeCanvas!.clientHeight / 2)">
                <span i-tabler-zoom-out />
            </button>
            <button type="button" name="Play/Pause" aria-label="Play/Pause" btn mx-1 flex items-center rounded-full p3 bg="#212121 hover:#333333" @click="particleLife.isRunning = !particleLife.isRunning">
                <span text-xl :class="particleLife.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'" />
            </button>
            <button type="button" name="Step" aria-label="Step" btn mx-1 flex items-center rounded-full p2 bg="#212121 hover:#333333" :disabled="particleLife.isRunning" @click="step">
                <span i-tabler-player-skip-forward-filled />
            </button>
            <button type="button" name="Zoom In" aria-label="Zoom In" btn mx-1 flex items-center rounded-full p2 bg="#212121 hover:#333333" @click="handleZoom(1, lifeCanvas!.clientWidth / 2, lifeCanvas!.clientHeight / 2)">
                <span i-tabler-zoom-in />
            </button>
            <button type="button" name="Toggle Fullscreen" aria-label="Toggle Fullscreen" btn mx-1 flex items-center rounded-full p2 bg="#212121 hover:#333333" @click="toggleFullscreen">
                <span :class="isFullscreen ? 'i-tabler-maximize-off' : 'i-tabler-maximize'" />
            </button>
        </div>
        <SocialLinks />
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import BrushSettings from "~/components/particle-life/BrushSettings.vue"
import MatrixSettings from "~/components/particle-brain/MatrixSettings.vue"
import PresetPanel from "~/components/particle-life/PresetPanel.vue"
import RadiusVisualizer from "~/components/particle-life/RadiusVisualizer.vue"
import SaveModal from "~/components/particle-life/SaveModal.vue"
import UrgeInspector from "~/components/particle-brain/UrgeInspector.vue"
import SidebarLeft from "~/components/SidebarLeft.vue"
import { hexToRgb, rgbFloatToHsl } from '~/helpers/utils/colorConversion'
import { generateHSLColors, PALETTE_OPTIONS } from "~/helpers/utils/colorsGenerator"
import { generateRules, RULES_OPTIONS } from '~/helpers/utils/rulesGenerator'

export default defineComponent({
    components: { RadiusVisualizer, SaveModal, PresetPanel, MatrixSettings, BrushSettings, SidebarLeft, UrgeInspector },
    setup() {
        const particleLife = useParticleBrainStore()
        const rulesOptions = RULES_OPTIONS
        const paletteOptions = PALETTE_OPTIONS
        const shareOptions = ref()
        const mainContainer = ref<HTMLElement | null>(null)
        const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(mainContainer)
        const { success } = useToasts()

        // eslint-disable-next-line unused-imports/no-unused-vars
        const customRulesMatrix: number[][] = [[0, 1, 0, 1, 0, 0, 0, 0, 0], [0, 0, 1, 0, 1, 0, 0, 0, 0], [1, 0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 1, 0, 1, 0, 0], [0, 0, 0, 0, 0, 1, 0, 1, 0], [0, 0, 0, 1, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, 0, 0, 0, 1], [0, 0, 1, 0, 0, 0, 1, 0, 0]]

        // Define canvas and context for drawing
        let lifeCanvas: HTMLCanvasElement | undefined
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        const backgroundColor: string = 'black'
        let animationFrameId: number | null = null

        // Flag to check if the GIF is being captured
        let isCapturingGIF: boolean = false

        // Define the reactive variables for the game state
        const fps = useFps()
        const cellCount = ref<number>(0)
        const executionTime = ref<number>(0)
        let isRunning = particleLife.isRunning
        let isBrushActive: boolean = particleLife.isBrushActive
        let brushes: number[] = particleLife.brushes
        let brushRadius: number = particleLife.brushRadius
        let brushIntensity: number = particleLife.brushIntensity
        let brushType: number = particleLife.brushType // 0: Erase, 1: Draw
        let attractForce: number = particleLife.attractForce
        let repulseForce: number = -Math.abs(particleLife.repulseForce)
        let isMagnetActive: boolean = false
        const wallRepelForce: number = particleLife.wallRepelForce // Repulse force for the walls (velocity will be multiplied by this value negative)

        // Define color list and rules matrix for the particles
        let currentColors: number[][] = [] // Current colors for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color

        // Define world properties
        let numParticles: number = particleLife.numParticles // Number of particles
        let numColors: number = particleLife.numColors // Number of colors to be used
        let NEW_NUM_TYPES: number = numColors // Temporary variable to handle changes in numColors
        let isUpdateNumTypesPending: boolean = false // Flag to indicate if numColors update is pending
        let isUpdatingParticles: boolean = false // Flag to prevent multiple additions at once
        let particleSize: number = particleLife.particleSize // Size of the particles at zoomFactor = 1
        let depthLimit: number = particleLife.depthLimit // Maximum Z axis depth (0 means almost 2D because there is friction with the walls && can be negative)
        let isCircle: boolean = particleLife.isCircle // Enable circular shape for the particles
        let hasGrid: boolean = particleLife.hasGrid // Enable grid
        let hasCells: boolean = particleLife.hasCells // Enable cells
        let isCellFollow: boolean = particleLife.isCellFollow // Enable cell follow
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let hasDepthSize: boolean = particleLife.hasDepthSize // Enable depth size effect
        let hasDepthOpacity: boolean = particleLife.hasDepthOpacity // Enable depth opacity effect
        let maxOpacity: number = particleLife.maxOpacity // Maximum opacity when hasDepthOpacity is enabled
        let minOpacity: number = particleLife.minOpacity // Depth effect will be stronger with lower opacity
        let cellGroupSize: number = particleLife.cellGroupSize // Minimum number of particles to be considered a group (0 to visualize all cells)
        let cellShape: number = particleLife.cellShape // 0: Rectangle, 1: Circle
        let wallShape: number = particleLife.wallShape // 0: Rectangle, 1: Circle
        let screenMultiplierForGridSize: number = particleLife.screenMultiplierForGridSize // Multiplier for the grid size based on the screen size

        // Define force properties
        let repel: number = particleLife.repel // repel force for particles that are too close to each other (can't be 0)
        let forceFactor: number = particleLife.forceFactor // Adjust the overall force applied between particles (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 0 is no friction)
        let zoomFactor: number = 1 // Zoom level
        let cellSizeFactor: number = particleLife.cellSizeFactor // Adjust the cell size based on the particle size
        let cellSize: number = 0 // Cell size based on the current max radius && cellSizeFactor

        // eslint-disable-next-line unused-imports/no-unused-vars
        const currentMinRadius: number = 0 // Max value between all colors min radius
        let currentMaxRadius: number = particleLife.currentMaxRadius // Max value between all colors max radius (for cell size)

        // Define grid properties
        let gridOffsetX: number = 0 // Grid offset X
        let gridOffsetY: number = 0 // Grid offset Y
        let gridWidth: number = 0 // Grid width
        let gridHeight: number = 0 // Grid height
        let startGridX: number = 0 // Position X of the start of the rectangle grid
        let startGridY: number = 0 // Position Y of the start of the rectangle grid
        let endGridX: number = 0 // Position X of the end of the rectangle grid
        let endGridY: number = 0 // Position Y of the end of the rectangle grid
        let halfParticleSize: number = 0 // Half of the particle size with zoom factor
        let circleRadius: number = 0 // Radius of the grid circle
        let circleCenterX: number = 0 // Center X of the grid circle
        let circleCenterY: number = 0 // Center Y of the grid circle

        // Define the properties for dragging and zooming
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y

        // Define the arrays for storing the properties of each particle
        let cells: Map<string, number[]> // Map to store the particles in each cell
        // Total particle count = matter + urges + neurons + sense neurons (when electrical is enabled)
        const MATRIX_EXTRA_TYPES = 2 // urge row + neuron row (sense neurons ride the neuron row; no own row)
        let numUrges: number = particleLife.numUrges
        let numNeurons: number = particleLife.numNeurons
        let numSenseNeurons: number = particleLife.numSenseNeurons // sense neurons (sensors; one target color each)
        let totalParticleCount: number = numParticles // will be set in initParticles
        let colors = new Int32Array(numParticles) // Type of each particle (0..numColors-1 matter, then urges, then neurons)
        let positionX = new Float32Array(numParticles) // X position of each particle
        let positionY = new Float32Array(numParticles) // Y position of each particle
        let positionZ = new Float32Array(numParticles) // Z position of each particle
        let velocityX = new Float32Array(numParticles).fill(0) // X velocity of each particle
        let velocityY = new Float32Array(numParticles).fill(0) // Y velocity of each particle
        let velocityZ = new Float32Array(numParticles).fill(0) // Z velocity of each particle
        let control = new Float32Array(numParticles).fill(0) // Electrical: urge learned attract(+)/repel(-) intent
        let signal = new Float32Array(numParticles).fill(0) // Electrical: urge prior-frame metric / neuron firing activity

        onMounted(() => {
            lifeCanvas = document.getElementById('lifeCanvas') as HTMLCanvasElement
            ctx = lifeCanvas?.getContext('2d') || undefined
            handleResize()
            setAlgorithms()
            initLife()
            if (!isRunning)
                simpleDrawParticles()
            animationFrameId = requestAnimationFrame(update) // Start the game loop

            onKeyStroke(' ', () => { // Space bar pressed
                console.log('Key Space pressed')
                particleLife.isRunning = !particleLife.isRunning
            })
            onKeyStroke('c', () => { // Space bar pressed
                console.log('Key C pressed')
                centerView()
                if (!isRunning)
                    simpleDrawParticles()
            })
            useEventListener('resize', handleResize)
            useEventListener(lifeCanvas, ['mousedown'], (e) => {
                lastPointerX = e.x - lifeCanvas!.getBoundingClientRect().left
                lastPointerY = e.y - lifeCanvas!.getBoundingClientRect().top
                if (e.buttons > 0) {
                    if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                        if (brushType === 0) {
                            eraseWithBrush()
                        }
                        else if (brushType === 1) {
                            drawWithBrush()
                        }
                        else if (brushType === 2 || brushType === 3) {
                            isMagnetActive = true
                        }
                    }
                }
            })
            useEventListener(lifeCanvas, ['mousemove'], (e) => {
                pointerX = e.x - lifeCanvas!.getBoundingClientRect().left
                pointerY = e.y - lifeCanvas!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    if (particleLife.isLockedPointer)
                        return // Prevent canvas dragging if the pointer is locked
                    isDragging = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        handleMove()
                    }
                    if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                        if (brushType === 0)
                            eraseWithBrush()
                        else if (brushType === 1)
                            drawWithBrush()
                    }
                }
                else if (e.buttons === 0) {
                    isDragging = false
                    isMagnetActive = false
                }
            })
            useEventListener(lifeCanvas, ['mouseup'], (e) => {
                isDragging = false
                if (e.button === 2 && isBrushActive) { // if secondary button is pressed (right click)
                    if (brushType === 2 || brushType === 3) { // Magnet
                        isMagnetActive = false
                    }
                }
            })
            useEventListener(lifeCanvas, ['touchstart'], (e) => {
                e.preventDefault()
                lastPointerX = e.touches[0].clientX - lifeCanvas!.getBoundingClientRect().left
                lastPointerY = e.touches[0].clientY - lifeCanvas!.getBoundingClientRect().top
            })
            useEventListener(lifeCanvas, ['touchmove'], (e) => {
                e.preventDefault()
                pointerX = e.touches[0].clientX - lifeCanvas!.getBoundingClientRect().left
                pointerY = e.touches[0].clientY - lifeCanvas!.getBoundingClientRect().top

                if (particleLife.isLockedPointer)
                    return // Prevent canvas dragging if the pointer is locked
                isDragging = true
                handleMove()
            })
            useEventListener(lifeCanvas, ['touchend'], (e) => {
                e.preventDefault()
                console.log('end touch')
                isDragging = false
            })

            useEventListener(lifeCanvas, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    handleZoom(1, pointerX, pointerY)
                }
                else { // Zoom out
                    handleZoom(-1, pointerX, pointerY)
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            canvasWidth = lifeCanvas!.width = lifeCanvas!.clientWidth
            canvasHeight = lifeCanvas!.height = lifeCanvas!.clientHeight
            setShapesProperties()
            if (!isRunning)
                simpleDrawParticles()
        }
        function handleMove() {
            if (isDragging) {
                gridOffsetX += (pointerX - lastPointerX) / zoomFactor
                gridOffsetY += (pointerY - lastPointerY) / zoomFactor
                lastPointerX = pointerX
                lastPointerY = pointerY
                setShapesProperties()
            }
        }
        function handleZoom(delta: number, x: number, y: number) {
            const oldZoomFactor = zoomFactor
            const zoomIntensity = 0.1
            const zoomDelta = delta * zoomIntensity
            zoomFactor = Math.max(0.1, Math.min(3.2, zoomFactor * (1 + zoomDelta)))

            // Adjust grid offsets by scaling the cursor position with the ratio of the new and old zoom factors
            // This maintains the cursor's position on the grid during zoom operations
            gridOffsetX -= (x / zoomFactor) * ((zoomFactor / oldZoomFactor) - 1)
            gridOffsetY -= (y / zoomFactor) * ((zoomFactor / oldZoomFactor) - 1)

            setShapesProperties()
            if (!isRunning)
                simpleDrawParticles()
        }
        // -------------------------------------------------------------------------------------------------------------
        function setAlgorithms() {
            if (particleLife.is3D) {
                processRules = particleLife.isWallWrap ? processRules3DWrapped : processRules3D
                updateParticles = updateParticles3D
                drawParticle = drawParticle3D
            }
            else {
                processRules = particleLife.isWallWrap ? processRules2DWrapped : processRules2D
                updateParticles = updateParticles2D
                drawParticle = drawParticle2D
            }
        }
        const MATRIX_TYPES = () => numColors + MATRIX_EXTRA_TYPES // total interaction matrix dimension
        function initLife() {
            // Set the grid size and zoom factor based on the screen size
            setGridSizeBasedOnScreen()
            zoomFactor /= screenMultiplierForGridSize

            initColors()
            centerView()
            initParticles()
            setRulesMatrix(generateRules(0, MATRIX_TYPES()))
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
        }
        function regenerateLife() {
            if (animationFrameId)
                cancelAnimationFrame(animationFrameId)

            initColors()
            initParticles()
            setRulesMatrix(generateRules(0, MATRIX_TYPES()))
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())

            if (!isRunning)
                simpleDrawParticles()
            animationFrameId = requestAnimationFrame(update) // Start the game loop
        }
        function initColors() {
            setColors(generateHSLColors(particleLife.selectedColorPaletteOption, numColors))
        }
        function initParticles() {
            const matterCount = numParticles // store value = matter count
            totalParticleCount = matterCount + (particleLife.isElectricalEnabled ? numUrges + numNeurons + numSenseNeurons : 0)

            // Resize arrays if the total changed
            if (colors.length !== totalParticleCount) {
                colors = new Int32Array(totalParticleCount)
                positionX = new Float32Array(totalParticleCount)
                positionY = new Float32Array(totalParticleCount)
                positionZ = new Float32Array(totalParticleCount)
                velocityX = new Float32Array(totalParticleCount).fill(0)
                velocityY = new Float32Array(totalParticleCount).fill(0)
                velocityZ = new Float32Array(totalParticleCount).fill(0)
                control = new Float32Array(totalParticleCount).fill(0)
                signal = new Float32Array(totalParticleCount).fill(0)
            }

            for (let i = 0; i < totalParticleCount; ++i) {
                if (i < matterCount) {
                    colors[i] = Math.floor(Math.random() * numColors)
                }
                else if (particleLife.isElectricalEnabled && i < matterCount + numUrges) {
                    colors[i] = numColors + (i - matterCount) // urge type
                }
                else if (particleLife.isElectricalEnabled && i < matterCount + numUrges + numNeurons) {
                    colors[i] = numColors + numUrges + (i - matterCount - numUrges) // motor neuron type
                }
                else if (particleLife.isElectricalEnabled) {
                    colors[i] = numColors + numUrges + numNeurons + (i - matterCount - numUrges - numNeurons) // sense neuron type
                }
                const newPositions = getRandomPositions()
                positionX[i] = newPositions.x
                positionY[i] = newPositions.y
                positionZ[i] = newPositions.z
            }
        }
        function newRandomRulesMatrix() {

        }
        function makeRandomMinRadiusMatrix() {
            const matrix: number[][] = []
            const min: number = particleLife.minRadiusRange[0]
            const max: number = particleLife.minRadiusRange[1]
            const size = MATRIX_TYPES()
            for (let i = 0; i < size; i++) {
                matrix.push([])
                for (let j = 0; j < size; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                }
            }
            return matrix
        }
        function makeRandomMaxRadiusMatrix() {
            const matrix: number[][] = []
            const min: number = particleLife.maxRadiusRange[0]
            const max: number = particleLife.maxRadiusRange[1]
            const size = MATRIX_TYPES()
            for (let i = 0; i < size; i++) {
                matrix.push([])
                for (let j = 0; j < size; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                }
            }
            return matrix
        }
        const randomizeRadius = () => {
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
            if (!isRunning)
                simpleDrawParticles()
        }
        const randomizeRulesAndRadius = () => {
            setRulesMatrix(generateRules(0, numColors))
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
            if (!isRunning)
                simpleDrawParticles()
        }
        const updateColors = async (useRandomGenerator: boolean | Event = false) => {
            const shouldRandom = typeof useRandomGenerator === 'boolean' ? useRandomGenerator : false
            if (shouldRandom)
                particleLife.selectedColorPaletteOption = paletteOptions[Math.floor(Math.random() * paletteOptions.length)].id

            setColors(generateHSLColors(particleLife.selectedColorPaletteOption, numColors))
            if (!isRunning)
                simpleDrawParticles() // Redraw the particles if the game is not running
        }
        const updateRulesMatrix = async (useRandomGenerator: boolean | Event = false) => {
            const shouldRandom = typeof useRandomGenerator === 'boolean' ? useRandomGenerator : false
            if (shouldRandom)
                particleLife.selectedRulesOption = rulesOptions[Math.floor(Math.random() * rulesOptions.length)].id

            setRulesMatrix(generateRules(particleLife.selectedRulesOption, MATRIX_TYPES()))
        }
        function getRandomPositions() {
            const minZDepthRandomParticle = depthLimit * 0.2 // The minimum Z-depth for randomly placed particles, in percentage of the depthLimit
            const maxZDepthRandomParticle = depthLimit * 0.45 // The maximum Z-depth for randomly placed particles, in percentage of the depthLimit

            if (wallShape === 0) { // Rectangle
                return {
                    x: Math.random() * gridWidth,
                    y: Math.random() * gridHeight,
                    z: Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle,
                }
            }
            else { // Circle
                while (true) {
                    const x = Math.random() * 2 * circleRadius - circleRadius
                    const y = Math.random() * 2 * circleRadius - circleRadius
                    if (x * x + y * y <= circleRadius * circleRadius) {
                        return {
                            x: circleCenterX + x,
                            y: circleCenterY + y,
                            z: Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle,
                        }
                    }
                }
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        const update = () => {
            const startExecutionTime = performance.now()
            if (isUpdateNumTypesPending)
                updateNumColors(NEW_NUM_TYPES)
            if (isRunning) {
                processRules()
                updateParticles()
                if (hasGrid)
                    drawGrid()
                if (hasCells)
                    drawCells()
                if (isCapturingGIF)
                    captureFrame()
                if (isMagnetActive) {
                    if (brushType === 2)
                        magnetWithBrush(repulseForce)
                    else if (brushType === 3)
                        magnetWithBrush(attractForce)
                }
            }
            else {
                if (isDragging || isBrushActive)
                    simpleDrawParticles()
            }
            if (isBrushActive)
                drawBrush()

            executionTime.value = performance.now() - startExecutionTime
            animationFrameId = requestAnimationFrame(update)
        }
        function step() {
            if (!isRunning) {
                processRules()
                updateParticles()
                if (hasGrid)
                    drawGrid()
                if (hasCells)
                    drawCells()
            }
        }
        function drawCells() {
            cells.forEach((particles, cell) => {
                if (particles.length <= cellGroupSize)
                    return // Detect groups of particles

                let centerX = 0; let centerY = 0
                if (isCellFollow) { // Follow the particles in the cell
                    for (let p = 0; p < particles.length; p++) {
                        centerX += positionX[particles[p]]
                        centerY += positionY[particles[p]]
                    }
                    centerX /= particles.length
                    centerY /= particles.length
                }
                else { // Static cell position
                    const [cellX, cellY] = cell.split(',').map(Number)
                    centerX = cellX * cellSize + cellSize / 2
                    centerY = cellY * cellSize + cellSize / 2
                }

                // Adjust the position based on the grid offset and zoom factor
                const drawX = (centerX + gridOffsetX) * zoomFactor
                const drawY = (centerY + gridOffsetY) * zoomFactor
                const radius = cellSize / 2 * zoomFactor

                // Skip if the cell is outside the canvas
                if (drawX < -radius || drawX > canvasWidth + radius || drawY < -radius || drawY > canvasHeight + radius)
                    return

                // Draw the cell
                ctx!.beginPath()
                if (cellShape === 0) { // Rectangle
                    ctx!.roundRect(drawX - radius, drawY - radius, radius * 2, radius * 2, radius / 4)
                }
                else { // Circle
                    ctx!.arc(drawX, drawY, radius, 0, Math.PI * 2)
                }
                ctx!.strokeStyle = `hsl(${0}, 100%, 50%, 0.55)`
                ctx!.stroke()
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // Get display color for a particle type code (handles matter + electrical types)
        const getColorForType = (typeCode: number): number[] => {
            if (typeCode < numColors)
                return currentColors[typeCode]
            if (typeCode < numColors + numUrges) {
                // Urge: cyan -> white ramp
                const k = typeCode - numColors
                const t = numUrges <= 1 ? 0 : k / (numUrges - 1)
                return [190, 85, Math.round(60 + 35 * t)] // HSL: cyan hue, increasing lightness
            }
            if (typeCode < numColors + numUrges + numNeurons) {
                // Motor neuron: magenta -> orange ramp
                const m = typeCode - numColors - numUrges
                const t = numNeurons <= 1 ? 0 : m / (numNeurons - 1)
                return [Math.round(300 - 240 * t), 90, Math.round(55 + 10 * t)] // HSL: magenta to orange
            }
            // Sense neuron: cool cyan -> magenta ramp (distinct from urges and motor neurons)
            const s = typeCode - numColors - numUrges - numNeurons
            const t = numSenseNeurons <= 1 ? 0 : s / (numSenseNeurons - 1)
            return [Math.round(185 + 95 * t), 85, Math.round(55 + 5 * t)] // HSL: cyan (185) to magenta (280)
        }

        let drawParticle: (x: number, y: number, z: number, color: number[], size: number) => void
        function drawParticle2D(x: number, y: number, z: number, color: number[], size: number) {
            const newSize = size * zoomFactor // Adjust the size based on the depth factor and zoom factor
            if (newSize <= 0)
                return // Skip if the particle is too small
            const drawX = (x + gridOffsetX) * zoomFactor // Adjust the position X based on the grid offset and zoom factor
            const drawY = (y + gridOffsetY) * zoomFactor // Adjust the position Y based on the grid offset and zoom factor
            if (drawX < 0 || drawX > canvasWidth || drawY < 0 || drawY > canvasHeight)
                return // Skip if the particle is outside the canvas

            ctx!.fillStyle = `hsl(${color[0]}, ${color[1]}%, ${color[2]}%, 1)`

            // Handle particle drawing
            if (newSize < 2 || !isCircle) { // Draw squares for small particles
                ctx!.fillRect(drawX - newSize / 2, drawY - newSize / 2, newSize, newSize)
            }
            else { // Draw circles for larger particles
                ctx!.beginPath()
                ctx!.arc(drawX, drawY, newSize / 2, 0, Math.PI * 2)
                ctx!.fill()
            }
        }
        function drawParticle3D(x: number, y: number, z: number, color: number[], size: number) {
            let depthFactor = 1
            if (hasDepthSize) {
                depthFactor = 1 - z / gridHeight / zoomFactor // Adjust this factor to control the depth effect
            }
            const newSize = size * depthFactor * zoomFactor // Adjust the size based on the depth factor and zoom factor
            if (newSize <= 0)
                return // Skip if the particle is too small
            const drawX = (x + gridOffsetX) * zoomFactor // Adjust the position X based on the grid offset and zoom factor
            const drawY = (y + gridOffsetY) * zoomFactor // Adjust the position Y based on the grid offset and zoom factor
            if (drawX < 0 || drawX > canvasWidth || drawY < 0 || drawY > canvasHeight)
                return // Skip if the particle is outside the canvas

            // Handle depth opacity effect
            if (hasDepthOpacity) {
                // Opacity depth effect
                const opacity = depthLimit !== 0 ? maxOpacity - (z / depthLimit) * (maxOpacity - minOpacity) : 1
                ctx!.fillStyle = `hsl(${color[0]}, ${color[1]}%, ${color[2]}%, ${opacity})`
            }
            else {
                // No opacity depth effect
                ctx!.fillStyle = `hsl(${color[0]}, ${color[1]}%, ${color[2]}%, 1)`
            }

            // Handle particle drawing
            if (newSize < 2 || !isCircle) { // Draw squares for small particles
                ctx!.fillRect(drawX - newSize / 2, drawY - newSize / 2, newSize, newSize)
            }
            else { // Draw circles for larger particles
                ctx!.beginPath()
                ctx!.arc(drawX, drawY, newSize / 2, 0, Math.PI * 2)
                ctx!.fill()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function getForce(ruleFactor: number, colorMinRadius: number, colorMaxRadius: number, distance: number) {
            if (distance < colorMinRadius) {
                return (repel / colorMinRadius) * distance - repel
            }
            else if (distance > colorMaxRadius) {
                return 0
            }
            else {
                const mid = (colorMinRadius + colorMaxRadius) / 2
                const slope = ruleFactor / (mid - colorMinRadius)
                return -(slope * Math.abs(distance - mid)) + ruleFactor
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        let processRules: () => void

        // Particle category: 0 matter, 1 urge, 2 motor neuron, 4 sense neuron, 3 dormant sentinel.
        // Mirrors the GPU shaders' cat(): layout [matter][urges][motor neurons][sense neurons][dormant].
        const particleCat = (typeCode: number): number => {
            if (typeCode < numColors)
                return 0
            if (typeCode < numColors + numUrges)
                return 1
            if (typeCode < numColors + numUrges + numNeurons)
                return 2 // motor neuron
            if (typeCode < numColors + numUrges + numNeurons + numSenseNeurons)
                return 4 // sense neuron
            if (typeCode === numColors + numUrges + numNeurons + numSenseNeurons)
                return 3 // dormant sentinel
            return 2 // fallback: stale type -> motor neuron (same as GPU)
        }

        // Per-urge goal (mirrors the GPU shader's urgeGoal)
        const urgeGoalFor = (k: number): { mode: number, targetValue: number } => {
            let mode: number
            const globalMode = ((particleLife.metricMode % 4) + 4) % 4
            switch (globalMode) {
                case 0: mode = k % 3; break // cycle all three
                case 1: mode = 0; break // all maximize
                case 2: mode = 1; break // all minimize
                default: mode = 2; break // all homeostasis
            }
            let targetValue = 1.0
            if (mode === 2) {
                // Deterministic pseudo-random in [0.6, 1.4]
                const hash = Math.abs(Math.sin(k * 12.9898 + 78.233) * 43758.5453) % 1
                targetValue = 0.6 + hash * 0.8
            }
            return { mode, targetValue }
        }

        function processRules2D() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < totalParticleCount; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []
                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        const neighborX = cellX + offsetX
                        const neighborY = cellY + offsetY
                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Electrical layer parameters (read once per frame)
            const eOn = particleLife.isElectricalEnabled
            const eR = Math.max(particleLife.urgeRadius, 1)
            const nR = Math.max(particleLife.neuronRadius, 1)
            const urgeForce = particleLife.urgeForce
            const cohesionVal = particleLife.cohesion

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]
                    const typeA = colors[indexA]
                    const catA = particleCat(typeA)

                    let velocityXSum = 0; let velocityYSum = 0
                    // Electrical accumulators
                    let metricCount = 0; let drive = 0; let cohesionFX = 0; let cohesionFY = 0

                    const isMatterA = catA === 0
                    const isUrgeA = catA === 1
                    const isNeuronA = catA === 2
                    const isSenseA = catA === 4
                    const kIdx = isUrgeA ? typeA - numColors : 0
                    const mIdx = isNeuronA ? typeA - numColors - numUrges : 0
                    const urgeTarget = kIdx % numColors
                    const neuronTarget = mIdx % numColors

                    // Sense-neuron setup: exactly ONE target color and a deterministic sense mode
                    // (0 sight, 1 smell, 2 sound) from its local index s — mirrors the GPU shaders.
                    const sIdx = isSenseA ? typeA - numColors - numUrges - numNeurons : 0
                    const senseTarget = sIdx % numColors
                    let senseModeLocal: number
                    switch (particleLife.senseMode % 4) {
                        case 1: senseModeLocal = 0; break // all sight
                        case 2: senseModeLocal = 1; break // all smell
                        case 3: senseModeLocal = 2; break // all sound
                        default: senseModeLocal = sIdx % 3 // cycle all three senses
                    }
                    const sR = Math.max(particleLife.senseRadius, 1)
                    const vlenA = Math.sqrt(velocityX[indexA] * velocityX[indexA] + velocityY[indexA] * velocityY[indexA])
                    const hasHeading = vlenA > 0.001
                    const headingX = velocityX[indexA] / Math.max(vlenA, 0.001)
                    const headingY = velocityY[indexA] / Math.max(vlenA, 0.001)
                    const cosHalfAngle = Math.cos(particleLife.senseConeHalfAngleDeg * Math.PI / 180)
                    // Sense accumulators (sector buffer allocated only for sense particles —
                    // matter/urges/motor neurons never touch it, keeping GC pressure at zero)
                    let seenCount = 0
                    const SENSE_SECTORS = 12
                    const sectorScores: Float32Array | null = isSenseA ? new Float32Array(SENSE_SECTORS) : null // smell: nearness-weighted score per sector
                    let soundVecX = 0; let soundVecY = 0; let soundCount = 0 // sound: uniform-weight vector sum + count

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB)
                                continue

                            const typeB = colors[indexB]
                            const catB = particleCat(typeB)

                            const dx = positionX[indexB] - posXA
                            const dy = positionY[indexB] - posYA
                            const distSq = dx * dx + dy * dy
                            if (distSq < 0.0001)
                                continue
                            const distance = Math.sqrt(distSq)
                            const dirX = dx / distance
                            const dirY = dy / distance

                            // ---- 1) Classic matter <-> matter rule ----
                            if (isMatterA && catB === 0) {
                                const maxR = maxRadiusMatrix[typeA][typeB]
                                if (distance < maxR) {
                                    const force = getForce(rulesMatrix[typeA][typeB], minRadiusMatrix[typeA][typeB], maxR, distance)
                                    velocityXSum += dirX * force
                                    velocityYSum += dirY * force
                                }
                            }

                            if (!eOn)
                                continue // no electrical layer

                            // ---- 2) Electrical <-> matter via the main interaction matrix ----
                            // The shared row gives the force ON the special particle from nearby matter.
                            // Sense neurons do NOT actuate matter but get matrix-driven drift through
                            // the shared NEURON row (same choice as the GPU shaders).
                            if ((isUrgeA || isNeuronA || isSenseA) && catB === 0) {
                                const rowIdx = numColors + ((isNeuronA || isSenseA) ? 1 : 0)
                                const maxR = maxRadiusMatrix[rowIdx][typeB]
                                if (distance < maxR) {
                                    const force = getForce(rulesMatrix[rowIdx][typeB], minRadiusMatrix[rowIdx][typeB], maxR, distance)
                                    velocityXSum += dirX * force
                                    velocityYSum += dirY * force
                                }
                            }

                            // ---- 3) Urge gathering metric for its goal ----
                            if (isUrgeA && catB === 0 && distance < eR) {
                                if (typeB === urgeTarget)
                                    metricCount++
                            }

                            // ---- 4) Neuron driven by nearby urges ----
                            if (isNeuronA && catB === 1 && distance < nR) {
                                const fall = Math.max(0, 1 - distance / nR)
                                drive += control[indexB] * fall
                            }

                            // ---- 5) Neuron actuating its own color ----
                            if (isNeuronA && catB === 0 && typeB === neuronTarget && distance < eR) {
                                const fall = Math.max(0, 1 - distance / eR)
                                const actForce = drive * urgeForce * fall
                                velocityXSum += dirX * actForce
                                velocityYSum += dirY * actForce
                            }

                            // ---- 5b) Sense neuron perceiving its ONE target color (no actuation) ----
                            // Mirrors the GPU perception math exactly. The three senses differ ONLY in
                            // how they aggregate the scan: sight = forward cone test; smell = nearness-
                            // weighted sector score ((sR-d)/sR, near-biased); sound = uniform weight 1.0
                            // (range-agnostic — many-far and few-near at equal count are indistinguishable).
                            if (isSenseA && catB === 0 && typeB === senseTarget && distance < sR) {
                                if (senseModeLocal === 0) {
                                    // SIGHT: "seen" iff inside the forward cone of motion
                                    if (hasHeading && (dirX * headingX + dirY * headingY) > cosHalfAngle)
                                        seenCount++
                                }
                                else if (senseModeLocal === 1) {
                                    // SMELL: closer particles weigh more -> nearest dense region wins
                                    const ang = Math.atan2(dirY, dirX) + Math.PI // [0, 2*PI)
                                    const sec = Math.floor(ang / ((2 * Math.PI) / SENSE_SECTORS)) % SENSE_SECTORS
                                    sectorScores![sec] += (sR - distance) / sR
                                }
                                else {
                                    // SOUND: uniform weight 1.0 (range-agnostic)
                                    soundVecX += dirX
                                    soundVecY += dirY
                                    soundCount++
                                }
                            }

                            // ---- 6) Cohesion: specials cling to matter & avoid overlapping ----
                            if (isUrgeA || isNeuronA || isSenseA) {
                                if (catB === 0 && distance < eR) {
                                    const fall = Math.max(0, 1 - distance / eR)
                                    cohesionFX += dirX * (fall * cohesionVal)
                                    cohesionFY += dirY * (fall * cohesionVal)
                                }
                                else if (catB === 1 || catB === 2 || catB === 4) {
                                    if (distance < 8) {
                                        cohesionFX -= dirX * (cohesionVal * 2)
                                        cohesionFY -= dirY * (cohesionVal * 2)
                                    }
                                    else if (distance < eR * 0.6) {
                                        cohesionFX += dirX * (cohesionVal * 0.3)
                                        cohesionFY += dirY * (cohesionVal * 0.3)
                                    }
                                }
                            }
                        }
                    }

                    // Update velocity
                    if (isMatterA) {
                        velocityX[indexA] += velocityXSum * forceFactor
                        velocityY[indexA] += velocityYSum * forceFactor
                    }
                    else {
                        velocityX[indexA] += (velocityXSum + cohesionFX) * forceFactor
                        velocityY[indexA] += (velocityYSum + cohesionFY) * forceFactor

                        // Update electrical state
                        if (isUrgeA) {
                            const goal = urgeGoalFor(kIdx)
                            // Normalize metric to O(1): mean=1.0 at baseline uniform
                            const numTypesF = numColors
                            const area = gridWidth * gridHeight
                            const numMatterApprox = Math.max(numParticles - numUrges - numNeurons, 1)
                            const expectedCount = numMatterApprox * Math.PI * eR * eR / area / numTypesF
                            const M = metricCount / Math.max(expectedCount, 0.001)
                            const dM = M - signal[indexA]
                            let newControl: number
                            if (goal.mode === 0) {
                                // MAXIMIZE density
                                newControl = control[indexA] + particleLife.controlGain * dM
                            }
                            else if (goal.mode === 1) {
                                // MINIMIZE density
                                newControl = control[indexA] - particleLife.controlGain * dM
                            }
                            else {
                                // HOMEOSTASIS: proportional controller toward target
                                const error = goal.targetValue - M
                                const targetCtrl = Math.max(-1, Math.min(1, error)) * particleLife.controlMax
                                newControl = control[indexA] + (targetCtrl - control[indexA]) * particleLife.controlGain
                            }
                            const cMax = particleLife.controlMax
                            if (newControl > cMax)
                                newControl = cMax
                            if (newControl < -cMax)
                                newControl = -cMax
                            control[indexA] = newControl
                            signal[indexA] = signal[indexA] * 0.85 + M * 0.15 // smooth
                        }
                        else if (isNeuronA) {
                            // Neuron: activity = magnitude of drive
                            const firing = Math.abs(drive)
                            signal[indexA] = signal[indexA] * 0.8 + firing * 0.2
                            control[indexA] = 0
                        }
                        else if (isSenseA) {
                            // Sense neuron: store the perception in signal (magnitude [0,1]) and control
                            // (bearing radians). Mirrors the GPU shaders' normalization exactly.
                            const numTypesF = numColors
                            const area = gridWidth * gridHeight
                            const numMatterApprox = Math.max(numParticles - numUrges - numNeurons - numSenseNeurons, 1)
                            // O(1) expected count of target-color matter in the full sense disk at baseline
                            const expectedCount = numMatterApprox * Math.PI * sR * sR / area / numTypesF
                            let newSignal = 0
                            let newControl = 0
                            if (senseModeLocal === 0) {
                                // SIGHT: fraction of the expected cone coverage that is occupied. No bearing.
                                const expectedInCone = expectedCount * (particleLife.senseConeHalfAngleDeg * Math.PI / 180) / Math.PI // (2*theta)/(2*PI)
                                newSignal = Math.min(1, Math.max(0, seenCount / Math.max(expectedInCone, 0.001)))
                                newControl = 0
                            }
                            else if (senseModeLocal === 1) {
                                // SMELL: strongest sector wins -> bearing to the nearest high-density cluster.
                                let bestScore = 0
                                let bestSector = 0
                                for (let sec = 0; sec < SENSE_SECTORS; sec++) {
                                    if (sectorScores![sec] > bestScore) { bestScore = sectorScores![sec]; bestSector = sec }
                                }
                                if (bestScore > 0.0001) { // global max ~0 -> nothing to smell, output stays zero
                                    newSignal = Math.min(1, Math.max(0, bestScore / Math.max(expectedCount / SENSE_SECTORS, 0.001)))
                                    newControl = (bestSector + 0.5) * (2 * Math.PI) / SENSE_SECTORS - Math.PI // sector center in [-PI, PI]
                                }
                            }
                            else {
                                // SOUND: bearing toward the centroid of sources + total loudness.
                                if (soundCount > 0) {
                                    newSignal = Math.min(1, Math.max(0, soundCount / Math.max(expectedCount, 0.001)))
                                    newControl = Math.atan2(soundVecY, soundVecX)
                                }
                            }
                            signal[indexA] = signal[indexA] * 0.75 + newSignal * 0.25 // smooth like other specials
                            control[indexA] = newControl
                        }
                    }
                }
            }
            cellCount.value = cells.size
        }
        function processRules2DWrapped() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < totalParticleCount; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell (with wrapping)
            const lastCellsX = Math.floor(gridWidth / cellSize)
            const lastCellsY = Math.floor(gridHeight / cellSize)
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []

                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        let neighborX = cellX + offsetX
                        let neighborY = cellY + offsetY

                        if (neighborX < 0)
                            neighborX = lastCellsX
                        else if (neighborX > lastCellsX)
                            neighborX = 0
                        if (neighborY < 0)
                            neighborY = lastCellsY
                        else if (neighborY > lastCellsY)
                            neighborY = 0

                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Electrical layer parameters
            const eOn = particleLife.isElectricalEnabled
            const eR = Math.max(particleLife.urgeRadius, 1)
            const nR = Math.max(particleLife.neuronRadius, 1)
            const urgeForce = particleLife.urgeForce
            const cohesionVal = particleLife.cohesion
            const halfW = gridWidth / 2
            const halfH = gridHeight / 2

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]
                    const typeA = colors[indexA]
                    const catA = particleCat(typeA)

                    let velocityXSum = 0; let velocityYSum = 0
                    let metricCount = 0; let drive = 0; let cohesionFX = 0; let cohesionFY = 0

                    const isMatterA = catA === 0
                    const isUrgeA = catA === 1
                    const isNeuronA = catA === 2
                    const isSenseA = catA === 4
                    const kIdx = isUrgeA ? typeA - numColors : 0
                    const mIdx = isNeuronA ? typeA - numColors - numUrges : 0
                    const urgeTarget = kIdx % numColors
                    const neuronTarget = mIdx % numColors

                    // Sense-neuron setup: exactly ONE target color and a deterministic sense mode
                    // (0 sight, 1 smell, 2 sound) from its local index s — mirrors the GPU shaders.
                    const sIdx = isSenseA ? typeA - numColors - numUrges - numNeurons : 0
                    const senseTarget = sIdx % numColors
                    let senseModeLocal: number
                    switch (particleLife.senseMode % 4) {
                        case 1: senseModeLocal = 0; break // all sight
                        case 2: senseModeLocal = 1; break // all smell
                        case 3: senseModeLocal = 2; break // all sound
                        default: senseModeLocal = sIdx % 3 // cycle all three senses
                    }
                    const sR = Math.max(particleLife.senseRadius, 1)
                    const vlenA = Math.sqrt(velocityX[indexA] * velocityX[indexA] + velocityY[indexA] * velocityY[indexA])
                    const hasHeading = vlenA > 0.001
                    const headingX = velocityX[indexA] / Math.max(vlenA, 0.001)
                    const headingY = velocityY[indexA] / Math.max(vlenA, 0.001)
                    const cosHalfAngle = Math.cos(particleLife.senseConeHalfAngleDeg * Math.PI / 180)
                    // Sense accumulators (sector buffer allocated only for sense particles —
                    // matter/urges/motor neurons never touch it, keeping GC pressure at zero)
                    let seenCount = 0
                    const SENSE_SECTORS = 12
                    const sectorScores: Float32Array | null = isSenseA ? new Float32Array(SENSE_SECTORS) : null // smell: nearness-weighted score per sector
                    let soundVecX = 0; let soundVecY = 0; let soundCount = 0 // sound: uniform-weight vector sum + count

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB)
                                continue

                            const typeB = colors[indexB]
                            const catB = particleCat(typeB)

                            let dx = positionX[indexB] - posXA
                            let dy = positionY[indexB] - posYA

                            // Apply wrapping
                            if (dx > halfW)
                                dx -= gridWidth
                            else if (dx < -halfW)
                                dx += gridWidth
                            if (dy > halfH)
                                dy -= gridHeight
                            else if (dy < -halfH)
                                dy += gridHeight

                            const distSq = dx * dx + dy * dy
                            if (distSq < 0.0001)
                                continue
                            const distance = Math.sqrt(distSq)
                            const dirX = dx / distance
                            const dirY = dy / distance

                            // ---- 1) Classic matter <-> matter rule ----
                            if (isMatterA && catB === 0) {
                                const maxR = maxRadiusMatrix[typeA][typeB]
                                if (distance < maxR) {
                                    const force = getForce(rulesMatrix[typeA][typeB], minRadiusMatrix[typeA][typeB], maxR, distance)
                                    velocityXSum += dirX * force
                                    velocityYSum += dirY * force
                                }
                            }

                            if (!eOn)
                                continue

                            // ---- 2) Electrical <-> matter via the main interaction matrix ----
                            // Sense neurons do NOT actuate matter but get matrix-driven drift through
                            // the shared NEURON row (same choice as the GPU shaders).
                            if ((isUrgeA || isNeuronA || isSenseA) && catB === 0) {
                                const rowIdx = numColors + ((isNeuronA || isSenseA) ? 1 : 0)
                                const maxR = maxRadiusMatrix[rowIdx][typeB]
                                if (distance < maxR) {
                                    const force = getForce(rulesMatrix[rowIdx][typeB], minRadiusMatrix[rowIdx][typeB], maxR, distance)
                                    velocityXSum += dirX * force
                                    velocityYSum += dirY * force
                                }
                            }

                            // ---- 3) Urge gathering metric for its goal ----
                            if (isUrgeA && catB === 0 && distance < eR) {
                                if (typeB === urgeTarget)
                                    metricCount++
                            }

                            // ---- 4) Neuron driven by nearby urges ----
                            if (isNeuronA && catB === 1 && distance < nR) {
                                const fall = Math.max(0, 1 - distance / nR)
                                drive += control[indexB] * fall
                            }

                            // ---- 5) Neuron actuating its own color ----
                            if (isNeuronA && catB === 0 && typeB === neuronTarget && distance < eR) {
                                const fall = Math.max(0, 1 - distance / eR)
                                const actForce = drive * urgeForce * fall
                                velocityXSum += dirX * actForce
                                velocityYSum += dirY * actForce
                            }

                            // ---- 5b) Sense neuron perceiving its ONE target color (no actuation) ----
                            // Mirrors the GPU perception math exactly. The three senses differ ONLY in
                            // how they aggregate the scan: sight = forward cone test; smell = nearness-
                            // weighted sector score ((sR-d)/sR, near-biased); sound = uniform weight 1.0
                            // (range-agnostic — many-far and few-near at equal count are indistinguishable).
                            if (isSenseA && catB === 0 && typeB === senseTarget && distance < sR) {
                                if (senseModeLocal === 0) {
                                    // SIGHT: "seen" iff inside the forward cone of motion
                                    if (hasHeading && (dirX * headingX + dirY * headingY) > cosHalfAngle)
                                        seenCount++
                                }
                                else if (senseModeLocal === 1) {
                                    // SMELL: closer particles weigh more -> nearest dense region wins
                                    const ang = Math.atan2(dirY, dirX) + Math.PI // [0, 2*PI)
                                    const sec = Math.floor(ang / ((2 * Math.PI) / SENSE_SECTORS)) % SENSE_SECTORS
                                    sectorScores![sec] += (sR - distance) / sR
                                }
                                else {
                                    // SOUND: uniform weight 1.0 (range-agnostic)
                                    soundVecX += dirX
                                    soundVecY += dirY
                                    soundCount++
                                }
                            }

                            // ---- 6) Cohesion ----
                            if (isUrgeA || isNeuronA || isSenseA) {
                                if (catB === 0 && distance < eR) {
                                    const fall = Math.max(0, 1 - distance / eR)
                                    cohesionFX += dirX * (fall * cohesionVal)
                                    cohesionFY += dirY * (fall * cohesionVal)
                                }
                                else if (catB === 1 || catB === 2 || catB === 4) {
                                    if (distance < 8) {
                                        cohesionFX -= dirX * (cohesionVal * 2)
                                        cohesionFY -= dirY * (cohesionVal * 2)
                                    }
                                    else if (distance < eR * 0.6) {
                                        cohesionFX += dirX * (cohesionVal * 0.3)
                                        cohesionFY += dirY * (cohesionVal * 0.3)
                                    }
                                }
                            }
                        }
                    }

                    // Update velocity
                    if (isMatterA) {
                        velocityX[indexA] += velocityXSum * forceFactor
                        velocityY[indexA] += velocityYSum * forceFactor
                    }
                    else {
                        velocityX[indexA] += (velocityXSum + cohesionFX) * forceFactor
                        velocityY[indexA] += (velocityYSum + cohesionFY) * forceFactor

                        if (isUrgeA) {
                            const goal = urgeGoalFor(kIdx)
                            // Normalize metric to O(1): mean=1.0 at baseline uniform
                            const numTypesF = numColors
                            const area = gridWidth * gridHeight
                            const numMatterApprox = Math.max(numParticles - numUrges - numNeurons, 1)
                            const expectedCount = numMatterApprox * Math.PI * eR * eR / area / numTypesF
                            const M = metricCount / Math.max(expectedCount, 0.001)
                            const dM = M - signal[indexA]
                            let newControl: number
                            if (goal.mode === 0) {
                                // MAXIMIZE density
                                newControl = control[indexA] + particleLife.controlGain * dM
                            }
                            else if (goal.mode === 1) {
                                // MINIMIZE density
                                newControl = control[indexA] - particleLife.controlGain * dM
                            }
                            else {
                                // HOMEOSTASIS: proportional controller toward target
                                const error = goal.targetValue - M
                                const targetCtrl = Math.max(-1, Math.min(1, error)) * particleLife.controlMax
                                newControl = control[indexA] + (targetCtrl - control[indexA]) * particleLife.controlGain
                            }
                            const cMax = particleLife.controlMax
                            if (newControl > cMax)
                                newControl = cMax
                            if (newControl < -cMax)
                                newControl = -cMax
                            control[indexA] = newControl
                            signal[indexA] = signal[indexA] * 0.85 + M * 0.15
                        }
                        else if (isNeuronA) {
                            const firing = Math.abs(drive)
                            signal[indexA] = signal[indexA] * 0.8 + firing * 0.2
                            control[indexA] = 0
                        }
                        else if (isSenseA) {
                            // Sense neuron: store the perception in signal (magnitude [0,1]) and control
                            // (bearing radians). Mirrors the GPU shaders' normalization exactly.
                            const numTypesF = numColors
                            const area = gridWidth * gridHeight
                            const numMatterApprox = Math.max(numParticles - numUrges - numNeurons - numSenseNeurons, 1)
                            // O(1) expected count of target-color matter in the full sense disk at baseline
                            const expectedCount = numMatterApprox * Math.PI * sR * sR / area / numTypesF
                            let newSignal = 0
                            let newControl = 0
                            if (senseModeLocal === 0) {
                                // SIGHT: fraction of the expected cone coverage that is occupied. No bearing.
                                const expectedInCone = expectedCount * (particleLife.senseConeHalfAngleDeg * Math.PI / 180) / Math.PI // (2*theta)/(2*PI)
                                newSignal = Math.min(1, Math.max(0, seenCount / Math.max(expectedInCone, 0.001)))
                                newControl = 0
                            }
                            else if (senseModeLocal === 1) {
                                // SMELL: strongest sector wins -> bearing to the nearest high-density cluster.
                                let bestScore = 0
                                let bestSector = 0
                                for (let sec = 0; sec < SENSE_SECTORS; sec++) {
                                    if (sectorScores![sec] > bestScore) { bestScore = sectorScores![sec]; bestSector = sec }
                                }
                                if (bestScore > 0.0001) { // global max ~0 -> nothing to smell, output stays zero
                                    newSignal = Math.min(1, Math.max(0, bestScore / Math.max(expectedCount / SENSE_SECTORS, 0.001)))
                                    newControl = (bestSector + 0.5) * (2 * Math.PI) / SENSE_SECTORS - Math.PI // sector center in [-PI, PI]
                                }
                            }
                            else {
                                // SOUND: bearing toward the centroid of sources + total loudness.
                                if (soundCount > 0) {
                                    newSignal = Math.min(1, Math.max(0, soundCount / Math.max(expectedCount, 0.001)))
                                    newControl = Math.atan2(soundVecY, soundVecX)
                                }
                            }
                            signal[indexA] = signal[indexA] * 0.75 + newSignal * 0.25 // smooth like other specials
                            control[indexA] = newControl
                        }
                    }
                }
            }
            cellCount.value = cells.size
        }

        function processRules3D() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < totalParticleCount; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []
                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        const neighborX = cellX + offsetX
                        const neighborY = cellY + offsetY
                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]
                    const posZA = positionZ[indexA]

                    let velocityXSum = 0; let velocityYSum = 0; let velocityZSum = 0

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB)
                                continue

                            const dx = positionX[indexB] - posXA
                            const dy = positionY[indexB] - posYA
                            const dz = positionZ[indexB] - posZA
                            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

                            const colorA = colors[indexA]
                            const colorB = colors[indexB]
                            // Electrical particles (urges/neurons) are 2D-only; skip them in the 3D force pass
                            if (colorA >= numColors || colorB >= numColors)
                                continue
                            const colorMaxRadius = maxRadiusMatrix[colorA][colorB]

                            // Apply force if the particles are close enough
                            if (distance < colorMaxRadius) {
                                const force = getForce(rulesMatrix[colorA][colorB], minRadiusMatrix[colorA][colorB], colorMaxRadius, distance)

                                velocityXSum += dx / distance * force
                                velocityYSum += dy / distance * force
                                velocityZSum += dz / distance * force
                            }
                        }
                    }
                    // Update the velocity of the particle
                    velocityX[indexA] += velocityXSum * forceFactor
                    velocityY[indexA] += velocityYSum * forceFactor
                    velocityZ[indexA] += velocityZSum * forceFactor
                }
            }
            cellCount.value = cells.size
        }
        function processRules3DWrapped() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < totalParticleCount; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell
            const lastCellsX = Math.floor(gridWidth / cellSize)
            const lastCellsY = Math.floor(gridHeight / cellSize)
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []

                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        let neighborX = cellX + offsetX
                        let neighborY = cellY + offsetY

                        if (neighborX < 0)
                            neighborX = lastCellsX
                        else if (neighborX > lastCellsX)
                            neighborX = 0
                        if (neighborY < 0)
                            neighborY = lastCellsY
                        else if (neighborY > lastCellsY)
                            neighborY = 0

                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]
                    const posZA = positionZ[indexA]

                    let velocityXSum = 0; let velocityYSum = 0; let velocityZSum = 0

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB)
                                continue

                            let dx = positionX[indexB] - posXA
                            let dy = positionY[indexB] - posYA
                            const dz = positionZ[indexB] - posZA

                            // Apply wrapping for X direction
                            if (dx > gridWidth / 2)
                                dx -= gridWidth
                            else if (dx < -gridWidth / 2)
                                dx += gridWidth
                            // Apply wrapping for Y direction
                            if (dy > gridHeight / 2)
                                dy -= gridHeight
                            else if (dy < -gridHeight / 2)
                                dy += gridHeight

                            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

                            const colorA = colors[indexA]
                            const colorB = colors[indexB]
                            // Electrical particles (urges/neurons) are 2D-only; skip them in the 3D force pass
                            if (colorA >= numColors || colorB >= numColors)
                                continue
                            const colorMaxRadius = maxRadiusMatrix[colorA][colorB]

                            // Apply force if the particles are close enough
                            if (distance < colorMaxRadius) {
                                const force = getForce(rulesMatrix[colorA][colorB], minRadiusMatrix[colorA][colorB], colorMaxRadius, distance)

                                velocityXSum += dx / distance * force
                                velocityYSum += dy / distance * force
                                velocityZSum += dz / distance * force
                            }
                        }
                    }
                    // Update the velocity of the particle
                    velocityX[indexA] += velocityXSum * forceFactor
                    velocityY[indexA] += velocityYSum * forceFactor
                    velocityZ[indexA] += velocityZSum * forceFactor
                }
            }
            cellCount.value = cells.size
        }
        // -------------------------------------------------------------------------------------------------------------
        let updateParticles: () => void
        function updateParticles2D() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            ctx!.fillStyle = backgroundColor
            ctx!.fillRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < totalParticleCount; i++) {
                velocityX[i] *= (1 - frictionFactor)
                velocityY[i] *= (1 - frictionFactor)
                positionX[i] += velocityX[i]
                positionY[i] += velocityY[i]

                // Bounce off the walls
                if (isWallRepel) {
                    if (wallShape === 0) { // Rectangle Shape
                        if (positionX[i] > gridWidth || positionX[i] < 0) {
                            positionX[i] -= velocityX[i]
                            velocityX[i] *= -wallRepelForce
                        }
                        if (positionY[i] > gridHeight || positionY[i] < 0) {
                            positionY[i] -= velocityY[i]
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                    else { // Circle Shape
                        const dx = positionX[i] - circleCenterX // X distance between the particle and the center of the circle
                        const dy = positionY[i] - circleCenterY // Y distance between the particle and the center of the circle
                        const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle

                        if (distanceSquared > circleRadius * circleRadius) {
                            positionX[i] -= velocityX[i]
                            positionY[i] -= velocityY[i]
                            velocityX[i] *= -wallRepelForce
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                }
                // Apply wrapping for the walls
                else if (isWallWrap) {
                    if (positionX[i] > gridWidth)
                        positionX[i] -= gridWidth
                    else if (positionX[i] < 0)
                        positionX[i] += gridWidth
                    if (positionY[i] > gridHeight)
                        positionY[i] -= gridHeight
                    else if (positionY[i] < 0)
                        positionY[i] += gridHeight
                }

                drawParticle(positionX[i], positionY[i], 0, getColorForType(colors[i]), particleSize)
            }
        }
        function updateParticles3D() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            ctx!.fillStyle = backgroundColor
            ctx!.fillRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < totalParticleCount; i++) {
                velocityX[i] *= (1 - frictionFactor)
                velocityY[i] *= (1 - frictionFactor)
                velocityZ[i] *= (1 - frictionFactor)
                positionX[i] += velocityX[i]
                positionY[i] += velocityY[i]
                positionZ[i] += velocityZ[i]

                // Bounce off the walls
                if (isWallRepel) {
                    if (wallShape === 0) { // Rectangle Shape
                        if (positionX[i] > gridWidth || positionX[i] < 0) {
                            positionX[i] -= velocityX[i]
                            velocityX[i] *= -wallRepelForce
                        }
                        if (positionY[i] > gridHeight || positionY[i] < 0) {
                            positionY[i] -= velocityY[i]
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                    else { // Circle Shape
                        const dx = positionX[i] - circleCenterX // X distance between the particle and the center of the circle
                        const dy = positionY[i] - circleCenterY // Y distance between the particle and the center of the circle
                        const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle

                        if (distanceSquared > circleRadius * circleRadius) {
                            positionX[i] -= velocityX[i]
                            positionY[i] -= velocityY[i]
                            velocityX[i] *= -wallRepelForce
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                }
                // Apply wrapping for the walls
                else if (isWallWrap) {
                    if (positionX[i] > gridWidth)
                        positionX[i] -= gridWidth
                    else if (positionX[i] < 0)
                        positionX[i] += gridWidth
                    if (positionY[i] > gridHeight)
                        positionY[i] -= gridHeight
                    else if (positionY[i] < 0)
                        positionY[i] += gridHeight
                }

                // Bounce off the depth limit
                if (positionZ[i] > depthLimit) {
                    positionZ[i] = depthLimit
                }
                else if (positionZ[i] < 0) {
                    positionZ[i] -= velocityZ[i] // or positionZ[i] = 0
                    velocityZ[i] *= -wallRepelForce
                }

                drawParticle(positionX[i], positionY[i], positionZ[i], getColorForType(colors[i]), particleSize)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function centerView() {
            const centerX = canvasWidth / 2 / zoomFactor - gridOffsetX
            const centerY = canvasHeight / 2 / zoomFactor - gridOffsetY
            const offsetX = gridWidth / 2 - centerX
            const offsetY = gridHeight / 2 - centerY
            gridOffsetX -= offsetX
            gridOffsetY -= offsetY
            setShapesProperties()
        }
        function simpleDrawParticles() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            ctx!.fillStyle = backgroundColor
            ctx!.fillRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < totalParticleCount; i++) {
                drawParticle(positionX[i], positionY[i], positionZ[i], getColorForType(colors[i]), particleSize)
            }
            if (hasGrid)
                drawGrid()
            if (hasCells || isBrushActive)
                assignParticlesToCells()
            if (hasCells)
                drawCells()
        }
        function drawGrid() {
            ctx!.beginPath()
            if (wallShape === 0) { // Rectangle Shape
                drawHorizontalLine(endGridX, startGridY) // Draw top line
                drawHorizontalLine(endGridX, endGridY) // Draw bottom line
                drawVerticalLine(startGridX, endGridY) // Draw left line
                drawVerticalLine(endGridX, endGridY) // Draw right line
            }
            else { // Circle Shape
                ctx!.arc((gridOffsetX + circleCenterX) * zoomFactor, (gridOffsetY + circleCenterY) * zoomFactor, circleRadius * zoomFactor + halfParticleSize, 0, Math.PI * 2)
            }
            ctx!.strokeStyle = 'rgba(32,32,38,1)'
            ctx!.lineWidth = 1
            ctx!.stroke()
        }
        function drawHorizontalLine(x: number, y: number) {
            ctx!.moveTo(startGridX, y)
            ctx!.lineTo(x, y)
        }
        function drawVerticalLine(x: number, y: number) {
            ctx!.moveTo(x, startGridY)
            ctx!.lineTo(x, y)
        }
        function drawBrush() {
            ctx!.beginPath()
            ctx!.arc(pointerX, pointerY, brushRadius * zoomFactor, 0, Math.PI * 2)
            ctx!.strokeStyle = 'rgb(23,37,84,0.4)'
            ctx!.lineWidth = 3
            ctx!.stroke()
        }
        function getParticlesInBrush(): number[] {
            // Detect cells within the brush radius
            const posX = (pointerX / zoomFactor) - gridOffsetX
            const posY = (pointerY / zoomFactor) - gridOffsetY
            const startCellX = Math.floor((posX - brushRadius) / cellSize)
            const startCellY = Math.floor((posY - brushRadius) / cellSize)
            const endCellX = Math.floor((posX + brushRadius) / cellSize)
            const endCellY = Math.floor((posY + brushRadius) / cellSize)

            const cellsInRadius = []
            for (let cellY = startCellY; cellY <= endCellY; cellY++) {
                for (let cellX = startCellX; cellX <= endCellX; cellX++) {
                    const cellKey = `${cellX},${cellY}`
                    if (cells.has(cellKey)) {
                        cellsInRadius.push(cellKey)
                    }
                }
            }
            // Detect particles within the brush radius
            const particlesInRadius: number[] = []
            for (let i = 0; i < cellsInRadius.length; i++) {
                const cellKey = cellsInRadius[i]
                const particles = cells.get(cellKey)

                for (let j = 0; j < particles!.length; j++) {
                    const index = particles![j]
                    const dx = positionX[index] - posX
                    const dy = positionY[index] - posY
                    if (dx * dx + dy * dy <= brushRadius * brushRadius) {
                        if (brushes.length > 0 && !brushes.includes(colors[index]))
                            continue
                        particlesInRadius.push(index)
                    }
                }
            }
            return particlesInRadius
        }
        function eraseWithBrush() {
            // Skip if brush is outside walls
            if (isBrushOutsideWalls())
                return

            // Remove particles within the brush radius
            removeParticleGroup(getParticlesInBrush())
        }
        function magnetWithBrush(magnetForce: number) {
            // Skip if brush is outside walls
            if (isBrushOutsideWalls())
                return

            const posX = (pointerX / zoomFactor) - gridOffsetX
            const posY = (pointerY / zoomFactor) - gridOffsetY

            const particlesInRadius = getParticlesInBrush()
            // Attract particles within the brush radius
            for (let i = 0; i < particlesInRadius.length; i++) {
                const index = particlesInRadius[i]
                const dx = posX - positionX[index]
                const dy = posY - positionY[index]
                const distance = Math.sqrt(dx * dx + dy * dy)

                const force = getForce(magnetForce, 0, brushRadius, distance)

                velocityX[index] += dx / distance * force * forceFactor
                velocityY[index] += dy / distance * force * forceFactor
            }
        }
        function drawWithBrush() {
            // Skip if brush is outside walls
            if (isBrushOutsideWalls())
                return

            const minZDepthRandomParticle = depthLimit * 0.2 // The minimum Z-depth for randomly placed particles, in percentage of the depthLimit
            const maxZDepthRandomParticle = depthLimit * 0.45 // The maximum Z-depth for randomly placed particles, in percentage of the depthLimit

            const newColors = new Int32Array(totalParticleCount + brushIntensity)
            const newPositionX = new Float32Array(totalParticleCount + brushIntensity)
            const newPositionY = new Float32Array(totalParticleCount + brushIntensity)
            const newPositionZ = new Float32Array(totalParticleCount + brushIntensity)
            const newVelocityX = new Float32Array(totalParticleCount + brushIntensity).fill(0)
            const newVelocityY = new Float32Array(totalParticleCount + brushIntensity).fill(0)
            const newVelocityZ = new Float32Array(totalParticleCount + brushIntensity).fill(0)

            newColors.set(colors, 0)
            newPositionX.set(positionX, 0)
            newPositionY.set(positionY, 0)
            newPositionZ.set(positionZ, 0)
            newVelocityX.set(velocityX, 0)
            newVelocityY.set(velocityY, 0)
            newVelocityZ.set(velocityZ, 0)

            for (let i = 0; i < brushIntensity; i++) {
                while (true) {
                    const x = Math.random() * 2 * brushRadius - brushRadius // Random X position within the brush radius
                    const y = Math.random() * 2 * brushRadius - brushRadius // Random Y position within the brush radius

                    if (x * x + y * y <= brushRadius * brushRadius) {
                        const posX = (pointerX / zoomFactor) - gridOffsetX + x // Adjust the X position based on the grid offset and the random X position
                        const posY = (pointerY / zoomFactor) - gridOffsetY + y // Adjust the Y position based on the grid offset and the random Y position
                        if (isWallRepel || isWallWrap) {
                            if (wallShape === 0) { // Rectangle Shape
                                if (posX > gridWidth || posX < 0 || posY > gridHeight || posY < 0) {
                                    continue // Skip if the particle is outside the rectangle
                                }
                            }
                            else { // Circle Shape
                                const dx = posX - circleCenterX // X distance between the particle and the center of the circle
                                const dy = posY - circleCenterY // Y distance between the particle and the center of the circle
                                const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle
                                if (distanceSquared > circleRadius * circleRadius) {
                                    continue // Skip if the particle is outside the circle
                                }
                            }
                        }
                        newPositionX[totalParticleCount + i] = posX
                        newPositionY[totalParticleCount + i] = posY
                        newPositionZ[totalParticleCount + i] = Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle

                        if (brushes.length > 0)
                            newColors[totalParticleCount + i] = brushes[Math.floor(Math.random() * brushes.length)]
                        else newColors[totalParticleCount + i] = Math.floor(Math.random() * numColors)

                        break // Exit the loop if the particle is placed successfully and move to the next particle
                    }
                }
            }

            colors = newColors
            positionX = newPositionX
            positionY = newPositionY
            positionZ = newPositionZ
            velocityX = newVelocityX
            velocityY = newVelocityY
            velocityZ = newVelocityZ
            // Also extend control/signal arrays for the new particles
            const newControl = new Float32Array(totalParticleCount + brushIntensity).fill(0)
            const newSignal = new Float32Array(totalParticleCount + brushIntensity).fill(0)
            newControl.set(control, 0)
            newSignal.set(signal, 0)
            control = newControl
            signal = newSignal

            numParticles += brushIntensity // matter count increased
            totalParticleCount += brushIntensity
            particleLife.numParticles = numParticles
        }
        function isBrushOutsideWalls() {
            if (isWallRepel || isWallWrap) {
                const posX = (pointerX / zoomFactor) - gridOffsetX
                const posY = (pointerY / zoomFactor) - gridOffsetY
                if (wallShape === 0) { // Rectangle Shape
                    if (posX > gridWidth || posX < 0 || posY > gridHeight || posY < 0) {
                        return true
                    }
                }
                else { // Circle Shape
                    const dx = posX - circleCenterX // X distance between the particle and the center of the circle
                    const dy = posY - circleCenterY // Y distance between the particle and the center of the circle
                    const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle
                    if (distanceSquared > circleRadius * circleRadius) {
                        return true
                    }
                }
            }
            return false // Within the walls or no walls
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function setGridSizeWhenWrapped() { // Set the grid size when the walls are wrapped
            particleLife.gridWidth = gridWidth = cellSize * Math.round(gridWidth / cellSize) - 4
            particleLife.gridHeight = gridHeight = cellSize * Math.round(gridHeight / cellSize) - 4
        }
        function setShapesProperties() {
            // Set the half particle size
            halfParticleSize = particleSize * zoomFactor / 2

            // Set the rectangle grid properties
            startGridX = gridOffsetX * zoomFactor - halfParticleSize // Start X position of the grid minus half particle size
            startGridY = gridOffsetY * zoomFactor - halfParticleSize // Start Y position of the grid minus half particle size
            endGridX = gridOffsetX * zoomFactor + gridWidth * zoomFactor + halfParticleSize // End X position of the grid plus half particle size
            endGridY = gridOffsetY * zoomFactor + gridHeight * zoomFactor + halfParticleSize // End Y position of the grid plus half particle size

            // Set the circle grid properties
            circleRadius = gridHeight / 2
            circleCenterX = gridWidth / 2
            circleCenterY = circleRadius
        }
        function updateGridWidth(newWidth: number | Event) {
            if (typeof (newWidth) !== 'number')
                return // Prevent input event like unfocus
            if (particleLife.linkProportions)
                particleLife.gridHeight = gridHeight = Math.round(gridHeight * (newWidth / gridWidth))
            particleLife.gridWidth = gridWidth = newWidth
            if (isWallWrap)
                setGridSizeWhenWrapped()
            setShapesProperties()
            initParticles()
            if (!isRunning)
                simpleDrawParticles()
        }
        function updateGridHeight(newHeight: number | Event) {
            if (typeof (newHeight) !== 'number')
                return // Prevent input event like unfocus
            if (particleLife.linkProportions)
                particleLife.gridWidth = gridWidth = Math.round(gridWidth * (newHeight / gridHeight))
            particleLife.gridHeight = gridHeight = newHeight
            if (isWallWrap)
                setGridSizeWhenWrapped()
            setShapesProperties()
            initParticles()
            if (!isRunning)
                simpleDrawParticles()
        }
        function setGridSizeBasedOnScreen() {
            particleLife.gridWidth = gridWidth = Math.floor(canvasWidth * screenMultiplierForGridSize)
            particleLife.gridHeight = gridHeight = Math.floor(canvasHeight * screenMultiplierForGridSize)
            // zoomFactor = 1 / screenMultiplierForGridSize
            centerView()
        }
        function updateScreenMultiplier(multiplier: number) {
            screenMultiplierForGridSize = multiplier
            setGridSizeBasedOnScreen()
            if (isWallWrap)
                setGridSizeWhenWrapped()
            setShapesProperties()
            initParticles()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function assignParticlesToCells() {
            cells = new Map<string, number[]>()
            for (let i = 0; i < totalParticleCount; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }
        }
        function removeParticleGroup(particles: number[]) {
            const newSize = totalParticleCount - particles.length
            const newColors = new Int32Array(newSize)
            const newPositionX = new Float32Array(newSize)
            const newPositionY = new Float32Array(newSize)
            const newPositionZ = new Float32Array(newSize)
            const newVelocityX = new Float32Array(newSize)
            const newVelocityY = new Float32Array(newSize)
            const newVelocityZ = new Float32Array(newSize)

            const newControl = new Float32Array(newSize)
            const newSignal = new Float32Array(newSize)

            particles.sort((a: any, b: any) => a - b) // Sort the indexes in ascending order
            for (let i = 0, j = 0, k = 0; i < totalParticleCount; i++) {
                if (k < particles.length && i === particles[k]) {
                    k++ // Skip the particle if it is within the brush radius
                }
                else {
                    newColors[j] = colors[i]
                    newPositionX[j] = positionX[i]
                    newPositionY[j] = positionY[i]
                    newPositionZ[j] = positionZ[i]
                    newVelocityX[j] = velocityX[i]
                    newVelocityY[j] = velocityY[i]
                    newVelocityZ[j] = velocityZ[i]
                    newControl[j] = control[i]
                    newSignal[j] = signal[i]
                    j++
                }
            }

            colors = newColors
            positionX = newPositionX
            positionY = newPositionY
            positionZ = newPositionZ
            velocityX = newVelocityX
            velocityY = newVelocityY
            velocityZ = newVelocityZ
            control = newControl
            signal = newSignal

            totalParticleCount = newSize
        }
        function updateNumParticles(newMatterCount: number) {
            if (newMatterCount === numParticles)
                return // Skip if matter count unchanged
            numParticles = newMatterCount
            initParticles() // Rebuild arrays with the new matter + electrical layout
            if (!isRunning)
                simpleDrawParticles()
        }
        const setNewNumTypes = (newNumTypes: number) => {
            NEW_NUM_TYPES = newNumTypes
            isUpdateNumTypesPending = true
        }
        const updateNumColors = (newNumColors: number) => {
            if (isUpdatingParticles || newNumColors === numColors) {
                isUpdateNumTypesPending = false
                return
            }
            isUpdatingParticles = true

            try {
                const oldNumTypes = numColors
                const oldMatrixSize = oldNumTypes + MATRIX_EXTRA_TYPES
                const newMatrixSize = newNumColors + MATRIX_EXTRA_TYPES
                adjustColors(currentColors, oldNumTypes, newNumColors)
                adjustParticleTypes(oldNumTypes, newNumColors)
                numColors = newNumColors
                particleLife.numColors = numColors

                setRulesMatrix(resizeMatrix(rulesMatrix, oldMatrixSize, newMatrixSize, () => {
                    return Math.round((Math.random() * 2 - 1) * 100) / 100
                }))
                setMinRadiusMatrix(resizeMatrix(minRadiusMatrix, oldMatrixSize, newMatrixSize, () => {
                    return Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                }))
                setMaxRadiusMatrix(resizeMatrix(maxRadiusMatrix, oldMatrixSize, newMatrixSize, () => {
                    return Math.floor(Math.random() * (particleLife.maxRadiusRange[1] - particleLife.maxRadiusRange[0] + 1) + particleLife.maxRadiusRange[0])
                }))
            }
            finally {
                isUpdatingParticles = false
                isUpdateNumTypesPending = NEW_NUM_TYPES !== numColors
                initParticles() // Reassign types (urge/neuron codes depend on numColors)
                if (!isRunning)
                    simpleDrawParticles() // Redraw the particles if the game is not running
            }
        }
        const loadPreset = async (options: { presetRules?: number[][], presetMinRadius?: number[][], presetMaxRadius?: number[][], presetColors?: number[][] }, presetTypeCount: number, matchPresetCount: boolean) => {
            const { presetRules, presetMinRadius, presetMaxRadius, presetColors } = options

            if (isUpdatingParticles || presetTypeCount === 0)
                return
            isUpdatingParticles = true

            try {
                const oldNumTypes = numColors
                const newNumTypes = presetTypeCount
                const oldPresetMatrixSize = oldNumTypes + MATRIX_EXTRA_TYPES
                const newPresetMatrixSize = newNumTypes + MATRIX_EXTRA_TYPES

                if (!matchPresetCount) {
                    const typesToUpdate = Math.min(numColors, newNumTypes)
                    if (presetColors)
                        await adjustColors(presetColors, numColors, typesToUpdate, true) // Update only the colors that fit within the current NUM_TYPES
                    if (presetRules)
                        setRulesMatrix(applyPresetSubMatrix(rulesMatrix, presetRules, numColors, typesToUpdate))
                    if (presetMinRadius)
                        setMinRadiusMatrix(applyPresetSubMatrix(minRadiusMatrix, presetMinRadius, numColors, typesToUpdate))
                    if (presetMaxRadius)
                        setMaxRadiusMatrix(applyPresetSubMatrix(maxRadiusMatrix, presetMaxRadius, numColors, typesToUpdate))
                }
                else {
                    if (presetColors) {
                        setColors(presetColors)
                    }
                    else if (newNumTypes !== oldNumTypes) {
                        await adjustColors(currentColors, oldNumTypes, newNumTypes)
                    }

                    if (newNumTypes !== oldNumTypes) {
                        await adjustParticleTypes(oldNumTypes, newNumTypes)

                        numColors = newNumTypes
                        particleLife.numColors = numColors

                        if (presetRules) {
                            setRulesMatrix(presetRules)
                        }
                        else {
                            setRulesMatrix(resizeMatrix(rulesMatrix, oldPresetMatrixSize, newPresetMatrixSize, () => {
                                return Math.round((Math.random() * 2 - 1) * 100) / 100
                            }))
                        }
                        if (presetMinRadius) {
                            setMinRadiusMatrix(presetMinRadius)
                        }
                        else {
                            setMinRadiusMatrix(resizeMatrix(minRadiusMatrix, oldPresetMatrixSize, newPresetMatrixSize, () => {
                                return Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                            }))
                        }
                        if (presetMaxRadius) {
                            setMaxRadiusMatrix(presetMaxRadius)
                        }
                        else {
                            setMaxRadiusMatrix(resizeMatrix(maxRadiusMatrix, oldPresetMatrixSize, newPresetMatrixSize, () => {
                                return Math.floor(Math.random() * (particleLife.maxRadiusRange[1] - particleLife.maxRadiusRange[0] + 1) + particleLife.maxRadiusRange[0])
                            }))
                        }
                    }
                    else {
                        if (presetRules)
                            setRulesMatrix(presetRules)
                        if (presetMinRadius)
                            setMinRadiusMatrix(presetMinRadius)
                        if (presetMaxRadius)
                            setMaxRadiusMatrix(presetMaxRadius)
                    }
                }
            }
            finally {
                isUpdatingParticles = false
                if (!isRunning)
                    simpleDrawParticles() // Redraw the particles if the game is not running
                success("Preset loaded.")
            }
        }
        const adjustColors = async (oldColors: number[][], oldNumTypes: number, newNumTypes: number, keepExtraColors: boolean = false) => {
            let newColors: number[][] = new Array(keepExtraColors ? oldNumTypes : newNumTypes)
            if (keepExtraColors)
                newColors = [...currentColors]

            for (let i = 0; i < newNumTypes; i++) {
                newColors[i] = oldColors[i] ? [...oldColors[i]] : getRandomHslColor()
            }
            setColors(newColors)
        }
        const adjustParticleTypes = async (oldNumTypes: number, newNumTypes: number) => {
            if (newNumTypes < oldNumTypes) {
                for (let i = 0; i < totalParticleCount; i++) {
                    // Only reassign matter particles (colors < oldNumTypes)
                    if (colors[i] >= newNumTypes && colors[i] < oldNumTypes) {
                        colors[i] = Math.floor(Math.random() * newNumTypes)
                    }
                }
            }
            else if (newNumTypes > oldNumTypes) {
                for (let i = 0; i < totalParticleCount; i++) {
                    // Only matter particles can be reassigned to new colors
                    if (colors[i] < oldNumTypes && Math.random() < (newNumTypes - oldNumTypes) / newNumTypes) {
                        colors[i] = oldNumTypes + Math.floor(Math.random() * (newNumTypes - oldNumTypes))
                    }
                }
            }
        }
        const resizeMatrix = (matrix: number[][], oldNumTypes: number, newNumTypes: number, randomFn: () => number) => {
            const newMatrix: number[][] = []
            for (let i = 0; i < newNumTypes; i++) {
                const row: number[] = []
                for (let j = 0; j < newNumTypes; j++) {
                    if (i < oldNumTypes && j < oldNumTypes) {
                        row.push(matrix[i][j])
                    }
                    else {
                        row.push(randomFn())
                    }
                }
                newMatrix.push(row)
            }
            return newMatrix
        }
        const applyPresetSubMatrix = (current: number[][], preset: number[][], numTypes: number, typesToUpdate: number): number[][] => {
            const result = current.map(row => row.slice())
            for (let i = 0; i < numTypes; i++) {
                for (let j = 0; j < numTypes; j++) {
                    if (i < typesToUpdate && j < typesToUpdate) {
                        result[i][j] = preset[i][j]
                    }
                }
            }
            return result
        }
        // -------------------------------------------------------------------------------------------------------------
        function setColors(newColors: number[][]) {
            currentColors = newColors
            particleLife.currentColors = currentColors
            particleLife.brushes = []
        }
        function updateSingleColor(colorId: number, hex: string) {
            const rgb = hexToRgb(hex)
            if (!rgb)
                return
            const [h, s, l] = rgbFloatToHsl(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
            currentColors[colorId] = [h, s, l]
            particleLife.currentColors = [...currentColors]
            if (!isRunning)
                simpleDrawParticles()
        }
        function setRulesMatrix(newRules: number[][]) {
            rulesMatrix = newRules
            particleLife.rulesMatrix = rulesMatrix
        }
        function setMaxRadiusMatrix(newMaxRadius: number[][]) {
            maxRadiusMatrix = newMaxRadius
            particleLife.maxRadiusMatrix = maxRadiusMatrix
            setCurrentMaxRadius(getCurrentMaxRadius())
        }
        function setMinRadiusMatrix(newMinRadius: number[][]) {
            minRadiusMatrix = newMinRadius
            particleLife.minRadiusMatrix = minRadiusMatrix
            // currentMinRadius = minRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity)
        }
        function updateRulesMatrixValue(x: number, y: number, value: number) {
            const roundedValue = Math.round(value * 100) / 100
            particleLife.rulesMatrix[x][y] = roundedValue
            rulesMatrix[x][y] = roundedValue
        }
        function updateMinMatrixValue(x: number, y: number, value: number) {
            particleLife.minRadiusMatrix[x][y] = value
            minRadiusMatrix[x][y] = value
            if (value > particleLife.maxRadiusMatrix[x][y]) {
                particleLife.maxRadiusMatrix[x][y] = value
                maxRadiusMatrix[x][y] = value
                setCurrentMaxRadius(getCurrentMaxRadius())
            }
            // currentMinRadius = minRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity)
        }
        function updateMaxMatrixValue(x: number, y: number, value: number) {
            particleLife.maxRadiusMatrix[x][y] = value
            maxRadiusMatrix[x][y] = value
            setCurrentMaxRadius(getCurrentMaxRadius())

            if (value < particleLife.minRadiusMatrix[x][y]) {
                particleLife.minRadiusMatrix[x][y] = value
                minRadiusMatrix[x][y] = value
                // currentMinRadius = minRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity)
            }
        }
        const getRandomHslColor = (): number[] => {
            const h = Math.floor(Math.random() * 360)
            const s = Math.floor(Math.random() * 70 + 20)
            const l = Math.floor(Math.random() * 50 + 30)
            return [h, s, l]
        }
        // -------------------------------------------------------------------------------------------------------------
        const getCurrentMaxRadius = () => {
            let maxRandom = 0
            for (let i = 0; i < numColors; i++) {
                for (let j = 0; j < numColors; j++) {
                    if (maxRadiusMatrix[i][j] > maxRandom)
                        maxRandom = maxRadiusMatrix[i][j]
                }
            }
            return maxRandom
            // return maxRadiusMatrix.reduce((max, row) => Math.max(max, ...row), -Infinity)
        }
        const setCurrentMaxRadius = (value: number) => {
            if (currentMaxRadius === value)
                return
            currentMaxRadius = value
            particleLife.currentMaxRadius = value
            // Cell size must cover the largest interaction radius (matter OR electrical)
            // The cell grid must cover the LARGEST interaction radius in play (incl. the sense disk),
            // or the neighbor scan clips to the square window and senses miss distant matter.
            const effectiveMax = Math.max(currentMaxRadius, particleLife.isElectricalEnabled ? Math.max(particleLife.urgeRadius, particleLife.neuronRadius, particleLife.senseRadius) : 0)
            cellSize = effectiveMax * cellSizeFactor
            if (isWallWrap) {
                setGridSizeWhenWrapped()
                setShapesProperties()
            }
            if (!isRunning)
                simpleDrawParticles()
        }
        // -------------------------------------------------------------------------------------------------------------
        function toggleCaptureMode(type: string) {
            if (type === particleLife.captureType) {
                particleLife.isShareOptionsOpen = !particleLife.isShareOptionsOpen
            }
            else {
                particleLife.isShareOptionsOpen = true
                particleLife.captureType = type
            }
        }
        function getSelectedAreaImageData(x: number, y: number, width: number, height: number) {
            return ctx!.getImageData(x, y, width, height)
        }
        function captureFrame() {
            shareOptions.value.captureOverlay.captureFrame(ctx)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function watchAndDraw(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                if (!isRunning)
                    simpleDrawParticles()
            })
        }
        watch(() => particleLife.isCapturingGIF, value => isCapturingGIF = value)
        watch(() => particleLife.numParticles, value => updateNumParticles(value))
        // watch(() => particleLife.numColors, (value) => updateNumColors(value))
        watch(() => particleLife.depthLimit, (value: number) => depthLimit = value)
        watch(() => particleLife.brushes, (value: number[]) => brushes = value)
        watch(() => particleLife.brushRadius, value => brushRadius = value)
        watch(() => particleLife.brushIntensity, value => brushIntensity = value)
        watch(() => particleLife.brushType, (value: number) => brushType = value)
        watch(() => particleLife.attractForce, (value: number) => attractForce = value)
        watch(() => particleLife.repulseForce, (value: number) => repulseForce = -Math.abs(value))
        watchAndDraw(() => particleLife.is3D, () => setAlgorithms())
        watchAndDraw(() => particleLife.isRunning, (value: boolean) => isRunning = value)
        watchAndDraw(() => particleLife.isBrushActive, (value: boolean) => isBrushActive = value)
        watchAndDraw(() => particleLife.particleSize, (value: number) => particleSize = value)
        watchAndDraw(() => particleLife.isWallRepel, (value: boolean) => {
            isWallRepel = value
            if (isWallRepel)
                particleLife.isWallWrap = false
            particleLife.hasGrid = isWallRepel || isWallWrap
        })
        watchAndDraw(() => particleLife.isWallWrap, (value: boolean) => {
            isWallWrap = value
            if (isWallWrap) {
                particleLife.isWallRepel = false
                particleLife.wallShape = 0
                setGridSizeWhenWrapped()
                setShapesProperties()
            }
            particleLife.hasGrid = isWallRepel || isWallWrap
            setAlgorithms()
        })
        watchAndDraw(() => particleLife.wallShape, (value: number) => {
            wallShape = value
            initParticles()
        })
        watchAndDraw(() => particleLife.cellShape, (value: number) => cellShape = value)
        watchAndDraw(() => particleLife.screenMultiplierForGridSize, (value: number) => updateScreenMultiplier(value))
        watchAndDraw(() => particleLife.hasGrid, (value: boolean) => hasGrid = value)
        watchAndDraw(() => particleLife.hasCells, (value: boolean) => hasCells = value)
        watchAndDraw(() => particleLife.isCellFollow, (value: boolean) => isCellFollow = value)
        watchAndDraw(() => particleLife.isCircle, (value: boolean) => isCircle = value)
        watchAndDraw(() => particleLife.hasDepthSize, (value: boolean) => hasDepthSize = value)
        watchAndDraw(() => particleLife.hasDepthOpacity, (value: boolean) => hasDepthOpacity = value)
        watchAndDraw(() => particleLife.minOpacity, (value: number) => minOpacity = value)
        watchAndDraw(() => particleLife.maxOpacity, (value: number) => maxOpacity = value)
        watchAndDraw(() => particleLife.cellGroupSize, (value: number) => cellGroupSize = value)
        watchAndDraw(() => particleLife.repel, (value: number) => repel = value)
        watchAndDraw(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndDraw(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)
        watchAndDraw(() => particleLife.cellSizeFactor, (value: number) => {
            cellSizeFactor = value
            cellSize = currentMaxRadius * cellSizeFactor // Update the cell size
        })
        // ---- Electrical layer watchers ----
        watch(() => particleLife.numUrges, () => {
            numUrges = particleLife.numUrges
            initParticles()
            if (!isRunning)
                simpleDrawParticles()
        })
        watch(() => particleLife.numNeurons, () => {
            numNeurons = particleLife.numNeurons
            initParticles()
            if (!isRunning)
                simpleDrawParticles()
        })
        watch(() => particleLife.numSenseNeurons, () => {
            numSenseNeurons = particleLife.numSenseNeurons
            initParticles()
            if (!isRunning)
                simpleDrawParticles()
        })
        watch(() => particleLife.isElectricalEnabled, () => {
            initParticles()
            setCurrentMaxRadius(currentMaxRadius) // recompute cell size
            if (!isRunning)
                simpleDrawParticles()
        })
        watch(() => particleLife.urgeRadius, () => {
            if (particleLife.isElectricalEnabled)
                setCurrentMaxRadius(currentMaxRadius)
        })
        watch(() => particleLife.neuronRadius, () => {
            if (particleLife.isElectricalEnabled)
                setCurrentMaxRadius(currentMaxRadius)
        })
        watch(() => particleLife.senseRadius, () => {
            if (particleLife.isElectricalEnabled)
                setCurrentMaxRadius(currentMaxRadius)
        })

        // ---- Urge Inspector state ----
        const urgeInspectorOpen = ref(false)
        const selectedUrgeId = ref(-1)
        const urgeStats = ref<any[]>([])
        let prevUrgeValues = new Map<number, { control: number, signal: number }>()

        // Read urge stats from CPU state (direct array access — no GPU readback needed)
        const readUrgeStats = () => {
            if (!urgeInspectorOpen.value)
                return
            if (!particleLife.isElectricalEnabled || numUrges <= 0) {
                if (urgeStats.value.length !== 0)
                    urgeStats.value = []
                prevUrgeValues.clear()
                return
            }

            const matterCount = numParticles
            const next: any[] = []
            for (let k = 0; k < numUrges; k++) {
                const idx = matterCount + k
                const stat = {
                    id: k,
                    type: numColors + k,
                    targetColor: k % numColors,
                    control: control[idx],
                    signal: signal[idx],
                    trendControl: 0,
                    trendSignal: 0,
                }
                const prev = prevUrgeValues.get(k)
                if (prev) {
                    stat.trendControl = stat.control - prev.control
                    stat.trendSignal = stat.signal - prev.signal
                }
                next.push(stat)
            }

            const newPrev = new Map<number, { control: number, signal: number }>()
            for (const s of next) {
                newPrev.set(s.id, { control: s.control, signal: s.signal })
            }
            prevUrgeValues = newPrev
            urgeStats.value = next
        }

        // Throttled readback every 500ms while inspector is open
        let urgeReadbackInterval: ReturnType<typeof setInterval> | null = null
        watch(urgeInspectorOpen, (open) => {
            if (open) {
                urgeReadbackInterval = setInterval(readUrgeStats, 500)
                readUrgeStats() // immediate first read
            }
            else {
                if (urgeReadbackInterval) { clearInterval(urgeReadbackInterval); urgeReadbackInterval = null }
            }
        })
        onUnmounted(() => {
            if (urgeReadbackInterval)
                clearInterval(urgeReadbackInterval)
        })

        // Electrical params snapshot for the inspector card
        const electricalParams = computed(() => ({
            metricMode: particleLife.metricMode,
            urgeRadius: particleLife.urgeRadius,
            neuronRadius: particleLife.neuronRadius,
            urgeForce: particleLife.urgeForce,
            controlGain: particleLife.controlGain,
            controlMax: particleLife.controlMax,
            neuronInfluence: 0,
            neuronAuthority: 0,
            maxAuthority: 0,
            cohesion: particleLife.cohesion,
        }))

        // Color strings for the inspector (HSL → CSS string)
        const colorRgbStrings = computed(() => {
            return currentColors.map(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`)
        })

        // Objective label for each urge (mirrors the shader's goal logic)
        const objectiveLabelFor = (k: number): string => {
            const g = urgeGoalFor(k)
            const n = (k % numColors) + 1
            const modeName = ['maximize', 'minimize', 'homeostasis'][g.mode]
            const targetStr = g.mode === 2 ? ` @ ${g.targetValue.toFixed(2)}` : ''
            return `${modeName} density of Color ${n}${targetStr}`
        }

        watch(() => particleLife.isLockedPointer, (value) => {
            const sidebarLeftElement = document.getElementById('sidebarLeft')
            if (sidebarLeftElement) {
                if (value) {
                    sidebarLeftElement.classList.add('force-hover-effect')
                }
                else {
                    sidebarLeftElement.classList.remove('force-hover-effect')
                }
            }
        })
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
            particleLife.$reset()
        })

        return {
            lifeCanvas,
            particleLife,
            toggleFullscreen,
            isFullscreen,
            toggleCaptureMode,
            getSelectedAreaImageData,
            fps,
            cellCount,
            executionTime,
            step,
            newRandomRulesMatrix,
            handleZoom,
            updateGridWidth,
            updateGridHeight,
            updateRulesMatrixValue,
            updateMinMatrixValue,
            updateMaxMatrixValue,
            regenerateLife,
            shareOptions,
            rulesOptions,
            paletteOptions,
            updateColors,
            updateRulesMatrix,
            loadPreset,
            setNewNumTypes,
            updateSingleColor,
            randomizeRadius,
            randomizeRulesAndRadius,
            urgeInspectorOpen,
            selectedUrgeId,
            urgeStats,
            electricalParams,
            colorRgbStrings,
            objectiveLabelFor,
        }
    },
})
</script>

<style scoped>
canvas {
    background: black;
}
</style>
