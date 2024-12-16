<script setup lang="ts">
import StreetView from './components/StreetView.vue'
</script>

<template>
  <div class="street-view-panorama">
    <StreetView id="sv" panoId="WlMXvion3Q6Rba7QdmHi5A" :zoom="4"/>
  </div>
</template>

<style>
.street-view-panorama {
  overflow-y: hidden;
  overscroll-behavior: none;
  margin: 0px;
}

#sv {
  width: 100%;
  height: 100%;
}
</style>