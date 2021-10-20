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
  watch: {
    lxConnected: function(lxIsConnected) {
      // if LX is connected, nothing to do here
      if (lxIsConnected) return;

      // if not and we're in scheduled downtime hours, reroute to the full error page
      // (no need to keep them connected since it's not coming back up in the near future)
      // No downtime at EDC! 24/7 baby
      // let curDate = new Date();
      // let dateHours = curDate.getHours();
      // let dateMinutes = curDate.getMinutes();

      // let afterDowntimeStart = (dateHours > 21 ||
      //                           (dateHours === 21 && dateMinutes >= 28));
      // let beforeDowntimeEnd = (dateHours < 10 ||
      //                       (dateHours === 10 && dateMinutes <= 32));
      // if (afterDowntimeStart || beforeDowntimeEnd) {
      //     this.$router.push('/error/tooLate');
      // }
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
      let dateHours = new Date().getHours();

      // if it's after 8am and before 5pm, it's too bright for them to see anything on the shrub, so shut them out
      // no need to even load the rest of the page and connect a session in this case
      if (dateHours >= 8 && dateHours < 17) {
        next('/error/tooBright');
        return;
      }

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
