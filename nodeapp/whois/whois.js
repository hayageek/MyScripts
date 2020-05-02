'use strict';
var Util = require('../util');
var whois = require('whois');
var parsedomain = require('parse-domain');
var parseRawData = require('./parse-raw-data');
var fs = require('fs');
var lookup = require('util').promisify(whois.lookup);
var Logger = require('../logger');

class WhoisLib {

    constructor(domain) {
        this.domain = domain;
        this.results = null;
    }
    parseFile(outFilePath) {
        var text = Util.getText(outFilePath);
        return parseRawData(text);
    }
    async lookupCmd() {
        var tmpDir = Util.getTmpDir();
        var results = {};
        var fileName = Util.getUniqueFileName('whois');
        var outFilePath = tmpDir + fileName + '.txt';
        var cmd = [
            'whois',
            this.domain,
            '&>',
            outFilePath
        ];
        await Util.executeCmd(cmd);
        if (!fs.existsSync(outFilePath)) {
            Logger.error(`Error Whois`)
        } else {
            results = await this.parseFile(outFilePath)
            if (process.env.DRY_RUN) {} else {
                fs.unlinkSync(outFilePath);
            }
            return results;
        }
    }
    async lookup() {
        var rawData = await lookup(this.domain, {
            timeout: 30000
        });
        var result = {};
        if (typeof rawData === 'object') {
            result = rawData.map(function (data) {
                data.data = parseRawData(data.data);
                return data;
            });
        } else {
            result = parseRawData(rawData);
        }
        return result;
    }
    async getDetails() {

        if (this.results == null) {
            try {
                this.results = await this.lookup();
                //this.results = await this.lookupCmd();
            } catch (error) {
                this.results = await this.lookupCmd();
            }
            //console.log(this.results);
            if (this.results) {
                var updated_results = {};
                for (var k in this.results) {
                    var nk = k.toLowerCase().replace(/\s/g, '')
                    updated_results[nk] = this.results[k];
                }

                this.results = updated_results;

            }
        }
    }
    async getDetailsForFields(fields) {

        await this.getDetails();
        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            f = f.toLowerCase().replace(/\s/g, '')
            if (this.results && this.results.hasOwnProperty(f)) {
                return this.results[f];
            }

        }
        return null;
    }
    async getFull() {
        await this.getDetails();
        return this.results;
    }
    async getExpiry() {

        return await this.getDetailsForFields(['registrarRegistrationExpirationDate']) || 'unknown';
    }
    async getCreationDate() {

        return await this.getDetailsForFields(['creationDate']) || 'unknown';
    }
    async getUpdationDate() {
        return await this.getDetailsForFields(['updatedDate']) || 'unknown';
    }
    async getAdminEmail() {
        var adminEmail = await this.getDetailsForFields(['techEmail', 'adminEmail', 'registrarAbuseContactEmail', 'RegistrantContactEmail']);
        if (adminEmail == null) {
            adminEmail = 'unknown';
        }
        return adminEmail;
    }
    async getOrganization() {
        var org = await this.getDetailsForFields(['techOrganization', 'adminOrganization', '', 'registrantOrganization', 'Registrant']);
        if (org == null) {
            org = 'unknown';
        }
        return org;
    }
    async getNameServers() {
        var name_servers = ['unknown'];
        //Fetch details.
        await this.getDetails();
        var tmp = await this.getDetailsForFields(['nameServer', 'nserver', 'Name Server']);
        if (tmp) {
            var list = tmp.split(' ');
            if (list && list.length > 0) {
                name_servers = [];
                list.forEach(host => {
                    if (Util.isValidSubDomain(host.trim()) == true || Util.isValidDomain(host.trim()) == true) {
                        var dinfo = parsedomain(host.trim());
                        if (dinfo) {
                            var domain = dinfo['domain'] + '.' + dinfo['tld'];
                            name_servers.push(domain);
                        }

                    }
                });
            }
        }
        return [...new Set(name_servers)];
    }

};
module.exports = WhoisLib;