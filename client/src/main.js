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

// Initialize PostHog (only if API key is configured)
if (process.env.VUE_APP_POSTHOG_KEY) {
  posthog.init(process.env.VUE_APP_POSTHOG_KEY, {
    api_host: process.env.VUE_APP_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: true,
    persistence: 'localStorage'
  });
  // Identify user with our session ID for cross-reference with server logs
  posthog.identify(sessionId);
  Vue.prototype.$posthog = posthog;
} else {
  // Provide a no-op stub so code doesn't break
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
