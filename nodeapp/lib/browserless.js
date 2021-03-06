const puppeteer = require('puppeteer-extra');
var fs = require('fs');
class Browserless {
    async capture(url, savePath, config) {

        var config = config || {};
        config.width = config.width || 1024;
        config.height = config.height || 768;
        config.timeout = config.timeout || 30000
        var endpointUrl = `ws://127.0.0.1:3000?token=${process.env.HTTP_API_PROXY_KEY}&blockAds=${config.blockAds}&stealth=${config.stealth}&ignoreHTTPSErrors=${config.ignoreHTTPSErrors}&--window-size=${config.width},${config.height}&timeout=${config.timeout}`;
        const browser = await puppeteer.connect({
            browserWSEndpoint: endpointUrl,
            ignoreHTTPSErrors: true,
            args: ['']
        });
        try {
            const page = await browser.newPage();
            await page.goto(url, {
                waitUntil: 'load',
                timeout: config.timeout
            });
            await page.screenshot({
                path: savePath,
                fullPage: true
            });
            if (fs.existsSync(savePath)) {
                return true;
            }
        } catch (error) {
            console.log(error)
        } finally {
            if (browser) {
                browser.close();
            }
        }
        return false;
    }
};
module.exports = Browserless;