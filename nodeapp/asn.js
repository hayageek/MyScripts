const net = require("net");
const asNetworks = require('as-networks');

class ASN {
    constructor() {}
    getASNInfo(asn) {
        if (asn.indexOf("AS") != 0) {
            asn = 'AS' + asn;
        }
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let output = "";
            socket.connect(43, 'whois.cymru.com', () => {
                socket.write(` -v ${asn}\n`);
            });

            socket.on("error", err => {
                reject(err);
                socket.destroy();
            });

            socket.on("timeout", err => {
                reject(err);
                socket.destroy();
            });

            socket.on("data", data => {
                output += String(data);
            });

            socket.on("end", () => {
                var obj = null;
                var lines = output.split(/\r?\n/gm);
                if (lines.length > 2) {
                    var t = lines[1].split('|').map(e => e.trimLeft().trimRight());
                    if (t.length > 4) {
                        var org = t[4].split(',')[0].toLowerCase();
                        org = org.charAt(0).toUpperCase() + org.slice(1);
                        obj = {
                            asn: t[0].trim(),
                            org: org
                        }
                    }

                }
                resolve(obj);
                socket.destroy();
            });
        });
    }
    getIpInfo(ip) {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let output = "";
            socket.connect(43, 'whois.cymru.com', () => {
                socket.write(` -v ${ip}\n`);
            });

            socket.on("error", err => {
                reject(err);
                socket.destroy();

            });

            socket.on("timeout", err => {
                reject(err);
                socket.destroy();

            });

            socket.on("data", data => {
                output += String(data);
            });

            socket.on("end", () => {
                var obj = null;
                var lines = output.split(/\r?\n/gm);
                if (lines.length > 2) {
                    var t = lines[1].split('|').map(e => e.trimLeft().trimRight());
                    if (t.length > 6) {
                        var org = t[6].split(',')[0].toLowerCase();
                        org = org.charAt(0).toUpperCase() + org.slice(1);
                        obj = {
                            asn: t[0],
                            ip: t[1],
                            cidr: t[2],
                            country: t[3],
                            allocated: t[5],
                            org: org
                        }
                    }

                }
                socket.destroy();
                resolve(obj);
            });
        });

    }
    async getIpRanges(asnNumber) {
        var ranges = [];
        ranges = await asNetworks(asnNumber);
        return ranges;
    }

}

module.exports = ASN;