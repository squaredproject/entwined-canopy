<template>
  <div>
    <div v-if="errorKey === 'tooBright'">
      <h1>Come Back at Night!</h1>
      <p>This is Entwined, an art installation by Charles Gadeken. At night, these trees and shrubs glow with beautiful and ever-changing light patterns until 9:30pm.</p>
      <p>When the lights are on, you can scan this QR code to modify the patterns on this shrub. Come back tonight to engage with Entwined!</p>
    </div>
    <div v-else-if="errorKey === 'tooLate'">
      <h1>Entwined Is Off for the Night</h1>
      <p>Entwined turns off at night, but earlier in the evening these trees and shrubs glow with beautiful and ever-changing light patterns.</p>
      <p>When the lights are on, you can scan this QR code to modify the patterns on this shrub. Come back tomorrow night to engage with Entwined!</p>
    </div>
    <div v-else-if="errorKey === 'canopyUnreachable'">
      <h1>Network Problems</h1>
      <p>Unfortunately, the connection to Entwined isn't working. This likely means that your device doesn't have a reliable internet connection, but it could also be an issue with Entwined.</p>
      <p>Try reloading the page. If that doesn't fix it, try again in a few minutes.</p>
    </div>
    <div v-else-if="errorKey === 'lxUnreachable'">
      <h1>Something's Wrong</h1>
      <p>We couldn't reach Entwined to allow interaction. This is a problem on our end, not an issue with your connection.</p>
      <p>We'll keep trying to get it working. This problem usually doesn't last longer than a couple minutes.</p>
    </div>
    <div v-else>
      <h1>Unknown Error</h1>
      <p>Something went wrong with our interactivity connection, but we're not sure what. That's weird!</p>
      <p>Try reloading the page. If that doesn't fix it, try again in a few minutes.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PieceErrorScreen',
  props: ['errorKey']
};
</script>

<style scoped>
</style>
