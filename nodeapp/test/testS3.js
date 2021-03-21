process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
var DoSpace = require('../lib/dospaces');
(async function () {

    var space = new DoSpace();

    await space.upload(__dirname + '/image.png', '1.png');
})();