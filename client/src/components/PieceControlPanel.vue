<template>
  <div>
    <h1 class="controller-title">Entwined Controller</h1>
    <h2 class="still-there-message" v-if="inactivityDeadline">Still there? Your session will end if you don't use the controls in the next {{inactivitySecondsRemaining}} seconds.</h2>
    <div class="row setting-row">
      <div class="col">
        <button type="button" class="mic-button mic-button-start" v-on:click="startAudioControl()" v-if="audioControlAvailable && !audioControlEnabled" aria-label="Start Microphone Control"></button>
        <button type="button" class="mic-button mic-button-stop" v-on:click="stopAudioControl()" v-if="audioControlAvailable && audioControlEnabled" aria-label="Stop Microphone Control"></button>
        <p class="sing-instructions" v-if="audioControlEnabled">Sing into your microphone to make the magic happen!</p>
        <p class="audio-error" v-if="audioControlError">Something went wrong accessing your microphone.</p>
      </div>
    </div>
    <span class="main-settings" v-if="!audioControlEnabled">
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
    </span>
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
// import { Sound } from "pts"
import Meyda from 'meyda';

let makeSettingUpdateFunction = function(key) {
  return _.throttle(function(newValue) {
    this.$socket.client.emit('updatePieceSetting', {
      installationId: this.installationId,
      pieceId: this.pieceId,
      [key]: newValue
    });

    delete this.$data.inactivityDeadline;
  }, 150);
}

export default {
  name: 'PieceControlPanel',
  props: ['installationId', 'pieceId', 'sessionExpiryDate'],
  data() {
    return {
      saturation: 50,
      brightness: 50,

      selectedColor: {
        hsl: {
          h: 0,
          s: 1,
          l: 1
        }
      },

      audioControlEnabled: false,
      audioControlAvailable: !!navigator.mediaDevices.getUserMedia,
      audioControlError: null,
      audioStream: null,
      audioAnalyzer: null,
      audioContext: null,
      lastAudioInputTimestamp: Date.now(),

      nowTimestamp: Date.now(),
      nowInterval: null,

      inactivityDeadline: null
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
    inactivitySecondsRemaining: function() {
      if (!this.inactivityDeadline) {
        return '0';
      }

      let secondsRemaining = Math.max(this.inactivityDeadline - this.nowTimestamp, 0) / 1000;
      return Math.round(secondsRemaining);
    },
    hueSet: function() {
      return this.selectedColor.hsl.h;
    }
  },
  watch: {
    hueSet: makeSettingUpdateFunction('hueSet'),
    saturation: makeSettingUpdateFunction('saturation'),
    brightness: makeSettingUpdateFunction('brightness'),
  },
  methods: {
    runOneShotTriggerable: function(triggerableName) {
      delete this.$data.inactivityDeadline;
      this.$socket.client.emit('runOneShotTriggerable', {
        installationId: this.installationId,
        pieceId: this.pieceId,
        triggerableName: triggerableName
      });
    },
    resetPieceSettings: function() {
      this.saturation = 50;
      this.brightness = 50;
      this.selectedColor = {
        hsl: {
          h: 0,
          s: 1,
          l: 1
        }
      };

      this.$socket.client.emit('resetPieceSettings', {
        installationId: this.installationId,
        pieceId: this.pieceId
      });
    },
    stopControlling: function() {
      delete this.$data.inactivityDeadline;
      this.$socket.client.emit('deactivateSession', this.installationId, this.pieceId);
      // TODO: should this happen now, or only after the server confirms?
      this.$router.push('/');
    },
    startAudioControl: function() {
      let updateHue = makeSettingUpdateFunction('hueSet').bind(this);
      let updateBrightness = makeSettingUpdateFunction('brightness').bind(this);

      // clamp the max reasonable RMS (volume)
      const MAX_RMS = 0.16;

      // below this level of RMS (volume), assume the user has given up on controlling with their voice
      const RMS_CONTROL_THRESHOLD = 0.01;

      // after 5 seconds, stop audio control
      const AUDIO_CONTROL_TIMEOUT_MS = 5000;

      const handleSuccess = (stream) => {
        this.audioControlEnabled = true;
        this.audioControlError = null;
        this.lastAudioInputTimestamp = Date.now();

        this.audioStream = stream;
        this.audioContext = new AudioContext();
        const source = this.audioContext.createMediaStreamSource(stream);

        this.audioAnalyzer = Meyda.createMeydaAnalyzer({
          audioContext: this.audioContext,
          source: source,
          bufferSize: 8192, // sample ~5 times per second
          featureExtractors: ["rms", "chroma"],
          callback: (features) => {
            if (features.rms < RMS_CONTROL_THRESHOLD) {
              // if they're inactive (i.e. not putting in real audio input) for a bit, end the mic control
              if (Date.now() - this.lastAudioInputTimestamp > AUDIO_CONTROL_TIMEOUT_MS) {
                console.log('Audio inactive for 3 seconds, stopping!');
                this.stopAudioControl();
              }

              return;
            }

            this.lastAudioInputTimestamp = Date.now();

            let brightnessProp = Math.max(Math.min(features.rms / MAX_RMS, 1), 0.05);
            updateBrightness(brightnessProp * 100.0);

            // control hue based on chroma (i.e. which note is best-represented)
            let chroma = features.chroma;

            let topChromaIndex = 0;
            let topChromaStrength = 0;
            let targetHue = 0;
            chroma.forEach(function(strength, index) {
              if (strength > topChromaStrength) {
                topChromaIndex = index;
                topChromaStrength = strength;
              }
            });
            targetHue = topChromaIndex * 30;

            let prevChromaIndex = (topChromaIndex === 0) ? (chroma.length - 1) : (topChromaIndex - 1);
            let nextChromaIndex = (topChromaIndex === (chroma.length - 1)) ? 0 : (topChromaIndex + 1);
            if (chroma[prevChromaIndex] > chroma[nextChromaIndex]) {
              // previous chroma in sequence is stronger than the following chroma
              let prevChromaStrengthRatio = chroma[prevChromaIndex] / topChromaStrength;
              // if we were at at zero, adjusting "down" really means coming back around the circle from 360
              if (targetHue === 0) targetHue = 360;
              targetHue -= (prevChromaStrengthRatio * 30);
              console.log(`Adjusting target hue ${targetHue} down by ${(prevChromaStrengthRatio * 30)}`);
            } else {
              // vice versa
              let nextChromaStrengthRatio = chroma[nextChromaIndex] / topChromaStrength;
              targetHue += (nextChromaStrengthRatio * 30);
              console.log(`Adjusting target hue ${targetHue} up by ${(nextChromaStrengthRatio * 30)}`);
            }
            updateHue(targetHue);

            console.log(`Microphone setting hue to ${targetHue} and brightness to ${brightnessProp * 100.0}`);
          },
        });
        this.audioAnalyzer.start();
      };
  
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(handleSuccess)
          .catch(err => {
            console.log('Error starting microphone input: ', err);
            this.audioControlError = err;
          });
    },
    stopAudioControl: function() {
      this.audioControlEnabled = false;

      if (this.audioAnalyzer) {
        this.audioAnalyzer.stop();
      }
      this.audioAnalyzer = null;

      if (this.audioContext) {
        this.audioContext.close();
      }
      this.audioContext = null;

      if (this.audioStream) {
        this.audioStream.getTracks().forEach(function(track) {
          track.stop();
        });
      }
      this.audioStream = null;

      // this line won't work until LX is updated to allow resetting piece settings via API
      this.resetPieceSettings();
    }
  },
  sockets: {
    inactivityWarning(data) {
      if (data.installationId !== this.installationId || data.pieceId !== this.pieceId) {
        console.log(`Unexpected event for piece ${data.pieceId} (piece ${this.pieceId} is loaded).`);
        return;
      }

      this.inactivityDeadline = data.deadline;
      console.log('Inactivity deadline updated to ' + this.inactivityDeadline + ' for piece ' + this.pieceId);
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
.still-there-message {
  font-size: 1rem;
  margin-bottom: 24px;
  color: #c50000;
}
.sing-instructions, .audio-error {
  margin-top: 15px;
}

.mic-button {
  width: 75px;
  height: 75px;
  border-radius: 50px;
  border: 2px solid #000;
  background: url(/images/mic-icon.png) no-repeat scroll 0 0 #eff0ff;
  background-size: 70%;
  padding: 20px;
  background-position: center center;
}
.mic-button-start {
  
}
.mic-button-stop {
  background-color: #ff0000;
  animation: pulse 4s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    background-color: rgba(215, 30, 30, 0.1);
  }
  50% {
    background-color: rgba(215, 30, 30, 1.0);
  }
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
