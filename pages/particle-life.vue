<template>
    <transition name="fade" @after-leave="onBootOverlayHidden">
        <div v-if="isBooting" class="fixed inset-0 z-50 bg-gray-950">
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="flex flex-col items-center gap-3">
                    <div class="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
                    <p class="text-white/80 text-sm">Loading simulation...</p>
                </div>
            </div>
        </div>
    </transition>
    <transition name="overlay-animation">
        <div v-if="isOverlayOpen" class="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-[0.6px]"></div>
    </transition>

    <Modal :modal-active="isModalOpen" @close="closeIntroModal" overlayColor="transparent" modalClass="max-w-[880px]">
        <section class="space-y-4">
            <header>
                <h1 class="text-2xl sm:text-[1.75rem] font-bold mb-3 flex items-center">
                    Particle Life
                    <span class="ml-2 px-2 py-1 rounded-lg ring-1 uppercase justify-center font-mono" :class="currentRenderer === 'gpu' ? 'bg-fuchsia-600/20 text-fuchsia-400 ring-fuchsia-500/30' : 'bg-sky-600/20 text-sky-400 ring-sky-500/30'">
                        {{ currentRenderer }}
                    </span>
                </h1>
                <p class="text-gray-300 mb-2">
                    <strong>Particle Life</strong> is a <strong>particle simulator</strong> where <em>simple interaction rules</em> produce <strong>complex, emergent behaviors</strong>.
                    Tweak <strong>forces</strong> and <strong>starting conditions</strong> to reveal <em>stable clusters</em>, <em>flowing patterns</em>, and <em>chaotic transitions</em> in <strong>real time</strong>.
                </p>
                <p class="text-sm text-gray-300">
                    <span class="font-bold text-fuchsia-500">WebGPU</span> provides <strong>higher FPS</strong>, <strong>smoother motion</strong>, and <strong>bigger particle counts</strong> when supported, while the <span class="font-bold text-sky-500">CPU renderer</span> stays <em>compatible</em> on every device.
                </p>
            </header>

            <div v-if="isWebGPUSupported && currentRenderer === 'cpu'" class="rounded-lg ring-1 ring-gray-500/30 bg-slate-700/20 text-gray-50 text-sm p-4">
                <div class="flex items-center rounded-full bg-amber-700/60 ring-1 ring-amber-400/30 w-fit pl-2 pr-3 py-0.5 mb-3">
                    <div i-tabler-alert-hexagon text-lg mr-1></div>
                    <h3 class="font-semibold">WebGPU is available</h3>
                </div>

                <div flex flex-col gap-2>
                    <p>
                        This device supports <strong>WebGPU</strong>. You’re currently on the <strong>CPU renderer</strong>.
                    </p>
                    <div rounded-lg py-2 px-3 mb-1 class="bg-sky-600/10 ring-1 ring-sky-400/20">
                        <div class="text-sky-100 text-sm font-semibold">CPU mode — Fully compatible</div>
                        <p class="text-indigo-50/90 text-sm mt-1">
                            Runs on every device and supports the full <strong>3D simulation</strong>. Switch to <strong>WebGPU</strong> for higher FPS and more particles. You can switch back anytime.
                        </p>
                    </div>
                    <div class="flex items-center gap-3 mt-1">
                        <button class="px-4 sm:px-8 py-2 rounded-xl bg-gray-50 hover:bg-gray-200 transition-all ring-1 ring-black text-black text-base font-semibold" @click.prevent="selectRenderer('gpu', true)">
                            Switch to WebGPU <em>(Recommended)</em>
                        </button>
                        <button class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700/75 transition-all text-white text-base font-semibold" @click.prevent="closeIntroModal">
                            Keep CPU for now
                        </button>
                    </div>
                </div>
            </div>
            <div v-else-if="isWebGPUSupported && currentRenderer === 'gpu'" class="rounded-lg border border-green-800 bg-green-900/20 ring-1 ring-green-400/30 text-green-100 text-sm p-4">
                <div class="flex items-center rounded-full bg-green-700/60 ring-1 ring-green-400/30 w-fit pl-2 pr-3 py-0.5 mb-3">
                    <div i-tabler-check text-lg mr-1></div>
                    <h3 class="font-semibold">WebGPU is available</h3>
                </div>

                <div flex flex-col gap-2>
                    <p>
                        You’re on the <strong>GPU renderer</strong> for maximum performance.
                    </p>
                    <div rounded-lg py-2 px-3 class="bg-emerald-500/10 ring-1 ring-emerald-400/20">
                        <div class="text-emerald-100 text-sm font-semibold">WebGPU mode — High performance</div>
                        <p class="text-emerald-50/90 text-sm mt-1">
                            <strong>WebGPU</strong> runs the simulation on your graphics card for <strong>higher FPS</strong>, <strong>more particles</strong>, and <em>richer visuals</em>. It also reduces <strong>CPU</strong> load to keep the <em>UI</em> responsive as scenes grow.
                        </p>
                    </div>
                    <p class="text-slate-300/90">
                        Need compatibility or lower power usage ?
                        <a href="#" class="underline hover:no-underline" @click.prevent="selectRenderer('cpu', true)">
                            Switch to CPU
                        </a>
                    </p>
                    <div class="flex items-center gap-3 mt-1">
                        <button class="px-4 sm:px-8 py-2 w-fit rounded-xl bg-gray-50 hover:bg-gray-200 transition-all ring-1 ring-black text-black text-base font-semibold" @click.prevent="closeIntroModal">
                            Start Simulation
                        </button>
                        <button class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700/75 ring-1 ring-gray-500/20 transition-all text-white text-base font-semibold" @click.prevent="selectRenderer('cpu', true)">
                            Switch to CPU
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="rounded-lg bg-amber-900/20 ring-1 ring-amber-400/30 text-amber-100 text-sm p-4">
                <div class="flex items-center rounded-full bg-amber-700/60 ring-1 ring-amber-400/30 w-fit pl-2 pr-3 py-0.5 mb-3">
                    <div i-tabler-alert-triangle text-lg mr-1></div>
                    <h3 class="font-semibold">WebGPU is not available</h3>
                </div>
                <div flex flex-col gap-2>
                    <p>
                        <strong>WebGPU</strong> is <strong>not supported</strong> on this <em>device or browser</em>. You’re currently on the <strong>CPU renderer</strong>.
                    </p>
                    <div rounded-lg py-2 px-3 class="bg-amber-500/10 ring-1 ring-amber-400/20">
                        <div class="text-amber-100 text-sm font-semibold">CPU mode — Fully compatible</div>
                        <p class="text-amber-50/90 text-sm mt-1">
                            Runs on <strong>every device</strong> and supports the full <strong>3D simulation</strong>. Enable <strong>WebGPU</strong> for higher FPS and more particles when your setup supports it.
                        </p>
                    </div>
                    <p class="text-stone-300/90">
                        Follow the <em>Enable WebGPU</em> guide below to set up your browser for higher FPS and more particles.
                    </p>
                    <button class="mt-1 px-4 sm:px-8 py-2 w-fit rounded-xl bg-gray-50 hover:bg-gray-200 transition-all ring-1 ring-black text-black text-base font-semibold" @click.prevent="closeIntroModal">
                        Start Simulation
                    </button>
                </div>
            </div>

            <!-- Performance warning even when WebGPU is available -->
            <div v-if="isWebGPUSupported && currentRenderer === 'gpu'" class="mt-3 rounded-lg border border-yellow-700 bg-yellow-900/30 text-yellow-100 p-4">
                <div class="flex items-center gap-2 font-medium text-white/90 mb-2">
                    <div i-tabler-alert-triangle text-lg mr-1></div>
                    <h3>Performance warning</h3>
                </div>
                <p class="mt-1 text-sm">
                    If performance is lower than expected, your system might be using the integrated GPU or the wrong graphics profile.
                </p>
                <p class="mt-1 text-sm">
                    On Windows, open <em>Settings → System → Display → Graphics → Graphics settings</em>, add Chrome or Edge, and set it to <strong>High performance GPU</strong>.
                    <br>
                    Also make sure <strong>Hardware Acceleration</strong> is enabled in your browser settings, then restart the browser.
                </p>
                <p class="mt-2 text-xs opacity-90">
                    💡 Tip: Open <code>chrome://gpu</code> or <code>edge://gpu</code> and check that WebGPU shows <em>“Hardware accelerated”</em>.
                </p>
            </div>

            <div class="flex flex-col md:flex-row gap-4" v-if="currentRenderer === 'cpu'" :key="currentRenderer">
                <DevicesGpuTips class="w-full md:w-1/2"></DevicesGpuTips>
                <div class="w-full md:w-1/2 flex flex-col sm:flex-row md:flex-col gap-3">
                    <div class="rounded-2xl p-4 bg-gradient-to-br from-amber-500/15 to-rose-500/10 ring-1 ring-amber-400/30 sm:w-1/2 md:w-auto">
                        <div class="flex items-center gap-2 text-sm font-semibold text-white/90 mb-1">
                            <div i-tabler-alert-triangle text-lg mr-1></div>
                            <h3 class="font-semibold">Performance not great ?</h3>
                        </div>
                        <p text-sm>Try the tips in the left guide for your OS, then restart the browser — small changes often make a big difference.</p>
                    </div>
                    <div class="rounded-2xl p-4 bg-gradient-to-br from-sky-500/15 to-indigo-500/10 ring-1 ring-sky-400/30 sm:w-1/2 md:w-auto">
                        <div class="flex items-center gap-2 text-sm font-semibold text-white/90 mb-1">
                            <div i-tabler-info-circle text-lg mr-1></div>
                            <h3 class="font-semibold">Helpfull reminders</h3>
                        </div>
                        <ul class="list-disc list-outside pl-5 text-sm">
                            <li>Keep your browser and GPU drivers up to date.</li>
                            <li>Plug in laptops and avoid power-saving modes.</li>
                            <li>Close heavy tabs/apps if you notice stutter.</li>
                        </ul>
                    </div>
                </div>
            </div>

<!--            <div flex justify-end>-->
<!--                <ToggleSwitch label="Don’t show this again" colorful-label v-model="modalDismissed" @update:modelValue="toggleModalDismiss" />-->
<!--            </div>-->
        </section>
    </Modal>

    <component v-if="particleLifeComponent" :is="particleLifeComponent" :key="currentRenderer" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DevicesGpuTips from "~/components/particle-life/DevicesGpuTips.vue";
import CpuComp from '~/components/particle-life/ParticleLifeCpu.vue'

export default defineComponent({
    components: {DevicesGpuTips},
    setup() {
        definePageMeta({
            layout: 'life',
            hideNavBar: true
        })
        useSeoMeta({
            title: 'Particle Life',
            description: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
            ogTitle: 'Particle Life • Particle Simulation',
            ogDescription: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
            twitterTitle: 'Particle Life • Particle Simulation',
            twitterDescription: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
        })

        const GpuComp = defineAsyncComponent({
            loader: () => import('~/components/particle-life/ParticleLifeGpu.vue'),
            suspensible: false
        })
        const particleLifeComponent = shallowRef<any>(CpuComp)
        const currentRenderer = ref<'gpu' | 'cpu'>('cpu') // track active renderer
        const isWebGPUSupported = ref<boolean>(true)
        const isModalOpen = ref<boolean>(false)
        const isOverlayOpen = ref<boolean>(true)
        const MODAL_DISMISS_KEY = 'particle-life:intro-modal-dismissed' // key stored in localStorage
        const modalDismissed = ref<boolean>(false)
        const isBooting = ref<boolean>(true)

        onMounted(async () => {
            modalDismissed.value = localStorage.getItem(MODAL_DISMISS_KEY) === 'true'
            isOverlayOpen.value = !modalDismissed.value
            try {
                isWebGPUSupported.value = await checkGPUAdapter()
                // isWebGPUSupported.value = false // TEMP DISABLE GPU RENDERER
                await selectRenderer(isWebGPUSupported.value ? 'gpu' : 'cpu')
            } catch (err) {
                console.error('Boot error:', err)
                isWebGPUSupported.value = false
                try { await selectRenderer('cpu') } catch {}
            }
        })
        // -------------------------------------------------------------------------------------------------------------
        const checkGPUAdapter = async (): Promise<boolean> => {
            try {
                if (!('gpu' in navigator) || !navigator.gpu?.requestAdapter) {
                    console.warn('WebGPU not available on this device/browser')
                    return false
                }
                const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
                if (!adapter) {
                    console.warn('WebGPU adapter not found')
                    return false
                }
                const device = await adapter.requestDevice()
                if (!device) {
                    console.warn('WebGPU device not found')
                    return false
                }
                console.log('WebGPU is supported')
                return true
            } catch (err) {
                console.warn('WebGPU check failed:', err)
                return false
            }
        }
        const selectRenderer = async (mode: 'gpu' | 'cpu', isSwitching = false) => {
            isBooting.value = true
            try {
                if (isSwitching) {
                    isModalOpen.value = false
                    await new Promise(r => setTimeout(r, 600)) // wait for fade out
                }
                if (mode === 'gpu' && !isWebGPUSupported.value) mode = 'cpu'

                particleLifeComponent.value = mode === 'gpu' ? GpuComp : CpuComp
                currentRenderer.value = mode
                await nextTick()

                await new Promise(r => setTimeout(r, 100)) // wait for component to mount
            } catch (err) {
                console.error('selectRenderer error:', err)
                particleLifeComponent.value = CpuComp
                currentRenderer.value = 'cpu'
            } finally {
                isBooting.value = false
                if (isSwitching) isModalOpen.value = true
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        const onBootOverlayHidden = () => {
            isModalOpen.value = !modalDismissed.value
            isOverlayOpen.value = !modalDismissed.value
        }
        const closeIntroModal = () => {
            isModalOpen.value = false
            isOverlayOpen.value = false
        }
        const toggleModalDismiss = () => {
            if (modalDismissed.value) {
                localStorage.setItem(MODAL_DISMISS_KEY, 'true')
            } else {
                localStorage.removeItem(MODAL_DISMISS_KEY)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            console.log('Particle Life Unmounted')
        })

        return {
            isModalOpen, isWebGPUSupported, particleLifeComponent, selectRenderer, currentRenderer,
            modalDismissed, toggleModalDismiss,
            isBooting, onBootOverlayHidden, isOverlayOpen, closeIntroModal
        }
    }
})
</script>

<style lang="scss" scoped>
.overlay-animation-enter-active,
.overlay-animation-leave-active {
    transition: opacity 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}
.overlay-animation-enter-from,
.overlay-animation-leave-to {
    opacity: 0;
}
.fade-enter-active, .fade-leave-active {
    transition: opacity 600ms ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
