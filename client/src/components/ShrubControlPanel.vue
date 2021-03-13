<template>
  <div>
    <h1 class="controller-title">Entwined Shrub Controller</h1>
    <div class="row setting-row">
      <div class="col">
        <hue-slider id="huePicker" v-model="selectedColor" :swatches="[]" />
        <label for="huePicker">Hue</label>
      </div>
    </div>
    <div class="row setting-row">
      <div class="col">
        <input type="range" class="form-range" id="saturation" name="saturation"
            min="0" max="100" v-model.number="saturation">
        <label for="saturation">Saturation</label>
      </div>
      <div class="col">
        <input type="range" class="form-range" id="brightness" name="brightness"
            min="0" max="100" v-model.number="brightness">
        <label for="brightness">Brightness</label>
      </div>
    </div>
    <div class="one-shot-triggers">
      <a href="#" v-on:click="runOneShotTriggerable('lightning')">⚡️</a>
      <a href="#" v-on:click="runOneShotTriggerable('rain')">🌧</a>
      <a href="#" v-on:click="runOneShotTriggerable('bass-slam')">🚨</a>
      <a href="#" v-on:click="runOneShotTriggerable('color-burst')">🌈</a>
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
import { Slider as HueSlider } from 'vue-color';

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
      saturation: 50,
      brightness: 50,
      colorCloud: 50,

      selectedColor: {
        hsl: {
          h: 0,
          s: 1,
          l: 1
        }
      },

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
    },
    hueSet: function() {
      return this.selectedColor.hsl.h;
    }
  },
  watch: {
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
  components: {
    'hue-slider': HueSlider
  }
};
</script>

<style scoped>
.controller-title {
  font-size: 18px;
  margin-bottom: 40px;
}

.one-shot-triggers {
  margin: 50px auto;
}
.one-shot-triggers a {
  font-size: 34px;
  text-decoration: none;
  margin: 10px;
}
.one-shot-triggers a:first-child {
  margin-left: 2px;
}
.one-shot-triggers a:last-child {
  margin-right: 2px;
}

.vc-slider {
  width: 100%;
  padding: 15px;
}
.vc-slider >>> .vc-slider-swatches {
  display: none;
}

.setting-row {
  max-width: 600px;
  margin: 0 auto 20px auto;
}
.setting-row label {
  margin-top: -20px;
}
.form-range {
  padding: 20px 0;
}
.vc-slider >>> .vc-hue-container {
  padding-bottom: 30px;
}
</style>
