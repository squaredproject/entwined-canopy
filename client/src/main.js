import Vue from 'vue';
import VueSocketIOExt from 'vue-socket.io-extended';
import { io } from 'socket.io-client';
import App from './App.vue';
import router from './router'
import { uid } from 'uid';

let userIO = io(process.env.VUE_APP_SOCKET_API_URL, {
  withCredentials: true,
  auth: (cb) => {
    cb({
      sessionId: sessionId
    });
  },
  timeout: 10000 // 10 seconds
});

Vue.config.productionTip = false;

// TODO: is a cookie more reliable than localStorage?
let sessionId = localStorage.getItem('entwined-canopy-session-id');
if (!sessionId) {
  sessionId = uid(24);
  localStorage.setItem('entwined-canopy-session-id', sessionId);
}
Vue.use(VueSocketIOExt, userIO);

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app');
