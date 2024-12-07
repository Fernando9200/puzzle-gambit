<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_2250_2500.json'
definePage({
  meta: {
    title: '2250-2500',
    icon: 'mdi-crown-outline',
    drawerIndex: 7,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="7" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
