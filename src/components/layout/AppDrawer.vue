<script setup lang="ts">
import { routes } from 'vue-router/auto/routes'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

const appStore = useAppStore()
const { drawer: drawerStored } = storeToRefs(appStore)

const { mobile } = useDisplay()

const drawer = computed<boolean>({
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

const drawerWidth = computed(() => {
  return mobile.value ? '75vw' : '200px'
})

nextTick(() => {
  drawerStored.value = false
})

const toggleDrawer = () => {
  drawerStored.value = !drawerStored.value
}

const closeDrawer = () => {
  if (mobile.value) {
    drawerStored.value = false
  }
}
</script>

<template>
  <div>
    <!-- Toggle button for mobile -->
    <v-btn v-if="mobile" @click="toggleDrawer" class="mobile-menu-toggle" icon>
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <v-navigation-drawer v-model="drawer" :expand-on-hover="rail" :rail="rail" @mouseenter="isHovering = true"
      @mouseleave="isHovering = false" class="custom-navigation-drawer" :width="drawerWidth" @click="closeDrawer">
      <template #prepend>
        <v-list dense nav>
          <v-list-item class="pa-1 custom-list-item">
            <template #prepend>
              <v-icon icon="mdi-menu" size="x-large" class="drawer-header-icon" color="white" />
            </template>
            <v-list-item-title class="text-h6 font-weight-bold drawer-title">Menu</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
      <v-list nav density="compact" class="custom-list">
        <AppDrawerItem v-for="route in routes" :key="route.name" :item="route" @click="closeDrawer" />
      </v-list>
      <v-spacer />
    </v-navigation-drawer>
  </div>
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
  font-size: 1.5rem;
  /* Adjust as needed */
  line-height: 1.2;
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

.mobile-menu-toggle {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background-color: #6d6b6b;
  color: white;
}

@media (max-width: 600px) {
  .custom-navigation-drawer {
    width: 75vw;
    border-radius: 0;
  }

  .custom-list-item {
    padding: 0;
  }

  .drawer-title {
    font-size: 1.2rem;
  }

  .custom-list .v-list-item {
    margin: 2px 0;
  }
}
</style>
