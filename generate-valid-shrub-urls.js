const md5 = require('md5');
const config = require('./config/config');
const shrubConfigs = require('./config/entwinedShrubs');

let baseURL = 'https://entwined.charliestigler.com';

shrubConfigs.forEach(function(shrubConfig) {
    let shrubId = shrubConfig.id;
    let correctKey = md5(shrubId + config.shrubKeySalt);
    let shrubURL = `${baseURL}/shrubs/${shrubId}?key=${correctKey}`;
    console.log(`Shrub #${shrubId}: ${shrubURL}`);
});
