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
        return 'unknown';
      }

      if (this.estimatedWaitTime < 30) {
        return 'less than a minute';
      }

      if (this.estimatedWaitTime < 90) {
        return 'one minute';
      }

      return `${Math.round(this.estimatedWaitTime / 60.0)} minutes`;
    }
  }
};
</script>

<style scoped>
</style>
