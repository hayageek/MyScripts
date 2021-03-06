const Phantomjs = require('./phantom');
const Browserless = require('./browserless');
var UserAgent = require('./useragent');
class Screenshot {


    async capturePhantom(url, savePath, config) {
        var width = config.width || 1024;
        var height = config.height || 768;
        var timeout = config.timeout || 60000;
        var delay = config.delay || 3000;
        var headers = config.headers || {};
        try {
            var phantom = new Phantomjs();
            return await phantom.capture({
                url: url,
                width: width,
                height: height,
                clip: false,
                wait: delay,
                ignoreSSLErrors: true,
                timeout: timeout,
                headers: headers,
                userAgent: UserAgent.forWeb(),
                path: savePath,
                SSLProtocol: 'any'
            });

        } catch (error) {
            console.log(error);
        }
        return false;
    }
    async captureChrome(url, savePath, config) {
        var browserless = new Browserless();
        return await browserless.capture(url, savePath, config)
    }
};
module.exports = Screenshot;