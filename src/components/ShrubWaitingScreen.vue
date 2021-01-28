<template>
  <div>
    <h1>Waiting to Interact</h1>
    <p>Somebody else is controlling the shrub right now. Hang out and enjoy Entwined while waiting for your turn.</p>
    <p v-if="estimatedWaitString">Your estimated wait time is {{estimatedWaitString}}.</p>
  </div>
</template>

<script>
export default {
  name: 'ShrubWaitingScreen',
  props: ['shrubId', 'estimatedWaitTime'],
  computed: {
    estimatedWaitString: function() {
      if (!this.estimatedWaitTime) {
        return '';
      }

      // borrowed from this StackOverflow answer https://stackoverflow.com/a/25279399
      return new Date(1000 * this.estimatedWaitTime).toISOString().substr(14, 5);
    }
  }
};
</script>

<style scoped>
</style>
