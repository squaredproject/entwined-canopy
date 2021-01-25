<template>
  <div class="shrub">
    <ShrubControlPanel :shrubId="shrubId"/>
  </div>
</template>

<script>
import md5 from 'md5';
import ShrubControlPanel from '../components/ShrubControlPanel.vue';
import config from '../../config.js';

function checkURLValidity(route) {
  let shrubId = route.params.shrubId;
  let accessKey = route.query.key;

  let shrubIdInt = parseInt(shrubId, 10);
  if (isNaN(shrubIdInt)) {
    console.log(`Shrub ID ${shrubId} is not a valid number.`);
    return false;
  } else if (shrubIdInt < 0 || shrubIdInt > config.numShrubs - 1) {
    console.log(`Shrub ID ${shrubId} is not a valid shrub.`);
    return false;
  } else if (shrubIdInt.toString() != shrubId) {
    console.log(`Shrub ID ${shrubId} is not properly formatted.`);
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
