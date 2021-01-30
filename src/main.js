import Vue from 'vue';
import VueSocketIOExt from 'vue-socket.io-extended';
import { io } from 'socket.io-client';
import App from './App.vue';
import router from './router'
import config from '../config';

let websocketAPIURL = (process.env.NODE_ENV === 'production') ? config.prodWebSocketAPI : null;

Vue.config.productionTip = false;

Vue.use(VueSocketIOExt, io(websocketAPIURL));

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app');
