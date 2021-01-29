<template>
  <div>
    <h1>Your spot is up!</h1>
    <p>It's your turn to control the shrub!</p>
    <button type="button" v-on:click="acceptOffer">Start Controlling</button>
    <button type="button" v-on:click="declineOffer">Decline Control</button>
    <p>You have {{offerTimeRemainingString}} to start controlling before we'll move on to the next person in line.</p>
  </div>
</template>

<script>
export default {
  name: 'ShrubOfferScreen',
  props: ['shrubId', 'offerExpiryDate'],
  data() {
    return {
      nowTimestamp: Date.now(),
      nowInterval: null
    }
  },
  created() {
    var self = this;

    // this is basically a crappy kluge to make offerTimeRemainingString update regularly
    this.nowInterval = setInterval(function () {
        self.nowTimestamp = Date.now();
    }, 250);
  },
  beforeDestroy() {
    if (this.nowInterval) {
      clearInterval(this.nowInterval);
      this.nowInterval = null;
    }
  },
  computed: {
    offerTimeRemainingString: function() {
      if (!this.offerExpiryDate) {
        return '0 seconds';
      }

      let timeRemaining = Math.max(this.offerExpiryDate.getTime() - this.nowTimestamp, 0);

      return `${Math.round(timeRemaining / 1000)} seconds`;
    }
  },
  methods: {
    declineOffer: function() {
      this.$socket.client.emit('declineOfferedSession', this.shrubId);
      // TODO: what should happen next?
    },
    acceptOffer: function() {
      this.$socket.client.emit('acceptOfferedSession', this.shrubId);
      // TODO: what should happen next?
    }
  }
};
</script>

<style scoped>
</style>
