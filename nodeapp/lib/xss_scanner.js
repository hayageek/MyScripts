const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
var Logger = require('../logger');
var UserAgent = require('./useragent');
puppeteer.use(StealthPlugin());

class XSSScanner {
    constructor(config) {
        this.config = config;
        this.vulnerable = [];
    }
    async __openBrowser() {

        try {
            const browser = await puppeteer.launch({
                headless: true,
                ignoreHTTPSErrors: true,
                timeout: this.config.puppeteer.timeout,
                defaultViewport: {
                    width: this.config.puppeteer.width,
                    height: this.config.puppeteer.height
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
    async __closeBrowser(browser) {
        try {
            if (browser) {
                await browser.close();
            }

        } catch (error) {
            Logger.error(`Failed to close browser :${error.stack}`)
        }
    }
    async __clearCookies(page) {

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
    async sleep(timeout) {
        await new Promise(resolve => setTimeout(resolve, timeout));
    }
    async __urlVulnerable(browser, urlObj) {
        Logger.debug(`Checking URL for vuln :${urlObj.url}`)
        var page = null;
        try {
            var parent = this;
            var waitTimeForPage = this.config.wait_time_page_load || 3000;

            page = await browser.newPage();
            //Anonymize User agent
            page.setUserAgent(UserAgent.forWeb());

            await page.setBypassCSP(true)
            await page.setCacheEnabled(true);

            await page.exposeFunction('ravik', () => {
                Logger.debug(`ravik() method called from ${urlObj.url}`)
                parent.vulnerable.push(urlObj);
                return true;
            });
            page.on('dialog', async dialog => {
                if (dialog.type == 'alert' || dialog.type == 'confirm' || dialog.type == 'prompt') {
                    Logger.debug(`dialog() method called from ${urlObj.url}`)
                    parent.vulnerable.push(urlObj);
                }
                await dialog.dismiss()
            })
            try {
                await page.goto(urlObj.url, {
                    waitUntil: 'networkidle0',
                    timeout: this.config.puppeteer.timeout
                });

            } catch (error) {
                Logger.error(`Failed to check xss vuln for url ${urlObj.url} ${error.stack}`)
            }

            //Wait for page load
            await this.sleep(waitTimeForPage);
            await this.__clearCookies(page);
            if (page.isClosed() == false) {
                await page.close();
            }


        } catch (error) {
            Logger.error(`XSS: Failed to check URL ${urlObj.url} ${error.stack}`)
        }

        console.log(`Checking URL Completed for vuln :${urlObj.url}`)
    }
    async scanUrlWithPayloads(urls) {
        var delay = this.config.delay || 1000;
        var browser = null;
        try {
            //get all the combination for urls
            if (urls && urls.length > 0) {
                browser = await this.__openBrowser();
                if (browser) {
                    for (var i = 0; i < urls.length; i++) {
                        //Check the URL
                        await this.__urlVulnerable(browser, urls[i]);

                        //Delay for each Request);
                        await this.sleep(delay);
                    }
                } else {
                    console.log('Failed to load Browser');
                }
            }

        } catch (error) {
            Logger.error(`XSS: Error scanUrlWithPayloads ${error.stack}`)
        }
        //close
        if (browser) {
            await this.__closeBrowser(browser);
        }
    }
    getVulnList() {
        return this.vulnerable;
    }
}

module.exports = XSSScanner;