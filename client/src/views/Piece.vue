<template>
  <div class="piece">
    <PieceErrorScreen :errorKey="errorKey" v-if="errorKey"/>
    <PieceControlPanel :installationId="installationId" :pieceId="pieceId" :pieceConfig="pieceConfig" :sessionExpiryDate="sessionExpiryDate" v-else-if="state === 'active'"/>
    <PieceWaitingScreen :estimatedWaitTime="estimatedWaitTime" v-else-if="state === 'waiting'"/>
    <PieceOfferScreen :installationId="installationId" :pieceId="pieceId" :offerExpiryDate="offerExpiryDate" v-else-if="state === 'offered'"/>
    <p v-else-if="state === 'loading'">Loading piece interactivity...</p>
  </div>
</template>

<script>
import md5 from 'md5';
import PieceControlPanel from '../components/PieceControlPanel.vue';
import PieceWaitingScreen from '../components/PieceWaitingScreen.vue';
import PieceOfferScreen from '../components/PieceOfferScreen.vue';
import PieceErrorScreen from '../components/PieceErrorScreen.vue';
import config from '../../config/config';

const installations = require('../../config/entwinedInstallations');
const pieceIdIsValid = function(installationId, pieceId) {
  // first, the installation has to exist
  if (!installations[installationId]) {
    return false;
  }

  const validPieceIDs = installations[installationId].pieces.map(function(pieceConfig) { return String(pieceConfig.id); });
  return validPieceIDs.includes(pieceId);
};

function checkURLValidity(route) {
  let installationId = route.params.installationId;
  let pieceId = route.params.pieceId;
  let accessKey = route.query.key;

  if (!pieceIdIsValid(installationId, pieceId)) {
    console.log(`Piece ID ${pieceId} is not a valid piece.`);
    return false;
  }

  // we normally check for keys, but for legacy reasons, we don't do this on the "shrubs"
  // installation (which is the Scottsdale installation using legacy QR codes with different keys)
  let correctKey = md5(installationId + pieceId + config.sculptureKeySalt);
  if (correctKey !== accessKey && installationId !== 'shrubs') {
    console.log(`Access key ${accessKey} is incorrect.`);
    return false;
  }

  return true;
}

export default {
  name: 'Piece',
  props: ['installationId', 'pieceId', 'accessKey'],
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
    },
    pieceConfig: function() {
      if (this.pieceId == null || this.pieceId == undefined) return null;

      return installations[this.installationId || 'shrubs'].pieces.find((pieceConfig) => { return String(pieceConfig.id) === String(this.pieceId); });
    }
  },
  watch: {
    lxConnected: function(lxIsConnected) {
      // if LX is connected, nothing to do here
      if (lxIsConnected) return;

      // if not and we're in scheduled downtime hours, reroute to the full error page
      // (no need to keep them connected since it's not coming back up in the near future)
      let curDate = new Date();
      let dateHours = curDate.getHours();
      let dateMinutes = curDate.getMinutes();

      let installation = installations[this.installationId];
      if (installation.nightlyDowntime) {
        let startTime = installation.nightlyDowntime.start;
        let endTime = installation.nightlyDowntime.end;

        let afterDowntimeStart = (dateHours > startTime.hours ||
                                  (dateHours === startTime.hours && dateMinutes >= (startTime.minutes - 2)));
        let beforeDowntimeEnd = (dateHours < endTime.hours ||
                              (dateHours === endTime.hours && dateMinutes <= (endTime.minutes + 2)));
        if (afterDowntimeStart || beforeDowntimeEnd) {
            this.$router.push('/error/tooLate');
        }
      }
    }
  },
  sockets: {
    connect() {
      console.log('Socket connected to piece');

      // if this is a reconnection, reset state accordingly
      if (this.state === 'disconnected') {
        this.state = 'loading';
      }

      this.$socket.client.emit('activateSession', this.installationId, this.pieceId);
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
      if (data.installationId !== this.installationId || data.pieceId !== this.pieceId) {
        console.log(`Unexpected event for piece ${data.pieceId} (piece ${this.pieceId} is loaded).`);
        return;
      }

      this.state = 'active';
      this.sessionExpiryDate = new Date(data.expiryDate);
      console.log('Session activated for piece ' + this.pieceId);

      this.$posthog.capture('session_activated', {
        installation_id: this.installationId,
        piece_id: this.pieceId
      });
    },
    sessionDeactivated(data) {
      if (data.installationId !== this.installationId || data.pieceId !== this.pieceId) {
        console.log(`Unexpected event for piece ${data.pieceId} (piece ${this.pieceId} is loaded).`);
        return;
      }

      this.state = 'loading';
      this.$router.push('/');
      console.log('Session deactivated for piece ' + this.pieceId);

      this.$posthog.capture('session_deactivated', {
        installation_id: this.installationId,
        piece_id: this.pieceId
      });
    },
    sessionWaiting(data) {
      if (data.installationId !== this.installationId || data.pieceId !== this.pieceId) {
        console.log(`Unexpected event for piece ${data.pieceId} (piece ${this.pieceId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      this.estimatedWaitTime = data.estimatedWaitTime;
      console.log('Piece.vue session waiting, est wait ' + this.estimatedWaitTime);
    },
    sessionOffered(data) {
      if (data.installationId !== this.installationId || data.pieceId !== this.pieceId) {
        console.log(`Unexpected event for piece ${data.pieceId} (piece ${this.pieceId} is loaded).`);
        return;
      }

      this.state = 'offered';
      this.offerExpiryDate = new Date(data.offerExpiryDate);

      console.log('Session offered for piece ' + this.pieceId);
    },
    sessionOfferRevoked(data) {
      if (data.installationId !== this.installationId || data.pieceId !== this.pieceId) {
        console.log(`Unexpected event for piece ${data.pieceId} (piece ${this.pieceId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      console.log('Session offer revoked for piece ' + this.pieceId);
    },
    waitTimeUpdated(data) {
      if (data.installationId !== this.installationId || data.pieceId !== this.pieceId) {
        console.log(`Unexpected event for piece ${data.pieceId} (piece ${this.pieceId} is loaded).`);
        return;
      }

      this.state = 'waiting';
      this.estimatedWaitTime = data.estimatedWaitTime;
      console.log('Wait time updated to ' + this.estimatedWaitTime + ' for piece ' + this.pieceId);
    }
  },
  mounted() {
    this.$socket.client.connect();

    this.$posthog.capture('piece_viewed', {
      installation_id: this.installationId,
      piece_id: this.pieceId
    });
  },
  beforeDestroy() {
    this.$socket.client.disconnect();
  },
  beforeRouteEnter(to, from, next) {
    if (!checkURLValidity(to)) {
      next('/');
    } else {
      let dateHours = new Date().getHours();

      let tooBrightHours = installations[to.params.installationId].tooBrightHours;

      // if it's too bright for them to see anything on the piece, shut them out
      // no need to even load the rest of the page and connect a session in this case
      if (tooBrightHours && dateHours >= tooBrightHours.start && dateHours < tooBrightHours.end) {
        next('/error/tooBright');
        return;
      }

      next();
    }
  },
  components: {
    PieceControlPanel,
    PieceWaitingScreen,
    PieceOfferScreen,
    PieceErrorScreen
  },
};
</script>
