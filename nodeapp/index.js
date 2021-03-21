process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
var Logger = require('./logger');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var Whois = require('./whois/whois');
var ASN = require('./asn');
var Util = require('./util');
var fs = require('fs');
var URL = require('url');
var Screenshot = require('./lib/screenshot');
var XSSScanner = require('./lib/xss_scanner');
var CachemanFile = require('cacheman-file');
var DoSpace = require('./lib/dospaces');
const uuid = require('uuid');
var fs = require('fs');

var cache = new CachemanFile({
    tmpDir: __dirname + '/tmp'
});
var CACHE_EXPIRATION = 1000 * 60 * 60 * 24;
const cacheSet = function (key, value) {
    return new Promise((resolve, reject) => {
        cache.set(key, value, CACHE_EXPIRATION, function (err) {
            console.log(err);
            resolve(err);
        })
    })
}
const cacheGet = function (key) {
    return new Promise((resolve, reject) => {
        cache.get(key, function (err, value) {
            resolve(value);
        })
    })
}



var app = express();
app.use(bodyParser.json());


async function getFromCache(key) {
    try {
        return await cacheGet(key);
    } catch (error) {
    }
    return null;
}
async function saveToCache(key, data) {
    try {
        await cacheSet(key, data);
    } catch (error) {
    }
}

function checkAuth(req, res, next) {
    var api_key = process.env.HTTP_API_PROXY_KEY || 'kqDIvhIhIIROPkfWlC3KpgtAt1e35ZSMCNUJ60olPqlsoP9TEJ8SFZIKhvBFlpAc';
    if (req.params.key == api_key) {
        next(); //If session exists, proceed to page
    } else {
        var err = new Error("No Access");
        next(err);
    }
}

app.get('/whois/domain/:key/:domain', checkAuth, async function (req, res) {
    var domain = req.params.domain || '';

    //get from cache
    var key = 'whois_' + domain;
    var data = await getFromCache(key);
    if (data) {
        res.json({
            status: 0,
            data: data
        });
        return;
    }

    if (domain.length > 0) {
        var whois = new Whois(domain);
        var data = await whois.getFull();

        if (data && Object.keys(data).length > 0) {
            await saveToCache(key, data);

        }
        res.json({
            status: 0,
            data: data
        });

    } else {
        res.json({
            status: 0,
            data: {}
        });
    }
});
app.get('/asn/:type/:key/:input', checkAuth, async function (req, res) {
    var input = req.params.input || '';
    var type = req.params.type || 'asninfo';

    var key = `asn_${type}_${input}`
    var data = await getFromCache(key);
    if (data) {
        res.json({
            status: 0,
            data: data
        });
        return;
    }


    if (input.length > 0) {
        var ASNLib = new ASN();
        var data = {};
        if (type == 'asninfo') {
            data = await ASNLib.getASNInfo(input);
        } else if (type == 'iprange') {
            data = await ASNLib.getIpRanges(input);
        } else if (type == 'ipinfo') {
            data = await ASNLib.getIpInfo(input);
        }

        if (data && Object.keys(data).length > 0) {
            await saveToCache(key, data);

        }
        res.json({
            status: 0,
            data: data
        });

    } else {
        res.json({
            status: 0,
            data: {}
        });
    }
});

function getParsedUrl(url) {
    var parsed = URL.parse(url);
    if (parsed.port == null) {
        if (parsed.protocol == 'http:') {
            parsed.port = '80';
        } else if (parsed.protocol == 'https:') {
            parsed.port = '443';
        }
    }
    return parsed;
}
async function resize(path, width, height, quality) {
    return await sharp(path).resize(width, height).jpeg({
            quality: quality
        })
        .toBuffer();
}
app.post('/screenshot/:key', checkAuth, async function (req, res) {
    var params = req.body || {};
    var browser = params.browser || 'chrome';
    var width = params.width || 1024;
    var height = params.height || 768;
    var blockAds = params.blockAds || true;
    var stealth = params.stealth || true;
    var quality = params.quality || 50;
    var root_domain = params.root_domain;
    var url = params.url;


    if (url == null || root_domain == null) {
        res.json({
            status: 0,
            data: "Invalid input params"
        });
        return;
    }

    var parsed_url = getParsedUrl(url);
    var uploadPath = `${root_domain}/${parsed_url.hostname}:${parsed_url.port}/sc.png`;
    var localPath = '/tmp/' + uuid.v4() + '.png';
    var sshot = new Screenshot();

    try {
        if (browser == 'chrome') {

            await sshot.captureChrome(url, localPath, {
                width: width,
                height: height,
                blockAds: blockAds,
                stealth: stealth
            });
        } else {
            await sshot.capturePhantom(url, localPath, {
                width: width,
                height: height,
                blockAds: blockAds,
                stealth: stealth
            });
        }
        if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
            var doSpace = new DoSpace();
            //var convrtedBuffer = await resize(localPath, width, height, quality)
            //await doSpace.uploadBuffer(convrtedBuffer, uploadPath)
            await doSpace.upload(localPath, uploadPath)
            fs.unlinkSync(localPath);
        }
        res.json({
            status: 0
        });
        return;
    } catch (error) {

        Logger.error(`Failed to get screenshot for ${url} ${error.stack}`);
    }
    res.json({
        status: -1
    });
});

app.post('/xss_scan/:key', checkAuth, async function (req, res) {
    var params = req.body || {};
    var config = params.config || {};
    var urls = params.urls || [];
    var xss = new XSSScanner(config);
    try {
        await xss.scanUrlWithPayloads(urls);
        res.json({
            status: 0,
            urls: xss.getVulnList()
        })
    } catch (error) {
        Logger.error(`Error in xss_scan ${error.stack}`);
        res.json({
            status: -1,
            urls: []
        });
    }
});
var tmpDir = Util.getTmpDir();
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
}
var server = http.createServer(app).listen(process.env.HTTP_PORT || 80);

server.on('error', function (e) {
    // Handle your error here
    console.log(e);
    Logger.error(e);
});
server.on('clientError', function (err, socket) {
    console.log(err);
    socket.destroy();
});
process.on('uncaughtException', function (err) {
    console.error('uncaughtException');
    console.error(err.stack);
    Logger.error(err.stack);
});