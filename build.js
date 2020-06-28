const fs = require('fs');
const { execSync } = require('child_process');
const git = require('simple-git')();
const terser = require('terser');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const postcss = require('postcss');
const htmlMinifier = require('html-minifier');

function minifyCssAsync(css) {
    return new Promise((resolve, reject) => {
        postcss([ autoprefixer, cssnano ]).process(css, {
            from: undefined // to prevent a warning
        }).then(result => {
            resolve(result.css); 
        }, reject);
    });
}

async function build() {
    let isRepo = await git.checkIsRepo();
    if (!isRepo) {
        return console.log('Repository not found.');
    }

    let status = await git.status();
    if (status.files.length > 0) {
        return console.log('There are uncommitted files.');
    }

    console.log('Checking out files...');
    await git.checkout('master');
    await git.checkout('dev');
    let commitId = (await git.revparse('@')).trim();
    
    let files = fs.readdirSync('.').concat(fs.readdirSync('./content').map(file => 'content/' + file));
    let exclude = [ 'build.js', 'package.json', 'yarn.lock' ],
        excludeDir = [ '.github' ];
    let toMinify = [];
    files.forEach(file => {
        if (/\.(css|html|js|json)$/.test(file) && !exclude.includes(file)) {
            toMinify.push(file);
        }
    });

    execSync('git symbolic-ref HEAD refs/heads/master');
    execSync('git reset');

    for (let i = 0; i < exclude.length; i++) {
        fs.unlinkSync(exclude[i]);
    }
    for (let i = 0; i < excludeDir.length; i++) {
        fs.rmdirSync(excludeDir[i], { recursive: true });
    }

    console.log('Minifying...');
    let hasErrors = false;
    for (let i = 0; i < toMinify.length; i++) {
        let file = toMinify[i];
        let ext = file.match(/\.([^\.]+)$/)[1];
        try {
            let content = fs.readFileSync(file).toString();
            switch (ext) {
                case 'js':
                    let jsResult = terser.minify(content);
                    if (jsResult.error) {
                        throw jsResult.error;
                    }
                    fs.writeFileSync(file, jsResult.code);
                    break;

                case 'json':
                    let jsonResult = JSON.stringify(JSON.parse(content));
                    fs.writeFileSync(file, jsonResult);
                    break;

                case 'css':
                    let cssResult = await minifyCssAsync(content);
                    fs.writeFileSync(file, cssResult);
                    break;

                case 'html':
                    let htmlResult = htmlMinifier.minify(content, {
                        removeComments: true,
                        collapseWhitespace: true,
                        collapseBooleanAttributes: true,
                        removeAttributeQuotes: true,
                        removeRedundantAttributes: true,
                        useShortDoctype: true,
                        removeEmptyAttributes: true,
                        minifyCSS: true
                    });
                    fs.writeFileSync(file, htmlResult);
                    break;
            }
        } catch (error) {
            console.log(`Unable to minify '${file}'.`);
            console.log(error);
            hasErrors = true;
        }
    }

    if (!hasErrors) {
        console.log('Committing to \'master\'...');
        await git.add('./*').commit(`Update to ${commitId}`);
        console.log('Done!');
    }
}

build();
