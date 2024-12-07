<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_2500_2750.json'
definePage({
  meta: {
    title: '2500-2750',
    icon: 'mdi-star-circle-outline',
    drawerIndex: 8,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <TrainingSession :puzzle-colection="data" :level="8" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
