process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var AWS = require('aws-sdk');
var fs = require('fs');

class DoSpace {
    async uploadBuffer(data, savePath) {

        try {
            var s3 = new AWS.S3({
                accessKeyId: process.env.DO_SPACES_KEY,
                secretAccessKey: process.env.DO_SPACES_SECRET,
                region: process.env.DO_SPACES_REGION,
                endpoint: process.env.SPACE_ENDPOINT
            });
            var params = {
                Bucket: process.env.DO_SPACES_NAME,
                Key: savePath,
                Body: data,
                ACL: 'public-read'
            };

            await s3.putObject(params).promise();
            return true;
        } catch (error) {
            console.log(error)
        }
        return false;
    }
    async upload(filePath, savePath) {

        try {
            var s3 = new AWS.S3({
                accessKeyId: process.env.DO_SPACES_KEY,
                secretAccessKey: process.env.DO_SPACES_SECRET,
                region: process.env.DO_SPACES_REGION,
                endpoint: process.env.SPACE_ENDPOINT
            });

            var data = fs.readFileSync(filePath);
            var params = {
                Bucket: process.env.DO_SPACES_NAME,
                Key: savePath,
                Body: data,
                ACL: 'public-read'
            };

            await s3.putObject(params).promise();
            return true;
        } catch (error) {
            console.log(error)
        }
        return false;
    }
}
module.exports = DoSpace;