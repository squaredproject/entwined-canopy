import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Piece from '../views/Piece.vue'
import ErrorScreen from '../views/ErrorScreen.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/error/:errorKey',
    name: 'ErrorScreen',
    component: ErrorScreen,
    props: route => ({
      errorKey: route.params.errorKey
    })
  },
  {
    path: '/:installationId/:pieceId',
    name: 'Piece',
    component: Piece,
    props: route => ({
      installationId: route.params.installationId,
      pieceId: route.params.pieceId,
      accessKey: route.query.key
    })
  },
  {
    // path: '/',
    path: '*',
    name: 'Home',
    component: Home
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
