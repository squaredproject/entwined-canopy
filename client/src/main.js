import Vue from 'vue';
import VueSocketIOExt from 'vue-socket.io-extended';
import { io } from 'socket.io-client';
import posthog from 'posthog-js';
import App from './App.vue';
import router from './router'
import { uid } from 'uid';

Vue.config.productionTip = false;

// Get or create session ID
let sessionId = localStorage.getItem('entwined-canopy-session-id');
if (!sessionId) {
  sessionId = uid(24);
  localStorage.setItem('entwined-canopy-session-id', sessionId);
}

// Initialize PostHog
const posthogKey = process.env.VUE_APP_POSTHOG_KEY || 'phc_Vlo5F0WYJmgCREUUna1TQQ1ZAieDDFyHZZ9lIXcVkMU';
console.log('PostHog init with key:', posthogKey);
try {
  posthog.init(posthogKey, {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: true,
    persistence: 'localStorage',
    loaded: (ph) => {
      console.log('PostHog loaded successfully', ph);
    }
  });
  // Identify user with our session ID for cross-reference with server logs
  posthog.identify(sessionId);
  console.log('PostHog identified user:', sessionId);
  Vue.prototype.$posthog = posthog;
} catch (e) {
  console.error('PostHog init error:', e);
  Vue.prototype.$posthog = { capture: () => {}, identify: () => {} };
}

let userIO = io(process.env.VUE_APP_SOCKET_API_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    cb({
      sessionId: sessionId
    });
  },
  timeout: 10000 // 10 seconds
});

Vue.use(VueSocketIOExt, userIO);

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app');
