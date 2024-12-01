<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import FailedPuzzlesAnalysis from '@/components/FailedPuzzlesAnalysis.vue'
import puzzleData from '@/puzzles/ratings_0_500.json'

definePage({
  meta: {
    icon: 'mdi-alert-circle',
    title: 'Failed Puzzles (0-500)',
    drawerIndex: 7,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <FailedPuzzlesAnalysis :puzzle-collection="puzzleData" :level="0" />

  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
