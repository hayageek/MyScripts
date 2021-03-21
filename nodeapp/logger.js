'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
var winston = require('winston');
var os = require('os');
var {
    Loggly
} = require('winston-loggly-bulk');

winston.add(new Loggly({
    token: process.env.LOGGLY_TOKEN,
    subdomain: process.env.LOGGLY_SUBDOMAIN,
    tags: [process.env.LOGGLY_TAG],
    level: process.env.LOGGER_LEVEL,
    json: true
}));
class LoggerWrapper {
    debug(message) {
        if (typeof message == 'string') {
            message = {
                message: message,
            };
        }
        message.host = os.hostname();
        if(process.env.NODE_ENV =='prod')
        {
            winston.log('debug', message)
        }
        else{
            console.log(message);
        }
        
    }
    info(message) {
        if (typeof message == 'string') {
            message = {
                message: message,
            };
        }
        message.host = os.hostname();

        winston.log('info', message)
    }
    error(message) {
        if (typeof message == 'string') {
            message = {
                message: message,
            };
        }
        message.host = os.hostname();
        if(process.env.NODE_ENV =='prod')
        {
            winston.log('error', message)
        }
        else{
            console.log(message)
        }
        
    }
    confirmed(message) {
        if (typeof message == 'string') {
            message = {
                message: message,
            };
        }
        message.host = os.hostname();
        winston.log('data', message)
    }

};

var logWrapper = new LoggerWrapper();
Object.freeze(logWrapper);

module.exports = logWrapper;