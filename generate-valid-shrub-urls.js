const md5 = require('md5');
const config = require('./config');

// TODO: this should really come from the config file, but...
// incompatible module formats, blegh JS I should probably just fix that

let baseURL = 'http://localhost:3000';

for (var shrubId = 0; shrubId < config.numShrubs; shrubId++) {
    let correctKey = md5(shrubId + config.shrubKeySalt);
    let shrubURL = `${baseURL}/shrubs/${shrubId}?key=${correctKey}`;
    console.log(`Shrub #${shrubId}: ${shrubURL}`);
}
