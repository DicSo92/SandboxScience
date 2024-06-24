<template>
    <div h-full flex flex-col>
        <div class="mt-4 px-4">
            <input type="text" placeholder="Search pattern here" class="w-full p-2 border border-gray-300 rounded-md focus:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors duration-300">
        </div>
        <div class="mt-4 px-4 flex justify-between">
            <p class="ml-2 text-gray-400">Patterns</p>
            <div class="flex">
                <button flex items-center>
                    <span i-tabler-list text-xl></span>
                </button>
                <button flex items-center>
                    <span i-tabler-layout-grid text-xl></span>
                </button>
            </div>
        </div>
        <div class="mt-4 px-4 overflow-auto flex-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-gray-500 hover:bg-gray-400 p-4 cursor-pointer rounded-md border border-gray-300 transition-colors duration-300" v-for="item in 22">
                    <h3 class="text-lg font-semibold text-black mb-2">Card {{ item }}</h3>
                    <p class="text-gray-600">Content for card {{ item }}.</p>
                </div>
            </div>
        </div>
        <!-- Sidebar Footer -->
        <div class="mt-6 px-4">
            <button class="flex justify-center items-center bg-black text-white rounded-md text-sm p-2 gap-1">
                <span i-tabler-filter text-xl></span>
                Filters
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped>

</style>