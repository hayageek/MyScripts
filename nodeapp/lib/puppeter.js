const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const BlockResources = require('puppeteer-extra-plugin-block-resources');

var UserAgent = require('./useragent');

//Make it stealthy
puppeteer.use(StealthPlugin());
puppeteer.user(BlockResources({
    blockedTypes: new Set(['image','media', 'other','font','manifest','texttracky'])
}));
//puppeteer.use(AdblockerPlugin());

var fs = require('fs');
class Puppeteer {

    static async __openBrowser(config) {

        try {
            const browser = await puppeteer.launch({
                headless: true,
                ignoreHTTPSErrors: true,
                timeout: config.puppeteer.timeout,
                defaultViewport: {
                    width: config.puppeteer.width,
                    height: config.puppeteer.height
                },
                devtools: false,
                args: [
                    "--headless",
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
                    '--disable-xss-auditor'
                ]
            });
            return browser;
        } catch (error) {
            Logger.error(`Failed to open browser :${error.stack}`)
        }
    }
    static async __closeBrowser(browser) {
        try {
            if (browser) {
                await browser.close();
            }

        } catch (error) {
            Logger.error(`Failed to close browser :${error.stack}`)
        }
    }
    static async __clearCookies(page) {

        try {
            const client = await page.target().createCDPSession()
            await client.send('Network.clearBrowserCookies')
            if (page._client) {
                await page._client.send('Network.clearBrowserCookies');
            }
        } catch (error) {
            Logger.error(`Failed to clear cookies :${error.stack}`)

        }
    }
    static async sleep(timeout) {
        await new Promise(resolve => setTimeout(resolve, timeout));
    }
    async capture(url, savePath, config) {
        var config = config || {};
        config.width = config.width || 1024;
        config.height = config.height || 768;
        config.timeout = config.timeout || 30000



        try {
            var browser = Puppeteer.__openBrowser(config);
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