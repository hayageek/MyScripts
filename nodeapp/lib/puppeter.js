const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
var UserAgent = require('./useragent');

//Make it stealthy
puppeteer.use(StealthPlugin());
//puppeteer.use(AdblockerPlugin());

var fs = require('fs');
class Puppeteer {

    async capture(url, savePath, config) {
        var config = config || {};
        config.width = config.width || 1024;
        config.height = config.height || 768;
        config.timeout = config.timeout || 30000


        var browser = null;

        try {
            browser = await puppeteer.launch({
                headless: true,
                ignoreHTTPSErrors: true,
                timeout: config.timeout,
                defaultViewport: {
                    width: config.width,
                    height: config.height
                },
                devtools: false,
                args: [
                    "--proxy-server='direct://'",
                    '--proxy-bypass-list=*',
                    '--disable-gpu',
                    '--disable-canvas-aa',
                    '--disable-2d-canvas-clip-aa',
                    '--disable-gl-drawing-for-tests',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-sandbox',
                    '--no-zygote',
                    '--single-process',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--enable-features=NetworkService',
                    '--download-whole-document',
                    '--disk-cache-dir=/dev/null',
                    '--deterministic-fetch',
                    '--use-gl=swiftshader',
                    '--enable-webgl',
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--disable-infobars',
                    '--disable-breakpad',
                    '--disable-notifications',
                    '--disable-logging',
                    '--disable-extensions',
                    '--safebrowsing-disable-auto-update',
                    '--disable-default-apps',
                ]
            });
            const page = await browser.newPage();

            //Anonymize User agent
            page.setUserAgent(UserAgent.forWeb());

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
module.exports = Puppeteer;