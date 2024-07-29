<script setup lang="ts">
import { routes } from 'vue-router/auto/routes'

const appStore = useAppStore()
const { drawer: drawerStored } = storeToRefs(appStore)

const { mobile, lgAndUp, width } = useDisplay()
const drawer = computed({
  get() {
    return drawerStored.value || !mobile.value
  },
  set(val: boolean) {
    drawerStored.value = val
  },
})
const rail = computed(() => !drawerStored.value && !mobile.value)
routes.sort((a, b) => (a.meta?.drawerIndex ?? 99) - (b.meta?.drawerIndex ?? 98))

const isHovering = ref(false)

nextTick(() => {
  drawerStored.value = false
})
</script>

<template>
  <v-navigation-drawer v-model="drawer" :expand-on-hover="rail" :rail="rail" @mouseenter="isHovering = true"
    @mouseleave="isHovering = false" class="custom-navigation-drawer" :width="200">
    <template #prepend>
      <v-list dense nav>
        <v-list-item class="pa-1 custom-list-item">
          <template #prepend>
            <v-icon icon="mdi-menu" size="x-large" class="drawer-header-icon" color="white" />
          </template>
          <v-list-item-title class="text-h6 font-weight-bold drawer-title">Elo Range</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>
    <v-list nav density="compact" class="custom-list">
      <AppDrawerItem v-for="route in routes" :key="route.name" :item="route" />
    </v-list>
    <v-spacer />
  </v-navigation-drawer>
</template>

<style scoped>
.custom-navigation-drawer {
  background-color: #1e1e2f;
  color: white;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  transition: width 0.3s, box-shadow 0.3s;
}

.custom-navigation-drawer:hover {
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
}

.custom-list-item {
  align-items: center;
  justify-content: space-between;
}

.drawer-header-icon {
  transition: transform 0.3s;
}

.drawer-header-icon.rotate-90 {
  transform: rotate(90deg);
}

.drawer-title {
  color: red;
  text-transform: uppercase;
}

.custom-list {
  padding: 10px;
}

.custom-list .v-list-item {
  border-radius: 8px;
  margin: 5px 0;
  transition: background-color 0.3s, transform 0.3s;
}

.custom-list .v-list-item:hover {
  background-color: red;
  transform: translateX(5px);
}

.v-navigation-drawer__content {
  overflow-y: hidden;
}

.v-navigation-drawer__content:hover {
  overflow-y: overlay;
}
</style>
