<template>
    <section>
        <div v-if="isSupported && memory" class="inline-grid grid-cols-2 gap-x-4 gap-y-1">
            <template v-if="memory">
                <div>Used</div>
                <div>{{ getSimplifiedMemory(memory.usedJSHeapSize) }}</div>
                <div>Allocated</div>
                <div>{{ getSimplifiedMemory(memory.totalJSHeapSize) }}</div>
                <div>Limit</div>
                <div>{{ getSimplifiedMemory(memory.jsHeapSizeLimit) }}</div>
            </template>
        </div>
        <div v-else>
            Your browser does not support performance memory API
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    setup() {
        const { isSupported, memory } = useMemory()
        function getSimplifiedMemory(v: number) {
            const kb = v / 1024 / 1024
            return `${kb.toFixed(2)} MB`
        }

        return { isSupported, memory, getSimplifiedMemory }
    }
})
</script>

<style scoped>

</style>