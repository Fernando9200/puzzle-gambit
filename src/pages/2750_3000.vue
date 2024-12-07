<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_2750_3000.json'
definePage({
  meta: {
    title: '2750-3000',
    icon: 'mdi-medal-outline',
    drawerIndex: 9,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="9" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
