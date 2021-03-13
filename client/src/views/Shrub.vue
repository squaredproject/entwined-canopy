<template>
  <div class="shrub">
    <ShrubErrorScreen :shrubId="shrubId" :errorKey="errorKey" v-if="errorKey"/>
    <ShrubControlPanel :shrubId="shrubId" :sessionExpiryDate="sessionExpiryDate" v-else-if="state === 'active'"/>
    <ShrubWaitingScreen :shrubId="shrubId" :estimatedWaitTime="estimatedWaitTime" v-else-if="state === 'waiting'"/>
    <ShrubOfferScreen :shrubId="shrubId" :offerExpiryDate="offerExpiryDate" v-else-if="state === 'offered'"/>
    <p v-else-if="state === 'loading'">Loading shrub interactivity...</p>
  </div>
</template>

<script>
import md5 from 'md5';
import ShrubControlPanel from '../components/ShrubControlPanel.vue';
import ShrubWaitingScreen from '../components/ShrubWaitingScreen.vue';
import ShrubOfferScreen from '../components/ShrubOfferScreen.vue';
import ShrubErrorScreen from '../components/ShrubErrorScreen.vue';
import config from '../../config/config';

const validShrubIDs = require('../../config/entwinedShrubs').map(function(shrubConfig) { return String(shrubConfig.id); });
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
      offerExpiryDate: null,
      sessionExpiryDate: null,
      lxConnected: true
    };
  },
  computed: {
    errorKey: function() {
      if (!this.$socket.connected && this.state !== 'loading') {
        return 'canopyUnreachable';
      }

      if (!this.lxConnected) {
        return 'lxUnreachable';
      }

      return null;
    }
  },
  sockets: {
    connect() {
      console.log('Shrub.vue socket connected');

      // if this is a reconnection, reset state accordingly
      if (this.state === 'disconnected') {
        this.state = 'loading';
      }

      this.$socket.client.emit('activateSession', this.shrubId);
    },
    connect_error(err) {
      console.log('Shrub.vue socket connect error: ', err);
      this.state = 'disconnected';
    },
    disconnect(disconnectReason) {
      console.log(`Shrub.vue socket disconnected with reason ${disconnectReason}`);
      this.state = 'disconnected';
    },
    lxConnected() {
      this.lxConnected = true;
    },
    lxDisconnected() {
      this.lxConnected = false;
    },

    sessionActivated(data) {
      if (data.shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${data.shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'active';
      this.sessionExpiryDate = new Date(data.expiryDate);
      console.log('Shrub.vue session activated');
    },
    sessionDeactivated(shrubId) {
      if (shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'loading';
      this.$router.push('/');
      console.log('Shrub.vue session deactivated');
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
    sessionOffered(data) {
      if (data.shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${data.shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'offered';
      this.offerExpiryDate = new Date(data.offerExpiryDate);

      console.log('Shrub.vue session offered');
    },
    sessionOfferRevoked(shrubId) {
      if (shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      console.log('Shrub.vue session offer revoked');
    },
    waitTimeUpdated(data) {
      if (data.shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${data.shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      this.estimatedWaitTime = data.estimatedWaitTime;
      console.log('Shrub.vue wait time updated to ' + this.estimatedWaitTime);
    }
  },
  beforeRouteEnter(to, from, next) {
    if (!checkURLValidity(to)) {
      next('/');
    } else {
      next();
    }
  },
  components: {
    ShrubControlPanel,
    ShrubWaitingScreen,
    ShrubOfferScreen,
    ShrubErrorScreen
  },
};
</script>
