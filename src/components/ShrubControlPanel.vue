<template>
  <div>
    <div>
      <input type="range" id="hue" name="hue"
          min="0" max="100" v-model="hue">
      <label for="hue">Hue Shift</label>
    </div>
    <div>
      <input type="range" id="saturation" name="saturation"
          min="0" max="100" v-model="saturation">
      <label for="saturation">Saturation</label>
    </div>
    <div>
      <input type="range" id="brightness" name="brightness"
          min="0" max="100" v-model="brightness">
      <label for="brightness">Brightness</label>
    </div>
    <div>
      <input type="range" id="colorCloud" name="colorCloud"
          min="0" max="100" v-model="colorCloud">
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
      key: key,
      value: newValue
    });
  }, 150);
}

export default {
  name: 'ShrubControlPanel',
  props: ['shrubId'],
  data() {
    return {
      hue: 50,
      saturation: 50,
      brightness: 50,
      colorCloud: 50,
    };
  },
  watch: {
    hue: makeSettingUpdateFunction('hue'),
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
</style>
