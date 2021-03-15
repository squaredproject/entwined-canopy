<template>
  <div id="app">
    <router-view v-if="sculptureState.interactivityEnabled" />
    <InteractivityDisabledScreen  v-else />
  </div>
</template>

<script>
import InteractivityDisabledScreen from './components/InteractivityDisabledScreen.vue';

export default {
  name: 'App',
  data() {
    return {
      // TODO: share these defaults with the server
      sculptureState: {
        interactivityEnabled: true,
          breakTimer: {
              runSeconds: 0,
              pauseSeconds: 0,
              state: 'run',
              nextStateChangeDate: new Date()
          }
      }
    };
  },
  sockets: {
    connect() {
      console.log('Socket connected!');
    },
    sculptureStateUpdated(newState) {
      console.log('Sculpture state updated to ', newState);
      this.sculptureState = newState;
    }
  },
  components: {
    InteractivityDisabledScreen
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 30px;
}
</style>
