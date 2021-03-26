<template>
    <div v-if="errorKey === 'tooBright'">
        <h1>Come Back at Night!</h1>
        <p>This is Entwined Meadow, an art installation by Charles Gadeken. At night, these trees and shrubs glow with beautiful and ever-changing light patterns until 9:30pm.</p>
        <p>When the lights are on, you can scan this QR code to modify the patterns on this shrub. Come back tonight to engage with Entwined!</p>
    </div>
    <div v-else-if="errorKey === 'tooLate'">
        <h1>Entwined Is Off for the Night</h1>
        <p>Entwined turns off at 9:30pm, but earlier in the evening these trees and shrubs glow with beautiful and ever-changing light patterns.</p>
        <p>When the lights are on, you can scan this QR code to modify the patterns on this shrub. Come back tomorrow night to engage with Entwined!</p>
    </div>
    <div v-else>
        <h1>Unknown Error</h1>
        <p>Something went wrong with Entwined's interactive controller, but we're not sure what. Sorry about that!</p>
        <p>Try scanning the QR code again. If that doesn't fix it, try again in a few minutes.</p>
    </div>
</template>

<script>
const ERROR_TIMEOUT_MS = 60000; // 1 minutes
const TIMEOUT_CHECK_FREQUENCY_MS = 5000; // every 5 seconds

export default {
  name: 'ErrorScreen',
  props: ['errorKey'],
  data() {
    return {
      errorLoadedDate: new Date(),
      timeoutInterval: null
    };
  },
  mounted() {
    this.errorLoadedDate = new Date();
    this.timeoutInterval = setInterval(() => {
        // if they've been on the error page for more than a minute, reroute them back to the homepage
        // this is because the error page doesn't automatically refresh, and it could be confusing if they loaded
        // a tab at 1pm and it showed the "too bright" message, and then they open the tab again at 8pm and are confused
        // to see the same message.
        if (Date.now() - this.errorLoadedDate.getTime() > ERROR_TIMEOUT_MS) {
            this.$router.push('/');
        }
    }, TIMEOUT_CHECK_FREQUENCY_MS); // every 5 seconds
  },
  beforeDestroy() {
      if (this.timeoutInterval) {
          clearInterval(this.timeoutInterval);
          this.timeoutInterval = null;
      }
  }
}
</script>
