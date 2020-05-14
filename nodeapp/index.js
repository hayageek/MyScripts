process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
var Logger = require('./logger');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var Whois = require('./whois/whois');
var ASN = require('./asn');
var Util = require('./util');
var fs = require('fs');
var app = express();
app.use(bodyParser.json());

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
    if (domain.length > 0) {
        var whois = new Whois(domain);
        var data = await whois.getFull();
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