var Logger = require('../logger');
var UserAgent = require('./useragent');
var Puppeteer = require('./puppeter');
class XSSScanner {
    constructor(config) {
        this.config = config;
        this.vulnerable = [];
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
            await Puppeteer.sleep(waitTimeForPage);
            await Puppeteer.__clearCookies(page);
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
                browser = await Puppeteer.__openBrowser(this.config);
                if (browser) {
                    for (var i = 0; i < urls.length; i++) {
                        //Check the URL
                        await this.__urlVulnerable(browser, urls[i]);

                        //Delay for each Request);
                        await Puppeteer.sleep(delay);
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
            await Puppeteer.__closeBrowser(browser);
        }
    }
    getVulnList() {
        return this.vulnerable;
    }
}

module.exports = XSSScanner;