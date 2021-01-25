import Vue from 'vue';
import VueSocketIOExt from 'vue-socket.io-extended';
import { io } from 'socket.io-client';
import App from './App.vue';
import router from './router'

Vue.config.productionTip = false;

Vue.use(VueSocketIOExt, io());

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app');
