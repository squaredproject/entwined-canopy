<template>
  <div>
    <h1 class="controller-title">Entwined Shrub Controller</h1>
    <div class="row setting-row">
      <div class="col">
        <label for="huePicker">Hue</label>
        <hue-slider id="huePicker" v-model="selectedColor" :swatches="[]" />
      </div>
    </div>
    <div class="row setting-row">
      <div class="col">
        <label for="saturation">Saturation</label>
        <input type="range" class="form-range" id="saturation" name="saturation"
            min="0" max="100" v-model.number="saturation">
      </div>
      <div class="col">
        <label for="brightness">Brightness</label>
        <input type="range" class="form-range" id="brightness" name="brightness"
            min="0" max="100" v-model.number="brightness">
      </div>
    </div>
    <div class="one-shot-triggers">
      <h3 class="triggerables-title">Tap to Run Special Pattern</h3>
      <button type="button" class="btn btn-outline-primary" ontouchstart="" v-on:click="runOneShotTriggerable('fire')">🔥</button>
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

.triggerables-title {
  font-size: 0.9rem;
}
.one-shot-triggers {
  margin: 50px auto;
}
.one-shot-triggers button {
  font-size: 1.3rem;
  margin: 4px;
}
.one-shot-triggers button:hover {
  background-color: inherit;
}
.one-shot-triggers button:active {
  background-color: #0d6efd;
}
.one-shot-triggers button:first-child {
  margin-left: 2px;
}
.one-shot-triggers button:last-child {
  margin-right: 2px;
}

.vc-slider {
  width: 100%;
  padding: 10px;
}
.vc-slider >>> .vc-slider-swatches {
  display: none;
}
.vc-slider >>> .vc-slider-hue-warp {
  height: 32px;
}
.vc-slider >>> .vc-hue-container {
  margin: 0 14px;
  padding-bottom: 30px;
}
.vc-slider >>> .vc-hue {
  border-radius: 16px;
}
.vc-slider >>> .vc-hue-picker {
  height: 32px;
  width: 32px;
  border-radius: 16px;
  position: relative;
  right: 10px;
  top: 1px;
}

.setting-row {
  max-width: 600px;
  margin: 0 auto 30px auto;
}

.form-range {
  padding: 25px 0;
}
.form-range::-webkit-slider-runnable-track {
  height: 32px;
}
.form-range::-moz-range-track {
  height: 32px;
} 
.form-range::-ms-track {
  height: 32px;
}
.form-range::-webkit-slider-thumb {
  position: relative;
  top: 3px;
  border-radius: 32px;
  height: 32px;
  width: 32px;
}
.form-range::-moz-range-thumb {
  height: 32px;
  width: 32px;
} 
.form-range::-ms-thumb {
  height: 32px;
  width: 32px;
}
</style>
