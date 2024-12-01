<script setup lang="ts">
import FailedPuzzlesAnalysis from '@/components/FailedPuzzlesAnalysis.vue'
import puzzles0_500 from '@/puzzles/ratings_0_500.json'
import puzzles500_1000 from '@/puzzles/ratings_500_1000.json'
import puzzles1000_1500 from '@/puzzles/ratings_1000_1500.json'
import puzzles1500_2000 from '@/puzzles/ratings_1500_2000.json'
import puzzles2000_2500 from '@/puzzles/ratings_2000_2500.json'
import puzzles2500_3000 from '@/puzzles/ratings_2500_3000.json'
import puzzles3000_3500 from '@/puzzles/ratings_3000_3500.json'

interface PuzzleData {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: number;
  RatingDeviation: number;
  Popularity: number;
  NbPlays: number;
  Themes: string;
  GameUrl: string;
  OpeningTags: string | null;
  [key: string]: any;
}

// Get all puzzle collections
const puzzleCollections: Record<number, PuzzleData[]> = {
  0: puzzles0_500 as PuzzleData[],
  1: puzzles500_1000 as PuzzleData[],
  2: puzzles1000_1500 as PuzzleData[],
  3: puzzles1500_2000 as PuzzleData[],
  4: puzzles2000_2500 as PuzzleData[],
  5: puzzles2500_3000 as PuzzleData[],
  6: puzzles3000_3500 as PuzzleData[],
}

// Load puzzles from all levels that were failed
const getAllFailedPuzzles = (): PuzzleData[] => {
  const allFailedPuzzles: PuzzleData[] = []

  for (let level = 0; level <= 6; level++) {
    const failedIndices = JSON.parse(localStorage.getItem(`failedPuzzles_${level}`) || '[]') as number[]
    const levelPuzzles = failedIndices.map(index => {
      const puzzle = puzzleCollections[level][index]
      if (puzzle) {
        return {
          ...puzzle,
          originalLevel: level,
          originalIndex: index
        }
      }
      return null
    }).filter(Boolean) as PuzzleData[]

    allFailedPuzzles.push(...levelPuzzles)
  }

  return allFailedPuzzles
}

definePage({
  meta: {
    icon: 'mdi-alert-circle',
    title: 'Failed Puzzles',
    drawerIndex: 7,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <FailedPuzzlesAnalysis :puzzle-collection="getAllFailedPuzzles()" :level="0" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
