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
      let curDate = new Date();
      let dateHours = curDate.getHours();
      let dateMinutes = curDate.getMinutes();

      // if it's after 8am and before 6pm, it's too bright for them to see anything on the shrub, so shut them out
      if (dateHours > 8 && dateHours < 18) {
        return 'tooBright'
      }

      if (!this.$socket.connected && this.state !== 'loading') {
        return 'canopyUnreachable';
      }

      if (!this.lxConnected) {
        // if it's after 9:30pm or before 6am, the LX disconnection is because Entwined shut off for the night
        let beforeDowntimeStart = (dateHours < 9 ||
                                  (dateHours === 9 && dateMinutes < 29));
        let afterDowntimeEnd = (dateHours > 6 ||
                              (dateHours === 6 && dateMinutes > 1));

        if (beforeDowntimeStart && afterDowntimeEnd) {
            // we're not in the scheduled downtime, so it's a normal unreachable error
            return 'lxUnreachable';
        } else {
            // we're in the scheduled downtime, so show a pretty error message
            return 'tooLate';
        }
      }

      return null;
    }
  },
  sockets: {
    connect() {
      console.log('Socket connected to shrub');

      // if this is a reconnection, reset state accordingly
      if (this.state === 'disconnected') {
        this.state = 'loading';
      }

      this.$socket.client.emit('activateSession', this.shrubId);
    },
    connect_error(err) {
      console.log('Socket connect error: ', err);
      this.state = 'disconnected';
    },
    disconnect(disconnectReason) {
      console.log(`Socket disconnected with reason ${disconnectReason}`);
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
      console.log('Session activated for shrub ' + this.shrubId);
    },
    sessionDeactivated(shrubId) {
      if (shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'loading';
      this.$router.push('/');
      console.log('Session deactivated for shrub ' + this.shrubId);
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

      console.log('Session offered for shrub ' + this.shrubId);
    },
    sessionOfferRevoked(shrubId) {
      if (shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      console.log('Session offer revoked for shrub ' + this.shrubId);
    },
    waitTimeUpdated(data) {
      if (data.shrubId !== this.shrubId) {
        console.log(`Unexpected event for shrub ${data.shrubId} (shrub ${this.shrubId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      this.estimatedWaitTime = data.estimatedWaitTime;
      console.log('Wait time updated to ' + this.estimatedWaitTime + ' for shrub ' + this.shrubId);
    }
  },
  mounted() {
    this.$socket.client.connect();
  },
  beforeDestroy() {
    this.$socket.client.disconnect();
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
