<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_2000_2250.json'
definePage({
  meta: {
    title: '2000-2250',
    icon: 'mdi-shield-crown',
    drawerIndex: 6,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="6" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
