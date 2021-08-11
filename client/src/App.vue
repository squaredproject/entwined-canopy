<template>
  <div id="app">
    <router-view />
    <!-- <InteractivityDisabledScreen /> -->
  </div>
</template>

<script>
// import InteractivityDisabledScreen from './components/InteractivityDisabledScreen.vue';

export default {
  name: 'App',
  sockets: {
    connect() {
      console.log('Socket connected!');
    }
  },
  components: {
    // InteractivityDisabledScreen
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
