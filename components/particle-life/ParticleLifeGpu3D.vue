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
                            <p ml-1.5 px-2 py-0.5 rounded-lg ring-1 uppercase justify-center font-mono font-bold class="bg-amber-600/20 text-amber-400 ring-amber-500/30">
                                3D
                            </p>
                        </div>
                        <button @click="switchTo2D" px-2 h-full rounded-lg flex items-center font-semibold class="bg-cyan-500/15 hover:bg-cyan-500/25 transition-all ring-1 ring-cyan-300/45 text-cyan-100" title="Switch to 2D version">
                            <span class="i-tabler-cube-off text-sm mr-1"></span>
                            <span class="-mb-px text-xs">Try 2D</span>
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
                                <Input label="x" v-model="particleLife.simWidth" @change="updateSimWidth" inputClass="w-12!" mr-2 />
                                <Input label="y" v-model="particleLife.simHeight" @change="updateSimHeight" inputClass="w-12!" mr-2 />
                                <Input label="z" v-model="particleLife.simDepth" @change="updateSimDepth" inputClass="w-12!" mr-2 />
                                <button type="button" btn rounded-full p2 flex items-center bg="slate-950/90 hover:slate-950/50" @click="particleLife.linkProportions = !particleLife.linkProportions">
                                    <span :class="particleLife.linkProportions ? 'i-tabler-link' : 'i-tabler-unlink'" text-sm></span>
                                </button>
                            </div>

                            <hr border-gray-500 mt-1 mb-2>
                            <p underline text-gray-300 class="-mt-0.5" mb-2>Boundary Settings :</p>

                            <OptionBar name="wallStateGpu3D" v-model="particleLife.wallState" :options="[
                                { id: 'none', label: 'None' },
                                { id: 'repel', label: 'Repel' },
                                { id: 'wrap', label: 'Wrap' }]">
                            </OptionBar>
                        </Collapse>
                        <Collapse label="Physics Settings" icon="i-tabler-atom text-fuchsia-500" opened>
                            <RangeInput input label="Repel Force"
                                        tooltip="Adjust the force that repels particles from each other. <br> Higher values increase the separation distance."
                                        :min="0.01" :max="4" :step="0.01" v-model="particleLife.repel">
                            </RangeInput>
                            <RangeInput input label="Force Multiplier"
                                        tooltip="Scales the interaction forces between particles. <br> Higher values make forces stronger and particles move faster."
                                        :min="0.01" :max="4" :step="0.01" v-model="particleLife.forceFactor" mt-2>
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

                            <hr border-gray-500 my-2>
                            <div flex justify-between gap-2>
                                <ToggleSwitch label="Bounding Box" v-model="particleLife.isBoundingBoxActive" />
                                <ToggleSwitch label="Particle Border"
                                              tooltip="Draw a subtle dark border around each particle. Helps individual particles stand out in dense clusters. Disable for solid discs that blend together more."
                                              v-model="particleLife.isParticleBorder">
                                </ToggleSwitch>
                            </div>
                            <hr border-gray-500 my-2>

                            <div flex items-start justify-between mb-1>
                                <p underline text-gray-300 mb-1>Sphere Shading :</p>
                                <ToggleSwitch label="Sphere Shading" colorful-label v-model="particleLife.isSphereShading" />
                            </div>
                            <div v-show="particleLife.isSphereShading">
                                <div flex items-center justify-between gap-2>
                                    <p class="w-1/3 text-2sm shrink-0">
                                        Material
                                        <TooltipInfo container="#mainContainer" tooltip="Preset combinations of ambient, diffuse, specular and shininess that emulate common materials (matte, plastic, metal…). <br> Pick one as a starting point, then fine-tune the sliders below." />
                                    </p>
                                    <SelectInput name="sphere-shading-preset" class="max-w-full!"
                                                 v-model="sphereShadingPreset"
                                                 :options="sphereShadingPresetOptions">
                                    </SelectInput>
                                </div>
                                <RangeInput input label="Ambient" mt-1
                                            tooltip="Constant ambient term added to the diffuse contribution. Raises overall brightness on dark sides."
                                            :min="0" :max="1" :step="0.01" v-model="particleLife.sphereAmbient">
                                </RangeInput>
                                <RangeInput input label="Diffuse" mt-2
                                            tooltip="Lambert diffuse strength. Controls how strongly the lit hemisphere reads as the base color."
                                            :min="0" :max="2" :step="0.01" v-model="particleLife.sphereDiffuseStrength">
                                </RangeInput>
                                <RangeInput input label="Specular" mt-2
                                            tooltip="Blinn-Phong specular strength (white highlight). 0 disables the highlight."
                                            :min="0" :max="2" :step="0.01" v-model="particleLife.sphereSpecularStrength">
                                </RangeInput>
                                <RangeInput input label="Shininess" mt-2
                                            tooltip="Specular exponent. Higher values produce a smaller, sharper highlight."
                                            :min="1" :max="128" :step="1" v-model="particleLife.sphereShininess">
                                </RangeInput>
                                <div flex items-center justify-between mt-2>
                                    <p class="w-2/3 text-2sm">
                                        Light Direction
                                        <TooltipInfo container="#mainContainer" tooltip="Position of the light source illuminating each particle. <br> X = left/right <br> Y = up/down <br> Z = front/back <br> Negative values flip the direction on that axis." />
                                    </p>
                                    <div flex items-center gap-2>
                                        <Input label="x" :model-value="particleLife.sphereLightDir[0]" @update:model-value="particleLife.sphereLightDir[0] = $event" inputClass="w-12!" />
                                        <Input label="y" :model-value="particleLife.sphereLightDir[1]" @update:model-value="particleLife.sphereLightDir[1] = $event" inputClass="w-12!" />
                                        <Input label="z" :model-value="particleLife.sphereLightDir[2]" @update:model-value="particleLife.sphereLightDir[2] = $event" inputClass="w-12!" />
                                    </div>
                                </div>
                            </div>

                            <hr border-gray-500 my-2>
                            <div flex items-start justify-between mb-2>
                                <p underline text-gray-300 mb-1>Glow Settings :</p>
                                <ToggleSwitch label="Particle Glowing" colorful-label v-model="particleLife.isParticleGlow" />
                            </div>
                            <div v-show="particleLife.isParticleGlow">
                                <RangeInput input label="Glow Threshold" mt-2
                                            tooltip="Luminance threshold above which pixels contribute to the glow (soft-knee around this value)."
                                            :min="0" :max="2" :step="0.01" v-model="particleLife.bloomThreshold">
                                </RangeInput>
                                <RangeInput input label="Glow Intensity" mt-2
                                            tooltip="Strength of the glow mixed back into the final image (final = hdr + glow * intensity)."
                                            :min="0" :max="2" :step="0.01" v-model="particleLife.bloomIntensity">
                                </RangeInput>
                                <RangeInput input label="Glow Knee" mt-2
                                            tooltip="Soft-knee width around the threshold. 0 = hard cutoff, 1 = very smooth ramp."
                                            :min="0" :max="1" :step="0.01" v-model="particleLife.bloomKnee">
                                </RangeInput>
                                <div flex items-center justify-between gap-2 mt-1>
                                    <p class="w-1/3 text-2sm shrink-0">
                                        Tonemap
                                        <TooltipInfo container="#mainContainer" tooltip="Tone mapping operator applied to the HDR buffer before display. <br> Controls how bright glowing pixels are compressed into the visible range." />
                                    </p>
                                    <SelectInput name="tonemap-mode" class="max-w-full!"
                                                 v-model="particleLife.tonemapMode"
                                                 :options="tonemapOptions">
                                    </SelectInput>
                                </div>
                            </div>
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
                        </Collapse>
                        <Collapse label="Performance" icon="i-tabler-gauge text-rose-500"
                                  tooltip="Tune how the simulation finds neighboring particles. <br> Different algorithms and storage layouts suit different particle counts and interaction radii. <br> Enable GPU Timings to measure each pass and pick the fastest combination for your scene.">
                            <div flex items-center justify-between gap-2>
                                <p class="w-1/3 text-2sm shrink-0">
                                    Algorithm
                                    <TooltipInfo container="#mainContainer" tooltip="How each particle finds its neighbors. <br> <b>Spatial Binning</b>: groups particles into cells, only checks nearby cells. Fastest for large radii or many particles. <br> <b>Brute Force</b>: every particle checks every other one. Simpler, only faster with very few particles." />
                                </p>
                                <SelectInput name="algorithm-mode" class="max-w-full!"
                                             :model-value="particleLife.useBinning ? 'spatial' : 'brute'"
                                             @update:model-value="particleLife.useBinning = $event === 'spatial'"
                                             :options="[
                                                 { id: 'spatial', name: 'Spatial Binning', icon: 'i-tabler-topology-ring-3', category: 'Method' },
                                                 { id: 'brute', name: 'Brute Force', icon: 'i-tabler-cpu', category: 'Method' },
                                             ]">
                                </SelectInput>
                            </div>
                            <div v-show="particleLife.useBinning" flex items-center justify-between gap-2 mt-1.5>
                                <p class="w-1/3 text-2sm shrink-0">
                                    Binning
                                    <TooltipInfo container="#mainContainer" tooltip="How spatial cells are stored in GPU memory. <br> <b>Dense Grid</b>: 3D array indexed by cell coordinates. Fast lookup, more memory. <br> <b>Hash Grid</b>: cells stored in a hash table. Constant memory, slight lookup overhead. Recommended for very large simulation spaces." />
                                </p>
                                <SelectInput name="binning-mode" class="max-w-full!"
                                             v-model="particleLife.binningMode"
                                             :options="[
                                                 { id: 'grid', name: 'Dense Grid', icon: 'i-tabler-grid-4x4', category: 'Binning' },
                                                 { id: 'hash', name: 'Hash Grid', icon: 'i-tabler-hash', category: 'Binning' },
                                             ]">
                                </SelectInput>
                            </div>
                            <RangeInput v-show="particleLife.useBinning" input label="Cell Subdivisions" mt-1.5
                                        tooltip="Splits each bin cell into smaller sub-cells. <br> Default: 1 (fastest in almost every scene). <br> Higher values rarely help: fewer particles per cell, but many more cells to scan around each particle. <br> Can help with very large interaction radii on dense clusters."
                                        :min="1" :max="5" :step="1" v-model="particleLife.cellSubdivisions">
                            </RangeInput>
                            <RangeInput v-show="particleLife.useBinning && particleLife.binningMode === 'grid' && particleLife.wallState === 'none'"
                                        input label="Grid Extension" mt-2
                                        tooltip="How many times larger than the simulation box the dense grid extends in each axis. <br> Higher values let particles drift further before being clamped at the borders, at a cubic memory cost. <br> Automatically clamped to what fits the device's max bin count."
                                        :min="1" :max="particleLife.maxGridExtensionFactor" :step="1"
                                        v-model="particleLife.gridExtensionFactor">
                            </RangeInput>
                            <hr border-gray-500 my-2>
                            <ToggleSwitch label="Show GPU Timings" colorful-label mb-0.5
                                          tooltip="Display per-pass GPU execution times (binning, forces, advance, render) in the top-right HUD. <br> Uses WebGPU timestamp queries. <br> Has a tiny performance cost (allocations + potential driver pipeline stalls), so it's off by default."
                                          v-model="particleLife.isGpuTimingsEnabled">
                            </ToggleSwitch>
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
                <button type="button" name="Toggle Camera Target" title="Toggle Camera Target" aria-label="Toggle Camera Target"
                        btn rounded-full flex items-center justify-center p-2 class="backdrop-blur-sm z-10 relative"
                        :class="particleLife.isCameraTargetVisible ? 'bg-red-700/80 hover:bg-red-600/80' : 'bg-red-900/80  hover:bg-red-700/80'"
                        @click="particleLife.isCameraTargetVisible = !particleLife.isCameraTargetVisible" :disabled="particleLife.isHudLocked">
                    <span i-streamline-flex-3d-coordinate-axis class="-mt-px" :class="particleLife.isCameraTargetVisible ? 'text-red-200' : 'text-red-300/80'"></span>
                </button>
                <CenterViewButton :disabled="particleLife.isHudLocked" :is3D="true"
                                  @centerAll="smoothCenterView()"
                                  @centerPosition="smoothCenterView(true, false, false)"
                                  @resetZoom="smoothCenterView(false, true, false)" 
                                  @resetRotation="smoothCenterView(false, false, true)">
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

        <SaveModal :store="particleLife"></SaveModal>

        <div absolute top-0 right-0 flex flex-col items-end text-right pointer-events-none>
            <div flex items-center text-start text-xs pl-4 pr-1 bg-slate-800 rounded-bl-xl style="padding-bottom: 1px; opacity: 75%" >
                <div flex>Fps: <div ml-1 min-w-8>{{ fps }}</div></div>
                <!--                <div flex ml-3>Process: <div ml-1 min-w-7>{{ Math.round(executionTime) }}</div></div>-->
            </div>
            <div v-if="particleLife.isGpuTimingsEnabled" flex flex-col items-end text-start text-xs pl-2.5 pr-2 py-1.5 bg-slate-800 rounded-l-xl style="opacity: 75%; font-family: monospace" mt-1>
                <div v-if="particleLife.useBinning" flex>bin <div ml-1 min-w-15 text-end>{{ gpuTimings.binning.toFixed(2) }} ms</div></div>
                <div flex>force <div ml-1 min-w-15 text-end>{{ gpuTimings.forces.toFixed(2) }} ms</div></div>
                <div flex>adv <div ml-1 min-w-15 text-end>{{ gpuTimings.advance.toFixed(2) }} ms</div></div>
                <div flex>rend <div ml-1 min-w-15 text-end>{{ gpuTimings.render.toFixed(2) }} ms</div></div>
                <div v-if="particleLife.isParticleGlow" flex>bloom <div ml-1 min-w-15 text-end>{{ gpuTimings.bloom.toFixed(2) }} ms</div></div>
                <div v-if="particleLife.isParticleGlow" flex>comp <div ml-1 min-w-15 text-end>{{ gpuTimings.compose.toFixed(2) }} ms</div></div>
                <div flex border-t-px border-gray-500 pt-0.5 mt-px>total <div ml-1 min-w-15 text-end>{{ gpuTimings.total.toFixed(2) }} ms</div></div>
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
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import MatrixSettings from "~/components/particle-life/MatrixSettings.vue";
import BrushSettings from "~/components/particle-life/BrushSettings.vue";
import RadiusVisualizer from "~/components/particle-life/RadiusVisualizer.vue";
import { RULES_OPTIONS, generateRules } from '~/helpers/utils/rulesGenerator';
import { PALETTE_OPTIONS, generateColors } from "~/helpers/utils/colorsGenerator";
import { POSITION_OPTIONS, generatePositions } from "~/helpers/utils/positionsGenerator3D";
import { mat4Perspective, mat4LookAt, mat4Mul } from "~/helpers/utils/camera3D";
import { hexToRgb } from '~/helpers/utils/colorConversion';

import binFillSizeShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/binFillSize.wgsl?raw';
import binScanLocalShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/binScanLocal.wgsl?raw';
import binScanAuxShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/binScanAux.wgsl?raw';
import binAddOffsetsShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/binAddOffsets.wgsl?raw';
import particleSortShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/particleSort.wgsl?raw';
import particleComputeForcesShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/particleComputeForces.wgsl?raw';
import binFillSizeHashShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/binFillSize_hash.wgsl?raw';
import particleSortHashShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/particleSort_hash.wgsl?raw';
import particleComputeForcesHashShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/particleComputeForces_hash.wgsl?raw';

import bruteForceShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/compute_bruteForce.wgsl?raw';
import particleAdvanceShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/particleAdvance.wgsl?raw';
import renderShaderCode from 'assets/particle-life-gpu-3d/shaders/render/render_normal.wgsl?raw';
import renderGlowShaderCode from 'assets/particle-life-gpu-3d/shaders/render/particle_render_glow.wgsl?raw';
import boxShaderCode from 'assets/particle-life-gpu-3d/shaders/render/render_box.wgsl?raw';
import cameraTargetShaderCode from 'assets/particle-life-gpu-3d/shaders/render/camera_target.wgsl?raw';
import composeHdrShaderCode from 'assets/particle-life-gpu-3d/shaders/compose/compose_hdr.wgsl?raw';
import bloomShaderCode from 'assets/particle-life-gpu-3d/shaders/compose/bloom.wgsl?raw';
import PresetPanel from "~/components/particle-life/PresetPanel.vue";
import SaveModal from "~/components/particle-life/SaveModal.vue";
import CenterViewButton from "~/components/particle-life/CenterViewButton.vue";

const tonemapOptions = [
    { id: 0, name: 'None (raw)',           category: 'Raw' },
    { id: 1, name: 'ACES (Narkowicz)',     category: 'Stylized' },
    { id: 2, name: 'ACES (Fitted)',        category: 'Stylized' },
    { id: 3, name: 'Lottes',               category: 'Stylized' },
    { id: 4, name: 'Reinhard-Jodie',       category: 'Filmic' },
    { id: 5, name: 'Uncharted 2 (Filmic)', category: 'Filmic' },
    { id: 6, name: 'AgX',                  category: 'Realistic' },
]
const SPHERE_SHADING_PRESETS = [
    { id: 'matte',    name: 'Matte',    category: 'Diffuse',  ambient: 0.45, diffuse: 0.95, specular: 0.00, shininess: 1 },
    { id: 'chalk',    name: 'Chalk',    category: 'Diffuse',  ambient: 0.35, diffuse: 0.80, specular: 0.05, shininess: 4 },
    { id: 'rubber',   name: 'Rubber',   category: 'Soft',     ambient: 0.20, diffuse: 0.90, specular: 0.20, shininess: 8 },
    { id: 'plastic',  name: 'Plastic',  category: 'Soft',     ambient: 0.25, diffuse: 0.85, specular: 0.45, shininess: 24 },
    { id: 'glossy',   name: 'Glossy',   category: 'Glossy',   ambient: 0.15, diffuse: 0.80, specular: 0.75, shininess: 48 },
    { id: 'ceramic',  name: 'Ceramic',  category: 'Glossy',   ambient: 0.10, diffuse: 0.70, specular: 1.10, shininess: 96 },
    { id: 'chrome',   name: 'Chrome',   category: 'Metallic', ambient: 0.05, diffuse: 0.55, specular: 1.50, shininess: 128},
] as const
const sphereShadingPresetOptions = [
    ...SPHERE_SHADING_PRESETS.map(p => ({ id: p.id, name: p.name, category: p.category })),
    { id: 'custom', name: 'Custom', category: 'Manual' },
]

export default defineComponent({
    name: 'ParticleLifeGpu',
    components: { SaveModal, PresetPanel, CenterViewButton, RadiusVisualizer, BrushSettings, MatrixSettings },
    emits: ['switch-renderer'],
    setup(props, { emit }) {
        // Define refs and variables
        const mainContainer = ref<HTMLElement | null>(null)
        const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(mainContainer)
        const { success, error } = useToasts()
        const particleLife = useParticleLifeGPU3DStore()
        const fps = useFps()
        const executionTime = ref<number>(0)
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: GPUCanvasContext
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
        let DEVICE_PIXEL_RATIO: number = 1
        let CANVAS_ASPECT_RATIO: number = 1
        let SIM_WIDTH: number = 0
        let SIM_HEIGHT: number = 0
        let SIM_DEPTH: number = 0
        let SIM_WIDTH_HALF: number = 0
        let SIM_HEIGHT_HALF: number = 0
        let SIM_DEPTH_HALF: number = 0
        let CELL_SIZE: number = 0
        let CELL_SUBDIVISIONS: number = particleLife.cellSubdivisions
        let baseSimWidth: number = 0
        let baseSimHeight: number = 0
        let baseSimDepth: number = 0
        let GRID_WIDTH: number = 0
        let GRID_HEIGHT: number = 0
        let GRID_DEPTH: number = 0
        let binCount: number = 0

        let SCAN_THREADS: number = 1024
        let SCAN_BLOCK_SIZE: number = 2048
        let scanBlockCount: number = 0 // ceil((binCount + 1) / SCAN_BLOCK_SIZE)
        let auxBlockCount: number = 0 // ceil(scanBlockCount / SCAN_BLOCK_SIZE)
        let binDispatchX: number = 0
        let binDispatchY: number = 0
        let scanTwoLevels: boolean = false // true if scanBlockCount > SCAN_BLOCK_SIZE

        let MAX_BIN_COUNT = 0 // Hardware ceiling computed once at boot from device.limits (see computeBinCaps)

        // -------------------------------------------------------------------------------------------------------------
        // ---- GPU profiling ----
        let isGpuTimingsEnabled: boolean = particleLife.isGpuTimingsEnabled
        let timestampQuerySupported: boolean = false
        let timestampQuerySet: GPUQuerySet | null = null
        let timestampResolveBuffer: GPUBuffer | null = null
        const timestampStagingPool: GPUBuffer[] = []
        const TIMESTAMP_COUNT = 12 // 6 slots × 2 (begin/end): binning, forces, advance, render, bloom, compose
        let timestampStagingInFlight: number = 0
        const gpuTimings = reactive({ binning: 0, forces: 0, advance: 0, render: 0, bloom: 0, compose: 0, total: 0 })
        // -----------------------
        // -------------------------------------------------------------------------------------------------------------

        let EXTENDED_GRID_WIDTH: number = 0
        let EXTENDED_GRID_HEIGHT: number = 0
        let EXTENDED_GRID_DEPTH: number = 0
        let GRID_OFFSET_X: number = 0
        let GRID_OFFSET_Y: number = 0
        let GRID_OFFSET_Z: number = 0
        let EXTENDED_SIM_WIDTH: number = 0
        let EXTENDED_SIM_HEIGHT: number = 0
        let EXTENDED_SIM_DEPTH: number = 0

        // Define color list and rules matrix for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color
        let currentMaxRadius: number = 0 // Max value between all colors max radius (for cell size)

        // Define the simulation properties
        let initialParticles: Float32Array // Initial particle x, y, vx, vy, type
        let colors: Float32Array // Particle colors

        // Define the properties for dragging and zooming
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y
        let cameraChanged: boolean = true

        // Define camera properties
        const FOV_Y: number = 60 * Math.PI / 180
        const NEAR_PLANE: number = 0.05
        const FAR_PLANE: number = 100.0

        let zoomSmoothing: number = particleLife.zoomSmoothing // Smoothing factor for zooming
        let panSmoothing: number = particleLife.panSmoothing // Smoothing factor for panning

        let zoomFactor: number = 1.5 // distance from focus point (zoom)
        let cameraYaw: number = 0 // rotation around Y (horizontal)
        let cameraPitch: number = 0 // rotation around X (vertical)
        const cameraTarget: [number, number, number] = [0, 0, 0] // pan offset in normalized world space

        let targetZoomFactor: number = 1.5
        let targetCameraYaw: number = 0
        let targetCameraPitch: number = 0
        const targetCameraTarget: [number, number, number] = [0, 0, 0]

        const cameraRight: [number, number, number] = [1, 0, 0]
        const cameraUp: [number, number, number]    = [0, 1, 0]
        const cameraFwd: [number, number, number]   = [0, 0, -1]
        let cameraRotationChanged: boolean = true

        const CAMERA_BUFFER_SIZE = 96 // 96 bytes = 64 (mat4) + 16 (vec4 params) + 16 (vec4 focus point), aligned to 16
        const cameraData = new Float32Array(CAMERA_BUFFER_SIZE / 4)
        const cameraProjMatrix = new Float32Array(16)
        const cameraViewMatrix = new Float32Array(16)

        // Define variables for the simulation
        let repel: number = particleLife.repel // Repel force between particles
        let forceFactor: number = particleLife.forceFactor // Adjust the overall force applied between particles (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 0 is no friction)
        let NUM_PARTICLES: number = particleLife.numParticles
        let NEW_NUM_PARTICLES: number = NUM_PARTICLES
        let PARTICLE_SIZE: number = particleLife.particleSize
        let PARTICLE_OPACITY: number = particleLife.particleOpacity
        let NUM_TYPES: number = particleLife.numColors
        let NEW_NUM_TYPES: number = NUM_TYPES
        let useBinning: boolean = particleLife.useBinning // Use spatial binning for neighbor search (vs brute force)
        let binningMode: 'grid' | 'hash' = particleLife.binningMode // 'grid' = dense extended grid, 'hash' = Teschner spatial hash table
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let isBoundingBoxActive: boolean = particleLife.isBoundingBoxActive // Show box wireframe
        let isCameraTargetVisible: boolean = particleLife.isCameraTargetVisible

        let isParticleGlow: boolean = particleLife.isParticleGlow // Toggle HDR + dual-filter bloom render path (UI: "Particle Glowing")
        let tonemapMode: number = particleLife.tonemapMode
        let bloomThreshold: number = particleLife.bloomThreshold
        let bloomIntensity: number = particleLife.bloomIntensity
        let bloomKnee: number = particleLife.bloomKnee

        let isParticleBorder: boolean = particleLife.isParticleBorder
        let isSphereShading: boolean = particleLife.isSphereShading
        let sphereAmbient: number = particleLife.sphereAmbient
        let sphereDiffuseStrength: number = particleLife.sphereDiffuseStrength
        let sphereSpecularStrength: number = particleLife.sphereSpecularStrength
        let sphereShininess: number = particleLife.sphereShininess
        let sphereLightDir: number[] = [...particleLife.sphereLightDir]

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

        let particleBuffer: GPUBuffer | undefined
        let particleTempBuffer: GPUBuffer | undefined
        let binOffsetBuffer: GPUBuffer | undefined
        let binSortCounterBuffer: GPUBuffer | undefined
        let binAuxBuffer: GPUBuffer | undefined
        let binAux2Buffer: GPUBuffer | undefined
        let cellSignatureBuffer: GPUBuffer | undefined // Hash mode only: per-particle 32-bit cell signature for collision rejection
        let bloomOptionsBuffer: GPUBuffer | undefined // threshold, intensity, knee
        let renderOptionsBuffer: GPUBuffer | undefined // border, sphere shading, lightDir, etc...

        let particleBufferBindGroup: GPUBindGroup
        let particleBufferReadOnlyBindGroup: GPUBindGroup
        let binFillSizeBindGroup: GPUBindGroup
        let scanLocalBinOffsetBindGroup: GPUBindGroup
        let scanLocalAuxBindGroup: GPUBindGroup
        let scanAuxBindGroup: GPUBindGroup
        let addOffsetsAuxBindGroup: GPUBindGroup
        let addOffsetsBinOffsetBindGroup: GPUBindGroup
        let particleSortBindGroup: GPUBindGroup
        let particleSortHashBindGroup: GPUBindGroup
        let particleComputeForcesBindGroup: GPUBindGroup
        let particleComputeForcesHashBindGroup: GPUBindGroup
        let bruteForceBindGroup: GPUBindGroup
        let simOptionsBindGroup: GPUBindGroup
        let deltaTimeBindGroup: GPUBindGroup
        let cameraBindGroup: GPUBindGroup
        let renderOptionsBindGroup: GPUBindGroup
        let composeHdrBindGroup: GPUBindGroup
        const bloomDownBindGroups: GPUBindGroup[] = []
        const bloomUpBindGroups: GPUBindGroup[] = []

        let particleBufferBindGroupLayout: GPUBindGroupLayout
        let particleBufferReadOnlyBindGroupLayout: GPUBindGroupLayout
        let scanLocalBindGroupLayout: GPUBindGroupLayout
        let scanAuxBindGroupLayout: GPUBindGroupLayout
        let addOffsetsBindGroupLayout: GPUBindGroupLayout
        let binFillSizeBindGroupLayout: GPUBindGroupLayout
        let particleSortBindGroupLayout: GPUBindGroupLayout
        let particleSortHashBindGroupLayout: GPUBindGroupLayout
        let particleComputeForcesBindGroupLayout: GPUBindGroupLayout
        let particleComputeForcesHashBindGroupLayout: GPUBindGroupLayout
        let bruteForceBindGroupLayout: GPUBindGroupLayout
        let simOptionsBindGroupLayout: GPUBindGroupLayout
        let deltaTimeBindGroupLayout: GPUBindGroupLayout
        let cameraBindGroupLayout: GPUBindGroupLayout
        let renderOptionsBindGroupLayout: GPUBindGroupLayout
        let bloomBindGroupLayout: GPUBindGroupLayout
        let composeHdrBindGroupLayout: GPUBindGroupLayout

        let binFillSizePipeline: GPUComputePipeline
        let binScanLocalPipeline: GPUComputePipeline
        let binScanAuxPipeline: GPUComputePipeline
        let binAddOffsetsPipeline: GPUComputePipeline
        let particleSortPipeline: GPUComputePipeline
        let particleComputeForcesPipeline: GPUComputePipeline
        let binFillSizeHashPipeline: GPUComputePipeline
        let particleSortHashPipeline: GPUComputePipeline
        let particleComputeForcesHashPipeline: GPUComputePipeline
        let bruteForceComputePipeline: GPUComputePipeline
        let particleAdvancePipeline: GPUComputePipeline

        let activeFillSizePipeline: GPUComputePipeline
        let activeSortPipeline: GPUComputePipeline
        let activeForcesPipeline: GPUComputePipeline
        let activeSortBindGroup: GPUBindGroup
        let activeForcesBindGroup: GPUBindGroup

        let renderPipeline: GPURenderPipeline
        let boxRenderPipeline: GPURenderPipeline
        let cameraTargetRenderPipeline: GPURenderPipeline
        let renderCirclePipeline: GPURenderPipeline
        let boxRenderHdrPipeline: GPURenderPipeline
        let cameraTargetHdrPipeline: GPURenderPipeline
        const composeHdrPipelines: GPURenderPipeline[] = [] // One pre-compiled pipeline per tonemap operator (indexed by tonemap id)
        let bloomPrefilterPipeline: GPURenderPipeline
        let bloomDownsamplePipeline: GPURenderPipeline
        let bloomUpsamplePipeline: GPURenderPipeline

        let depthTexture: GPUTexture | undefined
        let depthTextureView: GPUTextureView | undefined
        let hdrTexture: GPUTexture | undefined
        let hdrTextureView: GPUTextureView | undefined
        let bloomSampler: GPUSampler | undefined

        const BLOOM_MIPS: number = 4
        const bloomTextures: (GPUTexture | undefined)[] = new Array(BLOOM_MIPS).fill(undefined)
        const bloomTextureViews: (GPUTextureView | undefined)[] = new Array(BLOOM_MIPS).fill(undefined)

        const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus'
        const HDR_FORMAT: GPUTextureFormat = 'rgba16float'

        onMounted(async () => {
            await initWebGPU()
            handleResize()
            setSimSizeBasedOnScreen()
            await initLife()

            useEventListener('resize', handleResize)
            useEventListener(canvasRef.value, ['mousedown'], (e) => {
                lastPointerX = (e.x - canvasRef.value!.getBoundingClientRect().left) * DEVICE_PIXEL_RATIO
                lastPointerY = (e.y - canvasRef.value!.getBoundingClientRect().top) * DEVICE_PIXEL_RATIO
                if (e.button === 1) { // Middle click (wheel click)
                    particleLife.isCameraTargetVisible = !particleLife.isCameraTargetVisible
                }
            })
            useEventListener(canvasRef.value, ['mousemove'], (e) => {
                pointerX = (e.x - canvasRef.value!.getBoundingClientRect().left) * DEVICE_PIXEL_RATIO
                pointerY = (e.y - canvasRef.value!.getBoundingClientRect().top) * DEVICE_PIXEL_RATIO

                if (e.buttons & 3) { // if mouse is pressed, ignoring wheel click event (bit 4)
                    isDragging = true
                    if (e.buttons & 1) handleMove() // if left-click or left+right click
                    if (e.buttons & 2) handleRotate() // if right-click or left+right click
                    lastPointerX = pointerX
                    lastPointerY = pointerY
                }
                else if (e.buttons === 0) {
                    isDragging = false
                }
            })
            useEventListener(canvasRef.value, ['mouseup'], () => {
                isDragging = false
            })
            useEventListener(canvasRef.value, 'mouseleave', () => {
                isDragging = false
            })
            useEventListener(canvasRef.value, 'wheel', (e) => {
                e.preventDefault()
                if (e.deltaY < 0) handleZoom(1) // Zoom in
                else handleZoom(-1) // Zoom out
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1
            CANVAS_WIDTH = canvasRef.value!.width = Math.round(canvasRef.value!.clientWidth * DEVICE_PIXEL_RATIO)
            CANVAS_HEIGHT = canvasRef.value!.height = Math.round(canvasRef.value!.clientHeight * DEVICE_PIXEL_RATIO)
            CANVAS_ASPECT_RATIO = (CANVAS_WIDTH > 0 && CANVAS_HEIGHT > 0) ? CANVAS_WIDTH / CANVAS_HEIGHT : 1
            updateDepthTexture()
            updateHdrTexture()
            cameraChanged = true
        }
        function setSimSizeBasedOnScreen() {
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = CANVAS_WIDTH
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = CANVAS_HEIGHT
            particleLife.simDepth = SIM_DEPTH = baseSimDepth = CANVAS_HEIGHT
            SIM_WIDTH_HALF = SIM_WIDTH * 0.5
            SIM_HEIGHT_HALF = SIM_HEIGHT * 0.5
            SIM_DEPTH_HALF = SIM_DEPTH * 0.5
        }
        function setSimSize() {
            if (useBinning && isWallWrap) {
                particleLife.simWidth = SIM_WIDTH = CELL_SIZE * Math.round(baseSimWidth / CELL_SIZE)
                particleLife.simHeight = SIM_HEIGHT = CELL_SIZE * Math.round(baseSimHeight / CELL_SIZE)
                particleLife.simDepth = SIM_DEPTH = CELL_SIZE * Math.round(baseSimDepth / CELL_SIZE)
            }
            SIM_WIDTH_HALF = SIM_WIDTH * 0.5
            SIM_HEIGHT_HALF = SIM_HEIGHT * 0.5
            SIM_DEPTH_HALF = SIM_DEPTH * 0.5

            updateBinningParameters()
        }
        const updateBinningParameters = () => {
            const oldBinCount = binCount
            const oldScanBlockCount = scanBlockCount
            const oldAuxBlockCount = auxBlockCount

            GRID_WIDTH = Math.ceil(SIM_WIDTH / CELL_SIZE)
            GRID_HEIGHT = Math.ceil(SIM_HEIGHT / CELL_SIZE)
            GRID_DEPTH = Math.ceil(SIM_DEPTH / CELL_SIZE)

            if (binningMode === 'hash') {
                EXTENDED_SIM_WIDTH = SIM_WIDTH
                EXTENDED_SIM_HEIGHT = SIM_HEIGHT
                EXTENDED_SIM_DEPTH = SIM_DEPTH
                EXTENDED_GRID_WIDTH = GRID_WIDTH
                EXTENDED_GRID_HEIGHT = GRID_HEIGHT
                EXTENDED_GRID_DEPTH = GRID_DEPTH
                GRID_OFFSET_X = 0
                GRID_OFFSET_Y = 0
                GRID_OFFSET_Z = 0
                binCount = 1 << Math.ceil(Math.log2(NUM_PARTICLES)) // Smallest power of 2 ≥ NUM_PARTICLES so the modulo becomes a free bitmask in shaders.
            } else if (!isWallWrap && !isWallRepel) {
                const requestedFactor = particleLife.gridExtensionFactor // Default: 12
                const PERF_CAP = 30_000_000 // Arbitrary upper limit to avoid trying to use an excessive number of bins even if the device caps are very high. Based on preliminary tests showing that performance degrades significantly beyond this point on current hardware, even if the device limits would allow it.
                const targetBinCount = Math.min(MAX_BIN_COUNT, PERF_CAP)
                const baseBinCount = GRID_WIDTH * GRID_HEIGHT * GRID_DEPTH
                const maxPossibleFactor = Math.cbrt(MAX_BIN_COUNT / baseBinCount)
                const perfFactor = Math.cbrt(targetBinCount / baseBinCount)
                const safeFactor = Math.max(1, Math.min(requestedFactor, maxPossibleFactor * 0.9, perfFactor))

                particleLife.maxGridExtensionFactor = Math.max(1, Math.floor(maxPossibleFactor * 0.9))

                const extensionX = (SIM_WIDTH * safeFactor - SIM_WIDTH) / 2
                const extensionY = (SIM_HEIGHT * safeFactor - SIM_HEIGHT) / 2
                const extensionZ = (SIM_DEPTH * safeFactor - SIM_DEPTH) / 2

                EXTENDED_SIM_WIDTH = SIM_WIDTH + (extensionX * 2)
                EXTENDED_SIM_HEIGHT = SIM_HEIGHT + (extensionY * 2)
                EXTENDED_SIM_DEPTH = SIM_DEPTH + (extensionZ * 2)
                EXTENDED_GRID_WIDTH = Math.ceil(EXTENDED_SIM_WIDTH / CELL_SIZE)
                EXTENDED_GRID_HEIGHT = Math.ceil(EXTENDED_SIM_HEIGHT / CELL_SIZE)
                EXTENDED_GRID_DEPTH = Math.ceil(EXTENDED_SIM_DEPTH / CELL_SIZE)
                GRID_OFFSET_X = Math.ceil(extensionX / CELL_SIZE)
                GRID_OFFSET_Y = Math.ceil(extensionY / CELL_SIZE)
                GRID_OFFSET_Z = Math.ceil(extensionZ / CELL_SIZE)
                binCount = EXTENDED_GRID_WIDTH * EXTENDED_GRID_HEIGHT * EXTENDED_GRID_DEPTH
            } else {
                EXTENDED_SIM_WIDTH = SIM_WIDTH
                EXTENDED_SIM_HEIGHT = SIM_HEIGHT
                EXTENDED_SIM_DEPTH = SIM_DEPTH
                EXTENDED_GRID_WIDTH = GRID_WIDTH
                EXTENDED_GRID_HEIGHT = GRID_HEIGHT
                EXTENDED_GRID_DEPTH = GRID_DEPTH
                GRID_OFFSET_X = 0
                GRID_OFFSET_Y = 0
                GRID_OFFSET_Z = 0
                binCount = GRID_WIDTH * GRID_HEIGHT * GRID_DEPTH
            }

            scanBlockCount = Math.ceil((binCount + 1) / SCAN_BLOCK_SIZE)
            scanTwoLevels = scanBlockCount > SCAN_BLOCK_SIZE
            auxBlockCount = scanTwoLevels ? Math.ceil(scanBlockCount / SCAN_BLOCK_SIZE) : 0

            const MAX_DISPATCH_DIM = 65535 // Default GPU limit for max workgroups per dimension
            const binWgCount = Math.ceil((binCount + 1) / 64)
            binDispatchX = Math.min(binWgCount, MAX_DISPATCH_DIM)
            binDispatchY = Math.ceil(binWgCount / MAX_DISPATCH_DIM)

            if (device && (oldBinCount !== binCount || oldScanBlockCount !== scanBlockCount || oldAuxBlockCount !== auxBlockCount)) {
                updateBinningBuffers()
                if (!isInitializing) {
                    updateBinningBindGroups()
                    updateParticleBindGroups()
                }
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function centerView() {
            cameraYaw = targetCameraYaw = 0
            cameraPitch = targetCameraPitch = 0
            zoomFactor = targetZoomFactor = 1.5
            cameraTarget[0] = targetCameraTarget[0] = 0
            cameraTarget[1] = targetCameraTarget[1] = 0
            cameraTarget[2] = targetCameraTarget[2] = 0
            cameraRotationChanged = true
            cameraChanged = true
        }
        function smoothCenterView(position: boolean = true, zoom: boolean = true, rotation: boolean = true) {
            if (position) {
                targetCameraTarget[0] = 0
                targetCameraTarget[1] = 0
                targetCameraTarget[2] = 0
            }
            if (zoom) {
                targetZoomFactor = 1.5
            }
            if (rotation) {
                targetCameraYaw = 0
                targetCameraPitch = 0
            }
        }
        const handleMove = () => {
            const dx = pointerX - lastPointerX
            const dy = pointerY - lastPointerY
            updateCameraAxes()
            const speed = zoomFactor / Math.max(1, CANVAS_HEIGHT)
            targetCameraTarget[0] += (-dx * cameraRight[0] + dy * cameraUp[0]) * speed
            targetCameraTarget[1] += (-dx * cameraRight[1] + dy * cameraUp[1]) * speed
            targetCameraTarget[2] += (-dx * cameraRight[2] + dy * cameraUp[2]) * speed
        }
        const handleRotate = () => {
            const dx = pointerX - lastPointerX
            const dy = pointerY - lastPointerY
            const radPerPixel = Math.PI / Math.max(1, CANVAS_HEIGHT)
            targetCameraYaw -= dx * radPerPixel
            targetCameraPitch += dy * radPerPixel
            const lim = Math.PI * 0.5
            if (targetCameraPitch > lim) targetCameraPitch = lim
            if (targetCameraPitch < -lim) targetCameraPitch = -lim
        }
        function handleZoom(delta: number, isCentered: boolean = false) {
            const zoomIntensity = 0.1
            targetZoomFactor = Math.max(0.2, Math.min(20.0, targetZoomFactor * (1 - delta * zoomIntensity)))
        }
        const handleMoveSmoothing = () => {
            const dx = targetCameraTarget[0] - cameraTarget[0]
            const dy = targetCameraTarget[1] - cameraTarget[1]
            const dz = targetCameraTarget[2] - cameraTarget[2]
            // Cheap squared-magnitude test (avoids Math.abs x3 and a costly sqrt)
            if (dx * dx + dy * dy + dz * dz < 0.000001) return // 0.001²
            cameraTarget[0] += dx * panSmoothing
            cameraTarget[1] += dy * panSmoothing
            cameraTarget[2] += dz * panSmoothing
            cameraChanged = true
        }
        const handleRotateSmoothing = () => {
            const dyaw = targetCameraYaw - cameraYaw
            const dpitch = targetCameraPitch - cameraPitch
            if (dyaw * dyaw + dpitch * dpitch < 0.000001) return // 0.001² rad
            cameraYaw += dyaw * panSmoothing
            cameraPitch += dpitch * panSmoothing
            cameraRotationChanged = true
            cameraChanged = true
        }
        const handleZoomSmoothing = () => {
            const d = targetZoomFactor - zoomFactor
            if (d < 0.001 && d > -0.001) return
            zoomFactor += d * zoomSmoothing
            cameraChanged = true
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function updateCameraAxes() {
            if (!cameraRotationChanged) return
            const cp = Math.cos(cameraPitch), sp = Math.sin(cameraPitch)
            const cy = Math.cos(cameraYaw),   sy = Math.sin(cameraYaw)

            const fx = -sy * cp, fy = -sp, fz = -cy * cp
            let rx = -fz, rz = fx
            const rl = Math.hypot(rx, rz) || 1
            rx /= rl; rz /= rl

            cameraRight[0] = rx; cameraRight[1] = 0; cameraRight[2] = rz
            cameraUp[0] = -rz * fy; cameraUp[1] = rz * fx - rx * fz; cameraUp[2] = rx * fy
            cameraFwd[0] = fx; cameraFwd[1] = fy; cameraFwd[2] = fz

            cameraRotationChanged = false
        }
        function computeCameraEye(): [number, number, number] {
            const cp = Math.cos(cameraPitch), sp = Math.sin(cameraPitch)
            const cy = Math.cos(cameraYaw),   sy = Math.sin(cameraYaw)
            // eye = target + R * (0,0,distance)
            const dirX = sy * cp
            const dirY = sp
            const dirZ = cy * cp
            return [
                cameraTarget[0] + dirX * zoomFactor,
                cameraTarget[1] + dirY * zoomFactor,
                cameraTarget[2] + dirZ * zoomFactor
            ]
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const selectScanWorkgroupSize = (adapter: GPUAdapter): { scanThreads: 256 | 512 | 1024, scanBlockSize: number } => {
            const supported = Math.min(
                adapter.limits.maxComputeInvocationsPerWorkgroup,
                adapter.limits.maxComputeWorkgroupSizeX,
            )
            const threads: 256 | 512 | 1024 = supported >= 1024 ? 1024 : supported >= 512 ? 512 : 256
            return { scanThreads: threads, scanBlockSize: threads * 2 }
        }
        const getMaxBinCount = (device: GPUDevice, scanBlockSize: number): number => {
            const PER_BIN_BYTES = 8 // binOffset(4) + binSortCounter(4)
            const maxWg = device.limits.maxComputeWorkgroupsPerDimension
            const maxBindingBytes = device.limits.maxStorageBufferBindingSize

            const binsByMemory = Math.floor(maxBindingBytes / PER_BIN_BYTES / 3)
            const binsByScanDispatch = maxWg * scanBlockSize
            const binsByClearDispatch = maxWg * maxWg * 64

            const maxBinCount = Math.min(binsByMemory, binsByScanDispatch, binsByClearDispatch)

            console.log('[GPU caps]', {
                SCAN_THREADS, SCAN_BLOCK_SIZE, maxBinCount, binsByMemory, binsByScanDispatch, binsByClearDispatch
            })

            return maxBinCount
        }
        // -------------------------------------------------------------------------------------------------------------
        const initWebGPU = async () => {
            const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
            if (!adapter) throw new Error("WebGPU adapter not found")

            const { scanThreads, scanBlockSize } = selectScanWorkgroupSize(adapter)
            SCAN_THREADS = scanThreads
            SCAN_BLOCK_SIZE = scanBlockSize

            timestampQuerySupported = adapter.features.has('timestamp-query')
            device = await adapter.requestDevice({
                requiredFeatures: timestampQuerySupported ? ['timestamp-query'] : [],
                requiredLimits: {
                    maxComputeInvocationsPerWorkgroup: SCAN_THREADS,
                    maxComputeWorkgroupSizeX: SCAN_THREADS,
                    maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
                    maxBufferSize: adapter.limits.maxBufferSize,
                },
            })

            MAX_BIN_COUNT = getMaxBinCount(device, SCAN_BLOCK_SIZE)

            // -----------------
            if (timestampQuerySupported) {
                timestampQuerySet = device.createQuerySet({ type: 'timestamp', count: TIMESTAMP_COUNT })
                timestampResolveBuffer = device.createBuffer({
                    size: TIMESTAMP_COUNT * 8,
                    usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
                })
                for (let i = 0; i < 3; i++) {
                    timestampStagingPool.push(device.createBuffer({
                        size: TIMESTAMP_COUNT * 8,
                        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
                    }))
                }
            } else {
                console.warn('[GPU profiler] timestamp-query feature not available on this adapter')
            }
            // -----------------

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
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            await destroyBuffers(true)
            await initLife(false)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const tsWrites = (slot: number): GPUComputePassTimestampWrites | undefined => {
            if (!isGpuTimingsEnabled) return undefined
            if (!timestampQuerySupported || !timestampQuerySet) return undefined
            return {
                querySet: timestampQuerySet,
                beginningOfPassWriteIndex: slot * 2,
                endOfPassWriteIndex: slot * 2 + 1,
            }
        }
        const tsRenderWrites = (slot: number, mode: 'full' | 'begin' | 'end' = 'full'): GPURenderPassTimestampWrites | undefined => {
            if (!isGpuTimingsEnabled) return undefined
            if (!timestampQuerySupported || !timestampQuerySet) return undefined
            const writes: GPURenderPassTimestampWrites = { querySet: timestampQuerySet }
            if (mode !== 'end') writes.beginningOfPassWriteIndex = slot * 2
            if (mode !== 'begin') writes.endOfPassWriteIndex = slot * 2 + 1
            return writes
        }
        const resolveAndReadTimestamps = (encoder: GPUCommandEncoder) => {
            if (!isGpuTimingsEnabled) return
            if (!timestampQuerySupported || !timestampQuerySet || !timestampResolveBuffer) return
            const staging = timestampStagingPool.find(b => b.mapState === 'unmapped')
            if (!staging || timestampStagingInFlight >= timestampStagingPool.length) return
            encoder.resolveQuerySet(timestampQuerySet, 0, TIMESTAMP_COUNT, timestampResolveBuffer, 0)
            encoder.copyBufferToBuffer(timestampResolveBuffer, 0, staging, 0, TIMESTAMP_COUNT * 8)
            timestampStagingInFlight++
            queueMicrotask(() => {
                staging.mapAsync(GPUMapMode.READ).then(() => {
                    const data = new BigUint64Array(staging.getMappedRange().slice(0))
                    staging.unmap()
                    timestampStagingInFlight--
                    const ns2ms = (a: bigint, b: bigint) => Number(b - a) / 1e6
                    const binning = ns2ms(data[0],  data[1])
                    const forces  = ns2ms(data[2],  data[3])
                    const advance = ns2ms(data[4],  data[5])
                    const render  = ns2ms(data[6],  data[7])
                    const bloom   = ns2ms(data[8],  data[9])
                    const compose = ns2ms(data[10], data[11])
                    const k = 0.15
                    gpuTimings.binning = gpuTimings.binning * (1 - k) + binning * k
                    gpuTimings.forces  = gpuTimings.forces  * (1 - k) + forces  * k
                    gpuTimings.advance = gpuTimings.advance * (1 - k) + advance * k
                    gpuTimings.render  = gpuTimings.render  * (1 - k) + render  * k
                    gpuTimings.bloom   = gpuTimings.bloom   * (1 - k) + bloom   * k
                    gpuTimings.compose = gpuTimings.compose * (1 - k) + compose * k
                    gpuTimings.total   = gpuTimings.binning + gpuTimings.forces + gpuTimings.advance + gpuTimings.render + gpuTimings.bloom + gpuTimings.compose
                }).catch(() => { timestampStagingInFlight-- })
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        const frame = async () => {
            if (isUpdateNumParticlesPending) await updateNumParticles(NEW_NUM_PARTICLES)
            else if (isUpdateNumTypesPending) await updateNumTypes(NEW_NUM_TYPES)

            handleMoveSmoothing()
            handleRotateSmoothing()
            handleZoomSmoothing()

            const startExecutionTime = performance.now()
            if (isRunning) {
                handleDeltaTime(startExecutionTime)
                step()
            } else {
                const encoder = device.createCommandEncoder()
                renderParticles(encoder)
                resolveAndReadTimestamps(encoder)
                device.queue.submit([encoder.finish()])
            }

            hasUpdateNumParticles = false

            animationFrameId = requestAnimationFrame(frame)
        }
        // -------------------------------------------------------------------------------------------------------------
        const step = () => {
            const encoder = device.createCommandEncoder()

            if (useBinning) computeBinning(encoder)
            else {
                encoder.copyBufferToBuffer(particleBuffer!, 0, particleTempBuffer!, 0, particleBuffer!.size)
                computeBruteForce(encoder)
            }
            computeAdvance(encoder)

            renderParticles(encoder)

            resolveAndReadTimestamps(encoder)
            device.queue.submit([encoder.finish()])
        }
        // -------------------------------------------------------------------------------------------------------------
        const deltaTimeData = new Float32Array(1)
        const handleDeltaTime = (startExecutionTime: number) => {
            const deltaTime = Math.min((startExecutionTime - lastFrameTime) / 1000, 0.1) // Cap deltaTime to avoid spikes
            lastFrameTime = startExecutionTime
            const lastSmoothedDeltaTime = smoothedDeltaTime
            smoothedDeltaTime = smoothedDeltaTime * (1 - 0.01) + deltaTime * 0.01 // Smooth the delta time

            // Only update the delta time buffer if it has changed significantly
            if (Math.round(lastSmoothedDeltaTime * 1000) !== Math.round(smoothedDeltaTime * 1000)) {
                deltaTimeData[0] = smoothedDeltaTime
                device.queue.writeBuffer(deltaTimeBuffer!, 0, deltaTimeData)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const computeBruteForce = (encoder: GPUCommandEncoder) => {
            const computePass = encoder.beginComputePass({ timestampWrites: tsWrites(1) })
            computePass.setPipeline(bruteForceComputePipeline)
            computePass.setBindGroup(0, bruteForceBindGroup)
            computePass.setBindGroup(1, simOptionsBindGroup)
            computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            computePass.end()
        }
        const computeBinning = (encoder: GPUCommandEncoder) => {
            const clearBytes = (binCount + 1) * 4
            encoder.clearBuffer(binOffsetBuffer!, 0, clearBytes)
            encoder.clearBuffer(binSortCounterBuffer!, 0, clearBytes)

            const binningComputePass = encoder.beginComputePass({ timestampWrites: tsWrites(0) })
            binningComputePass.setPipeline(activeFillSizePipeline)
            binningComputePass.setBindGroup(0, particleBufferReadOnlyBindGroup)
            binningComputePass.setBindGroup(1, simOptionsBindGroup)
            binningComputePass.setBindGroup(2, binFillSizeBindGroup)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))

            binningComputePass.setPipeline(binScanLocalPipeline)
            binningComputePass.setBindGroup(0, scanLocalBinOffsetBindGroup)
            binningComputePass.dispatchWorkgroups(scanBlockCount)

            if (scanTwoLevels) {
                binningComputePass.setBindGroup(0, scanLocalAuxBindGroup)
                binningComputePass.dispatchWorkgroups(auxBlockCount)

                binningComputePass.setPipeline(binScanAuxPipeline)
                binningComputePass.setBindGroup(0, scanAuxBindGroup)
                binningComputePass.dispatchWorkgroups(1)

                binningComputePass.setPipeline(binAddOffsetsPipeline)
                binningComputePass.setBindGroup(0, addOffsetsAuxBindGroup)
                binningComputePass.dispatchWorkgroups(auxBlockCount)
            } else {
                binningComputePass.setPipeline(binScanAuxPipeline)
                binningComputePass.setBindGroup(0, scanAuxBindGroup)
                binningComputePass.dispatchWorkgroups(1)
            }
            binningComputePass.setPipeline(binAddOffsetsPipeline)
            binningComputePass.setBindGroup(0, addOffsetsBinOffsetBindGroup)
            binningComputePass.dispatchWorkgroups(scanBlockCount)

            binningComputePass.setPipeline(activeSortPipeline)
            binningComputePass.setBindGroup(0, activeSortBindGroup)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            binningComputePass.end()

            const forcesComputePass = encoder.beginComputePass({ timestampWrites: tsWrites(1) })
            forcesComputePass.setPipeline(activeForcesPipeline)
            forcesComputePass.setBindGroup(0, activeForcesBindGroup)
            forcesComputePass.setBindGroup(1, simOptionsBindGroup)
            forcesComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            forcesComputePass.end()
        }
        const computeAdvance = (encoder: GPUCommandEncoder) => {
            const advanceComputePass = encoder.beginComputePass({ timestampWrites: tsWrites(2) })
            advanceComputePass.setPipeline(particleAdvancePipeline)
            advanceComputePass.setBindGroup(0, particleBufferBindGroup)
            advanceComputePass.setBindGroup(1, simOptionsBindGroup)
            advanceComputePass.setBindGroup(2, deltaTimeBindGroup)
            advanceComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            advanceComputePass.end()
        }
        const renderParticles = (encoder: GPUCommandEncoder) => {
            if (cameraChanged) {
                updateCameraBuffer()
                cameraChanged = false
            }

            if (isParticleGlow) {
                const hdrPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: hdrTextureView!,
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store',
                    }],
                    depthStencilAttachment: {
                        view: depthTextureView!,
                        depthLoadOp: 'clear',
                        depthClearValue: 1.0,
                        depthStoreOp: 'store',
                    },
                    timestampWrites: tsRenderWrites(3),
                })
                hdrPass.setPipeline(renderCirclePipeline)
                hdrPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                hdrPass.setBindGroup(1, simOptionsBindGroup)
                hdrPass.setBindGroup(2, cameraBindGroup)
                hdrPass.setBindGroup(3, renderOptionsBindGroup)
                hdrPass.draw(4, NUM_PARTICLES)

                if (isBoundingBoxActive) renderHdrBoundingBox(hdrPass)
                if (isCameraTargetVisible) renderHdrCameraTarget(hdrPass)
                hdrPass.end()

                // --- Bloom chain (dual filter Bjørge 2015) -----------------------------------------------------------
                for (let i = 0; i < BLOOM_MIPS; i++) {
                    const downPass = encoder.beginRenderPass({
                        colorAttachments: [{
                            view: bloomTextureViews[i]!,
                            loadOp: 'clear',
                            clearValue: { r: 0, g: 0, b: 0, a: 1 },
                            storeOp: 'store',
                        }],
                        timestampWrites: i === 0 ? tsRenderWrites(4, 'begin') : undefined,
                    })
                    downPass.setPipeline(i === 0 ? bloomPrefilterPipeline : bloomDownsamplePipeline)
                    downPass.setBindGroup(0, bloomDownBindGroups[i])
                    downPass.draw(3)
                    downPass.end()
                }
                for (let i = BLOOM_MIPS - 2; i >= 0; i--) {
                    const upPass = encoder.beginRenderPass({
                        colorAttachments: [{
                            view: bloomTextureViews[i]!,
                            loadOp: 'load',
                            storeOp: 'store',
                        }],
                        timestampWrites: i === 0 ? tsRenderWrites(4, 'end') : undefined,
                    })
                    upPass.setPipeline(bloomUpsamplePipeline)
                    upPass.setBindGroup(0, bloomUpBindGroups[i])
                    upPass.draw(3)
                    upPass.end()
                }
                // -----------------------------------------------------------------------------------------------------
                const composePass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store',
                    }],
                    timestampWrites: tsRenderWrites(5),
                })
                composePass.setPipeline(composeHdrPipelines[tonemapMode] ?? composeHdrPipelines[1]!)
                composePass.setBindGroup(0, composeHdrBindGroup)
                composePass.draw(3)
                composePass.end()
            } else {
                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store',
                    }],
                    depthStencilAttachment: {
                        view: depthTextureView!,
                        depthLoadOp: 'clear',
                        depthClearValue: 1.0,
                        depthStoreOp: 'store',
                    },
                    timestampWrites: tsRenderWrites(3),
                })
                renderPass.setPipeline(renderPipeline)
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.setBindGroup(3, renderOptionsBindGroup)
                renderPass.draw(4, NUM_PARTICLES)

                if (isBoundingBoxActive) renderBoundingBox(renderPass)
                if (isCameraTargetVisible) renderCameraTarget(renderPass)

                renderPass.end()
            }
        }
        const renderBoundingBox = (renderPass: GPURenderPassEncoder) => {
            renderPass.setPipeline(boxRenderPipeline)
            renderPass.setBindGroup(0, simOptionsBindGroup)
            renderPass.setBindGroup(1, cameraBindGroup)
            renderPass.draw(24, 1)
        }
        const renderHdrBoundingBox = (hdrPass: GPURenderPassEncoder) => {
            hdrPass.setPipeline(boxRenderHdrPipeline)
            hdrPass.setBindGroup(0, simOptionsBindGroup)
            hdrPass.setBindGroup(1, cameraBindGroup)
            hdrPass.draw(24, 1)
        }
        const renderCameraTarget = (renderPass: GPURenderPassEncoder) => {
            renderPass.setPipeline(cameraTargetRenderPipeline)
            renderPass.setBindGroup(0, simOptionsBindGroup)
            renderPass.setBindGroup(1, cameraBindGroup)
            renderPass.draw(54, 1)
        }
        const renderHdrCameraTarget = (hdrPass: GPURenderPassEncoder) => {
            hdrPass.setPipeline(cameraTargetHdrPipeline)
            hdrPass.setBindGroup(0, simOptionsBindGroup)
            hdrPass.setBindGroup(1, cameraBindGroup)
            hdrPass.draw(54, 1)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function initColors() {
            colors = generateColors(particleLife.selectedColorPaletteOption, NUM_TYPES)
            particleLife.currentColors = colors // Ensure the store is updated with the initial colors
        }
        function initParticles() {
            initialParticles = generatePositions(particleLife.selectedSpawnPositionOption, NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT, SIM_DEPTH)
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
            if (shouldRandom) particleLife.selectedColorPaletteOption = PALETTE_OPTIONS[Math.floor(Math.random() * PALETTE_OPTIONS.length)].id

            colors = generateColors(particleLife.selectedColorPaletteOption, NUM_TYPES)
            particleLife.currentColors = colors
            updateColorBuffer()
        }
        const updateRulesMatrix = async (useRandomGenerator: boolean | Event = false) => {
            const shouldRandom = typeof useRandomGenerator === 'boolean' ? useRandomGenerator : false
            if (shouldRandom) particleLife.selectedRulesOption = RULES_OPTIONS[Math.floor(Math.random() * RULES_OPTIONS.length)].id

            setRulesMatrix(generateRules(particleLife.selectedRulesOption, NUM_TYPES))
            updateInteractionMatrixBuffer()
        }
        const updateParticlePositions = async (useRandomGenerator: boolean | Event = false) => {
            const shouldRandom = typeof useRandomGenerator === 'boolean' ? useRandomGenerator : false
            if (shouldRandom) particleLife.selectedSpawnPositionOption = POSITION_OPTIONS[Math.floor(Math.random() * POSITION_OPTIONS.length)].id

            initialParticles = generatePositions(particleLife.selectedSpawnPositionOption, NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT, SIM_DEPTH)
            device.queue.writeBuffer(particleBuffer!, 0, initialParticles.buffer)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const updateSimWidth = (newWidth: number | Event) => {
            if (typeof(newWidth) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) {
                particleLife.simHeight = SIM_HEIGHT = baseSimHeight = Math.round(SIM_HEIGHT * (newWidth / SIM_WIDTH))
                particleLife.simDepth = SIM_DEPTH = baseSimDepth = Math.round(SIM_DEPTH * (newWidth / SIM_WIDTH))
            }
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = newWidth
            applySimResize()
        }
        const updateSimHeight = (newHeight: number | Event) => {
            if (typeof(newHeight) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) {
                particleLife.simWidth = SIM_WIDTH = baseSimWidth = Math.round(SIM_WIDTH * (newHeight / SIM_HEIGHT))
                particleLife.simDepth = SIM_DEPTH = baseSimDepth = Math.round(SIM_DEPTH * (newHeight / SIM_HEIGHT))
            }
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = newHeight
            applySimResize()
        }
        const updateSimDepth = (newDepth: number | Event) => {
            if (typeof(newDepth) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) {
                particleLife.simWidth = SIM_WIDTH = baseSimWidth = Math.round(SIM_WIDTH * (newDepth / SIM_DEPTH))
                particleLife.simHeight = SIM_HEIGHT = baseSimHeight = Math.round(SIM_HEIGHT * (newDepth / SIM_DEPTH))
            }
            particleLife.simDepth = SIM_DEPTH = baseSimDepth = newDepth
            applySimResize()
        }
        const applySimResize = async () => {
            cancelAnimationLoop()
            setSimSize()
            updateSimOptionsBuffer()
            void updateParticlePositions()
            animationFrameId = requestAnimationFrame(frame)
        }
        // -------------------------------------------------------------------------------------------------------------
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
                particleLife.maxRadiusMatrix[x][y] = value + 1
                maxRadiusMatrix[x][y] = value + 1
                setCurrentMaxRadius(getCurrentMaxRadius())
            }
            updateInteractionMatrixBuffer()
        }
        const updateMaxMatrixValue = (x: number, y: number, value: number) => {
            particleLife.maxRadiusMatrix[x][y] = value
            maxRadiusMatrix[x][y] = value
            setCurrentMaxRadius(getCurrentMaxRadius())
            if (value < particleLife.minRadiusMatrix[x][y]) {
                particleLife.minRadiusMatrix[x][y] = value - 1
                minRadiusMatrix[x][y] = value - 1
            }
            updateInteractionMatrixBuffer()
        }
        const newRandomRulesMatrix = () => {

        }
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
        const updateBinningBuffers = () => {
            if (binOffsetBuffer) binOffsetBuffer.destroy(); binOffsetBuffer = undefined;
            if (binSortCounterBuffer) binSortCounterBuffer.destroy(); binSortCounterBuffer = undefined;
            if (binAuxBuffer) binAuxBuffer.destroy(); binAuxBuffer = undefined;
            if (binAux2Buffer) binAux2Buffer.destroy(); binAux2Buffer = undefined;

            binOffsetBuffer = device.createBuffer({
                size: (binCount + 1) * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            })
            binSortCounterBuffer = device.createBuffer({
                size: (binCount + 1) * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })

            const aux1Size = scanTwoLevels ? scanBlockCount : Math.max(scanBlockCount, SCAN_BLOCK_SIZE)
            binAuxBuffer = device.createBuffer({
                size: aux1Size * 4,
                usage: GPUBufferUsage.STORAGE,
            })
            binAux2Buffer = device.createBuffer({
                size: Math.max(auxBlockCount, SCAN_BLOCK_SIZE) * 4,
                usage: GPUBufferUsage.STORAGE,
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        function updateCameraBuffer() {
            mat4Perspective(cameraProjMatrix, FOV_Y, CANVAS_ASPECT_RATIO, NEAR_PLANE, FAR_PLANE)
            const eye = computeCameraEye()
            mat4LookAt(cameraViewMatrix, eye, cameraTarget, [0, 1, 0])
            mat4Mul(cameraData, cameraProjMatrix, cameraViewMatrix)

            cameraData[16] = CANVAS_ASPECT_RATIO
            cameraData[17] = FOV_Y
            cameraData[18] = NEAR_PLANE
            cameraData[19] = FAR_PLANE
            // Focus point (vec4); used by camera-target marker
            cameraData[20] = cameraTarget[0]
            cameraData[21] = cameraTarget[1]
            cameraData[22] = cameraTarget[2]
            cameraData[23] = 0

            if (!cameraBuffer) {
                cameraBuffer = device.createBuffer({
                    size: CAMERA_BUFFER_SIZE,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Float32Array(cameraBuffer.getMappedRange()).set(cameraData)
                cameraBuffer.unmap()
            } else {
                device.queue.writeBuffer(cameraBuffer, 0, cameraData)
            }
        }
        const updateSimOptionsBuffer = () => {
            const simOptionsData = new ArrayBuffer(92)
            const simOptionsView = new DataView(simOptionsData)
            simOptionsView.setFloat32(0,  SIM_WIDTH, true)
            simOptionsView.setFloat32(4,  SIM_HEIGHT, true)
            simOptionsView.setFloat32(8,  SIM_DEPTH, true)
            simOptionsView.setUint32(12,  GRID_WIDTH, true)
            simOptionsView.setUint32(16,  GRID_HEIGHT, true)
            simOptionsView.setUint32(20,  GRID_DEPTH, true)
            simOptionsView.setFloat32(24, CELL_SIZE, true)
            simOptionsView.setUint32(28,  NUM_PARTICLES, true)
            simOptionsView.setUint32(32,  NUM_TYPES, true)
            simOptionsView.setFloat32(36, PARTICLE_SIZE, true)
            simOptionsView.setFloat32(40, PARTICLE_OPACITY, true)
            simOptionsView.setUint32(44,  isWallRepel ? 1 : 0, true)
            simOptionsView.setUint32(48,  isWallWrap ? 1 : 0, true)
            simOptionsView.setFloat32(52, forceFactor, true)
            simOptionsView.setFloat32(56, frictionFactor, true)
            simOptionsView.setFloat32(60, repel, true)
            // Extended grid parameters for spatial hashing no walls
            simOptionsView.setUint32(64,  EXTENDED_GRID_WIDTH, true)
            simOptionsView.setUint32(68,  EXTENDED_GRID_HEIGHT, true)
            simOptionsView.setUint32(72,  EXTENDED_GRID_DEPTH, true)
            simOptionsView.setUint32(76,  GRID_OFFSET_X, true)
            simOptionsView.setUint32(80,  GRID_OFFSET_Y, true)
            simOptionsView.setUint32(84,  GRID_OFFSET_Z, true)
            simOptionsView.setUint32(88,  CELL_SUBDIVISIONS, true)

            if (!simOptionsBuffer) {
                simOptionsBuffer = device.createBuffer({
                    size: simOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(simOptionsBuffer.getMappedRange()).set(new Uint8Array(simOptionsData))
                simOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(simOptionsBuffer, 0, simOptionsData)
            }
        }
        const updateBloomOptionsBuffer = () => {
            const bloomOptionsData = new ArrayBuffer(16)
            const bloomOptionsView = new DataView(bloomOptionsData)
            bloomOptionsView.setFloat32(0, bloomThreshold, true)
            bloomOptionsView.setFloat32(4, bloomIntensity, true)
            bloomOptionsView.setFloat32(8, bloomKnee, true)

            if (!bloomOptionsBuffer) {
                bloomOptionsBuffer = device.createBuffer({
                    size: bloomOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(bloomOptionsBuffer.getMappedRange()).set(new Uint8Array(bloomOptionsData))
                bloomOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(bloomOptionsBuffer, 0, bloomOptionsData)
            }
        }
        const updateRenderOptionsBuffer = () => {
            const renderData = new ArrayBuffer(48)
            const view = new DataView(renderData)
            view.setUint32(0, isParticleBorder ? 1 : 0, true)
            view.setUint32(4, isSphereShading ? 1 : 0, true)
            view.setFloat32(8, sphereAmbient, true)
            view.setFloat32(12, sphereDiffuseStrength, true)
            view.setFloat32(16, sphereSpecularStrength, true)
            view.setFloat32(20, sphereShininess, true)
            view.setFloat32(32, sphereLightDir[0] ?? 0, true)
            view.setFloat32(36, sphereLightDir[1] ?? 0, true)
            view.setFloat32(40, sphereLightDir[2] ?? 1, true)

            if (!renderOptionsBuffer) {
                renderOptionsBuffer = device.createBuffer({
                    size: renderData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(renderOptionsBuffer.getMappedRange()).set(new Uint8Array(renderData))
                renderOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(renderOptionsBuffer, 0, renderData)
            }
        }
        const updateInteractionMatrixBuffer = () => {
            const wordCount = Math.ceil((NUM_TYPES * NUM_TYPES) / 4) * 4 // 16 octets
            const interactionData = new Uint32Array(wordCount)
            for (let a = 0; a < NUM_TYPES; a++) {
                for (let b = 0; b < NUM_TYPES; b++) {
                    const rule = Math.max(0, Math.min(200, Math.round(rulesMatrix[a][b] * 100) + 100)); // rule 8 bits (0-200) (-1.00->1.00)
                    const minR = Math.max(0, Math.min(4095, Math.round(minRadiusMatrix[a][b]))); // minR 12 bits (0–4095)
                    const maxR = Math.max(0, Math.min(4095, Math.round(maxRadiusMatrix[a][b]))); // maxR 12 bits (0–4095)
                    interactionData[a * NUM_TYPES + b] = (rule | (minR << 8) | (maxR << 20)) >>> 0;
                }
            }

            if (!interactionMatrixBuffer || interactionMatrixBuffer.size !== interactionData.byteLength) {
                if (interactionMatrixBuffer) interactionMatrixBuffer.destroy(); interactionMatrixBuffer = undefined;
                interactionMatrixBuffer = device.createBuffer({
                    size: interactionData.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Uint32Array(interactionMatrixBuffer.getMappedRange()).set(interactionData)
                interactionMatrixBuffer.unmap()
            } else {
                device.queue.writeBuffer(interactionMatrixBuffer, 0, interactionData)
            }
        }
        const updateParticleBuffers = (hasInitialParticles: boolean = false) => {
            if (particleBuffer) particleBuffer?.destroy(); particleBuffer = undefined;
            if (particleTempBuffer) particleTempBuffer?.destroy(); particleTempBuffer = undefined;
            if (cellSignatureBuffer) cellSignatureBuffer.destroy(); cellSignatureBuffer = undefined;

            particleBuffer = device.createBuffer({
                size: NUM_PARTICLES * 28,
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
            cellSignatureBuffer = device.createBuffer({
                size: NUM_PARTICLES * 4,
                usage: GPUBufferUsage.STORAGE,
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
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
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
                const oldParticlesData = await readBufferFromGPU(particleBuffer!, oldCount * 7 * 4)
                const oldParticles = new Float32Array(oldParticlesData)
                initialParticles = new Float32Array(newCount * 7)

                if (newCount > oldCount) { // If increasing the number of particles
                    initialParticles.set(oldParticles)
                    for (let i = oldCount; i < newCount; i++) {
                        const baseIndex = i * 7
                        initialParticles[baseIndex]     = Math.random() * SIM_WIDTH  // x
                        initialParticles[baseIndex + 1] = Math.random() * SIM_HEIGHT // y
                        initialParticles[baseIndex + 2] = Math.random() * SIM_DEPTH  // z
                        initialParticles[baseIndex + 6] = Math.floor(Math.random() * NUM_TYPES) // type
                    }
                } else { // If decreasing the number of particles
                    initialParticles.set(oldParticles.subarray(0, newCount * 7))
                    for (let i = newCount; i < oldCount; i++) {
                        const j = Math.floor(Math.random() * (i + 1))
                        if (j < newCount) {
                            const oldStartIndex = i * 7
                            const newIndex = j * 7
                            initialParticles[newIndex]     = oldParticles[oldStartIndex]     // x
                            initialParticles[newIndex + 1] = oldParticles[oldStartIndex + 1] // y
                            initialParticles[newIndex + 2] = oldParticles[oldStartIndex + 2] // z
                            initialParticles[newIndex + 3] = oldParticles[oldStartIndex + 3] // vx
                            initialParticles[newIndex + 4] = oldParticles[oldStartIndex + 4] // vy
                            initialParticles[newIndex + 5] = oldParticles[oldStartIndex + 5] // vz
                            initialParticles[newIndex + 6] = oldParticles[oldStartIndex + 6] // type
                        }
                    }
                }

                NUM_PARTICLES = newCount
                updateParticleBuffers(true) // Destroy and recreate particle buffers
                updateParticleBindGroups() // Recreate bind groups that depend on particle buffers
                updateSimOptionsBuffer() // Update simulation options buffer
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
        // -------------------------------------------------------------------------------------------------------------
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
            const particleDataBuffer = await readBufferFromGPU(particleBuffer!, NUM_PARTICLES * 7 * 4)
            const particles = new Float32Array(particleDataBuffer)

            if (newNumTypes < oldNumTypes) {
                for (let i = 0; i < NUM_PARTICLES; i++) {
                    const typeIndex = i * 7 + 6
                    if (particles[typeIndex] >= newNumTypes) {
                        particles[typeIndex] = Math.floor(Math.random() * newNumTypes)
                    }
                }
            } else if (newNumTypes > oldNumTypes) {
                for (let i = 0; i < NUM_PARTICLES; i++) {
                    if (Math.random() < (newNumTypes - oldNumTypes) / newNumTypes) {
                        const typeIndex = i * 7 + 6
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
        const createBuffers = () => {
            updateSimOptionsBuffer() // Set simulation options based on the store state
            updateInteractionMatrixBuffer() // Set interaction matrices based on the store state
            updateParticleBuffers(true)
            updateBinningBuffers()
            updateColorBuffer()
            updateCameraBuffer()
            updateBloomOptionsBuffer()
            updateRenderOptionsBuffer()
            // ----------------------------------------------------------------------------------------------
            deltaTimeBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(deltaTimeBuffer.getMappedRange()).set([smoothedDeltaTime])
            deltaTimeBuffer.unmap()
        }
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroups = () => {
            updateBinningBindGroups()
            updateParticleBindGroups()
            updateBloomBindGroups()
            updateComposeHdrBindGroup()
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
            renderOptionsBindGroup = device.createBindGroup({
                layout: renderOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: renderOptionsBuffer! } },
                ],
            })
        }
        const updateParticleBindGroups = () => {
            particleBufferBindGroup = undefined as any;
            particleBufferReadOnlyBindGroup = undefined as any;
            particleSortBindGroup = undefined as any;
            particleComputeForcesBindGroup = undefined as any;
            particleSortHashBindGroup = undefined as any;
            particleComputeForcesHashBindGroup = undefined as any;
            bruteForceBindGroup = undefined as any;

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
                    { binding: 3, resource: { buffer: binSortCounterBuffer! } },
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
            particleSortHashBindGroup = device.createBindGroup({
                layout: particleSortHashBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: particleTempBuffer! } },
                    { binding: 2, resource: { buffer: binOffsetBuffer! } },
                    { binding: 3, resource: { buffer: binSortCounterBuffer! } },
                    { binding: 4, resource: { buffer: cellSignatureBuffer! } },
                ],
            })
            particleComputeForcesHashBindGroup = device.createBindGroup({
                layout: particleComputeForcesHashBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleTempBuffer! } },
                    { binding: 1, resource: { buffer: particleBuffer! } },
                    { binding: 2, resource: { buffer: binOffsetBuffer! } },
                    { binding: 3, resource: { buffer: interactionMatrixBuffer! } },
                    { binding: 4, resource: { buffer: cellSignatureBuffer! } },
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
            refreshActiveBinning()
        }
        const refreshActiveBinning = () => {
            if (binningMode === 'hash') {
                activeFillSizePipeline = binFillSizeHashPipeline
                activeSortPipeline     = particleSortHashPipeline
                activeForcesPipeline   = particleComputeForcesHashPipeline
                activeSortBindGroup    = particleSortHashBindGroup
                activeForcesBindGroup  = particleComputeForcesHashBindGroup
            } else {
                activeFillSizePipeline = binFillSizePipeline
                activeSortPipeline     = particleSortPipeline
                activeForcesPipeline   = particleComputeForcesPipeline
                activeSortBindGroup    = particleSortBindGroup
                activeForcesBindGroup  = particleComputeForcesBindGroup
            }
        }
        const updateBinningBindGroups = () => {
            binFillSizeBindGroup = device.createBindGroup({
                layout: binFillSizeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } }
                ],
            })
            scanLocalBinOffsetBindGroup = device.createBindGroup({
                layout: scanLocalBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } },
                    { binding: 1, resource: { buffer: binAuxBuffer! } },
                ],
            })
            scanLocalAuxBindGroup = device.createBindGroup({
                layout: scanLocalBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binAuxBuffer! } },
                    { binding: 1, resource: { buffer: binAux2Buffer! } },
                ],
            })
            scanAuxBindGroup = device.createBindGroup({
                layout: scanAuxBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: scanTwoLevels ? binAux2Buffer! : binAuxBuffer! } },
                ],
            })
            addOffsetsAuxBindGroup = device.createBindGroup({
                layout: addOffsetsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binAuxBuffer! } },
                    { binding: 1, resource: { buffer: binAux2Buffer! } },
                ],
            })
            addOffsetsBinOffsetBindGroup = device.createBindGroup({
                layout: addOffsetsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } },
                    { binding: 1, resource: { buffer: binAuxBuffer! } },
                ],
            })
        }
        const updateComposeHdrBindGroup = () => {
            composeHdrBindGroup = device.createBindGroup({
                layout: composeHdrBindGroupLayout,
                entries: [
                    { binding: 0, resource: hdrTextureView! },
                    { binding: 1, resource: bloomTextureViews[0]! },
                    { binding: 2, resource: bloomSampler! },
                    { binding: 3, resource: { buffer: bloomOptionsBuffer! } },
                ],
            })
        }
        const updateBloomBindGroups = () => {
            bloomDownBindGroups.length = 0
            bloomUpBindGroups.length = 0
            for (let i = 0; i < BLOOM_MIPS; i++) {
                const textureView = i === 0 ? hdrTextureView! : bloomTextureViews[i - 1]!
                bloomDownBindGroups.push(device.createBindGroup({
                    layout: bloomBindGroupLayout,
                    entries: [
                        { binding: 0, resource: textureView },
                        { binding: 1, resource: bloomSampler! },
                        { binding: 2, resource: { buffer: bloomOptionsBuffer! } },
                    ],
                }))
            }
            for (let i = 0; i < BLOOM_MIPS - 1; i++) {
                bloomUpBindGroups.push(device.createBindGroup({
                    layout: bloomBindGroupLayout,
                    entries: [
                        { binding: 0, resource: bloomTextureViews[i + 1]! },
                        { binding: 1, resource: bloomSampler! },
                        { binding: 2, resource: { buffer: bloomOptionsBuffer! } },
                    ],
                }))
            }
        }
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
            scanLocalBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // data (in/out)
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // aux (out)
                ],
            })
            scanAuxBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // aux (in/out)
                ],
            })
            addOffsetsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // data (in/out)
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // aux (in)
                ],
            })
            particleSortBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleTempBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binSortCounterBuffer
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
            particleSortHashBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleTempBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binSortCounterBuffer
                    { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // cellSignatureBuffer
                ],
            })
            particleComputeForcesHashBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleTempBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // interactionMatrixBuffer
                    { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // cellSignatureBuffer
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
            renderOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // renderOptionsBuffer
                ],
            })
            bloomBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '2d' } }, // source mip / hdr
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }, // sampler
                    { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // bloomOptionsBuffer
                ],
            })
            composeHdrBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d' } }, // hdrTexture
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '2d' } }, // bloom mip[0]
                    { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }, // sampler
                    { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // bloomOptionsBuffer
                ],
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            createComputePipelines()
            createRenderPipelines()
            createHdrGlowPipelines()
        }
        const createComputePipelines = () => {
            const binFillSizeShader = device.createShaderModule({ code: binFillSizeShaderCode })
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

            const binScanConstants: Record<string, number> = {
                THREADS: SCAN_THREADS,
                BLOCK_SIZE: SCAN_BLOCK_SIZE
            }
            const binScanLocalShader = device.createShaderModule({ code: binScanLocalShaderCode })
            binScanLocalPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [scanLocalBindGroupLayout],
                }),
                compute: { module: binScanLocalShader, entryPoint: 'scanLocal', constants: binScanConstants }
            })
            const binScanAuxShader = device.createShaderModule({ code: binScanAuxShaderCode })
            binScanAuxPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [scanAuxBindGroupLayout],
                }),
                compute: { module: binScanAuxShader, entryPoint: 'scanAux', constants: binScanConstants }
            })
            const binAddOffsetsShader = device.createShaderModule({ code: binAddOffsetsShaderCode })
            binAddOffsetsPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [addOffsetsBindGroupLayout],
                }),
                compute: { module: binAddOffsetsShader, entryPoint: 'addOffsets', constants: binScanConstants }
            })

            const particleSortShader = device.createShaderModule({ code: particleSortShaderCode })
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
            // -------------------------------------------------------------------------------------------------
            const binFillSizeHashShader = device.createShaderModule({ code: binFillSizeHashShaderCode })
            binFillSizeHashPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferReadOnlyBindGroupLayout,
                        simOptionsBindGroupLayout,
                        binFillSizeBindGroupLayout,
                    ],
                }),
                compute: { module: binFillSizeHashShader, entryPoint: 'fillBinSize' }
            })
            const particleSortHashShader = device.createShaderModule({ code: particleSortHashShaderCode })
            particleSortHashPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleSortHashBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleSortHashShader, entryPoint: 'sortParticles' }
            })
            const particleComputeForcesHashShader = device.createShaderModule({ code: particleComputeForcesHashShaderCode })
            particleComputeForcesHashPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleComputeForcesHashBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleComputeForcesHashShader, entryPoint: 'computeForces' }
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
        }
        const particleNormalBlending: GPUBlendState = {
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
        }
        const particleAdditiveBlending: GPUBlendState = {
            color: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
        }
        const createRenderPipelines = () => {
            const renderShader = device.createShaderModule({code: renderShaderCode})
            renderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, renderOptionsBindGroupLayout],
                }),
                vertex: { module: renderShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: renderShader, entryPoint: 'fragmentMain', targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: particleNormalBlending
                    }]
                },
                primitive: {topology: 'triangle-strip'},
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                },
            })
            // ---------------------------------------------------------------------------------------------------------
            const boxShader = device.createShaderModule({ code: boxShaderCode })
            boxRenderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: boxShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: boxShader, entryPoint: 'fragmentMain', targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: particleNormalBlending,
                    }],
                },
                primitive: { topology: 'line-list' },
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: false,
                    depthCompare: 'less-equal',
                },
            })
            // ---------------------------------------------------------------------------------------------------------
            const cameraTargetShader = device.createShaderModule({ code: cameraTargetShaderCode })
            cameraTargetRenderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: cameraTargetShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: cameraTargetShader, entryPoint: 'fragmentMain', targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: particleNormalBlending,
                    }],
                },
                primitive: { topology: 'line-list' },
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: false,
                    depthCompare: 'less-equal',
                },
            })
        }
        const createHdrGlowPipelines = () => {
            const renderGlowShader = device.createShaderModule({ code: renderGlowShaderCode })
            renderCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, renderOptionsBindGroupLayout],
                }),
                vertex: { module: renderGlowShader, entryPoint: 'vertexCircle' },
                fragment: {
                    module: renderGlowShader, entryPoint: 'fragmentCircle', targets: [{
                        format: HDR_FORMAT,
                        blend: particleNormalBlending,
                    }],
                },
                primitive: { topology: 'triangle-strip' },
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                },
            })
            // ---------------------------------------------------------------------------------------------------------
            const composeShader = device.createShaderModule({ code: composeHdrShaderCode })
            const composeLayout = device.createPipelineLayout({
                bindGroupLayouts: [composeHdrBindGroupLayout],
            })
            for (const tonemap of tonemapOptions) {
                composeHdrPipelines[tonemap.id] = device.createRenderPipeline({
                    label: `composeHdrPipeline:${tonemap.id}`,
                    layout: composeLayout,
                    vertex: { module: composeShader, entryPoint: 'vertexMain' },
                    fragment: {
                        module: composeShader, entryPoint: 'fragmentMain',
                        constants: { TONEMAP_ID: tonemap.id },
                        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
                    },
                    primitive: { topology: 'triangle-list' },
                })
            }
            // ---------------------------------------------------------------------------------------------------------
            const boxShader = device.createShaderModule({ code: boxShaderCode })
            boxRenderHdrPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: boxShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: boxShader, entryPoint: 'fragmentMain', targets: [{
                        format: HDR_FORMAT,
                        blend: particleNormalBlending,
                    }],
                },
                primitive: { topology: 'line-list' },
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: false,
                    depthCompare: 'less-equal',
                },
            })
            // ---------------------------------------------------------------------------------------------------------
            const cameraTargetShader = device.createShaderModule({ code: cameraTargetShaderCode })
            cameraTargetHdrPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: cameraTargetShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: cameraTargetShader, entryPoint: 'fragmentMain', targets: [{
                        format: HDR_FORMAT,
                        blend: particleNormalBlending,
                    }],
                },
                primitive: { topology: 'line-list' },
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: false,
                    depthCompare: 'less-equal',
                },
            })
            // ---------------------------------------------------------------------------------------------------------
            const bloomShader = device.createShaderModule({ code: bloomShaderCode })
            const bloomPipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [bloomBindGroupLayout],
            })
            bloomPrefilterPipeline = device.createRenderPipeline({
                layout: bloomPipelineLayout,
                vertex: { module: bloomShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: bloomShader,
                    entryPoint: 'fragmentDownsample',
                    constants: { IS_PREFILTER: 1 },
                    targets: [{ format: HDR_FORMAT }],
                },
                primitive: { topology: 'triangle-list' },
            })
            bloomDownsamplePipeline = device.createRenderPipeline({
                layout: bloomPipelineLayout,
                vertex: { module: bloomShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: bloomShader,
                    entryPoint: 'fragmentDownsample',
                    constants: { IS_PREFILTER: 0 },
                    targets: [{ format: HDR_FORMAT }],
                },
                primitive: { topology: 'triangle-list' },
            })
            bloomUpsamplePipeline = device.createRenderPipeline({
                layout: bloomPipelineLayout,
                vertex: { module: bloomShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: bloomShader,
                    entryPoint: 'fragmentUpsample',
                    targets: [{
                        format: HDR_FORMAT,
                        blend: particleAdditiveBlending,
                    }],
                },
                primitive: { topology: 'triangle-list' },
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function updateDepthTexture() {
            if (depthTexture) depthTexture.destroy(); depthTexture = undefined;
            depthTexture = device.createTexture({
                size: [CANVAS_WIDTH, CANVAS_HEIGHT, 1],
                format: DEPTH_FORMAT,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            })
            depthTextureView = depthTexture.createView()
        }
        function updateHdrTexture() {
            if (hdrTexture) hdrTexture.destroy(); hdrTexture = undefined;

            hdrTexture = device.createTexture({
                size: [CANVAS_WIDTH, CANVAS_HEIGHT, 1],
                format: HDR_FORMAT,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            })
            hdrTextureView = hdrTexture.createView()

            for (let i = 0; i < BLOOM_MIPS; i++) {
                bloomTextures[i]?.destroy()
                bloomTextures[i] = undefined
                bloomTextureViews[i] = undefined
            }
            for (let i = 0; i < BLOOM_MIPS; i++) {
                const divisor = 1 << (i + 1) // 2, 4, 8, 16, ...
                const WIDTH = Math.max(1, Math.floor(CANVAS_WIDTH / divisor))
                const HEIGHT = Math.max(1, Math.floor(CANVAS_HEIGHT / divisor))
                bloomTextures[i] = device.createTexture({
                    size: [WIDTH, HEIGHT, 1],
                    format: HDR_FORMAT,
                    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                })
                bloomTextureViews[i] = bloomTextures[i]!.createView()
            }
            if (!bloomSampler) {
                bloomSampler = device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear',
                    addressModeU: 'clamp-to-edge',
                    addressModeV: 'clamp-to-edge',
                })
            }

            if (composeHdrPipelines.length > 0) {
                updateBloomBindGroups()
                updateComposeHdrBindGroup()
            }
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
        function watchAndUpdateBloomOptions(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateBloomOptionsBuffer()
            })
        }
        function watchAndUpdateRenderOptions(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateRenderOptionsBuffer()
            }, { deep: true })
        }

        watch(() => particleLife.isRunning, (value: boolean) => isRunning = value)
        watch(() => particleLife.isGpuTimingsEnabled, (value: boolean) => isGpuTimingsEnabled = value)
        watch(() => particleLife.zoomSmoothing, (value: number) => zoomSmoothing = value)
        watch(() => particleLife.panSmoothing, (value: number) => panSmoothing = value)
        watch(() => particleLife.isBoundingBoxActive, (value: boolean) => isBoundingBoxActive = value)
        watch(() => particleLife.isCameraTargetVisible, (value: boolean) => isCameraTargetVisible = value)
        watch(() => particleLife.tonemapMode, (value: number) => tonemapMode = value)
        watch(() => particleLife.isParticleGlow, (value: boolean) => isParticleGlow = value)
        watch(() => particleLife.useBinning, (value: boolean) => useBinning = value)
        watch(() => particleLife.binningMode, (value: 'grid' | 'hash') => {
            binningMode = value
            updateBinningParameters()
            updateSimOptionsBuffer()
            refreshActiveBinning()
        })

        watchAndUpdateBloomOptions(() => particleLife.bloomThreshold, (value: number) => bloomThreshold = value)
        watchAndUpdateBloomOptions(() => particleLife.bloomIntensity, (value: number) => bloomIntensity = value)
        watchAndUpdateBloomOptions(() => particleLife.bloomKnee, (value: number) => bloomKnee = value)

        watchAndUpdateRenderOptions(() => particleLife.isParticleBorder, (value: boolean) => isParticleBorder = value)
        watchAndUpdateRenderOptions(() => particleLife.isSphereShading, (value: boolean) => isSphereShading = value)
        watchAndUpdateRenderOptions(() => particleLife.sphereAmbient, (value: number) => sphereAmbient = value)
        watchAndUpdateRenderOptions(() => particleLife.sphereDiffuseStrength, (value: number) => sphereDiffuseStrength = value)
        watchAndUpdateRenderOptions(() => particleLife.sphereSpecularStrength, (value: number) => sphereSpecularStrength = value)
        watchAndUpdateRenderOptions(() => particleLife.sphereShininess, (value: number) => sphereShininess = value)
        watchAndUpdateRenderOptions(() => particleLife.sphereLightDir, (value: number[]) => sphereLightDir = [...value])

        watchAndUpdateSimOptions(() => particleLife.particleSize, (value: number) => PARTICLE_SIZE = value)
        watchAndUpdateSimOptions(() => particleLife.particleOpacity, (value: number) => PARTICLE_OPACITY = value)
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

        watch([() => particleLife.isWallRepel, () => particleLife.isWallWrap,], () => {
            isWallRepel = particleLife.isWallRepel
            isWallWrap = particleLife.isWallWrap
            setSimSize()
            updateSimOptionsBuffer()
        })
        watch(() => particleLife.cellSubdivisions, (value: number) => {
            CELL_SUBDIVISIONS = value
            CELL_SIZE = Math.ceil(currentMaxRadius / CELL_SUBDIVISIONS)
            setSimSize()
            updateSimOptionsBuffer()
        })
        watch(() => particleLife.gridExtensionFactor, () => {
            updateBinningParameters()
            updateSimOptionsBuffer()
        })
        // -------------------------------------------------------------------------------------------------------------
        const sphereShadingPreset = computed<string>({
            get() {
                const preset = SPHERE_SHADING_PRESETS.find(p =>
                    Math.abs(p.ambient - particleLife.sphereAmbient) < 0.0001 &&
                    Math.abs(p.diffuse - particleLife.sphereDiffuseStrength) < 0.0001 &&
                    Math.abs(p.specular - particleLife.sphereSpecularStrength) < 0.0001 &&
                    Math.abs(p.shininess - particleLife.sphereShininess) < 0.0001)
                return preset ? preset.id : 'custom'
            },
            set(id: string) {
                const preset = SPHERE_SHADING_PRESETS.find(p => p.id === id)
                if (!preset) return // custom
                particleLife.sphereAmbient = preset.ambient
                particleLife.sphereDiffuseStrength = preset.diffuse
                particleLife.sphereSpecularStrength = preset.specular
                particleLife.sphereShininess = preset.shininess
            },
        })
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const cancelAnimationLoop = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }
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
            bloomOptionsBuffer?.destroy(); bloomOptionsBuffer = undefined;
            renderOptionsBuffer?.destroy(); renderOptionsBuffer = undefined;

            particleBuffer?.destroy(); particleBuffer = undefined;
            particleTempBuffer?.destroy(); particleTempBuffer = undefined;

            if (!keepTexture) {
                depthTexture?.destroy(); depthTexture = undefined;
                depthTextureView = undefined;
                hdrTexture?.destroy(); hdrTexture = undefined;
                hdrTextureView = undefined;
                for (let i = 0; i < BLOOM_MIPS; i++) {
                    bloomTextures[i]?.destroy()
                    bloomTextures[i] = undefined
                    bloomTextureViews[i] = undefined
                }
            }

            await nextTick() // Ensure GPU resources are cleaned up before creating new ones
        }
        const destroyPipelinesAndBindGroups = () => {
            bruteForceComputePipeline = undefined as any;
            particleAdvancePipeline = undefined as any;
            renderPipeline = undefined as any;
            boxRenderPipeline = undefined as any;
            boxRenderHdrPipeline = undefined as any;
            cameraTargetRenderPipeline = undefined as any;
            cameraTargetHdrPipeline = undefined as any;
            renderCirclePipeline = undefined as any;
            composeHdrPipelines.length = 0;
            bloomPrefilterPipeline = undefined as any;
            bloomDownsamplePipeline = undefined as any;
            bloomUpsamplePipeline = undefined as any;
            composeHdrBindGroup = undefined as any;
            bloomDownBindGroups.length = 0
            bloomUpBindGroups.length = 0

            particleBufferReadOnlyBindGroup = undefined as any;
            bruteForceBindGroup = undefined as any;
            particleBufferBindGroup = undefined as any;
            simOptionsBindGroup = undefined as any;
            deltaTimeBindGroup = undefined as any;
            cameraBindGroup = undefined as any;
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
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

            try { timestampQuerySet?.destroy?.() } catch {}
            try { timestampResolveBuffer?.destroy?.() } catch {}
            for (const b of timestampStagingPool) { try { b?.destroy?.() } catch {} }
            timestampStagingPool.length = 0
            timestampQuerySet = null
            timestampResolveBuffer = null

            try { ctx?.unconfigure?.() } catch {}
            try { device?.destroy?.() } catch {}
            device = undefined as any
            ctx = undefined as any
        }

        const switchTo2D = () => {
            emit('switch-renderer', 'gpu')
        }

        return {
            particleLife, canvasRef, fps, executionTime, gpuTimings,
            handleZoom, toggleFullscreen, isFullscreen, smoothCenterView, regenerateLife, step,
            updateSimWidth, updateSimHeight, updateSimDepth,
            updateRulesMatrixValue, updateMinMatrixValue, updateMaxMatrixValue, newRandomRulesMatrix, updateSingleColor,
            randomizeRadius, randomizeRulesAndRadius, updateColors, updateRulesMatrix, updateParticlePositions, loadPreset,
            setNewNumParticles, setNewNumTypes,
            tonemapOptions,
            sphereShadingPresetOptions, sphereShadingPreset, switchTo2D,
        }
    }
})
</script>

<style scoped>
canvas {
    background: black;
}
</style>