<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_500_1000.json'
definePage({
  meta: {
    icon: 'mdi-chess-knight',
    title: '500-1000',
    drawerIndex: 1,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="1" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
