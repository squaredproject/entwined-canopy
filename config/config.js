module.exports = {
    sculptureKeySalt: '5D805F8816BBB020DC9C43FA4E74173B5C8C910E44A4E2F78DE5FD59CC7B11F1',

    // TODO: should these go in a .env file instead?
    staticSiteURLDev: 'http://localhost:8080',
    staticSiteURLProd: 'https://entwined.charliestigler.com',

    nightlyDowntimeStart: {
        hours: 21,
        minutes: 30
    },
    nightlyDowntimeEnd: {
        hours: 10,
        minutes: 30
    }
};
