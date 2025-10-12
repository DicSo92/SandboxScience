<template>
    <main class="grid w-full place-items-center">
        <div class="grid w-full grid-cols-3 gap-2 rounded-xl bg-zinc-700 text-sm" style="padding: 3px;">
            <div>
                <input type="radio" name="option" id="1" value="none" class="peer hidden" v-model="currentValue" />
                <label for="1" class="block cursor-pointer select-none rounded-xl px-2 text-center hover:bg-zinc-800 peer-checked:bg-zinc-900 peer-checked:font-bold peer-checked:text-white">
                    None
                </label>
            </div>
            <div>
                <input type="radio" name="option" id="2" value="repel" class="peer hidden" v-model="currentValue" />
                <label for="2" class="block cursor-pointer select-none rounded-xl px-2 text-center hover:bg-zinc-800 peer-checked:bg-zinc-900 peer-checked:font-bold peer-checked:text-white">
                    Repel
                </label>
            </div>
            <div>
                <input type="radio" name="option" id="3" value="wrap" class="peer hidden" v-model="currentValue" />
                <label for="3" class="block cursor-pointer select-none rounded-xl px-2 text-center hover:bg-zinc-800 peer-checked:bg-zinc-900 peer-checked:font-bold peer-checked:text-white">
                    Wrap
                </label>
            </div>
        </div>
    </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    props: {
        store: {
            type: Object,
            required: true,
        }
    },
    setup(props, { emit }) {
        const currentValue = ref()
        const particleLife = props.store

        onMounted(() => {
            if (particleLife.isWallRepel) {
                currentValue.value = 'repel'
            } else if (particleLife.isWallWrap) {
                currentValue.value = 'wrap'
            } else {
                currentValue.value = 'none'
            }
        })

        watch(() => currentValue.value, (value) => {
            if (value === 'repel') {
                particleLife.isWallRepel = true
            } else if (value === 'wrap') {
                particleLife.isWallWrap = true
            } else {
                particleLife.isWallRepel = false
                particleLife.isWallWrap = false
            }
        })

        watch([() => particleLife.isWallRepel, () => particleLife.isWallWrap], () => {
            if (particleLife.isWallRepel) {
                currentValue.value = 'repel'
            } else if (particleLife.isWallWrap) {
                currentValue.value = 'wrap'
            } else {
                currentValue.value = 'none'
            }
        })

        return { currentValue }
    }
})
</script>

<style scoped>

</style>
