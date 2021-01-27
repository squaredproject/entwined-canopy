<template>
  <div class="shrub">
    <ShrubControlPanel :shrubId="shrubId"/>
  </div>
</template>

<script>
import md5 from 'md5';
import ShrubControlPanel from '../components/ShrubControlPanel.vue';
import config from '../../config.js';
const validShrubIDs = require('../../entwinedShrubs').map(function(shrubConfig) { return String(shrubConfig.id); });
function checkURLValidity(route) {
  let shrubId = route.params.shrubId;
  let accessKey = route.query.key;

  if (!validShrubIDs.includes(shrubId)) {
    console.log(`Shrub ID ${shrubId} is not a valid shrub.`);
    return false;
  }

  let correctKey = md5(shrubId + config.shrubKeySalt);
  if (correctKey != accessKey) {
    console.log(`Access key ${accessKey} is incorrect.`);
    return false;
  }

  return true;
}

export default {
  name: 'Shrub',
  props: ['shrubId', 'accessKey'],
  beforeRouteEnter(to, from, next) {
    if (checkURLValidity(to)) {
      next();
    } else {
      next('/');
    }
  },
  components: {
    ShrubControlPanel,
  },
};
</script>
