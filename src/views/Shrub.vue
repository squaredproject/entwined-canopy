<template>
  <div class="shrub">
    <ShrubControlPanel :shrubId="shrubId" v-if="state === 'active'"/>
    <ShrubWaitingScreen :shrubId="shrubId" :state="state" :estimatedWaitTime="estimatedWaitTime" v-if="state === 'waiting' || state === 'offered'"/>
    <p v-if="state === 'loading'">Loading shrub interactivity...</p>
  </div>
</template>

<script>
import md5 from 'md5';
import ShrubControlPanel from '../components/ShrubControlPanel.vue';
import ShrubWaitingScreen from '../components/ShrubWaitingScreen.vue';
import config from '../../config.js';
const validShrubIDs = require('../../entwinedShrubs').map(function(shrubConfig) { return String(shrubConfig.id); });
function checkURLValidity(route) {
  let shrubId = route.params.shrubId;
  let accessKey = route.query.key;

  if (!validShrubIDs.includes(shrubId)) {
    console.log(`Shrub ID ${shrubId} is not a valid shrub.`);
    return false;
  }

  let correctKey = md5(shrubId + config.shrubKeySalt);
  if (correctKey !== accessKey) {
    console.log(`Access key ${accessKey} is incorrect.`);
    return false;
  }

  return true;
}

export default {
  name: 'Shrub',
  props: ['shrubId', 'accessKey'],
  data() {
    return {
      state: 'loading',
      estimatedWaitTime: 0,
    };
  },
  sockets: {
    connect() {
      console.log('Shrub.vue socket connected');
    },
    sessionActivated(shrubId) {
      if (shrubId !== this.shrubId) return;

      this.state = 'active';
      console.log('Shrub.vue session activated');
    },
    sessionWaiting(data) {
      if (data.shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${data.shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      this.estimatedWaitTime = data.estimatedWaitTime;
      console.log('Shrub.vue session waiting, est wait ' + this.estimatedWaitTime);
    },
    sessionOffered(shrubId) {
      if (shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${data.shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'offered';
      console.log('Shrub.vue session offered');
    },
    sessionOfferRevoked(shrubId) {
      if (shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${data.shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      console.log('Shrub.vue session offer revoked');
    },
  },
  beforeRouteEnter(to, from, next) {
    if (!checkURLValidity(to)) {
      next('/');
    } else {
      next();
    }
  },
  beforeMount() {
    this.$socket.client.emit('activateSession', this.shrubId);
  },
  components: {
    ShrubControlPanel,
    ShrubWaitingScreen,
  },
};
</script>
