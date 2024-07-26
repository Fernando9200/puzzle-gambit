<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_1000_1500.json'
definePage({
  meta: {
    title: '1000-1500',
    icon: 'mdi-numeric-3',
    drawerIndex: 2,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="2" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
