const fs = require('fs');
const git = require('simple-git')();
const request = require('request');

const jsDelivrPurge = 'https://purge.jsdelivr.net/gh/mathpron/mathpron.github.io@master';

function purge(file) {
    return new Promise((resolve, reject) => {
        request({
            url: jsDelivrPurge + '/' + file,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0'
            }
        }, (error, _response, _body) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function purgeAll() {
    await git.checkout('dev');

    let files = fs.readdirSync('.').concat(fs.readdirSync('./content').map(file => 'content/' + file));
    let exclude = [ 'build.js', 'purge.js' ];
    let toPurge = [];
    files.forEach(file => {
        // all files on jsdelivr except /fonts/* and /img/* are purged.
        if (/\.(css|html|js|json)$/.test(file) && !exclude.includes(file)) {
            toPurge.push(file);
        }
    });

    for (let i = 0; i < toPurge.length; i++) {
        let file = toPurge[i];
        await purge(file);
    }
}

purgeAll();
