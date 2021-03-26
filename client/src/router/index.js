import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Shrub from '../views/Shrub.vue'
import ErrorScreen from '../views/ErrorScreen.vue'

Vue.use(VueRouter)

const routes = [
  {
    // path: '/',
    path: '*',
    name: 'Home',
    component: Home
  },
  {
    path: '/shrubs/:shrubId',
    name: 'Shrub',
    component: Shrub,
    props: route => ({
      shrubId: route.params.shrubId,
      accessKey: route.query.key
    })
  },
  {
    path: '/error/:errorKey',
    name: 'ErrorScreen',
    component: ErrorScreen,
    props: route => ({
      errorKey: route.params.errorKey
    })
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
