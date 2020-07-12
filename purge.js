const fs = require('fs');
const request = require('request');

const jsDelivrPurge = 'https://purge.jsdelivr.net/gh/mathpron/mathpron.github.io@master';

function purge(file) {
    return new Promise((resolve, reject) => {
        let timeout = setTimeout(function () {
            console.log(`! Failed to purge ${file}.`);
        }, 20000);

        request({
            url: jsDelivrPurge + '/' + file,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0'
            }
        }, (error, _response, _body) => {
            clearTimeout(timeout);
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function purgeAll() {
    let files = fs.readdirSync('.');
    let exclude = [ 'build.js', 'purge.js', 'new-entry.js', 'package.json' ];
    let toPurge = [];
    files.forEach(file => {
        // all files on jsdelivr except /fonts/* and /img/* are purged.
        if (/\.(css|html|js|json)$/.test(file) && !exclude.includes(file)) {
            toPurge.push(file);
        }
    });

    for (let i = 0; i < toPurge.length; i++) {
        let file = toPurge[i];
        console.log(`Purging ${file}...`);
        await purge(file);
    }
}

purgeAll();
