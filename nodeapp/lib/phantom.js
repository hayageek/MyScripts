const {
    path: phantomjs
} = require('phantomjs')
var fs = require('fs');
const escape = require('shell-escape')
var execASync = require('child_process').exec;

const If = (cond, val) => (cond ? val : '')
class CapturePhantom {
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
                execASync(cmdStr, options, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`Command execution failed: ${error} cmd: ${cmdStr}`)
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
                resolve({
                    error: error,
                    stderr: null,
                    stdout: null
                })
            }

        });
    }


    async capture({
        url,
        width: width = 1024,
        height: height = 768,
        wait: wait = 0,
        format: format = 'png',
        clip: clip = true,
        cookies: cookies = [],
        ignoreSSLErrors: ignoreSSLErrors = false,
        SSLCertificatesPath,
        SSLProtocol,
        timeout: timeout = 60000,
        userAgent,
        headers: headers = [],
        path
    }) {

        var cmd = escape([
            phantomjs,
            '--debug=false',
            `--ignore-ssl-errors=${ignoreSSLErrors}`,
            If(SSLCertificatesPath, `--ssl-certificates-path=${SSLCertificatesPath}`),
            If(SSLProtocol, `--ssl-protocol=${SSLProtocol}`),
            `${__dirname}/script/render.js`,
            url,
            width,
            height,
            wait,
            format.toUpperCase(),
            clip,
            JSON.stringify(cookies),
            JSON.stringify(headers),
            userAgent,
            path
        ]);
        //console.log(cmd);
        await this.executeCmd(cmd, {
            timeout: timeout
        });
        if (fs.existsSync(path)) {
            return true;
        }
        return false;
    }
}
module.exports = CapturePhantom;