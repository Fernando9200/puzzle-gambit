<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_2000_2500.json'
definePage({
  meta: {
    title: '2000-2500',
    icon: 'mdi-chess-queen',
    drawerIndex: 4,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="4" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
