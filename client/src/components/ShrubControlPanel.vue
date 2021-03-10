<template>
  <div>
    <div>
      <input type="range" id="hueSet" name="hueSet"
          min="0" max="360" v-model.number="hueSet">
      <label for="hueSet">Hue Set</label>
    </div>
    <div>
      <input type="range" id="hueShift" name="hueShift"
          min="0" max="360" v-model.number="hueShift">
      <label for="hueShift">Hue Shift</label>
    </div>
    <div>
      <input type="range" id="saturation" name="saturation"
          min="0" max="100" v-model.number="saturation">
      <label for="saturation">Saturation</label>
    </div>
    <div>
      <input type="range" id="brightness" name="brightness"
          min="0" max="100" v-model.number="brightness">
      <label for="brightness">Brightness</label>
    </div>
    <div>
      <input type="range" id="colorCloud" name="colorCloud"
          min="0" max="100" v-model.number="colorCloud">
      <label for="colorCloud">Color Cloud</label>
    </div>
    <div class="one-shot-triggers">
      <a href="#" v-on:click="runOneShotTriggerable('lightning')">⚡️</a>
      <a href="#" v-on:click="runOneShotTriggerable('rain')">🌧</a>
      <a href="#" v-on:click="runOneShotTriggerable('bass-slam')">🚨</a>
      <a href="#" v-on:click="runOneShotTriggerable('color-burst')">🌈</a>
    </div>
    <div>
      <span>{{ $socket.connected ? 'Connected' : 'Disconnected' }}</span>
    </div>
    <div>
      <span>{{sessionTimeRemainingString}} remaining in session</span>
    </div>
    <div>
      <a href="#" v-on:click="stopControlling">Stop Controlling</a>
    </div>
  </div>
</template>

<script>
// TODO: break this file into a bunch of smaller components
import _ from 'underscore';

let makeSettingUpdateFunction = function(key) {
  return _.throttle(function(newValue) {
    this.$socket.client.emit('updateShrubSetting', {
      shrubId: this.shrubId,
      [key]: newValue
    });
  }, 150);
}

export default {
  name: 'ShrubControlPanel',
  props: ['shrubId', 'sessionExpiryDate'],
  data() {
    return {
      hueShift: 0,
      hueSet: 0,
      saturation: 50,
      brightness: 50,
      colorCloud: 50,

      nowTimestamp: Date.now(),
      nowInterval: null,
    };
  },
  created() {
    var self = this;

    // this is basically a crappy kluge to make sessionTimeRemainingString update regularly
    this.nowInterval = setInterval(function () {
        self.nowTimestamp = Date.now();
    }, 250);
  },
  computed: {
    sessionTimeRemainingString: function() {
      if (!this.sessionExpiryDate) {
        return '00:00';
      }

      let timeRemaining = Math.max(this.sessionExpiryDate.getTime() - this.nowTimestamp, 0);
      return new Date(timeRemaining).toISOString().substr(14, 5);
    }
  },
  watch: {
    hueShift: makeSettingUpdateFunction('hueShift'),
    hueSet: makeSettingUpdateFunction('hueSet'),
    saturation: makeSettingUpdateFunction('saturation'),
    brightness: makeSettingUpdateFunction('brightness'),
    colorCloud: makeSettingUpdateFunction('colorCloud'),
  },
  methods: {
    runOneShotTriggerable: function(triggerableName) {
      this.$socket.client.emit('runOneShotTriggerable', {
        shrubId: this.shrubId,
        triggerableName: triggerableName
      });
    },
    stopControlling: function() {
      this.$socket.client.emit('deactivateSession', this.shrubId);
      // TODO: should this happen now, or only after the server confirms?
      this.$router.push('/');
    }
  },
};
</script>

<style scoped>
.one-shot-triggers {
  margin: 10px;
}
.one-shot-triggers a {
  font-size: 34px;
  text-decoration: none;
  margin: 10px;
}
</style>
