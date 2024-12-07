<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_1250_1500.json'
definePage({
  meta: {
    title: '1250-1500',
    icon: 'mdi-chess-rook',
    drawerIndex: 3,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="3" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
