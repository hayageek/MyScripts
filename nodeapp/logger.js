'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var winston = require('winston');
var os = require('os');
/*const {
    Timber
} = require("@timberio/node");
const {
    TimberTransport
} = require("@timberio/winston");

const timber = new Timber(" ", "31279");
const DailyRotateFile = require('winston-daily-rotate-file');
var transport = new DailyRotateFile({
    filename: 'logfile-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '5m',
    maxFiles: '5d'
});
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        transport,
        new TimberTransport(timber)
    ]
});
logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: 'info',
}));

class LoggerWrapper {


    debug(message) {
        if (typeof message == 'object') {
            message = JSON.stringify(message);
        }
        message = hostName + ' : ' + message;
        logger.debug(message)
    }
    info(message) {
        if (typeof message == 'object') {
            message = JSON.stringify(message);
        }
        message = hostName + ' : ' + message;
        logger.info(message)
    }
    error(message) {
        if (typeof message == 'object') {
            message = JSON.stringify(message);
        }
        message = hostName + ' : ' + message;
        logger.error(message)
    }


}*/
var winston = require('winston');
var {
    Loggly
} = require('winston-loggly-bulk');

winston.add(new Loggly({
    token: "acb9b36c-f3d2-45d0-8384-9ccb8276a7a9",
    subdomain: "hayageek",
    tags: ["WhoIsApp"],
    json: true
}));
class LoggerWrapper {
    debug(message) {
        winston.log('debug', message)
    }
    info(message) {
        winston.log('info', message)
    }
    error(message) {

        winston.log('error', message)
    }
    confirmed(message) {

        winston.log('data', message)
    }

};

var logWrapper = new LoggerWrapper();
Object.freeze(logWrapper);

module.exports = logWrapper;
