<template>
  <div id="app">
    <ShrubControlPanel msg="Welcome to Your Vue.js + TypeScript App"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ShrubControlPanel from './components/ShrubControlPanel.vue';

export default {
  name: 'App',
  components: {
    ShrubControlPanel,
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
  margin-top: 60px;
}
</style>
