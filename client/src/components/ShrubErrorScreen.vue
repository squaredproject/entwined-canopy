<template>
  <div>
    <div v-if="errorKey === 'canopyUnreachable'">
      <h1>Network Problems</h1>
      <p>Unfortunately, the connection to Entwined isn't working. This likely means that your device doesn't have a reliable internet connection, but it could also be an issue with Entwined.</p>
      <p>Try reloading the page. If that doesn't fix it, try again in a few minutes.</p>
    </div>
    <div v-else-if="errorKey === 'lxUnreachable'">
      <h1>Something's Wrong</h1>
      <p>We couldn't reach the Entwined tree to allow interaction. This is a problem on our end, not an issue with your connection.</p>
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
  name: 'ShrubErrorScreen',
  props: ['shrubId', 'errorKey']
};
</script>

<style scoped>
</style>
