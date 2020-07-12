// This is a tool for creating new entries.
// Run `node new-entry.js`, and follow the steps to generate a template for a new entry.

const readline = require('readline');
const request = require('request');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const schemes = {
    "el-iso-tl": [["α","a"],["β","v"],["γ","g"],["δ","d"],["ε","e"],["ζ","z"],["η","ī"],["θ","th"],["ι","i"],["κ","k"],["λ","l"],["μ","m"],["ν","n"],["ξ","x"],["ο","o"],["π","p"],["ρ","r"],["σ","s"],["ς","s"],["τ","t"],["υ","y"],["φ","f"],["χ","ch"],["ψ","ps"],["ω","ō"]],
    "el-iso-tr": [["([αεη])υ","[fvy]"],["ου(?=̈)","oy"],["ου","ou"],["γγ","ng"],["γκ","gk"],["γξ","nx"],["γχ","nch"],["\bμπ|μπ\b","b"],["α","a"],["β","v"],["γ","g"],["δ","d"],["ε","e"],["ζ","z"],["η","i"],["θ","th"],["ι","i"],["κ","k"],["λ","l"],["μ","m"],["ν","n"],["ξ","x"],["ο","o"],["π","p"],["ρ","r"],["σ","s"],["ς","s"],["τ","t"],["υ","y"],["φ","f"],["χ","ch"],["ψ","ps"],["ω","o"],["\[fvy](?=́?[pftskc])","f"],["\[fvy](?=́?[bvmdznlrg])","v"],["\[fvy]","y"],["([fv])́","́"]],
    "ru-sci": [["́",""],["а","a"],["б","b"],["в","v"],["г","g"],["д","d"],["е","e"],["ж","ž"],["з","z"],["й","j"],["и","i"],["к","k"],["л","l"],["м","m"],["н","n"],["о","o"],["п","p"],["р","r"],["с","s"],["т","t"],["у","u"],["ф","f"],["х","x"],["ц","c"],["ч","č"],["ш","š"],["щ","šč"],["ъ","”"],["ы","y"],["ь","’"],["э","è"],["ю","ju"],["я","ja"]],
    "ru-iso": [["́",""],["а","a"],["б","b"],["в","v"],["г","g"],["д","d"],["е","e"],["ж","ž"],["з","z"],["й","j"],["и","i"],["к","k"],["л","l"],["м","m"],["н","n"],["о","o"],["п","p"],["р","r"],["с","s"],["т","t"],["у","u"],["ф","f"],["х","h"],["ц","c"],["ч","č"],["ш","š"],["щ","ŝ"],["ъ","”"],["ы","y"],["ь","’"],["э","è"],["ю","û"],["я","â"]],
    "ru-en": [["й","й"],["ё","ё"],["́",""],["(^|[ ↑])е","ye"],["ый(?=$| )","y"],["ий(?=$| )","y"],["([аеёиуэюяо])е","ye"],["([аеёиуэюяо])й","i"],["ьа","ya"],["ье","ye"],["ьи","yi"],["ьо","yo"],["ьу","yu"],["ьэ","ye"],["ъе","ye"],["а","a"],["б","b"],["в","v"],["г","g"],["д","d"],["е","e"],["ё","yo"],["ж","zh"],["з","z"],["и","i"],["й","y"],["к","k"],["л","l"],["м","m"],["н","n"],["о","o"],["п","p"],["р","r"],["с","s"],["т","t"],["у","u"],["ф","f"],["х","kh"],["ц","ts"],["ч","ch"],["ш","sh"],["щ","shch"],["ъ",""],["ы","y"],["ь",""],["э","e"],["ю","yu"],["я","ya"]],
    "ru-fr": [["й","й"],["ё","ё"],["́",""],["г(?=[еёиэюя])","gu"],["([аеёиуэюяо])с(?=[аеёиуэюяо])","ss"],["(^|[ ↑])е","ie"],["ый(?=$| )","y"],["ий(?=$| )","i"],["([аеёиуэюяо])е","ïe"],["([аеёиуэюяо])[ий]","ï"],["а","a"],["б","b"],["в","v"],["г","g"],["д","d"],["е","e"],["ё","io"],["ж","j"],["з","z"],["и","i"],["й","y"],["к","k"],["л","l"],["м","m"],["н","n"],["о","o"],["п","p"],["р","r"],["с","s"],["т","t"],["у","ou"],["ф","f"],["х","kh"],["ц","ts"],["ч","tch"],["ш","ch"],["щ","chtch"],["ъ",""],["ы","y"],["ь",""],["э","e"],["([iï])ю","ou"],["([aeouy])ю","ïou"],["ю","iou"],["([iï])я","a"],["([aeouy])я","ïa"],["я","ia"],["([ao])ou","u"],["[iy]n(?=$| )","$&e"]],
    "ru-de": [["й","й"],["ё","ё"],["́",""],["([аеёиуэюяо])с(?=[аеёиуэюяо])","ss"],["(^|[ ↑])е","je"],["ый(?=$| )","y"],["ий(?=$| )","i"],["([аеёиуэюяо])е","je"],["([аеёиуэюяо])й","i"],["ьа","ja"],["ье","je"],["ьи","ji"],["ьо","jo"],["ьу","ju"],["ъе","je"],["а","a"],["б","b"],["в","w"],["г","g"],["д","d"],["е","e"],["ё","jo"],["ж","sch"],["з","s"],["и","i"],["й","j"],["к","k"],["л","l"],["м","m"],["н","n"],["о","o"],["п","p"],["р","r"],["с","s"],["т","t"],["у","u"],["ф","f"],["х","ch"],["ц","z"],["ч","tsch"],["ш","sch"],["щ","schtsch"],["ъ",""],["ы","y"],["ь",""],["э","e"],["ю","ju"],["я","ja"]]
};

function transliterate(text, scheme) {
    text = text.normalize('NFD');
    for (var i = 0; i < text.length - 1; i++) {
        if (text[i].toLowerCase() !== text[i]) {
            text = text.substr(0, i) + '↑' + text[i].toLowerCase() + text.substr(i + 1);
            i++;
        }
    }
    schemes[scheme].forEach(rule => {
        text = text.replace( new RegExp(rule[0], 'g'), rule[1] );
    });
    for (var i = 0; i < text.length - 1; i++) {
        if (text[i] === '↑') {
            text = text.substr(0, i) + text[i + 1].toUpperCase() + text.substr(i + 2);
        }
    }
    text = text.normalize('NFC');
    return text;
}

/** @returns {Promise<string>} */
function questionAsync(query) {
    return new Promise((resolve, _reject) => {
        rl.question(query, function (answer) {
            resolve (answer);
        });
    });
}

/** @returns {Promise<string>} */
function requestAsync(url) {
    return new Promise((resolve, reject) => {
        request({
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0'
            }
        }, (error, _response, body) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(body);
        });
    });
}

async function main() {
    console.log('==================================');
    console.log('  Mathpron - Entry creation tool  ');
    console.log('==================================');
    console.log('');
    let firstLoop = true;

    while (true) {
        if (firstLoop) {
            firstLoop = false;
        } else {
            let answer = await questionAsync('Continue? (y/n): ');
            if (!/^y$/i.exec(answer)) break;
        }

        console.log('Wikipedia link (omit if it does not exist):');
        let wp = ( await questionAsync('> ') ).trim();
        let wd = '', mgp = '', mt = '', mgpTitle, mtTitle, birth = '', death = '';

        if (/^https?:\/\/\w+\.wikipedia.org\/wiki\//.test(wp)) {
            try {
                // Fetch Wikipedia
                console.log('Fetching Wikipedia...');
                let response = await requestAsync(wp);

                let match = /<li id="t-wikibase"><a href="https:\/\/www.wikidata.org\/wiki\/Special:EntityPage\/(Q\d+)"/.exec(response);
                if (match) {
                    wd = match[1];
                } else {
                    console.log('Wikidata item not found. Please enter:')
                    wd = await questionAsync('> ');
    
                    while (!/^Q\d+$/.test(wd)) {
                        console.log('Please enter a valid Wikidata ID, eg. Q12345:')
                        wd = await questionAsync('> ');
                    }
                }
            } catch (err) {
                console.log(err);
                continue;
            }
        } else {
            console.log('Wikidata item:')
            wd = await questionAsync('> ');

            while (!/^Q\d+$/.test(wd)) {
                console.log('Please enter a valid Wikidata ID, eg. Q12345:')
                wd = await questionAsync('> ');
            }
        }

        // Fetch Wikidata
        try {
            let query = `
                SELECT ?mgp ?mt ?b ?d WHERE {
                    OPTIONAL { wd:${wd} wdt:P549 ?mgp }
                    OPTIONAL { wd:${wd} wdt:P1563 ?mt }
                    OPTIONAL { wd:${wd} wdt:P569 ?b }
                    OPTIONAL { wd:${wd} wdt:P570 ?d }
                }`;
            query = query.replace(/\n/g, ' ').replace(/\s+/g, ' ');
            let queryUrl = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURI(query);

            console.log('Fetching Wikidata...');
            let queryResponse = await requestAsync(queryUrl);
            let json = JSON.parse(queryResponse);

            let result = json.results.bindings[0];
            if (result) {
                if (result.mgp) {
                    mgp = result.mgp.value;

                    try {
                        console.log('Fetching MGP...');
                        let mgpResponse = await requestAsync('https://mathgenealogy.org/id.php?id=' + mgp);
                        mgpTitle = /<title>([^<]+) - The Mathematics/.exec(mgpResponse)[1];
                    } catch (err) {
                        console.log(err);
                    }
                }

                if (result.mt) { 
                    mt = result.mt.value;

                    try {
                        console.log('Fetching MacTutor...');
                        let mtResponse = await requestAsync('https://mathshistory.st-andrews.ac.uk/Biographies/' + mt);
                        mtTitle = /<title>([^<(]+) [(\-]/.exec(mtResponse)[1].trim();
                    } catch (err) {
                        console.log(err);
                    }
                }

                if (result.b) birth = result.b.value.substr(0, 4);
                if (result.d) death = result.d.value.substr(0, 4);
            }
        } catch (err) {
            console.log(err);
            continue;
        }

        console.log('Fetching done!\n');
        let lang = await questionAsync('Language code: ');

        // compute some fields
        let wpTitle = wp ? decodeURI( wp.replace(/.+\/wiki\//, '') ).replace( /_/g, ' ' ) : '';
        let lastName = wpTitle.replace(/.+ /, '');
        let firstNames = wpTitle.substr(0, wpTitle.length - lastName.length).trim();

        let links = '';
        if (wp) {
            links += `\n        "{{wiki|${ wpTitle.replace(/ /g, '_') }}}",`;
        }
        if (mgp) {
            links += `\n        "{{mgp|${ mgp }|${ mgpTitle || '' }}}",`;
        }
        if (mt) {
            links += `\n        "{{mt|${ mt }|${ mtTitle || '' }}}",`;
        }
        links = links.substr(0, links.length - 1);

        // orthography section
        let orth = '', origText = '';
        switch (lang) {
            case 'el':
            case 'grc':
                console.log('Full name in modern Greek:');
                origText = await questionAsync('> ');
                orth += `\n        "{{el}}",`;
                orth += `\n        "> {{dict}} {{orth|el|${origText}}}",`;
                orth += `\n        "> {{el-iso-tl}} {{orth|el-Latn|${ transliterate(origText, 'el-iso-tl') }}}",`;
                orth += `\n        "> {{el-iso-tr}} {{orth|el-Latn|${ transliterate(origText, 'el-iso-tr') }}}"`;
                break;
            case 'ru':
                console.log('Full name in Russian:');
                origText = await questionAsync('> ');

                if (!origText.includes('́')) {
                    orth += `\n        // Please add stress marks manually.`;
                }
                orth += `\n        "{{ru}}",`;
                orth += `\n        "> {{dict}} {{orth|ru|${origText}}}",`;
                orth += `\n        "> {{ru-curs}} {{orthi|ru|${ origText.replace(/́/g, '') }}}",`;
                orth += `\n        "> {{ru-sci}} {{orth|ru-Latn|${ transliterate(origText, 'ru-sci') }}}",`;
                orth += `\n        "> {{ru-en}} {{orth|en|${ transliterate(origText, 'ru-en') }}}",`;
                orth += `\n        "*> {{ru-de}} {{orth|de|${ transliterate(origText, 'ru-de') }}}",`;
                orth += `\n        "*> {{ru-fr}} {{orth|fr|${ transliterate(origText, 'ru-fr') }}}"`;
                break;
            case 'ja':
                orth = `
        "{{ja}}",
        "> {{dict}} {{lang|ja|}}",
        "> {{ja-hep}} {{orth|ja-Latn|}}",
        "> {{ja-ks}} {{orth|ja-Latn|}}"`;
                break;
            case 'uk':
                orth = `
        "{{uk}}",
        "> {{dict}} {{lang|uk|}}",
        "> {{uk-curs}} {{orthi|uk|}}",
        "> {{uk-sci}} {{orth|uk-Latn|}}",
        "> {{uk-nat}} {{orth|uk-Latn|}}"]`;
                break;
            case 'zh':
                orth = `
        "{{zh}}",
        "> {{dict}} {{lang|zh|}}",
        "> {{zh-pinyin}} {{lang|zh|}}",
        "> {{zh-wg}} {{lang|zh|}}",
        "> {{zh-gr}} {{lang|zh|}}"`;
                break;
        }
        if (orth) {
            orth = '\n    "orth": [' + orth + '\n    ],';
        }
        
        // pronunciation section
        let pron1 = `
                "{{${lang}|orig}}@@@ {{ipa|${lang}|}} {{audio|}}",
                "{{en|aprx}} {{ipb|en|}}"`,
            pron2 = `
                "{{${lang}|orig}}@@@ {{ipa|${lang}|}} {{audio|}}"`;

        let origLastName = origText.replace(/.+ /, '');

        switch (lang) {
            case 'en':
                pron1 = `
                "{{en|orig}} {{ipb|en|}}",
                // Mark one of the following as {{en-XX|orig*}}.
                "> {{en-GB}} {{ipa|en-GB|}} {{audio|}}",
                "> {{en-US}} {{ipa|en-US|}} {{audio|}}"`;
                pron2 = `
                "{{en|orig}} {{ipb|en|}}",
                "> {{en-GB}} {{ipa|en-GB|}} {{audio|}}",
                "> {{en-US}} {{ipa|en-US|}} {{audio|}}"`;
                break;

            case 'grc':
                pron1 = `
                "{{el|orig}}",
                "> {{el-gre|orig*}} {{lang|el|${origLastName}|${ transliterate(origLastName, 'el-iso-tr') }}} {{ipa|el|}} {{audio|}}",
                "> {{el-grc|orig*|reconstructed}} {{lang|grc||}} {{ipb|grc|}}",
                "{{en|aprx}} {{ipb|en|}}"`;
                pron2 = `
                "{{el|orig}}",
                "> {{el-gre}} {{lang|el|${origText}|${ transliterate(origText, 'el-iso-tr') }}} {{ipa|el|}} {{audio|}}",
                "> {{el-grc|reconstructed}} {{lang|grc||}} {{ipb|grc|}}""`;
                break;

            case 'ru':
                pron1 = pron1.replace('@@@', ` {{lang|ru|${origLastName}|${ transliterate(origLastName, 'ru-en') }}}`);
                pron2 = pron2.replace('@@@', ` {{lang|ru|${origText}|${ transliterate(origText, 'ru-en') }}}`);
                break;

            case 'el':
                pron1 = pron1.replace('@@@', ` {{lang|el|${origLastName}|${ transliterate(origLastName, 'el-iso-tr') }}}`);
                pron2 = pron2.replace('@@@', ` {{lang|el|${origText}|${ transliterate(origText, 'el-iso-tr') }}}`);
                break;

            case 'he':
            case 'hi':
            case 'ja':
            case 'ta':
            case 'uk':
            case 'yi':
            case 'zh':
                pron1 = pron1.replace('@@@', ` {{lang|${lang}||}}`);
                pron2 = pron2.replace('@@@', ` {{lang|${lang}||}}`);
                break;

            default:
                pron1 = pron1.replace('@@@', '');
                pron2 = pron2.replace('@@@', '');
                break;
        }

        // make output
        let output = 
`{
    "title": "${lastName}|, ${firstNames}",
    "wd": "${wd}",
    // Please write the desc field manually.
    "desc": "?|?|?|${birth}|${death}",
    "forms": [
        {
            "type": "family-name",
            "text": "${lastName}",
            "prons": [${pron1}
                // Add more languages here.
            ]
        },
        {
            "type": "full-name",
            "text": "${wpTitle}",
            "prons": [${pron2}
            ]
        }
    ],${orth}
    "links": [${links}
    ]
}`

        console.log('\n' + output + '\n');
    }

    process.exit(0);
}

main();
