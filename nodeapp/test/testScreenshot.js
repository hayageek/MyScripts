var Screenshot = require('../lib/screenshot');
(async function()
{
    try {
        var sshot = new Screenshot();

        var config = 
        {
            stealth: true,
            blockAds:true,
            ignoreHTTPSErrors: true
        }
        await sshot.captureChrome('http://hayageek.com',__dirname+'/out.png',config);    
    } catch (error) {
            console.log(error);
    }
    
})();
