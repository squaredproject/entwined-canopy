import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Shrub from '../views/Shrub.vue'

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
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
