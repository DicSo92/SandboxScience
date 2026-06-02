<template>
    <section h-screen flex flex-col justify-center overflow-hidden relative ref="mainContainer" id="mainContainer">
        <SidebarLeft v-model="particleLife.sidebarLeftOpen">
            <template #controls>
            </template>
            <template #default>
                <div h-full px-2 flex flex-col>
                    <div flex justify-between items-end mb-1.5 px-1>
                        <div flex items-center>
                            <div i-lets-icons-bubble text-2xl mr-2 class="text-[#2a9d8f] -mt-0.5"></div>
                            <h1 font-800 text-lg tracking-widest class="text-[#dff6f3] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Particle Life</h1>
                            <p class="ml-2 px-2 py-0.5 rounded-lg ring-1 uppercase justify-center font-mono font-bold bg-fuchsia-600/20 text-fuchsia-400 ring-fuchsia-500/30">
                                GPU
                            </p>
                            <p ml-1.5 px-2 py-0.5 rounded-lg ring-1 uppercase justify-center font-mono font-bold class="bg-cyan-600/20 text-cyan-400 ring-cyan-500/30">
                                2D
                            </p>
                        </div>
                        <button @click="switchTo3D" px-2 h-full rounded-lg flex items-center font-semibold class="bg-amber-500/15 hover:bg-amber-500/25 transition-all ring-1 ring-amber-300/45 text-amber-100" title="Switch to 3D version">
                            <span class="i-tabler-cube text-sm mr-0.75"></span>
                            <span class="-mb-px text-xs">Try 3D</span>
                        </button>
<!--                        <ToggleSwitch inactive-label="2D" label="3D" colorful-label v-model="particleLife.is3D" />-->
                    </div>
                    <hr border-slate-500>
                    <div overflow-auto flex-1 flex flex-col gap-2 mt-2 pb-12 class="scrollableArea">
                        <Collapse label="Presets" icon="i-tabler-sparkles text-amber-500"
                                  tooltip="Choose predefined configurations to quickly set up your simulation.">
                            <PresetPanel :store="particleLife"
                                         @updateColors="updateColors"
                                         @updateRulesMatrix="updateRulesMatrix"
                                         @updateParticlePositions="updateParticlePositions"
                                         @loadPreset="loadPreset">
                            </PresetPanel>
                        </Collapse>
                        <Collapse label="Matrix Settings" icon="i-tabler-grid-4x4 text-indigo-500"
                                  tooltip="Modify matrix values by clicking on cells in the grid. <br>
                                  Adjust individual cell values with the slider, or click and drag to change them directly. <br>
                                  Use Ctrl + Click to select multiple cells for group adjustments. <br>
                                  If no cells are selected, the slider will adjust all values.">
                            <MatrixSettings :store="particleLife"
                                            @updateRulesMatrix="updateRulesMatrixValue"
                                            @randomRulesMatrix="newRandomRulesMatrix"
                                            @updateMinMatrix="updateMinMatrixValue"
                                            @updateMaxMatrix="updateMaxMatrixValue"
                                            @updateColor="updateSingleColor">
                            </MatrixSettings>
                        </Collapse>
                        <Collapse label="Randomizer Settings" icon="i-game-icons-perspective-dice-six-faces-random text-teal-500"
                                  tooltip="Adjust the parameters for randomizing particle attributes. <br> Configure the ranges for minimum and maximum interaction radii.">
                            <RadiusVisualizer v-model:min-radius-range="particleLife.minRadiusRange"
                                              v-model:max-radius-range="particleLife.maxRadiusRange"
                                              @randomize-radius="randomizeRadius"
                                              @randomize-rules-and-radius="randomizeRulesAndRadius"
                                              @randomize-all="regenerateLife">
                            </RadiusVisualizer>
                        </Collapse>
                        <Collapse label="World Settings" icon="i-tabler-world-cog text-cyan-500" opened>
                            <RangeInput input label="Particle Count"
                                        tooltip="Adjust the total number of particles. <br> More particles may reveal complex interactions but can increase computational demand."
                                        :min="16" :max="1048576" :step="16" v-model="particleLife.numParticles" @update:modelValue="setNewNumParticles">
                            </RangeInput>
                            <RangeInput input label="Species Count"
                                        tooltip="Specify the number of particle colors. <br> Each color interacts with all others, with distinct forces and interaction ranges."
                                        :min="1" :max="16" :step="1" v-model="particleLife.numColors" @update:modelValue="setNewNumTypes" mt-2>
                            </RangeInput>
                            <div flex items-center class="mt-0.5">
                                <p class="w-2/3 text-2sm mt-1">
                                    World Size
                                    <TooltipInfo container="#mainContainer" tooltip="Adjust the size of the area where particles are contained." />
                                </p>
                                <Input label="x" v-model="particleLife.simWidth" @change="updateSimWidth" mr-2 />
                                <Input label="y" v-model="particleLife.simHeight" @change="updateSimHeight" mr-2 />
                                <button type="button" btn rounded-full p2 flex items-center bg="slate-950/90 hover:slate-950/50" @click="particleLife.linkProportions = !particleLife.linkProportions">
                                    <span :class="particleLife.linkProportions ? 'i-tabler-link' : 'i-tabler-unlink'" text-sm></span>
                                </button>
                            </div>

                            <hr border-gray-500 mt-1 mb-2>
                            <p underline text-gray-300 class="-mt-0.5" mb-2>Boundary Settings :</p>

                            <OptionBar name="wallStateGpu" v-model="particleLife.wallState" mb-2 :options="[
                                { id: 'none', label: 'None' },
                                { id: 'repel', label: 'Repel' },
                                { id: 'wrap', label: 'Wrap' }]">
                            </OptionBar>

                            <div flex justify-around mb-1>
                                <div class="w-2/3 text-2sm mt-1">
                                    Wrapping Mode
                                    <TooltipInfo container="#mainContainer" tooltip="Wrapping render modes : <br> <small><u>Normal:</u> Simple wrap. <br> <u>Edges:</u> Wrap + finite grayscale edge tiling. <br> <u>Infinite:</u> wrap + tiles fill the viewport (higher GPU cost).</small>" />
                                </div>
                                <WrapModeSelection :store="particleLife" />
                            </div>
                            <div flex justify-between>
                                <div class="w-2/3 text-2sm mt-1">
                                    Edges Tiling
                                    <TooltipInfo container="#mainContainer" tooltip="Sets neighbor tiles count for Edges mode (grayscale)." />
                                </div>
                                <div flex>
                                    <SelectButton :id="5" label="Cross 5" v-model="particleLife.mirrorWrapCount" :disabled="!particleLife.isMirrorWrap" mr-2 />
                                    <SelectButton :id="9" label="3x3" v-model="particleLife.mirrorWrapCount" :disabled="!particleLife.isMirrorWrap" />
                                </div>
                            </div>
                        </Collapse>
                        <Collapse label="Physics Settings" icon="i-tabler-atom text-fuchsia-500" opened>
                            <RangeInput input label="Repel Force"
                                        tooltip="Adjust the force that repels particles from each other. <br> Higher values increase the separation distance."
                                        :min="0.01" :max="4" :step="0.01" v-model="particleLife.repel">
                            </RangeInput>
                            <RangeInput input label="Force Multiplier"
                                        tooltip="Scales the interaction forces between particles. <br> Higher values make forces stronger and particles move faster."
                                        :min="0.01" :max="2" :step="0.01" v-model="particleLife.forceFactor" mt-2>
                            </RangeInput>
                            <RangeInput input label="Friction"
                                        tooltip="Controls how much friction slows particles down. <br> Higher values reduce speed and help stabilize the system."
                                        :min="0" :max="1" :step="0.01" v-model="particleLife.frictionFactor" mt-2>
                            </RangeInput>
                        </Collapse>
                        <Collapse label="Graphics Settings" icon="i-tabler-photo-cog text-emerald-500">
                            <RangeInput input label="Particle Size"
                                        tooltip="Controls the overall size of the particles in the simulation, allowing you to make them larger or smaller depending on your preference. This setting does not impact performance."
                                        :min="0.1" :max="6" :step="0.1" v-model="particleLife.particleSize">
                            </RangeInput>
                            <RangeInput input label="Particle Opacity"
                                        tooltip="Adjust the opacity of the particles in the simulation. <br> This setting allows you to control how transparent or opaque the particles appear."
                                        :min="0" :max="1" :step="0.01" v-model="particleLife.particleOpacity" mt-2>
                            </RangeInput>
                            <div flex justify-between mt-1>
                                <div class="w-2/3 text-2sm mt-1">
                                    Particle Blending
                                    <TooltipInfo container="#mainContainer" tooltip="Particle blending modes. <br> <small><u>Normal:</u> Alpha blend (standard colors). <br> <u>Additive:</u> Adds color values. Overlaps accumulate brightness (glow-like).</small>" />
                                </div>
                                <div flex>
                                    <SelectButton :id="false" label="Normal" v-model="particleLife.isAdditiveBlending" mr-2 />
                                    <SelectButton :id="true" label="Additive" v-model="particleLife.isAdditiveBlending" />
                                </div>
                            </div>

                            <hr border-gray-500 my-2>
                            <div flex items-start justify-between mb-2>
                                <p underline text-gray-300 mb-1>Glow Settings :</p>
                                <ToggleSwitch label="Particle Glowing" colorful-label v-model="particleLife.isParticleGlow" />
                            </div>

                            <RangeInput input label="Glow Size"
                                        tooltip="Adjust the size of the glow effect around particles."
                                        :min="0" :max="32" :step="0.1" v-model="particleLife.glowSize" mt-2>
                            </RangeInput>
                            <RangeInput input label="Glow Intensity"
                                        tooltip="Adjust the intensity of the glow effect around particles."
                                        :min="0" :max="0.5" :step="0.005" v-model="particleLife.glowIntensity" mt-2>
                            </RangeInput>
                            <RangeInput input label="Glow Steepness"
                                        tooltip="Adjust the steepness of the glow effect around particles. <br> Higher values create a sharper transition between glowing and non-glowing areas."
                                        :min="0" :max="12" :step="1" v-model="particleLife.glowSteepness" mt-2>
                            </RangeInput>
                        </Collapse>
                        <Collapse label="Camera Settings" icon="i-tabler-camera-cog text-violet-500">
                            <RangeInput input label="Zoom Smoothing"
                                        tooltip="Adjusts the smoothness of the zoom. <br> Lower values result in a slower, more fluid zoom, while higher values make it faster and more abrupt."
                                        :min="0.01" :max="0.5" :step="0.01" v-model="particleLife.zoomSmoothing">
                            </RangeInput>
                            <RangeInput input label="Pan Smoothing"
                                        tooltip="Adjusts the smoothness of camera panning. <br> Lower values create more inertia for a gliding effect, while higher values make the movement stop more abruptly."
                                        :min="0.01" :max="0.5" :step="0.01" v-model="particleLife.panSmoothing" mt-2>
                            </RangeInput>

                            <hr border-gray-500 my-2>
                            <div flex items-center justify-between>
                                <p underline text-gray-300>Cinematic Mode :</p>
                                <button btn px-3 py-1 text-xs rounded-full font-medium flex items-center ring-1 transition-all relative
                                        :class="particleLife.isDriftCamActive
                                            ? 'bg-violet-600/80 hover:bg-violet-500/80 ring-violet-400/50 text-white'
                                            : 'bg-violet-900/60 hover:bg-violet-800/70 ring-violet-500/30 text-violet-300'"
                                        @click="particleLife.isDriftCamActive = !particleLife.isDriftCamActive">
                                    <span v-if="particleLife.isDriftCamActive" class="absolute -top-1 -right-1 flex size-3">
                                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 ring-1 ring-violet-300/50 opacity-75"></span>
                                        <span class="relative inline-flex size-3 rounded-full bg-violet-400"></span>
                                    </span>
                                    <span i-tabler-video text-xs mr-1></span>
                                    {{ particleLife.isDriftCamActive ? 'Drifting...' : 'Enable Drift' }}
                                </button>
                            </div>
                            <p v-if="!particleLife.isDriftCamActive" class="text-sm text-gray-500 mt-1">
                                Auto camera panning & zooming.
                            </p>
                            <div v-else flex flex-col gap-2 mt-2>
                                 <ToggleSwitch label="Reset Path on Pan" colorful-label v-model="particleLife.driftCamResetOnPan"
                                               tooltip="Starts a new drift trajectory after manual panning or zooming, instead of resuming the previous path.">
                                </ToggleSwitch>
                                <RangeInput input label="Drift Speed"
                                            tooltip="Controls the automatic camera movement speed. <br> - <b>Higher</b> → faster tracking. <br> - <b>Lower</b> → smoother cinematic effect."
                                            :min="0.01" :max="1.0" :step="0.01" v-model="particleLife.driftCamSpeed">
                                </RangeInput>
                                <RangeInput input label="Pan Amplitude"
                                            tooltip="Controls how far the camera moves from center. <br> - <b>0.5</b> → half the simulation area. <br> - <b>1.0</b> → full edges."
                                            :min="0.05" :max="1.0" :step="0.05" v-model="particleLife.driftCamAmplitude">
                                </RangeInput>
                                <RangeInputMinMax input label="Zoom Range" mt-2
                                                  tooltip="Sets the min/max zoom levels for automatic cinematic zoom."
                                                  :min="0.1" :max="5" :step="0.05" :range-offset="0.1" v-model="particleLife.driftCamZoomRange">
                                </RangeInputMinMax>
                            </div>

                            <hr border-gray-500 my-2>
                            <div flex items-center justify-between>
                                <p underline text-gray-300>Creature Tracking :</p>
                                <button btn px-3 py-1 text-xs rounded-full font-medium flex items-center ring-1 transition-all relative
                                        :class="particleLife.isTrackerSelectionActive
                                            ? 'bg-amber-700/80 hover:bg-amber-600/80 ring-amber-500/50 text-white animate-pulse'
                                            : particleLife.isTrackerActive
                                                ? 'bg-rose-600/80 hover:bg-rose-500/80 ring-rose-400/50 text-white'
                                                : 'bg-rose-900/60 hover:bg-rose-800/70 ring-rose-500/30 text-rose-300'"
                                        @click="particleLife.isTrackerSelectionActive ? cancelTrackerSelection() : particleLife.isTrackerActive ? stopTracker() : startTrackerSelection()">
                                    <span v-if="particleLife.isTrackerActive" class="absolute -top-1 -right-1 flex size-3">
                                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 ring-1 ring-rose-300/50 opacity-75"></span>
                                        <span class="relative inline-flex size-3 rounded-full bg-rose-400"></span>
                                    </span>
                                    <span :class="particleLife.isTrackerSelectionActive ? 'i-tabler-marquee-2' : 'i-tabler-current-location'" text-xs mr-1></span>
                                    {{ particleLife.isTrackerSelectionActive ? 'Selecting...' : particleLife.isTrackerActive ? 'Tracking...' : 'Select & Track' }}
                                </button>
                            </div>
                            <p v-if="!particleLife.isTrackerActive && !particleLife.isTrackerSelectionActive" class="text-sm text-gray-500 mt-1">
                                Track & follow a creature in real time.
                            </p>
                            <p v-else-if="particleLife.isTrackerSelectionActive" class="text-sm text-amber-500/80 mt-1">
                                Draw around a creature to start tracking.
                            </p>
                            <div v-else flex flex-col gap-2 mt-2>
                                <ToggleSwitch label="Camera Follow" colorful-label v-model="particleLife.isTrackerCameraActive"
                                              tooltip="When enabled, the camera will smoothly follow the tracked creature.">
                                </ToggleSwitch>
                                <ToggleSwitch label="Show Indicator" colorful-label v-model="particleLife.isTrackerIndicatorVisible"
                                              tooltip="Show or hide the visual tracker indicator overlay.">
                                </ToggleSwitch>
                                <RangeInput input label="Smoothing"
                                            tooltip="Controls how smoothly the camera follows the tracked creature. <br> Lower values give a slower, cinematic follow. Higher values make the camera snap to the target."
                                            :min="0.01" :max="1" :step="0.01" v-model="particleLife.trackerCameraSmoothing">
                                </RangeInput>
                            </div>
                        </Collapse>
                        <Collapse label="Debug Tools" icon="i-tabler-bug text-rose-500"
                                  tooltip="Provides tools for visualizing the simulation's internal state. <br> Toggle the grid view to see spatial bins or activate a heatmap to analyze particle density. <br> These features are useful for debugging and performance tuning.">
                            <div v-show="particleLife.useSpatialHash">
                                <p text-gray-300 text-2sm underline mb-1 class="-mt-0.5">Spatial Bins Overlay :</p>
                                <div flex items-center gap-2>
                                    <SelectInput name="debug-bins-mode"
                                                 :model-value="particleLife.isDebugHeatmapActive ? 'heatmap' : 'grid'"
                                                 @update:model-value="particleLife.isDebugHeatmapActive = $event === 'heatmap'"
                                                 :options="[
                                                 { id: 'grid', name: 'Grid', icon: 'i-tabler-grid-dots', category: 'Display Mode' },
                                                 { id: 'heatmap', name: 'Heatmap', icon: 'i-tabler-flame', category: 'Display Mode' }
                                             ]">
                                    </SelectInput>
                                    <ToggleSwitch label="Active" colorful-label v-model="particleLife.isDebugBinsActive" />
                                </div>
                                <RangeInput v-show="particleLife.isDebugHeatmapActive" input label="Heatmap Scale"
                                            tooltip="Sets the number of particles in a cell that maps to the highest value on the heatmap gradient. <br> Adjusting this value scales the density visualization, helping to fine-tune how particle concentrations are displayed."
                                            :min="640" :max="16000" :step="16" v-model="particleLife.debugMaxParticleCount" mt-2>
                                </RangeInput>
                                <hr border-gray-500 my-2>
                            </div>

                            <p text-gray-300 text-2sm underline mb-1 class="-mt-0.5">Neighbor Search :</p>
                            <SelectInput name="algorithm-mode"
                                         :model-value="particleLife.useSpatialHash ? 'spatial' : 'brute'"
                                         @update:model-value="particleLife.useSpatialHash = $event === 'spatial'"
                                         :options="[
                                             { id: 'spatial', name: 'Spatial Hash', icon: 'i-tabler-topology-ring-3', category: 'Method' },
                                             { id: 'brute', name: 'Brute Force', icon: 'i-tabler-cpu', category: 'Method' },
                                         ]">
                            </SelectInput>
                            <RangeInput v-show="particleLife.useSpatialHash" input label="Cell Subdivisions" mt-2
                                        tooltip="Subdivides the interaction radius into smaller grid cells. <br> Default: 2 (fastest in most cases). <br> Increasing subdivisions can improve performance for simulations with very large radii."
                                        :min="1" :max="5" :step="1" v-model="particleLife.cellSubdivisions">
                            </RangeInput>
                        </Collapse>
                    </div>
                    <div absolute bottom-2 right-0 z-100 class="-mr-px">
                        <button rounded-l-lg border border-slate-600 flex items-center p-1 bg="slate-900/85 hover:slate-950/85" @click="particleLife.sidebarLeftOpen = false">
                            <span i-tabler-chevron-left text-2xl></span>
                        </button>
                    </div>
                </div>
            </template>
            <template #bottom-actions>
                <button type="button" name="Cinematic Camera" aria-label="Cinematic Camera" title="Cinematic Camera"
                        btn rounded-full flex items-center justify-center p-2 backdrop-blur-sm pointer-events-auto
                        :class="particleLife.isDriftCamActive ? 'bg-violet-600/90 hover:bg-violet-500/90' : 'bg-violet-900/80 hover:bg-violet-800/80'"
                        @click="particleLife.isDriftCamActive = !particleLife.isDriftCamActive" :disabled="particleLife.isHudLocked">
                    <span i-tabler-video :class="particleLife.isDriftCamActive ? 'text-white' : 'text-violet-300'"></span>
                    <span v-if="particleLife.isDriftCamActive" class="absolute -top-0.5 -right-0.5 flex size-3">
                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 ring-1 ring-violet-300/50 opacity-75"></span>
                        <span class="relative inline-flex size-3 rounded-full bg-violet-400"></span>
                    </span>
                </button>
                <TrackerToggle
                    @toggle="particleLife.isTrackerSelectionActive ? cancelTrackerSelection() : particleLife.isTrackerActive ? stopTracker() : startTrackerSelection()">
                </TrackerToggle>
                <CenterViewButton :disabled="particleLife.isHudLocked" 
                                  @centerAll="smoothCenterView()" 
                                  @centerPosition="smoothCenterView(true, false)"
                                  @resetZoom="smoothCenterView(false, true)">
                </CenterViewButton>
                <button type="button" name="Randomize" aria-label="Randomize" title="Randomize simulation"
                        btn rounded-full flex items-center justify-center p-2 pointer-events-auto
                        class="backdrop-blur-sm bg-[#094F5D]/90 hover:bg-[#0B5F6F]/90"
                        @click="regenerateLife" :disabled="particleLife.isHudLocked">
                    <span i-game-icons-perspective-dice-six-faces-random text-2xl></span>
                </button>
            </template>
        </SidebarLeft>
        <canvas ref="canvasRef" id="canvasRef" @contextmenu.prevent w-full h-full cursor-crosshair></canvas>
        <ClientOnly>
            <TrackerOverlay v-if="particleLife.isTrackerSelectionActive" @tracker-zone-selected="onTrackerZoneSelected"></TrackerOverlay>
        </ClientOnly>
        <SaveModal :store="particleLife"></SaveModal>
        <div absolute top-0 right-0 flex flex-col items-end text-right pointer-events-none>
            <div flex items-center text-start text-xs pl-4 pr-1 bg-slate-800 rounded-bl-xl style="padding-bottom: 1px; opacity: 75%" >
                <div flex>Fps: <div ml-1 min-w-8>{{ fps }}</div></div>
<!--                <div flex ml-3>Process: <div ml-1 min-w-7>{{ Math.round(executionTime) }}</div></div>-->
            </div>
            <BrushSettings :store="particleLife" mt-2 mr-1 pointer-events-auto :class="particleLife.isHudLocked && '!pointer-events-none [&_*]:!pointer-events-none opacity-40'" />

            <div class="faded-hover-effect" mr-1>
                <button type="button" title="Debugger" aria-label="Debugger" btn w-8 aspect-square rounded-full p1 flex items-center justify-center bg="#D62839 hover:#DC4151" mt-2
                        @click="particleLife.isDebugBinsActive = !particleLife.isDebugBinsActive" :disabled="particleLife.isHudLocked">
                    <span text-sm :class="particleLife.isDebugBinsActive ? 'i-tabler-bug-filled' : 'i-tabler-bug'"></span>
                </button>
            </div>
        </div>
        <div fixed z-10 bottom-2 flex justify-center items-end pointer-events-none class="left-1/2 transform -translate-x-1/2"> <!-- faded-hover-effect -->
            <button type="button" name="Toggle Fullscreen" aria-label="Toggle Fullscreen" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="toggleFullscreen">
                <span :class="isFullscreen ? 'i-tabler-maximize-off' : 'i-tabler-maximize'"></span>
            </button>
            <button type="button" name="Zoom Out" aria-label="Zoom Out" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="handleZoom(-1, true)">
                <span i-tabler-zoom-out></span>
            </button>
            <button type="button" name="Play/Pause" aria-label="Play/Pause" btn p3 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="particleLife.isRunning = !particleLife.isRunning">
                <span text-xl :class="particleLife.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'"></span>
            </button>
            <button type="button" name="Step" aria-label="Step" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isRunning || particleLife.isHudLocked" @click="step">
                <span i-tabler-player-skip-forward-filled></span>
            </button>
            <button type="button" name="Zoom In" aria-label="Zoom In" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="handleZoom(1, true)">
                <span i-tabler-zoom-in></span>
            </button>
        </div>
        <SocialLinks />
    </section>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import WrapModeSelection from "~/components/particle-life/WrapModeSelection.vue";
import MatrixSettings from "~/components/particle-life/MatrixSettings.vue";
import BrushSettings from "~/components/particle-life/BrushSettings.vue";
import SaveModal from "~/components/particle-life/SaveModal.vue";
import PresetPanel from "~/components/particle-life/PresetPanel.vue";
import TrackerOverlay from "~/components/particle-life/TrackerOverlay.vue";
import TrackerToggle from "~/components/particle-life/TrackerToggle.vue";
import CenterViewButton from "~/components/particle-life/CenterViewButton.vue";
import RadiusVisualizer from "~/components/particle-life/RadiusVisualizer.vue";
import { RULES_OPTIONS, generateRules } from '~/helpers/utils/rulesGenerator';
import { PALETTE_OPTIONS, generateColors } from "~/helpers/utils/colorsGenerator";
import { POSITION_OPTIONS, generatePositions } from "~/helpers/utils/positionsGenerator";
import { hexToRgb } from '~/helpers/utils/colorConversion';

import heatmapImage from 'assets/particle-life-gpu/images/heatmap_red4x_256x1.png';

import binFillSizeShaderCode from 'assets/particle-life-gpu/shaders/compute/binFillSize.wgsl?raw';
import binPrefixSumShaderCode from 'assets/particle-life-gpu/shaders/compute/binPrefixSum.wgsl?raw';
import particleSortShaderCode from 'assets/particle-life-gpu/shaders/compute/particleSort.wgsl?raw';
import bruteForceShaderCode from 'assets/particle-life-gpu/shaders/compute/compute_bruteForce.wgsl?raw';
import particleComputeForcesShaderCode from 'assets/particle-life-gpu/shaders/compute/particleComputeForces.wgsl?raw';
import particleAdvanceShaderCode from 'assets/particle-life-gpu/shaders/compute/particleAdvance.wgsl?raw';
import particleAdvanceBrushShaderCode from 'assets/particle-life-gpu/shaders/compute/particleAdvance_brush.wgsl?raw';

import renderShaderCode from 'assets/particle-life-gpu/shaders/render/render_normal.wgsl?raw';
import offscreenShaderCode from 'assets/particle-life-gpu/shaders/render/offscreen_render_vertex.wgsl?raw';
import infiniteCompositorShaderCode from 'assets/particle-life-gpu/shaders/compose/infinite_compositor.wgsl?raw';
import renderGlowShaderCode from 'assets/particle-life-gpu/shaders/render/particle_render_glow.wgsl?raw';
import composeHdrShaderCode from 'assets/particle-life-gpu/shaders/compose/compose_hdr.wgsl?raw';

import renderMirrorShaderCode from 'assets/particle-life-gpu/shaders/render/render_mirror.wgsl?raw';
import renderInfiniteShaderCode from 'assets/particle-life-gpu/shaders/render/render_infinite.wgsl?raw';

import particleEraseShaderCode from 'assets/particle-life-gpu/shaders/compute/particleErase.wgsl?raw';
import particleCompactShaderCode from 'assets/particle-life-gpu/shaders/compute/particleCompact.wgsl?raw';
import particleDrawShaderCode from 'assets/particle-life-gpu/shaders/compute/particleDraw.wgsl?raw';
import renderBrushCircleShaderCode from 'assets/particle-life-gpu/shaders/render/render_brush_circle.wgsl?raw';
import renderBinsShaderCode from 'assets/particle-life-gpu/shaders/render/render_bins.wgsl?raw';
import renderTrackerShaderCode from 'assets/particle-life-gpu/shaders/render/render_tracker.wgsl?raw';
import trackerComputeShaderCode from 'assets/particle-life-gpu/shaders/compute/trackerCompute.wgsl?raw';
import trackerCameraUpdateShaderCode from 'assets/particle-life-gpu/shaders/compute/trackerCameraUpdate.wgsl?raw';

export default defineComponent({
    name: 'ParticleLifeGpu',
    components: { PresetPanel, SaveModal, BrushSettings, MatrixSettings, WrapModeSelection, TrackerOverlay, TrackerToggle, CenterViewButton, RadiusVisualizer },
    emits: ['switch-renderer'],
    setup(props, { emit }) {
        // Define refs and variables
        const mainContainer = ref<HTMLElement | null>(null)
        const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(mainContainer)
        const { success, error } = useToasts()
        const particleLife = useParticleLifeGPUStore()
        const rulesOptions = RULES_OPTIONS
        const paletteOptions = PALETTE_OPTIONS
        const positionOptions = POSITION_OPTIONS
        const fps = useFps()
        const executionTime = ref<number>(0)
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: GPUCanvasContext
        let DEVICE_PIXEL_RATIO: number = 1
        let animationFrameId: number | null = null
        let lastFrameTime: number = performance.now()
        let isRunning: boolean = particleLife.isRunning
        let isInitializing: boolean = true
        let isUpdatingParticles: boolean = false // Flag to prevent multiple additions at once
        let isUpdateNumParticlesPending: boolean = false
        let isUpdateNumTypesPending: boolean = false
        let hasUpdateNumParticles: boolean = false

        let smoothedDeltaTime: number = 0.0083 // Initial value (1/120s)
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let SIM_WIDTH: number = 0
        let SIM_HEIGHT: number = 0
        let SIM_WIDTH_HALF: number = 0
        let SIM_HEIGHT_HALF: number = 0
        let CELL_SIZE: number = 0
        let CELL_SUBDIVISIONS: number = particleLife.cellSubdivisions
        let baseSimWidth: number = 0
        let baseSimHeight: number = 0
        let GRID_WIDTH: number = 0
        let GRID_HEIGHT: number = 0
        let binCount: number = 0
        let prefixSumIterations: number = 0

        let EXTENDED_GRID_WIDTH: number = 0
        let EXTENDED_GRID_HEIGHT: number = 0
        let GRID_OFFSET_X: number = 0
        let GRID_OFFSET_Y: number = 0
        let EXTENDED_SIM_WIDTH: number = 0
        let EXTENDED_SIM_HEIGHT: number = 0

        // Define color list and rules matrix for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color
        let currentMaxRadius: number = 0 // Max value between all colors max radius (for cell size)

        // Define the simulation properties
        let initialParticles: Float32Array // Initial particle x, y, vx, vy, type
        let colors: Float32Array // Particle colors

        // Define the properties for dragging and zooming
        let zoomFactor: number = 1.0
        let targetZoomFactor: number = 1.0 // Target zoom factor for smooth zooming
        let zoomSmoothing: number = particleLife.zoomSmoothing // Smoothing factor for zooming
        let panSmoothing: number = particleLife.panSmoothing // Smoothing factor for panning
        let cameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
        let targetCameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 } // Target camera center for smooth movement
        let cameraScaleX: number = 1.0 // Scale factor for X axis
        let cameraScaleY: number = 1.0 // Scale factor for Y axis
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastZoomPositionX: number = 0 // Last zoom position X for smooth zooming
        let lastZoomPositionY: number = 0 // Last zoom position Y for smooth zooming
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y
        let lastFramePointerX: number = 0
        let lastFramePointerY: number = 0
        let cameraChanged: boolean = true
        let infiniteTotalInstances: number = 0 // Total number of instances for infinite rendering

        // Define properties for the drift camera
        let isDriftCamActive: boolean = particleLife.isDriftCamActive // Enable drift camera mode (slow automatic movement)
        let driftCamResetOnPan: boolean = particleLife.driftCamResetOnPan // Reset drift camera trajectory when user pans/zooms
        const driftCamSmoothing: number = 0.0003 // Smoothing factor for camera movement (affects panning and zooming, 0.1 = fast, 0.01 = slow)
        let driftCamSpeed: number = particleLife.driftCamSpeed // Drift camera speed (0.1 = slow, 1.0 = fast)
        let driftCamAmplitude: number = particleLife.driftCamAmplitude // Amplitude of camera movement (0.5 = half the simulation size, 1.0 = full simulation size)
        let driftCamZoomRange: number[] = particleLife.driftCamZoomRange // Range of zoom levels for driftCam (min, max)
        let driftCamZoomCenter: number = (driftCamZoomRange[1] + driftCamZoomRange[0]) * 0.5 // Center zoom level for driftCam
        let driftCamZoomAmplitude: number = (driftCamZoomRange[1] - driftCamZoomRange[0]) * 0.5 // Amplitude of zoom changes for driftCam
        let driftCamTime: number = 0 // Time variable for the drift camera, incremented each frame based on the driftCamSpeed to create continuous movement
        let driftCamLastTime: number = 0 // Last timestamp when the drift camera was updated, used to calculate elapsed time for consistent movement regardless of frame rate
        let driftCamTransitionProgress: number = 0 // Smoothly blend camera position from its current location to the drift trajectory when driftCam is enabled, and reset to 0 whenever the user manually pans/zooms the camera, allowing for a seamless transition back to the drift movement
        let driftCamPhase = { x1: 0, x2: 0, y1: 0, y2: 0, z1: 0, z2: 0 } // Phase offsets for the sine waves controlling camera movement and zoom

        // Define variables for the simulation
        let repel: number = particleLife.repel // Repel force between particles
        let forceFactor: number = particleLife.forceFactor // Adjust the overall force applied between particles (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 0 is no friction)
        let NUM_PARTICLES: number = particleLife.numParticles
        let NEW_NUM_PARTICLES: number = NUM_PARTICLES
        let PARTICLE_SIZE: number = particleLife.particleSize
        let NUM_TYPES: number = particleLife.numColors
        let NEW_NUM_TYPES: number = NUM_TYPES
        let isParticleGlow: boolean = particleLife.isParticleGlow // Enable glow effect for the particles
        let isAdditiveBlending = particleLife.isAdditiveBlending // Use additive blending for rendering particles
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let isMirrorWrap: boolean = particleLife.isMirrorWrap // Enable mirroring for the particles (only if isWallWrap is true)
        let isInfiniteMirrorWrap: boolean = particleLife.isInfiniteMirrorWrap // Enable infinite wrapping for the particles (only if isWallWrap is true)
        let mirrorWrapCount: number = particleLife.mirrorWrapCount // Number of mirrors to render if isMirrorWrap is true (5 or 9)
        let useSpatialHash: boolean = particleLife.useSpatialHash // Use spatial hash or brute force
        let isDebugBinsActive: boolean = particleLife.isDebugBinsActive // Flag to show/hide the bins
        let debugMaxParticleCount: number = particleLife.debugMaxParticleCount // Maximum number of particles for debugging purposes
        let isDebugHeatmapActive: boolean = particleLife.isDebugHeatmapActive // Flag to show/hide the heatmap

        let glowSize: number = particleLife.glowSize
        let glowIntensity: number = particleLife.glowIntensity
        let glowSteepness: number = particleLife.glowSteepness
        let particleOpacity: number = particleLife.particleOpacity

        let isBrushActive: boolean = particleLife.isBrushActive
        let isBrushErasing: boolean = false
        let isBrushDrawing: boolean = false
        let isApplyingBrushForce: boolean = false
        let isEraseCompletionPending: boolean = false
        let isEraseCompleting: boolean = false
        let brushType: number = particleLife.brushType // 0: Erase, 1: Draw, 2: Repulse, 3: Attract
        let brushes: number[] = particleLife.brushes
        let brushRadius: number = particleLife.brushRadius
        let brushIntensity: number = particleLife.brushIntensity
        let attractForce: number = -Math.abs(particleLife.attractForce)
        let repulseForce: number = particleLife.repulseForce
        let brushDirectionalForce: number = particleLife.brushDirectionalForce // Force applied in the direction of the brush movement
        let showBrushCircle: boolean = particleLife.showBrushCircle // Show the brush circle when using the brush

        // Define GPU resources
        let device: GPUDevice
        let currentPositionBuffer: GPUBuffer | undefined
        let nextPositionBuffer: GPUBuffer | undefined
        let velocityBuffer: GPUBuffer | undefined
        let typeBuffer: GPUBuffer | undefined
        let typeBufferPacked: GPUBuffer | undefined // Packed type buffer for compute shader
        let colorBuffer: GPUBuffer | undefined
        let deltaTimeBuffer: GPUBuffer | undefined
        let cameraBuffer: GPUBuffer | undefined
        let interactionMatrixBuffer: GPUBuffer | undefined
        let simOptionsBuffer: GPUBuffer | undefined
        let particleHashesBuffer: GPUBuffer | undefined
        let cellHeadsBuffer: GPUBuffer | undefined
        let particleNextIndicesBuffer: GPUBuffer | undefined
        let glowOptionsBuffer: GPUBuffer | undefined
        let infiniteRenderOptionsBuffer: GPUBuffer | undefined
        let brushOptionsBuffer: GPUBuffer | undefined

        let binOffsetBuffer: GPUBuffer | undefined
        let binOffsetTempBuffer: GPUBuffer | undefined
        let particleBuffer: GPUBuffer | undefined
        let particleTempBuffer: GPUBuffer | undefined
        let binPrefixSumStepSizeBuffer: GPUBuffer | undefined

        let offscreenTexture: GPUTexture | undefined
        let offscreenTextureView: GPUTextureView
        let offscreenSampler: GPUSampler
        let hdrTexture: GPUTexture | undefined
        let hdrTextureView: GPUTextureView

        let renderPipeline: GPURenderPipeline
        let renderGlowPipeline: GPURenderPipeline
        let renderCirclePipeline: GPURenderPipeline
        let renderMirrorPipeline: GPURenderPipeline
        let renderMirrorGlowPipeline: GPURenderPipeline
        let renderMirrorCirclePipeline: GPURenderPipeline
        let renderInfinitePipeline: GPURenderPipeline
        let renderInfiniteGlowPipeline: GPURenderPipeline
        let renderInfiniteCirclePipeline: GPURenderPipeline
        let renderOffscreenPipeline: GPURenderPipeline
        let composeInfinitePipeline: GPURenderPipeline
        let composeHdrPipeline: GPURenderPipeline
        let renderTrackerPipeline: GPURenderPipeline

        let renderPipelineAdditive: GPURenderPipeline
        let renderMirrorPipelineAdditive: GPURenderPipeline
        let renderInfinitePipelineAdditive: GPURenderPipeline
        let renderCirclePipelineAdditive: GPURenderPipeline
        let renderMirrorCirclePipelineAdditive: GPURenderPipeline
        let renderInfiniteCirclePipelineAdditive: GPURenderPipeline

        let binClearSizePipeline: GPUComputePipeline
        let binFillSizePipeline: GPUComputePipeline
        let binPrefixSumPipeline: GPUComputePipeline
        let particleSortClearSizePipeline: GPUComputePipeline
        let particleSortPipeline: GPUComputePipeline
        let bruteForceComputePipeline: GPUComputePipeline
        let particleComputeForcesPipeline: GPUComputePipeline
        let particleAdvancePipeline: GPUComputePipeline
        let particleAdvanceBrushPipeline: GPUComputePipeline

        let particleBufferReadOnlyBindGroup: GPUBindGroup
        let binFillSizeBindGroup: GPUBindGroup
        let binPrefixSumBindGroup: GPUBindGroup[] = []
        let particleSortBindGroup: GPUBindGroup
        let bruteForceBindGroup: GPUBindGroup
        let particleComputeForcesBindGroup: GPUBindGroup
        let particleBufferBindGroup: GPUBindGroup
        let simOptionsBindGroup: GPUBindGroup
        let deltaTimeBindGroup: GPUBindGroup
        let cameraBindGroup: GPUBindGroup
        let offscreenTextureBindGroup: GPUBindGroup
        let composeHdrBindGroup: GPUBindGroup
        let glowOptionsBindGroup: GPUBindGroup
        let infiniteRenderOptionsBindGroup: GPUBindGroup
        let brushOptionsBindGroup: GPUBindGroup

        let particleBufferBindGroupLayout: GPUBindGroupLayout
        let binPrefixSumBindGroupLayout: GPUBindGroupLayout
        let particleBufferReadOnlyBindGroupLayout: GPUBindGroupLayout
        let binFillSizeBindGroupLayout: GPUBindGroupLayout
        let particleSortBindGroupLayout: GPUBindGroupLayout
        let bruteForceBindGroupLayout: GPUBindGroupLayout
        let particleComputeForcesBindGroupLayout: GPUBindGroupLayout
        let simOptionsBindGroupLayout: GPUBindGroupLayout
        let deltaTimeBindGroupLayout: GPUBindGroupLayout
        let cameraBindGroupLayout: GPUBindGroupLayout
        let offscreenTextureBindGroupLayout: GPUBindGroupLayout
        let composeHdrBindGroupLayout: GPUBindGroupLayout
        let glowOptionsBindGroupLayout: GPUBindGroupLayout
        let infiniteRenderOptionsBindGroupLayout: GPUBindGroupLayout
        let brushOptionsBindGroupLayout: GPUBindGroupLayout
        let trackerRenderBindGroupLayout: GPUBindGroupLayout

        let particleErasePipeline: GPUComputePipeline;
        let particleCompactPipeline: GPUComputePipeline;
        let particleEraseBindGroupLayout: GPUBindGroupLayout;
        let particleCompactBindGroupLayout: GPUBindGroupLayout;
        let particleEraseBindGroup: GPUBindGroup;
        let particleCompactBindGroup: GPUBindGroup;
        let particleKeepFlagsBuffer: GPUBuffer | undefined;
        let newParticleCountBuffer: GPUBuffer | undefined;
        let newParticleCountReadBuffer: GPUBuffer | undefined;
        let particleCompactBuffer: GPUBuffer | undefined;

        let particleDrawPipeline: GPUComputePipeline;
        let particleDrawBindGroupLayout: GPUBindGroupLayout;
        let particleDrawBindGroup: GPUBindGroup;

        let brushesBuffer: GPUBuffer | undefined;

        let renderBrushCirclePipeline: GPURenderPipeline
        let renderBrushCircleBindGroupLayout: GPUBindGroupLayout
        let renderBrushCircleBindGroup: GPUBindGroup

        let renderDebugBinsPipeline: GPURenderPipeline
        let renderDebugBinsBindGroupLayout: GPUBindGroupLayout
        let renderDebugBinsBindGroup: GPUBindGroup
        let debugOptionsBindGroupLayout: GPUBindGroupLayout
        let debugOptionsBindGroup: GPUBindGroup

        let heatmapTexture: GPUTexture | undefined
        let heatmapTextureView: GPUTextureView
        let heatmapSampler: GPUSampler

        let debugOptionsBuffer: GPUBuffer | undefined

        onMounted(async () => {
            await initWebGPU()
            await createHeatmapTexture()
            handleResize()
            setSimSizeBasedOnScreen()
            await initLife()

            useEventListener('resize', handleResize)
            useEventListener(canvasRef.value, ['mousedown'], (e) => {
                lastPointerX = (e.x - canvasRef.value!.getBoundingClientRect().left) * DEVICE_PIXEL_RATIO
                lastPointerY = (e.y - canvasRef.value!.getBoundingClientRect().top) * DEVICE_PIXEL_RATIO
                if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                    if (brushType === 0) isBrushErasing = true
                    else if (brushType === 1) isBrushDrawing = true
                    else isApplyingBrushForce = true
                }
            })
            useEventListener(canvasRef.value, ['mousemove'], (e) => {
                pointerX = (e.x - canvasRef.value!.getBoundingClientRect().left) * DEVICE_PIXEL_RATIO
                pointerY = (e.y - canvasRef.value!.getBoundingClientRect().top) * DEVICE_PIXEL_RATIO

                if (e.buttons > 0) { // if mouse is pressed
                    if (particleLife.isLockedPointer) return // Prevent canvas dragging if the pointer is locked
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        isDragging = true
                        handleMove()
                    }
                    if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                        if (brushType === 0) isBrushErasing = true
                        else if (brushType === 1) isBrushDrawing = true
                        else isApplyingBrushForce = true
                    }
                }
                else if (e.buttons === 0) {
                    isDragging = false
                    isBrushErasing = false
                    isBrushDrawing = false
                    isApplyingBrushForce = false
                }
            })
            useEventListener(canvasRef.value, ['mouseup'], () => {
                if (isDragging && isDriftCamActive && driftCamResetOnPan) initDriftCamera()
                isDragging = false
                isBrushErasing = false
                isBrushDrawing = false
                isApplyingBrushForce = false
            })
            useEventListener(canvasRef.value, 'mouseleave', () => {
                isDragging = false
                isBrushErasing = false
                isBrushDrawing = false
                isApplyingBrushForce = false
            })
            useEventListener(canvasRef.value, 'wheel', (e) => {
                if (e.deltaY < 0) handleZoom(1) // Zoom in
                else handleZoom(-1) // Zoom out
                if (isDriftCamActive) {
                    driftCamTransitionProgress = 0 // Reset drift cam transition when user interacts with the camera
                    if (driftCamResetOnPan) initDriftCamera()
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1
            CANVAS_WIDTH = canvasRef.value!.width = Math.round(canvasRef.value!.clientWidth * DEVICE_PIXEL_RATIO)
            CANVAS_HEIGHT = canvasRef.value!.height = Math.round(canvasRef.value!.clientHeight * DEVICE_PIXEL_RATIO)
            updateCameraScaleFactors()
            updateHdrTexture()
            cameraChanged = true
        }
        function updateCameraScaleFactors() {
            cameraScaleY = zoomFactor * 2.0 / CANVAS_HEIGHT
            cameraScaleX = cameraScaleY / (CANVAS_WIDTH / CANVAS_HEIGHT)
        }
        function setSimSizeBasedOnScreen() {
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = CANVAS_WIDTH
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = CANVAS_HEIGHT
            SIM_WIDTH_HALF = SIM_WIDTH * 0.5
            SIM_HEIGHT_HALF = SIM_HEIGHT * 0.5
            updateCameraScaleFactors()
        }
        function setSimSize() {
            if (useSpatialHash && isWallWrap) {
                particleLife.simWidth = SIM_WIDTH = CELL_SIZE * Math.round(baseSimWidth / CELL_SIZE)
                particleLife.simHeight = SIM_HEIGHT = CELL_SIZE * Math.round(baseSimHeight / CELL_SIZE)
            }
            SIM_WIDTH_HALF = SIM_WIDTH * 0.5
            SIM_HEIGHT_HALF = SIM_HEIGHT * 0.5
            updateCameraScaleFactors()
            updateBinningParameters()
            updateOffscreenMirrorResources()
            updateInfiniteRenderOptions()
        }
        const updateBinningParameters = () => {
            const oldBinCount = binCount
            const oldPrefixSumIterations = prefixSumIterations

            // If no walls, set a larger grid size for better performance
            if (!isWallWrap && !isWallRepel) {
                const requestedFactor = 16
                const maxWorkgroups = device.limits.maxComputeWorkgroupsPerDimension
                const maxBinCount = maxWorkgroups * 64
                const baseBinCount = Math.ceil(SIM_WIDTH / CELL_SIZE) * Math.ceil(SIM_HEIGHT / CELL_SIZE)
                const maxPossibleFactor = Math.sqrt(maxBinCount / baseBinCount)
                const safeFactor = Math.min(requestedFactor, maxPossibleFactor * 0.9)
                const extensionX = (SIM_WIDTH * safeFactor - SIM_WIDTH) / 2
                const extensionY = (SIM_HEIGHT * safeFactor - SIM_HEIGHT) / 2

                EXTENDED_SIM_WIDTH = SIM_WIDTH + (extensionX * 2)
                EXTENDED_SIM_HEIGHT = SIM_HEIGHT + (extensionY * 2)
                EXTENDED_GRID_WIDTH = Math.ceil(EXTENDED_SIM_WIDTH / CELL_SIZE)
                EXTENDED_GRID_HEIGHT = Math.ceil(EXTENDED_SIM_HEIGHT / CELL_SIZE)
                GRID_OFFSET_X = Math.ceil(extensionX / CELL_SIZE)
                GRID_OFFSET_Y = Math.ceil(extensionY / CELL_SIZE)
                GRID_WIDTH = Math.ceil(SIM_WIDTH / CELL_SIZE)
                GRID_HEIGHT = Math.ceil(SIM_HEIGHT / CELL_SIZE)
                binCount = EXTENDED_GRID_WIDTH * EXTENDED_GRID_HEIGHT
            } else {
                GRID_WIDTH = Math.ceil(SIM_WIDTH / CELL_SIZE)
                GRID_HEIGHT = Math.ceil(SIM_HEIGHT / CELL_SIZE)
                binCount = GRID_WIDTH * GRID_HEIGHT
            }
            prefixSumIterations = Math.ceil(Math.ceil(Math.log2(binCount + 1)) / 2) * 2

            if (device && (oldBinCount !== binCount || oldPrefixSumIterations !== prefixSumIterations)) {
                updateBinningBuffers()
                if (!isInitializing) {
                    updateBinningBindGroups()
                    updateParticleBindGroups()
                }
            }
        }
        function centerView() {
            cameraCenter = { x: SIM_WIDTH_HALF, y: SIM_HEIGHT_HALF }
            targetCameraCenter = { x: SIM_WIDTH_HALF, y: SIM_HEIGHT_HALF }
        }
        function smoothCenterView(position: boolean = true, zoom: boolean = true) {
            if (position) targetCameraCenter = { x: SIM_WIDTH_HALF, y: SIM_HEIGHT_HALF }
            if (zoom) {
                targetZoomFactor = Math.min(CANVAS_WIDTH / SIM_WIDTH, CANVAS_HEIGHT / SIM_HEIGHT)
                lastZoomPositionX = CANVAS_WIDTH / 2
                lastZoomPositionY = CANVAS_HEIGHT / 2
            }
        }
        function handleMove() {
            const dx = pointerX - lastPointerX
            const dy = pointerY - lastPointerY
            const worldDx = dx / (cameraScaleX * CANVAS_WIDTH * 0.5)
            const worldDy = dy / (cameraScaleY * CANVAS_HEIGHT * 0.5)
            if (isCameraTracking) {
                targetTrackerCameraOffset.x -= worldDx
                targetTrackerCameraOffset.y -= worldDy
            } else {
                targetCameraCenter.x -= worldDx
                targetCameraCenter.y -= worldDy
            }
            lastPointerX = pointerX
            lastPointerY = pointerY
        }
        const handleMoveSmoothing = () => {
            const panXDiff = targetCameraCenter.x - cameraCenter.x
            const panYDiff = targetCameraCenter.y - cameraCenter.y
            if (Math.abs(panXDiff) < 0.001 && Math.abs(panYDiff) < 0.001) return

            cameraCenter.x += panXDiff * panSmoothing
            cameraCenter.y += panYDiff * panSmoothing
            cameraChanged = true;
        }
        function handleZoom(delta: number, isCentered: boolean = false) {
            lastZoomPositionX = isCentered ? cameraCenter.x : pointerX
            lastZoomPositionY = isCentered ? cameraCenter.y : pointerY
            const zoomIntensity = 0.1
            const zoomDelta = delta * zoomIntensity
            targetZoomFactor = Math.max(0.15, Math.min(1000.0, targetZoomFactor * (1 + zoomDelta)))
        }
        const handleZoomSmoothing = () => {
            const zoomDiff = targetZoomFactor - zoomFactor
            if (Math.abs(zoomDiff) < 0.001) return

            const mouseClipX = (lastZoomPositionX / CANVAS_WIDTH) * 2 - 1
            const mouseClipY = (lastZoomPositionY / CANVAS_HEIGHT) * 2 - 1

            const worldXBefore = cameraCenter.x + mouseClipX / cameraScaleX
            const worldYBefore = cameraCenter.y + mouseClipY / cameraScaleY

            zoomFactor += zoomDiff * zoomSmoothing
            updateCameraScaleFactors()

            const worldXAfter = cameraCenter.x + mouseClipX / cameraScaleX
            const worldYAfter = cameraCenter.y + mouseClipY / cameraScaleY

            const worldXCenter = worldXBefore - worldXAfter
            const worldYCenter = worldYBefore - worldYAfter
            cameraCenter.x += worldXCenter
            cameraCenter.y += worldYCenter
            targetCameraCenter.x += worldXCenter
            targetCameraCenter.y += worldYCenter

            cameraChanged = true
        }
        // -------------------------------------------------------------------------------------------------------------
        const initDriftCamera = () => {
            driftCamTransitionProgress = 0
            driftCamTime = 0
            driftCamLastTime = performance.now() / 1000

            const clamp = (v: number) => Math.max(-1, Math.min(1, v))
            // Calculates sine wave phase offsets so the drift camera starts smoothly from the current position without jumping and follows a "randomized" trajectory
            const findMatchingPhases = (target: number) => {
                const p2 = Math.random() * Math.PI * 2 // Random initial phase for the secondary wave
                const primaryWaveValue = (clamp(target) - Math.sin(p2) * 0.4) / 0.6 // Calculate the required phase for the primary wave to achieve the target position, given the random secondary wave phase and their respective amplitudes (0.6 and 0.4)
                const p1 = Math.asin(clamp(primaryWaveValue)) // Calculate the primary wave phase using arcsin, which gives a value between -π/2 and π/2. This ensures that the combined sine waves will start at the current camera position
                return { p1, p2 }
            }

            // Calculate the initial phases for X, Y, and Z (zoom) based on the current camera position and zoom level to ensure that when driftCam is enabled, the camera starts moving smoothly from its current position without any sudden jumps.
            const phasesX = findMatchingPhases((cameraCenter.x - SIM_WIDTH_HALF) / (SIM_WIDTH_HALF * driftCamAmplitude))
            const phasesY = findMatchingPhases((cameraCenter.y - SIM_HEIGHT_HALF) / (SIM_HEIGHT_HALF * driftCamAmplitude))
            const phasesZ = findMatchingPhases((zoomFactor - driftCamZoomCenter) / driftCamZoomAmplitude)

            driftCamPhase = { x1: phasesX.p1, x2: phasesX.p2, y1: phasesY.p1, y2: phasesY.p2, z1: phasesZ.p1, z2: phasesZ.p2}
        }
        const handleDriftCamera = () => {
            const now = performance.now() / 1000
            if (isDragging) {
                driftCamLastTime = now // Update last time to prevent large jumps in camera position when the user stops dragging after a long interaction
                driftCamTransitionProgress = 0 // Reset transition when users pans to allow for a smooth blend back to the drift trajectory when they stop interacting
                return
            }

            driftCamTransitionProgress += (1 - driftCamTransitionProgress) * driftCamSmoothing // Progressive transition towards the drift trajectory after pans/zooms, creating a smooth blending effect
            driftCamTime += (now - driftCamLastTime) * driftCamSpeed // Increment the drift camera's internal time based on the elapsed real time and the configured speed, ensuring consistent movement regardless of frame rate variations
            driftCamLastTime = now

            // Drift pan movement only when tracking is disabled
            if (!isTrackerActive) {
                // Horizontal pan using two combined sine waves
                const driftTargetX = SIM_WIDTH_HALF + (
                    Math.sin(driftCamTime * 1.0 + driftCamPhase.x1) * 0.6 +   // Primary wave (60%), base freq
                    Math.sin(driftCamTime * 1.618 + driftCamPhase.x2) * 0.4   // Secondary wave (40%), golden ratio freq
                ) * SIM_WIDTH_HALF * driftCamAmplitude

                // Vertical pan with offset frequencies for diagonal drift
                const driftTargetY = SIM_HEIGHT_HALF + (
                    Math.sin(driftCamTime * 1.1 + driftCamPhase.y1) * 0.6 +   // Primary wave (60%), slightly faster than X
                    Math.sin(driftCamTime * 1.414 + driftCamPhase.y2) * 0.4   // Secondary wave (40%), sqrt(2) freq
                ) * SIM_HEIGHT_HALF * driftCamAmplitude

                // Smoothly interpolate camera center towards the drift targets
                targetCameraCenter.x += (driftTargetX - targetCameraCenter.x) * driftCamTransitionProgress
                targetCameraCenter.y += (driftTargetY - targetCameraCenter.y) * driftCamTransitionProgress
            }

            // Zoom level with slower frequencies for smooth transitions
            const driftTargetZoom = driftCamZoomCenter + (
                Math.sin(driftCamTime * 0.7 + driftCamPhase.z1) * 0.6 +   // Primary wave (60%), slow zoom
                Math.sin(driftCamTime * 1.3 + driftCamPhase.z2) * 0.4     // Secondary wave (40%), faster variation
            ) * driftCamZoomAmplitude

            // Smoothly interpolate zoom towards the drift targets
            targetZoomFactor += (driftTargetZoom - targetZoomFactor) * driftCamTransitionProgress
        }
        const handleCameraTrackingMoveSmoothing = () => {
            if (!isDragging) {
                targetTrackerCameraOffset.x += (0 - targetTrackerCameraOffset.x) * panSmoothing
                targetTrackerCameraOffset.y += (0 - targetTrackerCameraOffset.y) * panSmoothing
            }

            const dx = targetTrackerCameraOffset.x - trackerCameraOffset.x
            const dy = targetTrackerCameraOffset.y - trackerCameraOffset.y
            if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
                if (!isDragging) {
                    trackerCameraOffset.x = 0
                    trackerCameraOffset.y = 0
                    targetTrackerCameraOffset.x = 0
                    targetTrackerCameraOffset.y = 0
                }
                return
            }
            trackerCameraOffset.x += dx * panSmoothing
            trackerCameraOffset.y += dy * panSmoothing
            device.queue.writeBuffer(trackerCameraOptionsBuffer!, 0, new Float32Array([
                trackerCameraOffset.x, trackerCameraOffset.y
            ]))
        }
        const handleCameraTrackingZoomSmoothing = () => {
            const zoomDiff = targetZoomFactor - zoomFactor
            if (Math.abs(zoomDiff) < 0.001) return

            zoomFactor += zoomDiff * zoomSmoothing
            updateCameraScaleFactors()

            cameraChanged = true
        }
        // -------------------------------------------------------------------------------------------------------------
        // GPU Tracker buffers
        let trackerStateBuffer: GPUBuffer | undefined
        let trackerLevelsBuffer: GPUBuffer | undefined
        let trackerCameraOptionsBuffer: GPUBuffer | undefined
        let trackerAccumulatePipeline: GPUComputePipeline
        let trackerFinalizePipeline: GPUComputePipeline
        let trackerCameraUpdatePipeline: GPUComputePipeline
        let trackerComputeBindGroupLayout: GPUBindGroupLayout
        let trackerComputeBindGroup: GPUBindGroup
        let trackerCameraUpdateBindGroupLayout: GPUBindGroupLayout
        let trackerCameraUpdateBindGroup: GPUBindGroup
        let trackerRenderBindGroup: GPUBindGroup

        let isTrackerActive: boolean = particleLife.isTrackerActive
        let isTrackerCameraActive: boolean = particleLife.isTrackerCameraActive
        let isTrackerIndicatorVisible: boolean = particleLife.isTrackerIndicatorVisible
        let isCameraTracking: boolean = isTrackerActive && isTrackerCameraActive
        let trackerCameraOffset: { x: number, y: number } = { x: 0, y: 0 }
        let targetTrackerCameraOffset: { x: number, y: number } = { x: 0, y: 0 }

        const startTrackerSelection = () => {
            particleLife.isTrackerSelectionActive = true
            particleLife.isRunning = false // Pause the simulation while selecting the tracker zone
            particleLife.isBrushActive = false // Disable brush while selecting tracker zone
            particleLife.isDriftCamActive = false
        }
        const cancelTrackerSelection = () => {
            particleLife.isTrackerSelectionActive = false
            particleLife.isRunning = true // Resume the simulation if tracker selection is canceled
        }
        const stopTracker = async () => {
            if (isTrackerCameraActive) await syncCameraFromGPU()
            resetTrackerCameraOffset()
            particleLife.isTrackerActive = false
            particleLife.isTrackerSelectionActive = false
            particleLife.isDriftCamActive = false
        }
        const resetTrackerCameraOffset = () => {
            trackerCameraOffset = { x: 0, y: 0 }
            targetTrackerCameraOffset = { x: 0, y: 0 }
            device.queue.writeBuffer(trackerCameraOptionsBuffer!, 0, new Float32Array([0, 0]))
        }
        // Syncs CPU camera to GPU camera position (used when switching between tracker camera and free camera modes to prevent jumps)
        const syncCameraFromGPU = async () => {
            if (!cameraBuffer) return

            const arrayBuffer = await readBufferFromGPU(cameraBuffer, 16)
            const cameraData = new Float32Array(arrayBuffer)

            cameraCenter.x = targetCameraCenter.x = cameraData[0]  // centerX
            cameraCenter.y = targetCameraCenter.y = cameraData[1]  // centerY
            cameraChanged = true
        }
        const onTrackerZoneSelected = async (zone: { x: number, y: number, width: number, height: number }) => {
            const scaledX = zone.x * DEVICE_PIXEL_RATIO
            const scaledY = zone.y * DEVICE_PIXEL_RATIO
            const scaledWidth = zone.width * DEVICE_PIXEL_RATIO
            const scaledHeight = zone.height * DEVICE_PIXEL_RATIO
            
            const centerScreenX = scaledX + scaledWidth / 2
            const centerScreenY = scaledY + scaledHeight / 2
            
            // Convert screen coordinates to world coordinates
            const worldX = cameraCenter.x + (centerScreenX / CANVAS_WIDTH * 2 - 1) / cameraScaleX
            const worldY = cameraCenter.y + (centerScreenY / CANVAS_HEIGHT * 2 - 1) / cameraScaleY

            // Calculate the world size of the selected zone based on the current camera zoom level
            const worldWidth = (scaledWidth / CANVAS_WIDTH) * 2 / cameraScaleX
            const worldHeight = (scaledHeight / CANVAS_HEIGHT) * 2 / cameraScaleY

            const success = await initializeTrackerFromZone({ x: worldX, y: worldY, width: worldWidth, height: worldHeight })
            
            if (success) particleLife.isTrackerActive = true
            particleLife.isTrackerSelectionActive = false
            particleLife.isRunning = true
        }
        // Initialize tracker state based on a user-selected zone, calculating the center of mass
        const initializeTrackerFromZone = async (zone: { x: number, y: number, width: number, height: number }): Promise<boolean> => {
            // Read the current particle positions and velocities from the GPU to calculate the center of mass and average
            const arrayBuffer = await readBufferFromGPU(particleBuffer!, NUM_PARTICLES * 5 * 4)
            const particles = new Float32Array(arrayBuffer)

            const zoneHalfW = zone.width * 0.5
            const zoneHalfH = zone.height * 0.5
            let sumX = 0, sumY = 0, sumVx = 0, sumVy = 0, count = 0

            // Get the center of mass and average velocity of particles within the selected zone
            for (let i = 0; i < NUM_PARTICLES; i++) {
                const idx = i * 5
                const px = particles[idx]
                const py = particles[idx + 1]

                if (Math.abs(px - zone.x) <= zoneHalfW && Math.abs(py - zone.y) <= zoneHalfH) {
                    sumX += px
                    sumY += py
                    sumVx += particles[idx + 2]
                    sumVy += particles[idx + 3]
                    count++
                }
            }
            
            if (count < 8) {
                error(`Not enough particles to track. <br> <b>${count}</b> found, <b>8</b> minimum.`)
                return false
            }

            // Calculate center of mass and average velocity for the selected particles
            const centerX = sumX / count
            const centerY = sumY / count
            const avgVx = sumVx / count
            const avgVy = sumVy / count

            // Determine the initial search radius
            const minRadius = Math.max(currentMaxRadius * 0.8, 16)
            const zoneRadius = Math.max(zoneHalfW, zoneHalfH)
            const initialSearchRadius = Math.max(zoneRadius, minRadius)
            
            // Initialize tracker state on GPU (32 bytes)
            const stateData = new ArrayBuffer(32)
            const view = new DataView(stateData)
            view.setFloat32(0, centerX, true)              // x
            view.setFloat32(4, centerY, true)              // y
            view.setFloat32(8, avgVx, true)                // vx
            view.setFloat32(12, avgVy, true)               // vy
            view.setFloat32(16, initialSearchRadius, true) // searchRadius
            view.setUint32(20, count, true)                // expectedCount
            view.setFloat32(24, cameraCenter.x, true)      // baseCameraX
            view.setFloat32(28, cameraCenter.y, true)      // baseCameraY
            device.queue.writeBuffer(trackerStateBuffer!, 0, stateData)

            // Clear levels buffer
            device.queue.writeBuffer(trackerLevelsBuffer!, 0, new ArrayBuffer(32 * 4)) // 128 bytes for 4 levels

            if (isTrackerCameraActive) {
                targetCameraCenter.x = centerX
                targetCameraCenter.y = centerY
            }

            success(`Creature <b>locked</b> - now tracking.`)
            return true
        }
        const computeTracking = (encoder: GPUCommandEncoder) => {
            if (!trackerStateBuffer || !trackerLevelsBuffer) return

            const accumulatePass = encoder.beginComputePass()
            accumulatePass.setPipeline(trackerAccumulatePipeline)
            accumulatePass.setBindGroup(0, trackerComputeBindGroup)
            accumulatePass.setBindGroup(1, simOptionsBindGroup)
            accumulatePass.setBindGroup(2, deltaTimeBindGroup)
            accumulatePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 256))
            accumulatePass.end()

            const finalizePass = encoder.beginComputePass()
            finalizePass.setPipeline(trackerFinalizePipeline)
            finalizePass.setBindGroup(0, trackerComputeBindGroup)
            finalizePass.setBindGroup(1, simOptionsBindGroup)
            finalizePass.setBindGroup(2, deltaTimeBindGroup)
            finalizePass.dispatchWorkgroups(1)
            finalizePass.end()
            
            if (isTrackerCameraActive) computeTrackerCameraUpdate(encoder)
        }
        const computeTrackerCameraUpdate = (encoder: GPUCommandEncoder) => {
            const cameraUpdatePass = encoder.beginComputePass()
            cameraUpdatePass.setPipeline(trackerCameraUpdatePipeline)
            cameraUpdatePass.setBindGroup(0, trackerCameraUpdateBindGroup)
            cameraUpdatePass.dispatchWorkgroups(1)
            cameraUpdatePass.end()
        }
        const renderTrackerIndicator = (encoder: GPUCommandEncoder) => {
            const renderPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: ctx.getCurrentTexture().createView(),
                    loadOp: 'load',
                    storeOp: 'store',
                }],
            })
            renderPass.setPipeline(renderTrackerPipeline)
            renderPass.setBindGroup(0, cameraBindGroup)
            renderPass.setBindGroup(1, trackerRenderBindGroup)
            renderPass.setBindGroup(2, deltaTimeBindGroup)
            renderPass.setBindGroup(3, simOptionsBindGroup)
            renderPass.draw(4, 1, 0, 0)
            renderPass.end()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const initWebGPU = async () => {
            const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
            if (!adapter) throw new Error("WebGPU adapter not found")
            device = await adapter.requestDevice()
            ctx = canvasRef.value!.getContext('webgpu')!
            ctx.configure({
                device,
                format: navigator.gpu.getPreferredCanvasFormat(),
                alphaMode: 'opaque',
                colorSpace: 'srgb',
            })
        }
        const initLife = async (autoCenter: boolean = true) => {
            isInitializing = true
            setRulesMatrix(generateRules(0, NUM_TYPES)) // Random rule
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
            // setRulesMatrix([[-0.2758, -0.9341, -0.7292, -0.2024, -0.4367, -0.4714, -0.8962],[0.3548, -0.4365, -0.5117, -0.3945, -0.7828, 0.7885, 0.4696],[-0.9114, -0.8742, -0.5724, 0.1277, 0.3471, 0.3468, -0.6377],[0.3619, 0.6267, -0.6251, -0.1823, -0.285, -0.7255, 0.4615],[-0.2717, 0.9975, -0.4783, -0.9001, -0.2176, -0.9916, -0.4428],[-0.133, -0.342, -0.5631, 0.1238, -0.2723, -0.7484, 0.8461],[0.571, -0.7669, 0.0851, 0.5078, 0.8143, -0.7627, 0.7893]])
            // setMinRadiusMatrix([[25, 39, 37, 31, 31, 40, 30],[33, 27, 37, 33, 40, 33, 40],[26, 31, 25, 30, 32, 34, 39],[33, 27, 33, 39, 34, 25, 38],[28, 32, 31, 30, 40, 37, 30],[39, 39, 38, 35, 25, 31, 40],[33, 36, 29, 35, 30, 25, 40]])
            // setMaxRadiusMatrix([[65, 72, 80, 66, 72, 67, 79],[69, 61, 75, 73, 69, 70, 73],[80, 69, 71, 74, 67, 62, 61],[73, 79, 70, 70, 70, 72, 79],[67, 65, 74, 76, 64, 77, 71],[61, 68, 72, 64, 69, 64, 79],[72, 68, 77, 74, 63, 70, 75]])
            // particleLife.currentMaxRadius = 80

            console.log("Rules Matrix:", rulesMatrix);
            console.log("Min Radius Matrix:", minRadiusMatrix);
            console.log("Max Radius Matrix:", maxRadiusMatrix);

            await nextTick()
            if (autoCenter) centerView()

            initColors()
            initParticles()
            createBuffers()
            createBindGroupLayouts()
            createPipelines()
            createBindGroups()

            isInitializing = false
            lastFrameTime = performance.now()
            animationFrameId = requestAnimationFrame(frame)
        }
        const regenerateLife = async () => {
            if (isTrackerActive) await stopTracker()
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            await destroyBuffers(true)
            await initLife(false)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        let pendingFrames: number = 0
        const frame = async () => {
            // Wait for the GPU to finish processing before starting a new frame (to avoid overloading the GPU)
            // Produces flickering if the GPU is not fast enough
            // if (pendingFrames > 3) {
            //     animationFrameId = requestAnimationFrame(frame)
            //     return
            // }

            if (isDriftCamActive) handleDriftCamera()
            if (isCameraTracking) {
                handleCameraTrackingMoveSmoothing()
                handleCameraTrackingZoomSmoothing()
            } else {
                handleMoveSmoothing()
                handleZoomSmoothing()
            }

            if (isBrushActive && showBrushCircle) updateBrushOptionsBuffer()
            if (!isEraseCompleting) { // Prevent buffer mutations while async erase completion is pending
                if (isBrushErasing) eraseWithBrush()
                else if (isEraseCompletionPending) completeEraseWithBrush()
                else if (isBrushDrawing) drawWithBrush()
                else if (isUpdateNumParticlesPending) await updateNumParticles(NEW_NUM_PARTICLES)
                else if (isUpdateNumTypesPending) await updateNumTypes(NEW_NUM_TYPES)
            }

            const startExecutionTime = performance.now()
            if (isRunning) {
                handleDeltaTime(startExecutionTime)
                step()
            } else {
                const encoder = device.createCommandEncoder()
                if (isCameraTracking) computeTrackerCameraUpdate(encoder)
                renderParticles(encoder)
                if (isDebugBinsActive && useSpatialHash) renderDebugBins(encoder)
                if (isBrushActive && showBrushCircle) renderBrushCircle(encoder)
                if (isTrackerActive && isTrackerIndicatorVisible) renderTrackerIndicator(encoder)
                device.queue.submit([encoder.finish()])
            }
            // device.queue.onSubmittedWorkDone().then(() => executionTime.value = performance.now() - startExecutionTime) // Approximate execution time of the GPU commands
            lastFramePointerX = pointerX
            lastFramePointerY = pointerY
            hasUpdateNumParticles = false

            // // Wait for the GPU to finish processing before starting a new frame
            // ++pendingFrames
            // device.queue.onSubmittedWorkDone().then(() => { --pendingFrames })

            animationFrameId = requestAnimationFrame(frame)
        }
        // -------------------------------------------------------------------------------------------------------------
        const handleDeltaTime = (startExecutionTime: number) => {
            const deltaTime = Math.min((startExecutionTime - lastFrameTime) / 1000, 0.1) // Cap deltaTime to avoid spikes
            lastFrameTime = startExecutionTime
            const lastSmoothedDeltaTime = smoothedDeltaTime
            smoothedDeltaTime = smoothedDeltaTime * (1 - 0.01) + deltaTime * 0.01 // Smooth the delta time

            // Only update the delta time buffer if it has changed significantly
            if (Math.round(lastSmoothedDeltaTime * 1000) !== Math.round(smoothedDeltaTime * 1000)) {
                device.queue.writeBuffer(deltaTimeBuffer!, 0, new Float32Array([smoothedDeltaTime]))
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        const step = () => {
            const encoder = device.createCommandEncoder()

            if (!useSpatialHash) {
                encoder.copyBufferToBuffer(particleBuffer!, 0, particleTempBuffer!, 0, particleBuffer!.size)
            }
            if (useSpatialHash) computeBinning(encoder)
            else computeBruteForce(encoder)
            computeAdvance(encoder)
            
            if (isTrackerActive) computeTracking(encoder)
            
            renderParticles(encoder)

            if (isDebugBinsActive && useSpatialHash) renderDebugBins(encoder)
            if (isBrushActive && showBrushCircle) renderBrushCircle(encoder)
            if (isTrackerActive && isTrackerIndicatorVisible) renderTrackerIndicator(encoder)

            device.queue.submit([encoder.finish()])
        }
        // -------------------------------------------------------------------------------------------------------------
        const computeBruteForce = (encoder: GPUCommandEncoder) => {
            const computePass = encoder.beginComputePass()
            computePass.setPipeline(bruteForceComputePipeline)
            computePass.setBindGroup(0, bruteForceBindGroup)
            computePass.setBindGroup(1, simOptionsBindGroup)
            computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            computePass.end()
        }
        const computeBinning = (encoder: GPUCommandEncoder) => {
            const binningComputePass = encoder.beginComputePass()
            binningComputePass.setPipeline(binClearSizePipeline)
            binningComputePass.setBindGroup(0, particleBufferReadOnlyBindGroup)
            binningComputePass.setBindGroup(1, simOptionsBindGroup)
            binningComputePass.setBindGroup(2, binFillSizeBindGroup)
            binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))

            binningComputePass.setPipeline(binFillSizePipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))

            binningComputePass.setPipeline(binPrefixSumPipeline)
            for (let i = 0; i < prefixSumIterations; ++i) {
                binningComputePass.setBindGroup(0, binPrefixSumBindGroup[i % 2], [i * 256])
                binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))
            }

            binningComputePass.setPipeline(particleSortClearSizePipeline)
            binningComputePass.setBindGroup(0, particleSortBindGroup)
            binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))

            binningComputePass.setPipeline(particleSortPipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            binningComputePass.end()

            const forcesComputePass = encoder.beginComputePass()
            forcesComputePass.setPipeline(particleComputeForcesPipeline)
            forcesComputePass.setBindGroup(0, particleComputeForcesBindGroup)
            forcesComputePass.setBindGroup(1, simOptionsBindGroup)
            forcesComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            forcesComputePass.end()
        }
        const computeAdvance = (encoder: GPUCommandEncoder) => {
            if (isApplyingBrushForce) {
                if (!showBrushCircle) updateBrushOptionsBuffer() // Condition prevents duplicate updates

                const advanceBrushComputePass = encoder.beginComputePass()
                advanceBrushComputePass.setPipeline(particleAdvanceBrushPipeline)
                advanceBrushComputePass.setBindGroup(0, particleBufferBindGroup)
                advanceBrushComputePass.setBindGroup(1, simOptionsBindGroup)
                advanceBrushComputePass.setBindGroup(2, deltaTimeBindGroup)
                advanceBrushComputePass.setBindGroup(3, brushOptionsBindGroup)
                advanceBrushComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                advanceBrushComputePass.end()
            } else {
                const advanceComputePass = encoder.beginComputePass()
                advanceComputePass.setPipeline(particleAdvancePipeline)
                advanceComputePass.setBindGroup(0, particleBufferBindGroup)
                advanceComputePass.setBindGroup(1, simOptionsBindGroup)
                advanceComputePass.setBindGroup(2, deltaTimeBindGroup)
                advanceComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                advanceComputePass.end()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const renderParticles = (encoder: GPUCommandEncoder) => {
            if (cameraChanged) {
                if (isCameraTracking) { // Only update zoom factors when tracking (position is handled by the tracker camera compute shader)
                    device.queue.writeBuffer(cameraBuffer!, 8, new Float32Array([cameraScaleX, cameraScaleY]))
                } else {
                    device.queue.writeBuffer(cameraBuffer!, 0, new Float32Array([
                        cameraCenter.x, cameraCenter.y, cameraScaleX, cameraScaleY
                    ]))
                }
                updateInfiniteRenderOptions()
                cameraChanged = false
            }

            if (isParticleGlow) {
                const hdrRenderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: hdrTextureView,
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                })
                hdrRenderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                hdrRenderPass.setBindGroup(1, simOptionsBindGroup)
                hdrRenderPass.setBindGroup(2, cameraBindGroup)
                if (isMirrorWrap) {
                    hdrRenderPass.setBindGroup(3, glowOptionsBindGroup)
                    hdrRenderPass.setPipeline(renderMirrorGlowPipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES * mirrorWrapCount)
                    hdrRenderPass.setPipeline(isAdditiveBlending ? renderMirrorCirclePipelineAdditive : renderMirrorCirclePipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES * mirrorWrapCount)
                    hdrRenderPass.end()
                } else if (isInfiniteMirrorWrap) {
                    hdrRenderPass.setBindGroup(3, infiniteRenderOptionsBindGroup)
                    hdrRenderPass.setPipeline(renderInfiniteGlowPipeline)
                    hdrRenderPass.draw(4, infiniteTotalInstances)
                    hdrRenderPass.setPipeline(isAdditiveBlending ? renderInfiniteCirclePipelineAdditive : renderInfiniteCirclePipeline)
                    hdrRenderPass.draw(4, infiniteTotalInstances)
                    hdrRenderPass.end()
                } else {
                    hdrRenderPass.setBindGroup(3, glowOptionsBindGroup)
                    hdrRenderPass.setPipeline(renderGlowPipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES)
                    hdrRenderPass.setPipeline(isAdditiveBlending ? renderCirclePipelineAdditive : renderCirclePipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES)
                    hdrRenderPass.end()
                }
                const composePass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                })
                composePass.setPipeline(composeHdrPipeline)
                composePass.setBindGroup(0, composeHdrBindGroup)
                composePass.draw(3)
                composePass.end()
            }
            else if (isMirrorWrap) {
                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        storeOp: 'store',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }
                    }]
                })
                renderPass.setPipeline(isAdditiveBlending ? renderMirrorPipelineAdditive : renderMirrorPipeline)
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.setBindGroup(3, glowOptionsBindGroup)
                renderPass.draw(4, NUM_PARTICLES * mirrorWrapCount)
                renderPass.end()
            }
            else if (isInfiniteMirrorWrap) {
                // renderInfiniteMirrorWithOffscreenTexture(encoder)

                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store'
                    }]
                })
                renderPass.setPipeline(isAdditiveBlending ? renderInfinitePipelineAdditive : renderInfinitePipeline)
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.setBindGroup(3, infiniteRenderOptionsBindGroup)
                renderPass.draw(4, infiniteTotalInstances)
                renderPass.end()
            }
            else {
                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store',
                    }],
                })
                renderPass.setPipeline(isAdditiveBlending ? renderPipelineAdditive : renderPipeline)
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.draw(4, NUM_PARTICLES)
                renderPass.end()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        const renderBrushCircle = (encoder: GPUCommandEncoder) => {
            const renderPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: ctx.getCurrentTexture().createView(),
                    loadOp: 'load',
                    storeOp: 'store',
                }],
            })
            renderPass.setPipeline(renderBrushCirclePipeline)
            renderPass.setBindGroup(0, cameraBindGroup)
            renderPass.setBindGroup(1, renderBrushCircleBindGroup)
            renderPass.draw(4, 1, 0, 0)
            renderPass.end()
        }
        // -------------------------------------------------------------------------------------------------------------
        const renderDebugBins = (encoder: GPUCommandEncoder) => {
            if (!isRunning && hasUpdateNumParticles) { // Compute binning for debug rendering only when not running so new particles are ordered correctly
                const binningComputePass = encoder.beginComputePass()
                binningComputePass.setPipeline(binClearSizePipeline)
                binningComputePass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                binningComputePass.setBindGroup(1, simOptionsBindGroup)
                binningComputePass.setBindGroup(2, binFillSizeBindGroup)
                binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))
                binningComputePass.setPipeline(binFillSizePipeline)
                binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                binningComputePass.setPipeline(binPrefixSumPipeline)
                for (let i = 0; i < prefixSumIterations; ++i) {
                    binningComputePass.setBindGroup(0, binPrefixSumBindGroup[i % 2], [i * 256])
                    binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))
                }
                binningComputePass.end()
            }

            const renderPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: ctx.getCurrentTexture().createView(),
                    loadOp: 'load',
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    storeOp: 'store',
                }],
            })
            renderPass.setPipeline(renderDebugBinsPipeline)
            renderPass.setBindGroup(0, renderDebugBinsBindGroup)
            renderPass.setBindGroup(1, debugOptionsBindGroup)
            renderPass.setBindGroup(2, simOptionsBindGroup)
            renderPass.setBindGroup(3, cameraBindGroup)
            renderPass.draw(4, binCount, 0, 0)
            renderPass.end()
        }
        // -------------------------------------------------------------------------------------------------------------
        const renderInfiniteMirrorWithOffscreenTexture = (encoder: GPUCommandEncoder) => {
            const renderOffscreenPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: offscreenTextureView,
                    loadOp: 'clear',
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    storeOp: 'store',
                }],
            })
            renderOffscreenPass.setPipeline(renderOffscreenPipeline)
            renderOffscreenPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
            renderOffscreenPass.setBindGroup(1, simOptionsBindGroup)
            renderOffscreenPass.draw(4, NUM_PARTICLES)
            renderOffscreenPass.end()

            const renderInfinitePass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: ctx.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    storeOp: 'store'
                }]
            })
            renderInfinitePass.setPipeline(composeInfinitePipeline)
            renderInfinitePass.setBindGroup(0, cameraBindGroup)
            renderInfinitePass.setBindGroup(1, simOptionsBindGroup)
            renderInfinitePass.setBindGroup(2, offscreenTextureBindGroup)
            renderInfinitePass.draw(3, 1)
            renderInfinitePass.end()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBuffers = () => {
            updateSimOptionsBuffer() // Set simulation options based on the store state
            updateInteractionMatrixBuffer() // Set interaction matrices based on the store state
            updateParticleBuffers(true)
            updateEraseCompactBuffers()
            updateBinningBuffers()
            updateColorBuffer()
            updateGlowOptionsBuffer()
            updateBrushOptionsBuffer()
            updateBrushesBuffer()
            updateDebugOptionsBuffer()
            createTrackerComputeBuffers()
            // ----------------------------------------------------------------------------------------------
            const cameraData = new Float32Array([cameraCenter.x, cameraCenter.y, cameraScaleX, cameraScaleY])
            cameraBuffer = device.createBuffer({
                size: cameraData.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true
            });
            new Float32Array(cameraBuffer.getMappedRange()).set(cameraData)
            cameraBuffer.unmap()

            deltaTimeBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(deltaTimeBuffer.getMappedRange()).set([smoothedDeltaTime])
            deltaTimeBuffer.unmap()

            const infiniteRenderOptionsData = new Int32Array(4) // startX, startY, numCopiesX, numCopiesY
            infiniteRenderOptionsBuffer = device.createBuffer({
                size: infiniteRenderOptionsData.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Int32Array(infiniteRenderOptionsBuffer.getMappedRange()).set(infiniteRenderOptionsData)
            infiniteRenderOptionsBuffer.unmap()
            updateInfiniteRenderOptions()

            newParticleCountBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            })
            newParticleCountReadBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            })
        }
        const updateColorBuffer = () => {
            const paddedSize = Math.ceil(colors.byteLength / 16) * 16 // Ensure padded to 16 bytes
            if (!colorBuffer || colorBuffer.size !== paddedSize) {
                if (colorBuffer) colorBuffer?.destroy(); colorBuffer = undefined;
                colorBuffer = device.createBuffer({
                    size: paddedSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Float32Array(colorBuffer.getMappedRange()).set(colors)
                colorBuffer.unmap()
            } else {
                const paddedColors = new Float32Array(paddedSize / 4)
                paddedColors.set(colors)
                device.queue.writeBuffer(colorBuffer!, 0, paddedColors)
            }
        }
        const updateParticleBuffers = (hasInitialParticles: boolean = false) => {
            if (particleBuffer) particleBuffer?.destroy(); particleBuffer = undefined;
            if (particleTempBuffer) particleTempBuffer?.destroy(); particleTempBuffer = undefined;

            particleBuffer = device.createBuffer({
                size: NUM_PARTICLES * 20,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
                mappedAtCreation: hasInitialParticles,
            })
            if (hasInitialParticles) {
                new Float32Array(particleBuffer.getMappedRange()).set(initialParticles)
                particleBuffer.unmap()
            }
            particleTempBuffer = device.createBuffer({
                size: particleBuffer.size,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
        }
        const updateEraseCompactBuffers = () => {
            if (particleKeepFlagsBuffer) particleKeepFlagsBuffer.destroy(); particleKeepFlagsBuffer = undefined
            if (particleCompactBuffer) particleCompactBuffer.destroy(); particleCompactBuffer = undefined
            particleKeepFlagsBuffer = device.createBuffer({
                size: NUM_PARTICLES * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            particleCompactBuffer = device.createBuffer({
                size: NUM_PARTICLES * 5 * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            })
        }
        const updateBinningBuffers = () => {
            if (binOffsetBuffer) binOffsetBuffer.destroy(); binOffsetBuffer = undefined;
            if (binOffsetTempBuffer) binOffsetTempBuffer.destroy(); binOffsetTempBuffer = undefined;
            if (binPrefixSumStepSizeBuffer) binPrefixSumStepSizeBuffer.destroy(); binPrefixSumStepSizeBuffer = undefined;

            binOffsetBuffer = device.createBuffer({
                size: (binCount + 1) * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            })
            binOffsetTempBuffer = device.createBuffer({
                size: (binCount + 1) * 4,
                usage: GPUBufferUsage.STORAGE,
            })

            const binPrefixSumStepSize = new Uint32Array(prefixSumIterations * 64)
            for (let i = 0; i < prefixSumIterations; ++i) {
                binPrefixSumStepSize[i * 64] = Math.pow(2, i)
            }
            binPrefixSumStepSizeBuffer = device.createBuffer({
                size: prefixSumIterations * 256,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
                mappedAtCreation: true
            })
            new Uint32Array(binPrefixSumStepSizeBuffer.getMappedRange()).set(binPrefixSumStepSize)
            binPrefixSumStepSizeBuffer.unmap()
        }
        // -------------------------------------------------------------------------------------------------------------
        const updateBrushesBuffer = () => {
            if (brushesBuffer) brushesBuffer.destroy(); brushesBuffer = undefined;

            const selectedTypes = new Uint32Array(brushes)
            const bufferSize = 8 + selectedTypes.byteLength

            brushesBuffer = device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })

            device.queue.writeBuffer(brushesBuffer, 0, new Uint32Array([selectedTypes.length]))
            if (selectedTypes.length > 0) {
                device.queue.writeBuffer(brushesBuffer, 4, selectedTypes)
            }
            if (brushOptionsBindGroup) updateBrushesBindGroup()
        }
        const updateBrushOptionsBuffer = () => {
            const brushClipX = pointerX / CANVAS_WIDTH * 2 - 1
            const brushClipY = pointerY / CANVAS_HEIGHT * 2 - 1
            const brushVx = (pointerX - lastFramePointerX) / (cameraScaleX * CANVAS_WIDTH * 0.5) / smoothedDeltaTime
            const brushVy = (pointerY - lastFramePointerY) / (cameraScaleY * CANVAS_HEIGHT * 0.5) / smoothedDeltaTime

            const brushForce = brushType === 1 ? brushIntensity : brushType === 2 ? repulseForce : attractForce

            const brushOptionsData = new ArrayBuffer(28)
            const brushOptionsView = new DataView(brushOptionsData)
            brushOptionsView.setFloat32(0, brushClipX, true)
            brushOptionsView.setFloat32(4, brushClipY, true)
            brushOptionsView.setFloat32(8, brushVx, true)
            brushOptionsView.setFloat32(12, brushVy, true)
            brushOptionsView.setFloat32(16, brushRadius, true)
            brushOptionsView.setFloat32(20, brushForce, true)
            brushOptionsView.setFloat32(24, brushDirectionalForce, true)

            if (!brushOptionsBuffer) {
                brushOptionsBuffer = device.createBuffer({
                    size: brushOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(brushOptionsBuffer.getMappedRange()).set(new Uint8Array(brushOptionsData))
                brushOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(brushOptionsBuffer, 0, brushOptionsData)
            }
        }
        const updateInfiniteRenderOptions = () => {
            if (!isInfiniteMirrorWrap) return

            const viewWidth = 2.0 / cameraScaleX
            const viewHeight = 2.0 / cameraScaleY

            const viewLeft = cameraCenter.x - viewWidth / 2
            const viewRight = cameraCenter.x + viewWidth / 2
            const viewTop = cameraCenter.y - viewHeight / 2
            const viewBottom = cameraCenter.y + viewHeight / 2

            const startX = Math.floor(viewLeft / SIM_WIDTH)
            const endX = Math.ceil(viewRight / SIM_WIDTH)
            const startY = Math.floor(viewTop / SIM_HEIGHT)
            const endY = Math.ceil(viewBottom / SIM_HEIGHT)

            const numCopiesX = endX - startX
            const numCopiesY = endY - startY

            infiniteTotalInstances = NUM_PARTICLES * numCopiesX * numCopiesY

            device.queue.writeBuffer(infiniteRenderOptionsBuffer!, 0, new Int32Array([startX, startY, numCopiesX, numCopiesY]))
        }
        const updateGlowOptionsBuffer = () => {
            const glowOptionsData = new ArrayBuffer(12)
            const glowOptionsView = new DataView(glowOptionsData)
            glowOptionsView.setFloat32(0, glowSize, true)
            glowOptionsView.setFloat32(4, glowIntensity, true)
            glowOptionsView.setFloat32(8, glowSteepness, true)

            if (!glowOptionsBuffer) {
                glowOptionsBuffer = device.createBuffer({
                    size: glowOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(glowOptionsBuffer.getMappedRange()).set(new Uint8Array(glowOptionsData))
                glowOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(glowOptionsBuffer, 0, glowOptionsData)
            }
        }
        const updateSimOptionsBuffer = () => {
            const simOptionsData = new ArrayBuffer(80)
            const simOptionsView = new DataView(simOptionsData)
            simOptionsView.setFloat32(0, SIM_WIDTH, true)
            simOptionsView.setFloat32(4, SIM_HEIGHT, true)
            simOptionsView.setUint32(8, GRID_WIDTH, true)
            simOptionsView.setUint32(12, GRID_HEIGHT, true)
            simOptionsView.setFloat32(16, CELL_SIZE, true)
            simOptionsView.setUint32(20, NUM_PARTICLES, true)
            simOptionsView.setUint32(24, NUM_TYPES, true)
            simOptionsView.setFloat32(28, PARTICLE_SIZE, true)
            simOptionsView.setFloat32(32, particleOpacity, true)
            simOptionsView.setUint32(36, isWallRepel ? 1 : 0, true)
            simOptionsView.setUint32(40, isWallWrap ? 1 : 0, true)
            simOptionsView.setFloat32(44, forceFactor, true)
            simOptionsView.setFloat32(48, frictionFactor, true)
            simOptionsView.setFloat32(52, repel, true)
            // Extended grid parameters for spatial hashing no walls
            simOptionsView.setUint32(56, EXTENDED_GRID_WIDTH, true)
            simOptionsView.setUint32(60, EXTENDED_GRID_HEIGHT, true)
            simOptionsView.setUint32(64, GRID_OFFSET_X, true)
            simOptionsView.setUint32(68, GRID_OFFSET_Y, true)
            simOptionsView.setUint32(72, mirrorWrapCount, true)
            simOptionsView.setUint32(76, CELL_SUBDIVISIONS, true)

            if (!simOptionsBuffer) {
                simOptionsBuffer = device.createBuffer({
                    size: simOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(simOptionsBuffer.getMappedRange()).set(new Uint8Array(simOptionsData))
                simOptionsBuffer.unmap()
            } else if (isEraseCompletionPending) {
                // Skip writing numParticles during erase to avoid conflicts with GPU-side copyBufferToBuffer
                device.queue.writeBuffer(simOptionsBuffer, 0, simOptionsData, 0, 20)
                device.queue.writeBuffer(simOptionsBuffer, 24, simOptionsData, 24, 56)
            } else {
                device.queue.writeBuffer(simOptionsBuffer, 0, simOptionsData)
            }
        }
        const updateDebugOptionsBuffer = () => {
            const debugOptionsData = new ArrayBuffer(8)
            const debugOptionsView = new DataView(debugOptionsData)
            debugOptionsView.setUint32(0, isDebugHeatmapActive ? 1 : 0, true)
            debugOptionsView.setFloat32(4, debugMaxParticleCount, true)

            if (!debugOptionsBuffer) {
                debugOptionsBuffer = device.createBuffer({
                    size: debugOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(debugOptionsBuffer.getMappedRange()).set(new Uint8Array(debugOptionsData))
                debugOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(debugOptionsBuffer, 0, debugOptionsData)
            }
        }
        const createTrackerComputeBuffers = () => {
            trackerStateBuffer = device.createBuffer({
                size: 32, // x, y, vx, vy, searchRadius, expectedCount, _padding1, _padding2
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            })
            trackerLevelsBuffer = device.createBuffer({
                size: 32 * 4, // 128 bytes for 4 levels
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            trackerCameraOptionsBuffer = device.createBuffer({
                size: 16, // panOffsetX, panOffsetY, smoothing, _padding
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            })
            new Float32Array(trackerCameraOptionsBuffer.getMappedRange()).set([0, 0, particleLife.trackerCameraSmoothing, 0])
            trackerCameraOptionsBuffer.unmap()
            trackerCameraOffset = { x: 0, y: 0 }
            targetTrackerCameraOffset = { x: 0, y: 0 }
        }
        const updateInteractionMatrixBuffer = () => {
            const stride = 4; // 4 octets par couple
            const interactionData = new Uint8Array(NUM_TYPES * NUM_TYPES * stride);
            for (let a = 0; a < NUM_TYPES; a++) {
                for (let b = 0; b < NUM_TYPES; b++) {
                    const index = (a * NUM_TYPES + b) * stride;
                    interactionData[index] = Math.round((rulesMatrix[a][b] + 1) * 0.5 * 255); // rule u8
                    interactionData[index + 1] = Math.round(minRadiusMatrix[a][b]); // minR u8
                    const maxR = maxRadiusMatrix[a][b];
                    interactionData[index + 2] = maxR & 0xFF; // maxR low byte
                    interactionData[index + 3] = (maxR >> 8) & 0xFF; // maxR high byte
                }
            }

            const paddedSize = Math.ceil(interactionData.byteLength / 16) * 16 // Ensure padded to 16 bytes
            const paddedInteractionData = new Uint8Array(paddedSize)
            paddedInteractionData.set(interactionData)

            if (!interactionMatrixBuffer || interactionMatrixBuffer.size !== paddedSize) {
                if (interactionMatrixBuffer) interactionMatrixBuffer.destroy(); interactionMatrixBuffer = undefined;
                interactionMatrixBuffer = device.createBuffer({
                    size: paddedSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Uint8Array(interactionMatrixBuffer.getMappedRange()).set(paddedInteractionData)
                interactionMatrixBuffer.unmap()
            } else {
                device.queue.writeBuffer(interactionMatrixBuffer, 0, paddedInteractionData)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroups = () => {
            updateBinningBindGroups()
            updateParticleBindGroups()
            updateEraseCompactBindGroups()
            updateOffscreenTextureBindGroup()
            updateComposeHdrBindGroup()
            updateBrushesBindGroup()
            // ---------------------------------------------------------------------------------------------------------
            simOptionsBindGroup = device.createBindGroup({
                layout: simOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: simOptionsBuffer! } },
                ],
            })
            deltaTimeBindGroup = device.createBindGroup({
                layout: deltaTimeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: deltaTimeBuffer! } },
                ],
            })
            cameraBindGroup = device.createBindGroup({
                layout: cameraBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: cameraBuffer! } },
                ],
            })
            glowOptionsBindGroup = device.createBindGroup({
                layout: glowOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: glowOptionsBuffer! } },
                ],
            })
            infiniteRenderOptionsBindGroup = device.createBindGroup({
                layout: infiniteRenderOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: glowOptionsBuffer! } },
                    { binding: 1, resource: { buffer: infiniteRenderOptionsBuffer! } },
                ],
            })
            renderBrushCircleBindGroup = device.createBindGroup({
                layout: renderBrushCircleBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: brushOptionsBuffer! } },
                ],
            })
            debugOptionsBindGroup = device.createBindGroup({
                layout: debugOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: debugOptionsBuffer! } },
                ],
            })
            trackerRenderBindGroup = device.createBindGroup({
                layout: trackerRenderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: trackerStateBuffer! } },
                ],
            })
            trackerCameraUpdateBindGroup = device.createBindGroup({
                layout: trackerCameraUpdateBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: trackerStateBuffer! } },
                    { binding: 1, resource: { buffer: cameraBuffer! } },
                    { binding: 2, resource: { buffer: trackerCameraOptionsBuffer! } },
                ],
            })
        }
        const updateBrushesBindGroup = () => {
            brushOptionsBindGroup = undefined as any
            brushOptionsBindGroup = device.createBindGroup({
                layout: brushOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: brushOptionsBuffer! } },
                    { binding: 1, resource: { buffer: brushesBuffer! } },
                    { binding: 2, resource: { buffer: cameraBuffer! } },
                ],
            })
        }
        const updateBinningBindGroups = () => {
            binFillSizeBindGroup = device.createBindGroup({
                layout: binFillSizeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } }
                ],
            })
            binPrefixSumBindGroup[0] = device.createBindGroup({
                layout: binPrefixSumBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } },
                    { binding: 1, resource: { buffer: binOffsetTempBuffer! } },
                    { binding: 2, resource: { buffer: binPrefixSumStepSizeBuffer!, size: 4 } },
                ],
            })
            binPrefixSumBindGroup[1] = device.createBindGroup({
                layout: binPrefixSumBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetTempBuffer! } },
                    { binding: 1, resource: { buffer: binOffsetBuffer! } },
                    { binding: 2, resource: { buffer: binPrefixSumStepSizeBuffer!, size: 4 } },
                ],
            })
            renderDebugBinsBindGroup = device.createBindGroup({
                layout: renderDebugBinsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } },
                    { binding: 1, resource: heatmapTextureView! },
                    { binding: 2, resource: heatmapSampler! }
                ],
            })
        }
        const updateParticleBindGroups = () => {
            particleBufferBindGroup = undefined as any;
            particleBufferReadOnlyBindGroup = undefined as any;
            particleSortBindGroup = undefined as any;
            particleComputeForcesBindGroup = undefined as any;
            bruteForceBindGroup = undefined as any;
            trackerComputeBindGroup = undefined as any;

            particleBufferBindGroup = device.createBindGroup({
                layout: particleBufferBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: interactionMatrixBuffer! } },
                ],
            })
            particleBufferReadOnlyBindGroup = device.createBindGroup({
                layout: particleBufferReadOnlyBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: colorBuffer! } }
                ],
            })
            particleSortBindGroup = device.createBindGroup({
                layout: particleSortBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: particleTempBuffer! } },
                    { binding: 2, resource: { buffer: binOffsetBuffer! } },
                    { binding: 3, resource: { buffer: binOffsetTempBuffer! } },
                ],
            })
            particleComputeForcesBindGroup = device.createBindGroup({
                layout: particleComputeForcesBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleTempBuffer! } },
                    { binding: 1, resource: { buffer: particleBuffer! } },
                    { binding: 2, resource: { buffer: binOffsetBuffer! } },
                    { binding: 3, resource: { buffer: interactionMatrixBuffer! } },
                ],
            })
            bruteForceBindGroup = device.createBindGroup({
                layout: bruteForceBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleTempBuffer! } },
                    { binding: 1, resource: { buffer: particleBuffer! } },
                    { binding: 2, resource: { buffer: interactionMatrixBuffer! } },
                ],
            })
            trackerComputeBindGroup = device.createBindGroup({
                layout: trackerComputeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: trackerStateBuffer! } },
                    { binding: 2, resource: { buffer: trackerLevelsBuffer! } },
                ],
            })
        }
        const updateEraseCompactBindGroups = () => {
            particleEraseBindGroup = undefined as any;
            particleCompactBindGroup = undefined as any;

            particleEraseBindGroup = device.createBindGroup({
                layout: particleEraseBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: particleKeepFlagsBuffer! } }
                ],
            })
            particleCompactBindGroup = device.createBindGroup({
                layout: particleCompactBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: particleCompactBuffer! } },
                    { binding: 2, resource: { buffer: particleKeepFlagsBuffer! } },
                    { binding: 3, resource: { buffer: newParticleCountBuffer! } },
                ],
            })
        }
        const updateOffscreenTextureBindGroup = () => {
            if (offscreenTextureView && offscreenSampler) {
                offscreenTextureBindGroup = device.createBindGroup({
                    layout: offscreenTextureBindGroupLayout,
                    entries: [
                        { binding: 0, resource: offscreenTextureView },
                        { binding: 1, resource: offscreenSampler }
                    ]
                })
            }
        }
        const updateComposeHdrBindGroup = () => {
            composeHdrBindGroup = device.createBindGroup({
                layout: composeHdrBindGroupLayout,
                entries: [
                    { binding: 0, resource: hdrTextureView }
                ],
            })
        }
        const updateDrawBindGroup = () => {
            particleDrawBindGroup = undefined as any
            particleDrawBindGroup = device.createBindGroup({
                layout: particleDrawBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                ],
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroupLayouts = () => {
            particleBufferBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // interactionMatrixBuffer
                ],
            })
            particleBufferReadOnlyBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, // colorBuffer
                ],
            })
            binFillSizeBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binOffsetBuffer
                ],
            })
            binPrefixSumBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binOffsetTempBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform', hasDynamicOffset: true } }, // binPrefixSumStepSizeBuffer
                ],
            })
            particleSortBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleTempBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binOffsetTempBuffer
                ],
            })
            particleComputeForcesBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleTempBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // interactionMatrixBuffer
                ],
            })
            bruteForceBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleTempBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // interactionMatrixBuffer
                ],
            })
            simOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                ],
            });
            deltaTimeBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // deltaTimeBuffer
                ],
            })
            cameraBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, // cameraBuffer
                ],
            })
            offscreenTextureBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: '2d' } }, // offscreenTextureView
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }, // offscreenSampler
                ],
            })
            composeHdrBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } }, // Texture for HDR rendering
                ],
            })
            glowOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // glowOptionsBuffer
                ],
            })
            infiniteRenderOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // glowOptionsBuffer
                    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, // infiniteRenderOptionsBuffer
                ],
            })
            brushOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }, // brushOptionsBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // brushesBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }, // cameraBuffer
                ],
            })
            particleEraseBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }        // particleKeepFlagsBuffer
                ]
            })
            particleCompactBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // oldParticleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },         // newParticleBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleKeepFlags
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }          // newParticleCount
                ]
            })
            particleDrawBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                ],
            })
            renderBrushCircleBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, // brushOptionsBuffer
                ],
            })
            renderDebugBinsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '2d' } }, // heatmapTextureView
                    { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }, // heatmapSampler
                ],
            })
            debugOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // debugOptionsBuffer
                ],
            })
            trackerRenderBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, // trackerStateBuffer
                ],
            })
            trackerComputeBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // trackerStateBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // trackerLevelsBuffer
                ],
            })
            trackerCameraUpdateBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // trackerStateBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // cameraBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }, // trackerCameraOptionsBuffer
                ],
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            createComputePipelines()
            createRenderPipelines()
            createHdrGlowPipelines()
        }
        const createComputePipelines = () => {
            const binFillSizeShader = device.createShaderModule({ code: binFillSizeShaderCode })
            binClearSizePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferReadOnlyBindGroupLayout,
                        simOptionsBindGroupLayout,
                        binFillSizeBindGroupLayout,
                    ],
                }),
                compute: { module: binFillSizeShader, entryPoint: 'clearBinSize' }
            })
            binFillSizePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferReadOnlyBindGroupLayout,
                        simOptionsBindGroupLayout,
                        binFillSizeBindGroupLayout,
                    ],
                }),
                compute: { module: binFillSizeShader, entryPoint: 'fillBinSize' }
            })
            const binPrefixSumShader = device.createShaderModule({ code: binPrefixSumShaderCode })
            binPrefixSumPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        binPrefixSumBindGroupLayout,
                    ],
                }),
                compute: { module: binPrefixSumShader, entryPoint: 'prefixSumStep' }
            })
            const particleSortShader = device.createShaderModule({ code: particleSortShaderCode })
            particleSortClearSizePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleSortBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleSortShader, entryPoint: 'clearBinSize' }
            })
            particleSortPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleSortBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleSortShader, entryPoint: 'sortParticles' }
            })
            const particleComputeForcesShader = device.createShaderModule({ code: particleComputeForcesShaderCode })
            particleComputeForcesPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleComputeForcesBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleComputeForcesShader, entryPoint: 'computeForces' }
            })
            const bruteForceShader = device.createShaderModule({ code: bruteForceShaderCode })
            bruteForceComputePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        bruteForceBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: bruteForceShader, entryPoint: 'main' }
            })
            const particleAdvanceShader = device.createShaderModule({ code: particleAdvanceShaderCode })
            particleAdvancePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferBindGroupLayout,
                        simOptionsBindGroupLayout,
                        deltaTimeBindGroupLayout,
                    ],
                }),
                compute: { module: particleAdvanceShader, entryPoint: 'particleAdvance' }
            })
            const particleAdvanceBrushShader = device.createShaderModule({ code: particleAdvanceBrushShaderCode })
            particleAdvanceBrushPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferBindGroupLayout,
                        simOptionsBindGroupLayout,
                        deltaTimeBindGroupLayout,
                        brushOptionsBindGroupLayout
                    ],
                }),
                compute: { module: particleAdvanceBrushShader, entryPoint: 'particleAdvance' }
            })
            const particleEraseShader = device.createShaderModule({ code: particleEraseShaderCode })
            particleErasePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleEraseBindGroupLayout, simOptionsBindGroupLayout, brushOptionsBindGroupLayout,],
                }),
                compute: { module: particleEraseShader, entryPoint: 'markForErase' }
            })
            const particleCompactShader = device.createShaderModule({ code: particleCompactShaderCode })
            particleCompactPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleCompactBindGroupLayout, simOptionsBindGroupLayout]
                }),
                compute: { module: particleCompactShader, entryPoint: 'compactParticles' },
            })
            const particleDrawShader = device.createShaderModule({ code: particleDrawShaderCode });
            particleDrawPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleDrawBindGroupLayout, simOptionsBindGroupLayout, brushOptionsBindGroupLayout]
                }),
                compute: { module: particleDrawShader, entryPoint: 'drawParticles' },
            })

            const trackerComputeShader = device.createShaderModule({ code: trackerComputeShaderCode })
            trackerAccumulatePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [trackerComputeBindGroupLayout, simOptionsBindGroupLayout, deltaTimeBindGroupLayout]
                }),
                compute: { module: trackerComputeShader, entryPoint: 'accumulateParticles' }
            })
            trackerFinalizePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [trackerComputeBindGroupLayout, simOptionsBindGroupLayout, deltaTimeBindGroupLayout]
                }),
                compute: { module: trackerComputeShader, entryPoint: 'finalizeTracker' }
            })
            const trackerCameraUpdateShader = device.createShaderModule({ code: trackerCameraUpdateShaderCode })
            trackerCameraUpdatePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [trackerCameraUpdateBindGroupLayout]
                }),
                compute: { module: trackerCameraUpdateShader, entryPoint: 'main' }
            })
        }
        const particleNormalBlending: GPUBlendState = {
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
        }
        const particleAdditiveBlending: GPUBlendState = {
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
        }
        const createRenderPipelines = () => {
            const renderShader = device.createShaderModule({ code: renderShaderCode })
            renderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: renderShader, entryPoint: 'vertexMain' },
                fragment: { module: renderShader, entryPoint: 'fragmentMain', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            renderPipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout,],
                }),
                vertex: { module: renderShader, entryPoint: 'vertexMain'},
                fragment: { module: renderShader, entryPoint: 'fragmentMain', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleAdditiveBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderMirrorShader = device.createShaderModule({ code: renderMirrorShaderCode });
            renderMirrorPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout],
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertex' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            renderMirrorPipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout],
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertex' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleAdditiveBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderInfiniteShader = device.createShaderModule({ code: renderInfiniteShaderCode });
            renderInfinitePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertex' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending
                }] },
                primitive: { topology: 'triangle-strip', stripIndexFormat: 'uint32' }
            })
            renderInfinitePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout,]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertex' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleAdditiveBlending
                }] },
                primitive: { topology: 'triangle-strip', stripIndexFormat: 'uint32' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const offscreenVertexShader = device.createShaderModule({ code: offscreenShaderCode })
            renderOffscreenPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout,],
                }),
                vertex: { module: offscreenVertexShader, entryPoint: 'vertexMain' },
                fragment: { module: renderShader, entryPoint: 'fragmentMain',
                    targets: [{ format: 'rgba8unorm' }]
                },
                primitive: { topology: 'triangle-strip' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const infiniteCompositorShader = device.createShaderModule({ code: infiniteCompositorShaderCode })
            composeInfinitePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [cameraBindGroupLayout, simOptionsBindGroupLayout, offscreenTextureBindGroupLayout],
                }),
                vertex: { module: infiniteCompositorShader, entryPoint: 'vertexInfinite' },
                fragment: { module: infiniteCompositorShader, entryPoint: 'fragmentInfinite',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: { topology: 'triangle-list' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderBrushCircleShader = device.createShaderModule({ code: renderBrushCircleShaderCode })
            renderBrushCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [cameraBindGroupLayout, renderBrushCircleBindGroupLayout]
                }),
                vertex: { module: renderBrushCircleShader, entryPoint: 'vertexMain' },
                fragment: { module: renderBrushCircleShader, entryPoint: 'fragmentMain', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            const renderBinsShader = device.createShaderModule({ code: renderBinsShaderCode });
            renderDebugBinsPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [renderDebugBinsBindGroupLayout, debugOptionsBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout]
                }),
                vertex: { module: renderBinsShader, entryPoint: 'vertexMain' },
                fragment: { module: renderBinsShader, entryPoint: 'fragmentMain', targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: particleNormalBlending,
                    }] },
                primitive: { topology: 'triangle-strip' },
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderTrackerShader = device.createShaderModule({ code: renderTrackerShaderCode })
            renderTrackerPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [cameraBindGroupLayout, trackerRenderBindGroupLayout, deltaTimeBindGroupLayout, simOptionsBindGroupLayout]
                }),
                vertex: { module: renderTrackerShader, entryPoint: 'vertexMain' },
                fragment: { module: renderTrackerShader, entryPoint: 'fragmentMain', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
        }
        const createHdrGlowPipelines = () => {
            const glowBlendOptions: GPUBlendState = {
                color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one' },
                alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
            }
            // ---------------------------------------------------------------------------------------------------------
            const renderGlowShader = device.createShaderModule({ code: renderGlowShaderCode })
            renderGlowPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderGlowShader, entryPoint: 'vertexGlow' },
                fragment: { module: renderGlowShader, entryPoint: 'fragmentGlow', targets: [{
                    format: 'rgba16float',
                    blend: glowBlendOptions,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderGlowShader, entryPoint: 'vertexCircle' },
                fragment: { module: renderGlowShader, entryPoint: 'fragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderCirclePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderGlowShader, entryPoint: 'vertexCircle' },
                fragment: { module: renderGlowShader, entryPoint: 'fragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleAdditiveBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderMirrorShader = device.createShaderModule({ code: renderMirrorShaderCode });
            renderMirrorGlowPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertexGlow' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragmentGlow', targets: [{
                    format: 'rgba16float',
                    blend: glowBlendOptions,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderMirrorCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertexCircle' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderMirrorCirclePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertexCircle' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleAdditiveBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderInfiniteShader = device.createShaderModule({ code: renderInfiniteShaderCode });
            renderInfiniteGlowPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertexGlow' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragmentGlow', targets: [{
                    format: 'rgba16float',
                    blend: glowBlendOptions,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderInfiniteCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertexCircle' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderInfiniteCirclePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertexCircle' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleAdditiveBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            // ---------------------------------------------------------------------------------------------------------
            const composeShader = device.createShaderModule({ code: composeHdrShaderCode });
            composeHdrPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [composeHdrBindGroupLayout]
                }),
                vertex: { module: composeShader, entryPoint: 'vertexMain' },
                fragment: { module: composeShader, entryPoint: 'fragmentMain',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: { topology: 'triangle-list' },
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const updateHdrTexture = () => {
            if (hdrTexture) hdrTexture.destroy(); hdrTexture = undefined;

            hdrTexture = device.createTexture({
                size: [CANVAS_WIDTH, CANVAS_HEIGHT],
                format: 'rgba16float',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                mipLevelCount: 1, // No mipmaps for HDR = -33% performance hit
                sampleCount: 1, // No multisampling (MSAA) for HDR = -75% memory and compute hit
            })
            hdrTextureView = hdrTexture.createView()

            if (composeHdrPipeline) {
                updateComposeHdrBindGroup()
            }
        }
        const createHeatmapTexture = async () => {
            const response = await fetch(heatmapImage)
            const blob = await response.blob()
            const imageBitmap = await createImageBitmap(blob, {
                colorSpaceConversion: "none",
                premultiplyAlpha: "none",
            })

            heatmapTexture = device.createTexture({
                size: [imageBitmap.width, imageBitmap.height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            })

            device.queue.copyExternalImageToTexture(
                { source: imageBitmap },
                { texture: heatmapTexture },
                [imageBitmap.width, imageBitmap.height, 1]
            )

            heatmapSampler = device.createSampler({
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge', // maybe repeat
                magFilter: 'linear',
                minFilter: 'linear',
            })

            heatmapTextureView = heatmapTexture.createView()
        }
        const updateOffscreenMirrorResources = () => {
            if (offscreenTexture) {
                offscreenTexture.destroy(); offscreenTexture = undefined;
            }
            if (!isInfiniteMirrorWrap) return

            const maxDimension = device.limits.maxTextureDimension2D
            const aspectRatio = SIM_WIDTH / SIM_HEIGHT
            const baseResolution2K = 2048

            let desiredWidth = SIM_WIDTH * 3.5
            let desiredHeight = SIM_HEIGHT * 3.5

            if (desiredWidth > maxDimension || desiredHeight > maxDimension) {
                if (aspectRatio > 1) {
                    desiredWidth = maxDimension
                    desiredHeight = Math.round(desiredWidth / aspectRatio)
                } else {
                    desiredHeight = maxDimension
                    desiredWidth = Math.round(desiredHeight * aspectRatio)
                }
            }
            if (desiredWidth < baseResolution2K || desiredHeight < baseResolution2K) {
                if (aspectRatio > 1) {
                    desiredWidth = Math.max(desiredWidth, baseResolution2K)
                    desiredHeight = Math.round(desiredWidth / aspectRatio)
                } else {
                    desiredHeight = Math.max(desiredHeight, baseResolution2K)
                    desiredWidth = Math.round(desiredHeight * aspectRatio)
                }
            }
            const maxWidth = Math.min(desiredWidth, maxDimension)
            const maxHeight = Math.min(desiredHeight, maxDimension)
            offscreenTexture = device.createTexture({
                size: [maxWidth, maxHeight],
                // format: navigator.gpu.getPreferredCanvasFormat(),
                format: 'rgba8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            })
            offscreenTextureView = offscreenTexture.createView()

            if (!offscreenSampler) {
                offscreenSampler = device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear',
                    addressModeU: 'repeat',
                    addressModeV: 'repeat'
                })
            }

            if (isInfiniteMirrorWrap && composeInfinitePipeline) updateOffscreenTextureBindGroup()
        }
        const drawWithBrush = () => {
            if (isUpdatingParticles || isEraseCompleting || !isBrushActive || brushType !== 1) return
            isUpdatingParticles = true

            try {
                if (!showBrushCircle) updateBrushOptionsBuffer() // Condition prevents duplicate updates

                const oldNumParticles = NUM_PARTICLES
                const numParticlesToAdd = Math.floor(brushIntensity)
                const newNumParticles = oldNumParticles + numParticlesToAdd

                const newParticleBuffer = device.createBuffer({
                    size: newNumParticles * 20,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                })

                const encoder = device.createCommandEncoder({ label: 'Draw Brush Encoder' })
                encoder.copyBufferToBuffer(particleBuffer!, 0, newParticleBuffer, 0, oldNumParticles * 20)

                const oldParticleBuffer = particleBuffer
                particleBuffer = newParticleBuffer

                updateDrawBindGroup()

                const drawPass = encoder.beginComputePass({ label: 'Draw Pass' })
                drawPass.setPipeline(particleDrawPipeline)
                drawPass.setBindGroup(0, particleDrawBindGroup)
                drawPass.setBindGroup(1, simOptionsBindGroup)
                drawPass.setBindGroup(2, brushOptionsBindGroup)
                drawPass.dispatchWorkgroups(Math.ceil(numParticlesToAdd / 64))
                drawPass.end()

                device.queue.submit([encoder.finish()])

                oldParticleBuffer?.destroy()

                NUM_PARTICLES = newNumParticles
                particleLife.numParticles = newNumParticles

                if (particleTempBuffer) particleTempBuffer?.destroy(); particleTempBuffer = undefined;
                particleTempBuffer = device.createBuffer({
                    size: particleBuffer.size,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                })

                updateSimOptionsBuffer()
                updateEraseCompactBuffers()
                updateParticleBindGroups()
                updateEraseCompactBindGroups()
                updateInfiniteRenderOptions()
                hasUpdateNumParticles = true
            } catch (error) {
                console.error("Error drawing with brush:", error)
            } finally {
                isUpdatingParticles = false
            }
        }
        const eraseWithBrush = () => {
            if (isUpdatingParticles || isEraseCompleting || !isBrushActive || brushType !== 0) return
            isUpdatingParticles = true

            try {
                if (!showBrushCircle) updateBrushOptionsBuffer() // Condition prevents duplicate updates

                const encoder = device.createCommandEncoder({ label: 'Erase and Compact Encoder' })
                encoder.clearBuffer(newParticleCountBuffer!, 0, 4)

                const markPass = encoder.beginComputePass({ label: 'Mark Pass' })
                markPass.setPipeline(particleErasePipeline)
                markPass.setBindGroup(0, particleEraseBindGroup)
                markPass.setBindGroup(1, simOptionsBindGroup)
                markPass.setBindGroup(2, brushOptionsBindGroup)
                markPass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                markPass.end()

                const compactPass = encoder.beginComputePass({ label: 'Compact Pass' })
                compactPass.setPipeline(particleCompactPipeline)
                compactPass.setBindGroup(0, particleCompactBindGroup)
                compactPass.setBindGroup(1, simOptionsBindGroup)
                compactPass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                compactPass.end()

                // Copy compacted particles back to particleBuffer (full old size)
                encoder.copyBufferToBuffer(particleCompactBuffer!, 0, particleBuffer!, 0, NUM_PARTICLES * 20)
                // Update GPU-side numParticles from the atomic counter (no CPU readback needed)
                encoder.copyBufferToBuffer(newParticleCountBuffer!, 0, simOptionsBuffer!, 20, 4)

                device.queue.submit([encoder.finish()])
                isEraseCompletionPending = true
            } catch (error) {
                console.error("Error during erase and compact operation:", error)
            } finally {
                isUpdatingParticles = false
            }
        }
        const completeEraseWithBrush = () => {
            if (isEraseCompleting || !isEraseCompletionPending) return
            isEraseCompleting = true

            // Copy new particle count to readback buffer
            const readEncoder = device.createCommandEncoder({ label: 'Read Erase Count Encoder' })
            readEncoder.copyBufferToBuffer(newParticleCountBuffer!, 0, newParticleCountReadBuffer!, 0, 4)
            device.queue.submit([readEncoder.finish()])

            // .then() instead of await prevents blocking the main loop during GPU readback
            newParticleCountReadBuffer!.mapAsync(GPUMapMode.READ).then(() => {
                const newCount = new Uint32Array(newParticleCountReadBuffer!.getMappedRange())[0]
                newParticleCountReadBuffer!.unmap()

                if (newCount < NUM_PARTICLES) {
                    const oldParticleBuffer = particleBuffer

                    NUM_PARTICLES = newCount
                    particleLife.numParticles = newCount

                    particleBuffer = device.createBuffer({
                        size: newCount * 20,
                        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
                    })

                    const copyEncoder = device.createCommandEncoder({ label: 'Copy to Resized Buffer' })
                    copyEncoder.copyBufferToBuffer(oldParticleBuffer!, 0, particleBuffer!, 0, newCount * 20)
                    device.queue.submit([copyEncoder.finish()])
                    oldParticleBuffer?.destroy()

                    if (particleTempBuffer) particleTempBuffer.destroy(); particleTempBuffer = undefined;
                    particleTempBuffer = device.createBuffer({
                        size: particleBuffer.size,
                        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    })

                    updateSimOptionsBuffer()
                    updateEraseCompactBuffers()
                    updateParticleBindGroups()
                    updateEraseCompactBindGroups()
                    updateInfiniteRenderOptions()
                    hasUpdateNumParticles = true
                }
            }).catch((error) => {
                console.error("Error during erase completion:", error)
            }).finally(() => {
                isEraseCompletionPending = false
                isEraseCompleting = false
            })
        }
        const setNewNumParticles = (newCount: number) => {
            NEW_NUM_PARTICLES = newCount
            isUpdateNumParticlesPending = true
        }
        const updateNumParticles = async (newCount: number) => {
            if (isUpdatingParticles || newCount === NUM_PARTICLES) {
                isUpdateNumParticlesPending = false
                return
            }
            isUpdatingParticles = true
            await device.queue.onSubmittedWorkDone()

            try {
                const oldCount = NUM_PARTICLES
                const oldParticlesData = await readBufferFromGPU(particleBuffer!, oldCount * 5 * 4)
                const oldParticles = new Float32Array(oldParticlesData)
                initialParticles = new Float32Array(newCount * 5)

                if (newCount > oldCount) { // If increasing the number of particles
                    initialParticles.set(oldParticles)
                    for (let i = oldCount; i < newCount; i++) {
                        const baseIndex = i * 5
                        initialParticles[baseIndex]     = Math.random() * SIM_WIDTH  // x
                        initialParticles[baseIndex + 1] = Math.random() * SIM_HEIGHT // y
                        initialParticles[baseIndex + 4] = Math.floor(Math.random() * NUM_TYPES) // type
                    }
                } else { // If decreasing the number of particles
                    initialParticles.set(oldParticles.subarray(0, newCount * 5))
                    for (let i = newCount; i < oldCount; i++) {
                        const j = Math.floor(Math.random() * (i + 1))
                        if (j < newCount) {
                            const oldStartIndex = i * 5
                            const newIndex = j * 5
                            initialParticles[newIndex]     = oldParticles[oldStartIndex]     // x
                            initialParticles[newIndex + 1] = oldParticles[oldStartIndex + 1] // y
                            initialParticles[newIndex + 2] = oldParticles[oldStartIndex + 2] // vx
                            initialParticles[newIndex + 3] = oldParticles[oldStartIndex + 3] // vy
                            initialParticles[newIndex + 4] = oldParticles[oldStartIndex + 4] // type
                        }
                    }
                }

                NUM_PARTICLES = newCount
                updateParticleBuffers(true) // Destroy and recreate particle buffers
                updateEraseCompactBuffers()
                updateParticleBindGroups() // Recreate bind groups that depend on particle buffers
                updateEraseCompactBindGroups()
                updateSimOptionsBuffer() // Update simulation options buffer
                updateInfiniteRenderOptions() // Update infinite render options buffer
                hasUpdateNumParticles = true
            } finally {
                isUpdatingParticles = false
                isUpdateNumParticlesPending = NEW_NUM_PARTICLES !== NUM_PARTICLES
            }
        }
        const setNewNumTypes = (newNumTypes: number) => {
            NEW_NUM_TYPES = newNumTypes
            isUpdateNumTypesPending = true
        }
        const updateNumTypes = async (newNumTypes: number) => {
            if (isUpdatingParticles || newNumTypes === NUM_TYPES) {
                isUpdateNumTypesPending = false
                return
            }
            isUpdatingParticles = true
            await device.queue.onSubmittedWorkDone()

            try {
                const oldNumTypes = NUM_TYPES
                NUM_TYPES = newNumTypes

                await adjustColors(colors, oldNumTypes, newNumTypes)
                await adjustParticleTypes(oldNumTypes, newNumTypes)

                setRulesMatrix(resizeMatrix(rulesMatrix, oldNumTypes, newNumTypes, () => {
                    return Math.round((Math.random() * 2 - 1) * 100) / 100
                }))
                setMinRadiusMatrix(resizeMatrix(minRadiusMatrix, oldNumTypes, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                }))
                setMaxRadiusMatrix(resizeMatrix(maxRadiusMatrix, oldNumTypes, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.maxRadiusRange[1] - particleLife.maxRadiusRange[0] + 1) + particleLife.maxRadiusRange[0])
                }))

                updateInteractionMatrixBuffer()
                updateSimOptionsBuffer()
                updateColorBuffer()
                updateParticleBindGroups()
            } finally {
                isUpdatingParticles = false
                isUpdateNumTypesPending = NEW_NUM_TYPES !== NUM_TYPES
            }
        }
        const loadPreset = async (options: { presetRules?: number[][], presetMinRadius?: number[][], presetMaxRadius?: number[][], presetColors?: Float32Array }, presetTypeCount: number, matchPresetCount: boolean) => {
            const { presetRules, presetMinRadius, presetMaxRadius, presetColors } = options

            if (isUpdatingParticles) return
            isUpdatingParticles = true
            await device.queue.onSubmittedWorkDone()

            try {
                const oldNumTypes = NUM_TYPES
                const newNumTypes = presetTypeCount
                if (newNumTypes === 0) return

                if (!matchPresetCount) {
                    const typesToUpdate = Math.min(NUM_TYPES, newNumTypes)
                    if (presetColors) await adjustColors(presetColors, NUM_TYPES, typesToUpdate, true) // Update only the colors that fit within the current NUM_TYPES
                    if (presetRules) setRulesMatrix(applyPresetSubMatrix(rulesMatrix, presetRules, NUM_TYPES, typesToUpdate))
                    if (presetMinRadius) setMinRadiusMatrix(applyPresetSubMatrix(minRadiusMatrix, presetMinRadius, NUM_TYPES, typesToUpdate))
                    if (presetMaxRadius) setMaxRadiusMatrix(applyPresetSubMatrix(maxRadiusMatrix, presetMaxRadius, NUM_TYPES, typesToUpdate))
                } else {
                    if (presetColors) {
                        colors = presetColors
                        particleLife.currentColors = colors
                    } else if (newNumTypes !== oldNumTypes) {
                        await adjustColors(colors, oldNumTypes, newNumTypes)
                    }

                    if (newNumTypes !== oldNumTypes) {
                        NUM_TYPES = newNumTypes
                        particleLife.numColors = NUM_TYPES

                        await adjustParticleTypes(oldNumTypes, newNumTypes)

                        if (presetRules) setRulesMatrix(presetRules)
                        else setRulesMatrix(resizeMatrix(rulesMatrix, oldNumTypes, newNumTypes, () => {
                            return Math.round((Math.random() * 2 - 1) * 100) / 100
                        }))
                        if (presetMinRadius) setMinRadiusMatrix(presetMinRadius)
                        else setMinRadiusMatrix(resizeMatrix(minRadiusMatrix, oldNumTypes, newNumTypes, () => {
                            return Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                        }))
                        if (presetMaxRadius) setMaxRadiusMatrix(presetMaxRadius)
                        else setMaxRadiusMatrix(resizeMatrix(maxRadiusMatrix, oldNumTypes, newNumTypes, () => {
                            return Math.floor(Math.random() * (particleLife.maxRadiusRange[1] - particleLife.maxRadiusRange[0] + 1) + particleLife.maxRadiusRange[0])
                        }))

                        updateSimOptionsBuffer()
                    } else {
                        if (presetRules) setRulesMatrix(presetRules)
                        if (presetMinRadius) setMinRadiusMatrix(presetMinRadius)
                        if (presetMaxRadius) setMaxRadiusMatrix(presetMaxRadius)
                    }
                }

                updateColorBuffer()
                updateInteractionMatrixBuffer()
                if (matchPresetCount && (newNumTypes !== oldNumTypes)) updateParticleBindGroups()
            } finally {
                isUpdatingParticles = false
                success("Preset loaded.")
            }
        }
        const applyPresetSubMatrix = (current: number[][], preset: number[][], numTypes: number, typesToUpdate: number,): number[][] => {
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
        const adjustColors = async (oldColors: Float32Array, oldNumTypes: number, newNumTypes: number, keepExtraColors: boolean = false) => {
            const newColors = new Float32Array((keepExtraColors ? oldNumTypes : newNumTypes) * 4)
            if (keepExtraColors) newColors.set(colors)

            for (let i = 0; i < newNumTypes; i++) {
                const idx = i * 4
                newColors[idx]     = oldColors[idx]     ?? Math.random()
                newColors[idx + 1] = oldColors[idx + 1] ?? Math.random()
                newColors[idx + 2] = oldColors[idx + 2] ?? Math.random()
                newColors[idx + 3] = oldColors[idx + 3] ?? 1
            }
            colors = newColors
            particleLife.currentColors = colors // Ensure the store is updated with the new colors
        }
        const adjustParticleTypes = async (oldNumTypes: number, newNumTypes: number) => {
            const particleDataBuffer = await readBufferFromGPU(particleBuffer!, NUM_PARTICLES * 5 * 4)
            const particles = new Float32Array(particleDataBuffer)

            if (newNumTypes < oldNumTypes) {
                for (let i = 0; i < NUM_PARTICLES; i++) {
                    const typeIndex = i * 5 + 4
                    if (particles[typeIndex] >= newNumTypes) {
                        particles[typeIndex] = Math.floor(Math.random() * newNumTypes)
                    }
                }
            } else if (newNumTypes > oldNumTypes) {
                for (let i = 0; i < NUM_PARTICLES; i++) {
                    if (Math.random() < (newNumTypes - oldNumTypes) / newNumTypes) {
                        const typeIndex = i * 5 + 4
                        particles[typeIndex] = oldNumTypes + Math.floor(Math.random() * (newNumTypes - oldNumTypes))
                    }
                }
            }
            device.queue.writeBuffer(particleBuffer!, 0, particles)
        }
        // -------------------------------------------------------------------------------------------------------------
        async function readBufferFromGPU(buffer: GPUBuffer, size: number): Promise<ArrayBuffer> {
            const readBuffer = device.createBuffer({
                size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            })
            const encoder = device.createCommandEncoder()
            encoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, size)
            device.queue.submit([encoder.finish()])
            await readBuffer.mapAsync(GPUMapMode.READ)
            const arrayBuffer = readBuffer.getMappedRange().slice(0)
            readBuffer.unmap()
            readBuffer.destroy()
            return arrayBuffer
        }
        function resizeMatrix(matrix: number[][], oldNumTypes: number, newNumTypes: number, randomFn: () => number) {
            const newMatrix: number[][] = []
            for (let i = 0; i < newNumTypes; i++) {
                const row: number[] = []
                for (let j = 0; j < newNumTypes; j++) {
                    if (i < oldNumTypes && j < oldNumTypes) {
                        row.push(matrix[i][j])
                    } else {
                        row.push(randomFn())
                    }
                }
                newMatrix.push(row)
            }
            return newMatrix
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function initColors() {
            colors = generateColors(particleLife.selectedColorPaletteOption, NUM_TYPES)
            particleLife.currentColors = colors // Ensure the store is updated with the initial colors
        }
        function initParticles() {
            initialParticles = generatePositions(particleLife.selectedSpawnPositionOption, NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT)
        }
        function makeRandomMinRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = particleLife.minRadiusRange[0]
            const max: number = particleLife.minRadiusRange[1]
            for (let i = 0; i < NUM_TYPES; i++) {
                matrix.push([])
                for (let j = 0; j < NUM_TYPES; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                }
            }
            return matrix
        }
        function makeRandomMaxRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = particleLife.maxRadiusRange[0]
            const max: number = particleLife.maxRadiusRange[1]
            for (let i = 0; i < NUM_TYPES; i++) {
                matrix.push([])
                for (let j = 0; j < NUM_TYPES; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                }
            }
            return matrix
        }
        const randomizeRadius = () => {
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
            updateInteractionMatrixBuffer()
        }
        const randomizeRulesAndRadius = () => {
            setRulesMatrix(generateRules(0, NUM_TYPES))
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
            updateInteractionMatrixBuffer()
        }
        const updateColors = async (useRandomGenerator: boolean | Event = false) => {
            const shouldRandom = typeof useRandomGenerator === 'boolean' ? useRandomGenerator : false
            if (shouldRandom) particleLife.selectedColorPaletteOption = paletteOptions[Math.floor(Math.random() * paletteOptions.length)].id

            colors = generateColors(particleLife.selectedColorPaletteOption, NUM_TYPES)
            particleLife.currentColors = colors
            updateColorBuffer()
        }
        const updateRulesMatrix = async (useRandomGenerator: boolean | Event = false) => {
            const shouldRandom = typeof useRandomGenerator === 'boolean' ? useRandomGenerator : false
            if (shouldRandom) particleLife.selectedRulesOption = rulesOptions[Math.floor(Math.random() * rulesOptions.length)].id

            setRulesMatrix(generateRules(particleLife.selectedRulesOption, NUM_TYPES))
            updateInteractionMatrixBuffer()
        }
        const updateParticlePositions = async (useRandomGenerator: boolean | Event = false) => {
            const shouldRandom = typeof useRandomGenerator === 'boolean' ? useRandomGenerator : false
            if (shouldRandom) particleLife.selectedSpawnPositionOption = positionOptions[Math.floor(Math.random() * positionOptions.length)].id

            initialParticles = generatePositions(particleLife.selectedSpawnPositionOption, NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT)
            device.queue.writeBuffer(particleBuffer!, 0, initialParticles.buffer)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const updateSimWidth = (newWidth: number | Event) => {
            if (typeof(newWidth) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.simHeight = SIM_HEIGHT = baseSimHeight = Math.round(SIM_HEIGHT * (newWidth / SIM_WIDTH))
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = newWidth
            setSimSize()
            regenerateLife()
        }
        const updateSimHeight = (newHeight: number | Event) => {
            if (typeof(newHeight) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.simWidth = SIM_WIDTH = baseSimWidth = Math.round(SIM_WIDTH * (newHeight / SIM_HEIGHT))
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = newHeight
            setSimSize()
            regenerateLife()
        }
        const updateRulesMatrixValue = (x: number, y: number, value: number) => {
            const roundedValue = Math.round(value * 100) / 100
            particleLife.rulesMatrix[x][y] = roundedValue
            rulesMatrix[x][y] = roundedValue
            updateInteractionMatrixBuffer()
        }
        const updateMinMatrixValue = (x: number, y: number, value: number) => {
            particleLife.minRadiusMatrix[x][y] = value
            minRadiusMatrix[x][y] = value
            if (value > particleLife.maxRadiusMatrix[x][y]) {
                particleLife.maxRadiusMatrix[x][y] = value
                maxRadiusMatrix[x][y] = value
                setCurrentMaxRadius(getCurrentMaxRadius())
            }
            updateInteractionMatrixBuffer()
        }
        const updateMaxMatrixValue = (x: number, y: number, value: number) => {
            particleLife.maxRadiusMatrix[x][y] = value
            maxRadiusMatrix[x][y] = value
            setCurrentMaxRadius(getCurrentMaxRadius())
            if (value < particleLife.minRadiusMatrix[x][y]) {
                particleLife.minRadiusMatrix[x][y] = value
                minRadiusMatrix[x][y] = value
            }
            updateInteractionMatrixBuffer()
        }
        const newRandomRulesMatrix = () => {

        }
        function setRulesMatrix(newRules: number[][]) {
            rulesMatrix = newRules
            particleLife.rulesMatrix = rulesMatrix
        }
        function setMinRadiusMatrix(newMinRadius: number[][]) {
            minRadiusMatrix = newMinRadius
            particleLife.minRadiusMatrix = minRadiusMatrix
        }
        function setMaxRadiusMatrix(newMaxRadius: number[][]) {
            maxRadiusMatrix = newMaxRadius
            particleLife.maxRadiusMatrix = maxRadiusMatrix
            setCurrentMaxRadius(getCurrentMaxRadius())
        }
        // -------------------------------------------------------------------------------------------------------------
        const getCurrentMaxRadius = () => {
            let maxRandom = 0
            for (let i = 0; i < NUM_TYPES; i++) {
                for (let j = 0; j < NUM_TYPES; j++) {
                    if (maxRadiusMatrix[i][j] > maxRandom) maxRandom = maxRadiusMatrix[i][j]
                }
            }
            return maxRandom
        }
        const setCurrentMaxRadius = (value: number) => {
            if (currentMaxRadius === value) return
            currentMaxRadius = value
            particleLife.currentMaxRadius = value
            CELL_SIZE = Math.max(1, Math.ceil(currentMaxRadius / CELL_SUBDIVISIONS))

            setSimSize()
            updateSimOptionsBuffer()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const colorRgbStrings = computed(() => {
            const arr = particleLife.currentColors
            if (!arr) return []
            const result: string[] = []
            for (let i = 0; i < arr.length; i += 4) {
                const r = Math.round(arr[i] * 255)
                const g = Math.round(arr[i + 1] * 255)
                const b = Math.round(arr[i + 2] * 255)
                result.push(`rgb(${r}, ${g}, ${b})`)
            }
            return result
        })
        // -------------------------------------------------------------------------------------------------------------
        const updateSingleColor = (colorId: number, hex: string) => {
            const rgb = hexToRgb(hex)
            if (!rgb) return
            const idx = colorId * 4
            colors[idx]     = rgb[0] / 255
            colors[idx + 1] = rgb[1] / 255
            colors[idx + 2] = rgb[2] / 255
            particleLife.currentColors = new Float32Array(colors) // New reference to trigger reactivity
            updateColorBuffer()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function watchAndUpdateSimOptions(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateSimOptionsBuffer()
            })
        }
        function watchAndUpdateGlowOptions(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateGlowOptionsBuffer()
            })
        }
        watch(() => particleLife.isRunning, (value: boolean) => isRunning = value)
        watch(() => particleLife.useSpatialHash, (value: boolean) => useSpatialHash = value)
        watch(() => particleLife.isParticleGlow, (value: boolean) => isParticleGlow = value)
        watch(() => particleLife.isAdditiveBlending, (value: boolean) => isAdditiveBlending = value)
        watch(() => particleLife.isBrushActive, (value: boolean) => isBrushActive = value)
        watch(() => particleLife.brushType, (value: number) => brushType = value)
        watch(() => particleLife.brushes, (value: number[]) => { brushes = value; updateBrushesBuffer(); }, { deep: true })
        watch(() => particleLife.brushRadius, (value: number) => brushRadius = value)
        watch(() => particleLife.brushIntensity, (value: number) => brushIntensity = value)
        watch(() => particleLife.repulseForce, (value: number) => repulseForce = value)
        watch(() => particleLife.attractForce, (value: number) => attractForce = -value)
        watch(() => particleLife.brushDirectionalForce, (value: number) => brushDirectionalForce = value)
        watch(() => particleLife.showBrushCircle, (value: boolean) => showBrushCircle = value)
        watch(() => particleLife.zoomSmoothing, (value: number) => zoomSmoothing = value)
        watch(() => particleLife.panSmoothing, (value: number) => panSmoothing = value)
        watch(() => particleLife.isDriftCamActive, (value: boolean) => { value && initDriftCamera(); isDriftCamActive = value })
        watch(() => particleLife.driftCamResetOnPan, (value: boolean) => driftCamResetOnPan = value)
        watch(() => particleLife.driftCamSpeed, (value: number) => driftCamSpeed = value)
        watch(() => particleLife.driftCamAmplitude, (value: number) => driftCamAmplitude = value)
        watch(() => particleLife.driftCamZoomRange, (value: number[]) => {
            driftCamZoomRange = value;
            driftCamZoomCenter = (driftCamZoomRange[1] + driftCamZoomRange[0]) * 0.5 // Center zoom level for driftCam
            driftCamZoomAmplitude = (driftCamZoomRange[1] - driftCamZoomRange[0]) * 0.5 // Amplitude of zoom changes for driftCam
        }, { deep: true })
        
        watch(() => particleLife.isTrackerIndicatorVisible, (value: boolean) => isTrackerIndicatorVisible = value)
        watch(() => particleLife.isTrackerSelectionActive, (value: boolean) => particleLife.isHudLocked = value)
        watch(() => particleLife.isTrackerActive, (value: boolean) => {
            isTrackerActive = value
            isCameraTracking = isTrackerActive && isTrackerCameraActive
        })
        watch(() => particleLife.isTrackerCameraActive, async (value: boolean) => {
            if (isTrackerActive && !value) await syncCameraFromGPU()
            // Update baseCameraX/Y to current camera position so smoothing starts from here when tracker camera is re-enabled.
            if (isTrackerActive && value) device.queue.writeBuffer(trackerStateBuffer!, 24, new Float32Array([cameraCenter.x, cameraCenter.y]))
            resetTrackerCameraOffset()
            isTrackerCameraActive = value
            isCameraTracking = isTrackerActive && isTrackerCameraActive
        })
        watch(() => particleLife.trackerCameraSmoothing, (value: number) => {
            device.queue.writeBuffer(trackerCameraOptionsBuffer!, 8, new Float32Array([value]))
        })

        watchAndUpdateGlowOptions(() => particleLife.glowSize, (value: number) => glowSize = value)
        watchAndUpdateGlowOptions(() => particleLife.glowIntensity, (value: number) => glowIntensity = value)
        watchAndUpdateGlowOptions(() => particleLife.glowSteepness, (value: number) => glowSteepness = value)

        watchAndUpdateSimOptions(() => particleLife.particleOpacity, (value: number) => particleOpacity = value)
        watchAndUpdateSimOptions(() => particleLife.mirrorWrapCount, (value: number) => mirrorWrapCount = value)
        watchAndUpdateSimOptions(() => particleLife.particleSize, (value: number) => PARTICLE_SIZE = value)
        watchAndUpdateSimOptions(() => particleLife.repel, (value: number) => repel = value)
        watchAndUpdateSimOptions(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndUpdateSimOptions(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)

        watch(() => particleLife.minRadiusRange, (value: number[]) => {
            if (value[0] > value[1]) particleLife.minRadiusRange[0] = value[1]
            if (value[1] > particleLife.maxRadiusRange[0]) particleLife.maxRadiusRange[0] = value[1]
        }, { deep: true })
        watch(() => particleLife.maxRadiusRange, (value: number[]) => {
            if (value[0] > value[1]) particleLife.maxRadiusRange[1] = value[0]
            if (value[0] < particleLife.minRadiusRange[1]) particleLife.minRadiusRange[1] = value[0]
        }, { deep: true })

        watch(() => particleLife.isDebugBinsActive, (value: boolean) => {
            isDebugBinsActive = value
            if (!isRunning && isDebugBinsActive) step() // Force step for debug bins update
        })
        watch(() => particleLife.isDebugHeatmapActive, (value: boolean) => {
            isDebugHeatmapActive = value
            updateDebugOptionsBuffer()
            particleLife.isDebugBinsActive = true
        })
        watch(() => particleLife.debugMaxParticleCount, (value: number) => { debugMaxParticleCount = value; updateDebugOptionsBuffer(); })
        watch(() => particleLife.cellSubdivisions, (value: number) => {
            CELL_SUBDIVISIONS = value
            CELL_SIZE = Math.ceil(currentMaxRadius / CELL_SUBDIVISIONS)
            setSimSize()
            updateSimOptionsBuffer()
        })

        let isUpdatingWallState = false
        watch([
            () => particleLife.isWallRepel,
            () => particleLife.isWallWrap,
            () => particleLife.isMirrorWrap,
            () => particleLife.isInfiniteMirrorWrap,
        ], ([newRepel, newWrap, newMirror, newInfinite], [oldRepel, oldWrap, oldMirror, oldInfinite]) => {
            if (isUpdatingWallState) return

            let changedProp = ''
            if (newRepel !== oldRepel) changedProp = 'isWallRepel'
            else if (newWrap !== oldWrap) changedProp = 'isWallWrap'
            else if (newMirror !== oldMirror) changedProp = 'isMirrorWrap'
            else if (newInfinite !== oldInfinite) changedProp = 'isInfiniteMirrorWrap'

            if (!changedProp) return

            isUpdatingWallState = true

            if (changedProp === 'isWallRepel' && newRepel) {
                particleLife.isWallWrap = false
                particleLife.isMirrorWrap = false
                particleLife.isInfiniteMirrorWrap = false
            } else if (changedProp === 'isWallWrap') {
                if (newWrap) {
                    particleLife.isWallRepel = false
                    if (!newMirror && !newInfinite) particleLife.isMirrorWrap = true
                } else {
                    particleLife.isMirrorWrap = false
                    particleLife.isInfiniteMirrorWrap = false
                }
            } else if (changedProp === 'isMirrorWrap' && newMirror) {
                particleLife.isWallWrap = true
                particleLife.isWallRepel = false
                particleLife.isInfiniteMirrorWrap = false
            } else if (changedProp === 'isInfiniteMirrorWrap' && newInfinite) {
                particleLife.isWallWrap = true
                particleLife.isWallRepel = false
                particleLife.isMirrorWrap = false
            }

            isWallRepel = particleLife.isWallRepel
            isWallWrap = particleLife.isWallWrap
            isMirrorWrap = particleLife.isMirrorWrap
            isInfiniteMirrorWrap = particleLife.isInfiniteMirrorWrap

            setSimSize()
            if (changedProp === 'isWallWrap' || changedProp === 'isWallRepel' || (changedProp === 'isMirrorWrap' && newMirror && !oldWrap) || (changedProp === 'isInfiniteMirrorWrap' && newInfinite && !oldWrap)) {
                updateSimOptionsBuffer()
                if (!isRunning && isDebugBinsActive) step() // Force step for debug bins update
            }

            nextTick(() => {
                isUpdatingWallState = false
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        const destroyBuffers = async (keepTexture: boolean = false) => {
            currentPositionBuffer?.destroy(); currentPositionBuffer = undefined;
            nextPositionBuffer?.destroy(); nextPositionBuffer = undefined;
            velocityBuffer?.destroy(); velocityBuffer = undefined;
            typeBuffer?.destroy(); typeBuffer = undefined;
            typeBufferPacked?.destroy(); typeBufferPacked = undefined;
            colorBuffer?.destroy(); colorBuffer = undefined;
            deltaTimeBuffer?.destroy(); deltaTimeBuffer = undefined;
            cameraBuffer?.destroy(); cameraBuffer = undefined;
            interactionMatrixBuffer?.destroy(); interactionMatrixBuffer = undefined;
            simOptionsBuffer?.destroy(); simOptionsBuffer = undefined;
            glowOptionsBuffer?.destroy(); glowOptionsBuffer = undefined;
            infiniteRenderOptionsBuffer?.destroy(); infiniteRenderOptionsBuffer = undefined;
            debugOptionsBuffer?.destroy(); debugOptionsBuffer = undefined;
            brushOptionsBuffer?.destroy(); brushOptionsBuffer = undefined;
            brushesBuffer?.destroy(); brushesBuffer = undefined;
            particleHashesBuffer?.destroy(); particleHashesBuffer = undefined;
            cellHeadsBuffer?.destroy(); cellHeadsBuffer = undefined;
            particleNextIndicesBuffer?.destroy(); particleNextIndicesBuffer = undefined;
            particleBuffer?.destroy(); particleBuffer = undefined;
            particleTempBuffer?.destroy(); particleTempBuffer = undefined;
            binOffsetBuffer?.destroy(); binOffsetBuffer = undefined;
            binOffsetTempBuffer?.destroy(); binOffsetTempBuffer = undefined;
            binPrefixSumStepSizeBuffer?.destroy(); binPrefixSumStepSizeBuffer = undefined;

            particleKeepFlagsBuffer?.destroy(); particleKeepFlagsBuffer = undefined;
            newParticleCountBuffer?.destroy(); newParticleCountBuffer = undefined;
            newParticleCountReadBuffer?.destroy(); newParticleCountReadBuffer = undefined;
            particleCompactBuffer?.destroy(); particleCompactBuffer = undefined;
            
            trackerStateBuffer?.destroy(); trackerStateBuffer = undefined;
            trackerLevelsBuffer?.destroy(); trackerLevelsBuffer = undefined;
            trackerCameraOptionsBuffer?.destroy(); trackerCameraOptionsBuffer = undefined;

            if (!keepTexture) {
                offscreenTexture?.destroy(); offscreenTexture = undefined;
                offscreenTextureView = undefined as any;
                offscreenSampler = undefined as any;
                hdrTexture?.destroy(); hdrTexture = undefined;
                hdrTextureView = undefined as any;
            }

            await nextTick() // Ensure GPU resources are cleaned up before creating new ones
        }
        const destroyPipelinesAndBindGroups = () => {
            particleErasePipeline = undefined as any;
            particleCompactPipeline = undefined as any;
            particleCompactBindGroup = undefined as any;
            particleCompactBindGroupLayout = undefined as any;
            particleEraseBindGroup = undefined as any;
            particleEraseBindGroupLayout = undefined as any;

            renderPipeline = undefined as any;
            renderOffscreenPipeline = undefined as any;
            composeInfinitePipeline = undefined as any;
            renderMirrorPipeline = undefined as any;
            renderGlowPipeline = undefined as any;
            renderCirclePipeline = undefined as any;
            renderMirrorGlowPipeline = undefined as any;
            renderMirrorCirclePipeline = undefined as any;
            composeHdrPipeline = undefined as any;

            renderPipelineAdditive = undefined as any;
            renderMirrorPipelineAdditive = undefined as any;
            renderInfinitePipelineAdditive = undefined as any;
            renderCirclePipelineAdditive = undefined as any;
            renderMirrorCirclePipelineAdditive = undefined as any;
            renderInfiniteCirclePipelineAdditive = undefined as any;

            binClearSizePipeline = undefined as any;
            binFillSizePipeline = undefined as any;
            binPrefixSumPipeline = undefined as any;
            particleSortClearSizePipeline = undefined as any;
            particleSortPipeline = undefined as any;
            bruteForceComputePipeline = undefined as any;
            particleComputeForcesPipeline = undefined as any;
            particleAdvancePipeline = undefined as any;

            particleBufferReadOnlyBindGroup = undefined as any;
            binFillSizeBindGroup = undefined as any;
            if (binPrefixSumBindGroup) {
                for (let i = 0; i < binPrefixSumBindGroup.length; i++) {
                    binPrefixSumBindGroup[i] = undefined as any;
                }
            }
            binPrefixSumBindGroup = [];
            particleSortBindGroup = undefined as any;
            bruteForceBindGroup = undefined as any;
            particleComputeForcesBindGroup = undefined as any;
            particleBufferBindGroup = undefined as any;
            simOptionsBindGroup = undefined as any;
            deltaTimeBindGroup = undefined as any;
            cameraBindGroup = undefined as any;
            offscreenTextureBindGroup = undefined as any;
            composeHdrBindGroup = undefined as any;
            glowOptionsBindGroup = undefined as any;
            brushOptionsBindGroup = undefined as any;

            trackerAccumulatePipeline = undefined as any;
            trackerFinalizePipeline = undefined as any;
            trackerCameraUpdatePipeline = undefined as any;
            renderTrackerPipeline = undefined as any;
            trackerComputeBindGroup = undefined as any;
            trackerCameraUpdateBindGroup = undefined as any;
            trackerRenderBindGroup = undefined as any;
        }
        const cancelAnimationLoop = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        watch(() => particleLife.isLockedPointer, (value) => {
            const sidebarLeftElement = document.getElementById('sidebarLeft')
            if (sidebarLeftElement) {
                if (value) {
                    sidebarLeftElement.classList.add('force-hover-effect')
                } else {
                    sidebarLeftElement.classList.remove('force-hover-effect')
                }
            }
        })
        onUnmounted(() => {
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            destroyBuffers()
            releaseGpuDevice()
            // particleLife.$reset()
        })

        const releaseGpuDevice = () => {
            if (!device && !ctx) return
            cancelAnimationLoop()
            // if (device) device.onuncapturederror = null

            try { ctx?.unconfigure?.() } catch {}
            try { device?.destroy?.() } catch {}
            device = undefined as any
            ctx = undefined as any
        }

        const switchTo3D = () => {
            emit('switch-renderer', 'gpu3d')
        }

            return {
                particleLife, canvasRef, fps, executionTime, colorRgbStrings,
                handleZoom, toggleFullscreen, isFullscreen, smoothCenterView, regenerateLife, step, randomizeRadius, randomizeRulesAndRadius,
                updateSimWidth, updateSimHeight, updateNumParticles, setNewNumParticles, setNewNumTypes,
                updateRulesMatrixValue, updateMinMatrixValue, updateMaxMatrixValue, newRandomRulesMatrix,
                updateRulesMatrix, updateParticlePositions, updateColors, loadPreset, updateSingleColor,
                startTrackerSelection, cancelTrackerSelection, stopTracker, onTrackerZoneSelected,
                rulesOptions, paletteOptions, positionOptions, switchTo3D
            }
    }
});
</script>

<style scoped>
canvas {
    background: black;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}
</style>
