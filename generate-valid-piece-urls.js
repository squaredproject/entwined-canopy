const md5 = require('md5');
const config = require('./config/config');
const installations = require('./config/entwinedInstallations');

let baseURL = 'https://entwined.charliestigler.com';
Object.keys(installations).forEach(function(installationId) {
    installations[installationId].pieces.forEach(function(piece) {
        let pieceId = piece.id;
        let correctKey = md5(installationId + pieceId + config.sculptureKeySalt);
        let pieceURL = `${baseURL}/${installationId}/${pieceId}?key=${correctKey}`;
        console.log(`Piece #${pieceId} in ${installationId}: ${pieceURL}`);    
    })
});
