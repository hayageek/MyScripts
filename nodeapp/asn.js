const net = require("net");
const asNetworks = require('as-networks');
const axios = require('axios');
var UserAgents = require('user-agents')
const cidrTools = require("cidr-tools");

class ASN {
    constructor() { }

    static async getRespFromHackerTarget(asn) {
        var url = `https://api.hackertarget.com/aslookup/?q=${asn}`;
        var options = {
            headers: {
                'User-Agent': UserAgents.random().toString(),
                maxRedirects: 5,
                timeout: 1000,
            }
        };
        try {
            const response = await axios.get(url, options);
            if (response && response.status == 200 && response.data) {
                var lines = response.data.split('\n');
                return lines;
            }

        } catch (error) {
            console.log(error);
        }
        return [];
    }
    async getASNInfoFromHackerTarget(asnNumber) {
        var lines = await ASN.getRespFromHackerTarget(asnNumber)
        if (lines && lines.length > 0) {
            var tmp = lines[0].split('","')
            if (tmp && tmp.length >= 2) {
                var asn = tmp[0].replace('"', '').trim();
                var org = tmp[1].replace('"', '').trim().toLowerCase();
                org = org.charAt(0).toUpperCase() + org.slice(1);
                var asnInput = asnNumber.toLowerCase().replace('as', '');
                if (asn == asnInput) {
                    return {
                        asn: asnNumber,
                        org: org

                    }
                }
            }

        }
        return null;
    }
    async getIpRangeFromHackerTarget(asn) {
        var lines = await ASN.getRespFromHackerTarget(asn)
        if (lines && lines.length > 1) {
            var list = [];

            for (var i = 1; i < lines.length; i++) {
                list.push(lines[i].trim());
            }
            if (list.length > 0) {
                return cidrTools.merge(list);
            }
        }
    }
    async getIpInfoFromHackerTarget(ip) {
        var lines = await ASN.getRespFromHackerTarget(ip)
        if (lines && lines.length > 0) {
            var tmp = lines[0].split('","')
            if (tmp && tmp.length > 3) {
                var asn = tmp[1].replace('"', '').trim();
                var cidr = tmp[2].replace('"', '').trim();
                var org = tmp[3].replace('"', '').trim().toLowerCase();
                org = org.charAt(0).toUpperCase() + org.slice(1);
                return {
                    asn: asn,
                    ip: ip,
                    cidr: cidr,
                    org: org
                }

            }
        }
        return null;
    }

    getASNInfoFromWhoIs(asn) {
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
                            asn: asn,
                            org: org
                        }
                    }

                }
                resolve(obj);
                socket.destroy();
            });
        });
    }



    async getASNInfoFromHackerBGPView(asn) {
        asn = asn.toUpperCase().replace('AS', '');
        var url = `https://api.bgpview.io/asn/${asn}`;
        var options = {
            headers: {
                'User-Agent': UserAgents.random().toString(),
                'Content-type': 'application/json',
                maxRedirects: 5,
                timeout: 1000,
            }
        };
        try {
            const response = await axios.get(url, options);
            if (response && response.status == 200 && response.data) {
                var json = response.data;
                var asnInput = asn.toLowerCase().replace('as', '');
                if (json && json.status && json.status == 'ok' && json.data && json.data.asn == asnInput) {

                    var org = json.data.name.toLowerCase();
                    org = org.charAt(0).toUpperCase() + org.slice(1);
                    return {
                        asn: asn,
                        org: org
                    }
                }
            }

        } catch (error) {
            console.log(error);
        }
    }
    async getIpRangeFromBgpView(asn) {
        asn = asn.toUpperCase().replace('AS', '');
        var url = `https://api.bgpview.io/asn/${asn}/prefixes`;
        var options = {
            headers: {
                'User-Agent': UserAgents.random().toString(),
                'Content-type': 'application/json',
                maxRedirects: 5,
                timeout: 1000,
            }
        };
        try {
            const response = await axios.get(url, options);
            if (response && response.status == 200 && response.data) {
                var json = response.data;
                if (json && json.status && json.status == 'ok' && json.data) {

                    var v4_prefixes = json.data.ipv4_prefixes || [];
                    var v6_prefixes = json.data.ipv6_prefixes || [];
                    var prefixes = v4_prefixes.concat(v6_prefixes);
                    var list = [];
                    prefixes.forEach(prefix => {
                        list.push(prefix.prefix);
                    });
                    if (list.length > 0) {
                        return cidrTools.merge(list);
                    }

                }
            }

        } catch (error) {
            console.log(error);
        }
    }
    async getIpInfoFromBgpView(ip) {
        var url = `https://api.bgpview.io/ip/${ip}`;
        var options = {
            headers: {
                'User-Agent': UserAgents.random().toString(),
                'Content-type': 'application/json',
                timeout: 1000,
                maxRedirects: 5
            }
        };
        try {
            const response = await axios.get(url, options);
            if (response && response.status == 200 && response.data) {
                var json = response.data;
                if (json && json.status && json.status == 'ok' && json.data && json.data.ip == ip && json.data.prefixes != null && json.data.prefixes.length > 0) {
                    var prefix = json.data.prefixes[0];
                    var asn = prefix.asn || null;
                    if (asn) {
                        var org = prefix.name || asn.name;
                        var country = prefix.country_code || asn.country_code;
                        return {
                            asn: asn.asn,
                            ip: ip,
                            cidr: prefix.prefix,
                            country: country,
                            org: org
                        }
                    }

                }
            }

        } catch (error) {
            console.log(error);
        }
    }
    async getASNInfo(asn) {
        if (asn.indexOf("AS") != 0) {
            asn = 'AS' + asn;
        }
        var fns = ['getASNInfoFromHackerTarget', 'getASNInfoFromHackerBGPView', 'getASNInfoFromWhoIs'];
        return await this.runFuncByRandom(fns, asn);
    }
    getIpInfoFromWhois(ip) {
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

    async getIpInfo(ip) {
        var fns = ['getIpInfoFromHackerTarget', 'getIpInfoFromBgpView', 'getIpInfoFromWhois'];
        return await this.runFuncByRandom(fns, ip);
    }
    async getIpRangesFromWhois(asnNumber) {
        var ranges = await asNetworks(asnNumber);
        if (ranges && ranges.length > 0) {
            return ranges;
        }
    }

    sort(items) {
        function func(a, b) {
            return 0.5 - Math.random();
        }
        return items.sort(func);
    }
    async runFuncByRandom(fns, args) {

        var sorted_fns = this.sort(fns);
        for (var i = 0; i < sorted_fns.length; i++) {
            var fname = sorted_fns[i];
            console.log('Calling function ' + fname)
            try {
                var ret = await this[fname](args);
                if (ret) {
                    return ret;
                }
            } catch (error) {
                console.log(error);
            }
        }
        return null;
    }


    async getIpRanges(asnNumber) {

        var fns = [this.getIpRangesFromWhois(asnNumber), this.getIpRangeFromBgpView(asnNumber), this.getIpRangeFromHackerTarget(asnNumber)];
        var list = await Promise.all(fns);
        var all_list = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i]) {
                all_list = all_list.concat(list[i]);
            }
        }

        var ret = cidrTools.merge(all_list);
        return ret;
    }

}

module.exports = ASN;