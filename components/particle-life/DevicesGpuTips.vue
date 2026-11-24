<template>
    <section>
        <h3 class="mb-3 text-sm text-white/90 font-semibold">
            Enable WebGPU
        </h3>
        <div mb-2 flex gap-1>
            <div v-for="value in values" :key="`${value}-btn`">
                <input :id="value" v-model="currentValue" type="radio" name="devices-gpu-tips" :value="value" class="peer hidden">
                <label
                    :for="value" class="block shrink-0 cursor-pointer select-none whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1 text-center text-[12px] text-white ring-1 transition hover:bg-white/10 peer-checked:bg-white/90 peer-checked:text-slate-900 peer-checked:font-bold first-letter:uppercase peer-checked:ring-white"
                >
                    {{ value }}
                </label>
            </div>
        </div>
        <div class="rounded-lg bg-slate-700/20 p-4 text-sm text-gray-50 ring-1 ring-gray-500/30">
            <div v-if="currentValue === 'windows'">
                <h3 mb-2>
                    Let's get WebGPU ready on your device.
                </h3>
                <ul class="list-disc list-outside pl-5">
                    <li>Open <strong>Settings → System → Display → Graphics</strong>, add your browser (Chrome/Edge) and set it to <strong>High performance GPU.</strong></li>
                    <li>Update to <strong>Chrome/Edge 113+</strong> and enable <strong>Use hardware acceleration</strong> in browser settings.</li>
                    <li>Update GPU drivers (NVIDIA/AMD/Intel), then restart the browser.</li>
                </ul>
            </div>
            <div v-else-if="currentValue === 'macOS'">
                <h3 mb-2>
                    Let's get WebGPU ready on your device.
                </h3>
                <ul class="list-disc list-outside pl-5">
                    <li>Use a recent <strong>Safari 17+</strong> or <strong>Chrome 113+</strong>. Ensure <strong>hardware acceleration</strong> is enabled (Chrome → Settings → System).</li>
                    <li>On laptops: <strong>plug into power</strong> and avoid <strong>Low Power Mode</strong>.</li>
                    <li><strong>Firefox on macOS</strong>: WebGPU support still limited.</li>
                </ul>
            </div>
            <div v-else-if="currentValue === 'mobile'">
                <h3 mb-2>
                    Mobile support depends on your device and OS.
                </h3>
                <ul class="list-disc list-outside pl-5">
                    <li>On <strong>Android</strong>, use the latest <strong>Chrome</strong>. Some devices may fall back to CPU automatically.</li>
                    <li>On <strong>iOS/iPadOS</strong>, use the latest <strong>Safari</strong>. If WebGPU isn’t offered, CPU mode will be used.</li>
                </ul>
            </div>
            <div v-else-if="currentValue === 'linux'">
                <h3 mb-2>
                    Let's get WebGPU ready on your device.
                </h3>
                <ul class="list-disc list-outside pl-5">
                    <li>Use <strong>Chrome/Chromium 113+</strong> with <strong>hardware acceleration</strong> enabled.</li>
                    <li>In <em>chrome://flags</em>: turn on <strong>Unsafe WebGPU</strong> (and sometimes <strong>Vulkan</strong>).</li>
                    <li>Prefer <strong>proprietary GPU drivers</strong> (NVIDIA/AMD/Intel).</li>
                    <li><strong>Firefox stable</strong>: WebGPU support mostly missing.</li>
                </ul>
            </div>
            <div v-else-if="currentValue === 'verify'">
                <h3 mb-2>
                    Let's get WebGPU ready on your device.
                </h3>
                <ul class="mb-1 list-disc list-outside pl-5">
                    <li>Open <strong>chrome://gpu (or edge://gpu)</strong> and look for <strong>WebGPU</strong> → <em>Hardware accelerated</em>.</li>
                </ul>
                <p>On iOS, this page isn’t available, rely on in‑app status and performance.</p>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {},
    // eslint-disable-next-line unused-imports/no-unused-vars
    setup(props, { emit }) {
        const currentValue = ref('windows')
        const values = ['windows', 'macOS', 'mobile', 'linux', 'verify']

        return { currentValue, values }
    },
})
</script>

<style scoped>

</style>
