'use strict';
var dns = require('dns'),
    fs = require('fs'),
    URL = require('url'),
    execASync = require('child_process').exec;
var UUID = require('uuid');
var sanitize = require("sanitize-filename");
var Logger = require('./logger');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
var main = {

    getParsedUrl(url) {
        var parsed = URL.parse(url);
        if (parsed.port == null) {
            if (parsed.protocol == 'http:') {
                parsed.port = '80';
            } else if (parsed.protocol == 'https:') {
                parsed.port = '443';
            }
        }
        return parsed;
    },

    getTmpDir() {
        var tmpDir = __dirname + '/tmp/';
        return tmpDir;
    },

    getUniqueFileName(filename) {
        var name = sanitize(`${UUID.v4()}_${Date.now()}_${filename}`);
        return name;
    },

    lookup: (domain, next) => {
        try {
            dns.resolve(domain, function (err, ipAddr) {
                if (ipAddr == undefined || ipAddr == null) {
                    ipAddr = '';
                }
                ipAddr = ipAddr == undefined ? null : ipAddr;
                if (Array.isArray(ipAddr)) {
                    //ipAddr = ipAddr.join(',');
                    ipAddr = ipAddr[0];
                }
                next(null, ipAddr);
            });
        } catch (error) {
            next(null, null);
        }

    },
    reverseLookup: (ip, next) => {
        dns.reverse(ip, function (err, domains) {
            if (err != null) next(null, []);
            next(null, domains)
        });
    },
    resolveCname: (domain, next) => {
        try {
            dns.resolveCname(domain, function (err, cname) {
                if (err) {
                    next(null, null);
                } else {
                    next(err, cname);
                }
            });

        } catch (error) {
            next(null, null);
        }
    },

    executeCmd(cmd, options) {
        if (options == undefined) {
            options = {};
        }
        options.maxBuffer = 1024 * 1024 * 10;
        return new Promise((resolve, reject) => {
            var cmdStr = '';
            if (typeof cmd == "string") {
                cmdStr = cmd;
            } else {
                cmdStr = cmd.join(' ');
            }
            try {
                Logger.debug(cmdStr);
                execASync(cmdStr, options, (error, stdout, stderr) => {
                    if (error) {
                        Logger.error(`Command execution failed: ${error} cmd: ${cmdStr}`)
                    }
                    //Hack for the errors, file not found
                    setTimeout(function () {
                        resolve({
                            error: error,
                            stdout: stdout,
                            stderr: stderr
                        });

                    }, 1000);

                });
            } catch (error) {
                console.log(error);
                resolve({
                    error: error,
                    stderr: null,
                    stdout: null
                })
            }

        });
    },
    txtToArray(text) {
        var list = text.split("\n");
        var ret = [];
        list.forEach(line => {
            if (line && line.trim().length > 0) {
                ret.push(line.trim());
            }
        });
        return ret;
    },
    txtFileToArray(filePath) {
        var text = fs.readFileSync(filePath, 'utf8');
        var list = text.split("\n");
        var ret = [];
        list.forEach(line => {
            if (line && line.trim().length > 0) {
                ret.push(line.trim());
            }
        });
        return ret;
    },
    writeArrayToFile(arr, filePath) {
        var text = arr.join("\n");
        fs.writeFileSync(filePath, text, 'utf8');
    },
    getText(filePath) {
        var text = fs.readFileSync(filePath, 'utf8');
        return text;
    },
    parseJson(text) {
        var obj = null;
        try {
            obj = JSON.parse(text);
        } catch (e) {}
        return obj;
    },
    getJSON(filePath) {
        var obj = null;
        var text = fs.readFileSync(filePath, 'utf8');
        try {
            obj = JSON.parse(text);
        } catch (e) {}
        return obj;
    },

    randomStr(length) {
        length = length || 8;
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
};
module.exports = main;