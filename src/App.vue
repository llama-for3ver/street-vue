<script setup lang="ts">
import StreetView from './components/StreetView.vue'
import { ref } from 'vue'

const zoom = ref(4)
const pano = ref("WlMXvion3Q6Rba7QdmHi5A")

const changeZoom = () => {
  zoom.value = Number(prompt('Enter new zoom (1-5):', zoom.value.toString()))
}
const changePano = () => {
  pano.value = prompt(`Enter new pano ID. Examples: 
  WlMXvion3Q6Rba7QdmHi5A - Times Square
  OoRKqxWe0KxxEWUisDIy7w - Amsterdam`.trim(),
  pano.value) as string
}

</script>

<template>
  <div class="street-view-panorama">
    <button style="position:absolute; top: 20px; left: 2%;" @click="changeZoom">Change Zoom</button>
    <button style="position:absolute; top: 20px; left: 10%;" @click="changePano">Change Pano</button>
    <StreetView id="sv" :panoId="pano" :zoom="zoom" />
  </div>
</template>

<style>
.street-view-panorama {
  overflow-y: hidden;
  overscroll-behavior: none;
  padding: 2px;
}

#sv {
  width: 100vw;
  height: 100vh;
  align-self: center;
}
</style>