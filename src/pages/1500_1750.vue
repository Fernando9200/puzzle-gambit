<script setup lang="ts">
import router from '@/plugins/router';
import data from '../puzzles/ratings_1500_1750.json'
definePage({
  meta: {
    title: '1500-1750',
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
