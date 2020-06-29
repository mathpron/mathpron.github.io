let loaded;
let data, ipaConversion = {};
let ipaType = 'broad';
let isBusy, activeItem, activeReferences, needIpaSelector, activeInitial, selfHashChange;
let langLong = navigator.language || 'en-US';
let langShort = langLong.replace(/-.+/, '');
let setTimeoutHide, explainerShowing;
let searchTimeout, searchText, searchListHasTouch;
let langButtonPressed, reportButtonPressed;
const hashes = {}, allEntries = [], stats = {}, idx = [];
const diacriticsMap = {}, diacriticsRegex = /[\u0300-\u036F]/g, diacriticsAtStartRegex = /^[\u0300-\u036F]*/;
const cjkLanguages = ['zh'];

// from https://stackoverflow.com/q/990904
const diacriticsRemovalMap = [{'base':'a','letters':'ⱥ'},{'base':'aa','letters':'ꜳ'},{'base':'ae','letters':'æ'},{'base':'ao','letters':'ꜵ'},{'base':'au','letters':'ꜷ'},{'base':'av','letters':'ꜹꜻ'},{'base':'ay','letters':'ꜽ'},{'base':'b','letters':'ƀƃɓ'},{'base':'c','letters':'ƈȼ'},{'base':'d','letters':'đƌɖɗꝺ'},{'base':'e','letters':'ɇ'},{'base':'f','letters':'ƒꝼ'},{'base':'g','letters':'ǥɠꞡᵹ'},{'base':'h','letters':'ħⱨ'},{'base':'hv','letters':'ƕ'},{'base':'i','letters':'ɨı'},{'base':'j','letters':'ɉ'},{'base':'k','letters':'ƙⱪꝁꝃꝅꞣ'},{'base':'l','letters':'łƚɫⱡꝉꞁꝇ'},{'base':'m','letters':'ɱ'},{'base':'n','letters':'ƞɲꞑꞥ'},{'base':'o','letters':'øøꝋꝍɵ'},{'base':'oi','letters':'ƣ'},{'base':'ou','letters':'ȣ'},{'base':'oo','letters':'ꝏ'},{'base':'p','letters':'ƥᵽꝑꝓꝕ'},{'base':'q','letters':'ɋꝗꝙ'},{'base':'r','letters':'ɍɽꝛꞧꞃ'},{'base':'s','letters':'ȿꞩꞅ'},{'base':'ss','letters':'ß'},{'base':'t','letters':'ŧƭʈⱦꞇ'},{'base':'tz','letters':'ꜩ'},{'base':'u','letters':'ʉ'},{'base':'v','letters':'ʋꝟ'},{'base':'vy','letters':'ꝡ'},{'base':'w','letters':'ⱳ'},{'base':'y','letters':'ƴɏỿ'},{'base':'z','letters':'ƶȥɀⱬꝣ'},{'base':"'",'letters':'‘’'}];

$.getJSON('./data.json?_v=' + Math.floor(Date.now() / 86400000 - 1 / 6), function (json) { // bust cache at 4am
    data = json;
    if (loaded) initialise();
});

$(function () {
    loaded = true;
    if (data) initialise();
});

String.prototype.replaceAll = function (searchValue, replaceValue) {
    if (typeof searchValue === 'string') {
        replaceValue = replaceValue.toString();
        let index = 0;
        let result = this;
        while (true) {
            let i = result.indexOf(searchValue, index);
            if (i === -1) break;
            result = result.substring(0, i) + replaceValue + result.substring(i + searchValue.length);
            index = i + replaceValue.length;
        }
        return result;
    }
}

function initialise() {
    $('html').attr('lang', langLong);
    document.title = getString('title') + ' – ' + getString('title-text');

    $('h1').removeClass('hidden');

    let langNames = data.strings['available-languages'], langs = [];
    $.each(langNames, function (key, _value) {
        langs.push(key);
    });
    if (!langs.includes(langLong)) {
        if (!langs.includes(langShort)) {
            langShort = 'en';
        }
        langLong = langShort;
    }

    $('span[data-string-id]').each(function () {
        const str = getString($(this).data('string-id'));
        if (str) {
            $(this).html(str);
        }
    });
    $('#search-input').attr('placeholder', getString('search-box-placeholder'));
    $('.lang-button').text( langNames[langLong] );
    
    if (cjkLanguages.includes(langShort)) {
        $('.content').addClass('content-cjk');
    }

    $('.tabs-container .tab').each(function () {
        const initial = $(this).data('header');
        if (data.items[initial]) {
            $(this).removeClass('tab-disabled');
        }
    });

    $('.tabs-container .tab').click(function () {
        if (isBusy) return;

        const $this = $(this);
        if ($this.hasClass('tab-selected') || $this.hasClass('tab-disabled')) return;
        const initial = $this.data('header');
        animateLoadIndex(initial);
    });

    $('#ipa-explainer-container').hover(function () {
        clearTimeout(setTimeoutHide);
    }, hideIpaExplainer).focusout(hideIpaExplainer);

    $('#ipa-explainer .ipa-notes-button').click(function () {
        if (window.location.hash !== '#IPA_Notes') {
            window.open('#IPA_Notes');
        } else {
            hideIpaExplainer();
        }
    });

    // diacritics map
    for (var i = 0; i < diacriticsRemovalMap.length; i++){
        var letters = diacriticsRemovalMap[i].letters;
        for (var j = 0; j < letters.length ; j++){
            diacriticsMap[letters[j]] = diacriticsRemovalMap[i].base;
        }
    }

    // initialise hashes and index
    $.each(data.items, function (key, value) {
        value.forEach(function (item) {
            let name = item.title.replaceAll('|', '').replaceAll(' ', '_');

            if (item.forms) {
                let entryId = allEntries.push({
                    hash: name,
                    entry: item
                }) - 1, formId = -1;
                item.forms.forEach(form => {
                    formId++;
                    if (!form.type || !form.text || !form.prons) return;
                    if (!form.type.endsWith('name')) return;

                    idx.push({
                        words: toSearchForm(form.text).split(' '),
                        text: form.text,
                        entryId: entryId,
                        formId: formId,
                        extraScore: formId === 0 ? 10 : 5
                    });

                    if (form.alt) {
                        form.alt.forEach(alt => {
                            idx.push({
                                words: toSearchForm(alt).split(' '),
                                text: alt,
                                entryId: entryId,
                                formId: formId,
                                extraScore: formId === 0 ? 8 : 5
                            });
                        });
                    }

                    form.prons.forEach(pron => {
                        let match = pron.match(/\{\{lang\|[a-zA-Z\-]+\|([^{|}]+)(?=(\|[^{|}]*)*\}\})/g);
                        if (!match) match = [];

                        if (pron.includes('{{ruby|')) {
                            let ruby1 = pron.replace(/\{\{ruby\|([^\{\|\}]+)\|([^\{\|\}]+)\}\}/g, '$1');
                            let ruby2 = pron.replace(/\{\{ruby\|([^\{\|\}]+)\|([^\{\|\}]+)\}\}/g, '$2');
                            match = match
                                .concat(ruby1.match(/\{\{lang\|[a-zA-Z\-]+\|([^{|}]+)(?=(\|[^{|}]*)*\}\})/g) || [])
                                .concat(ruby2.match(/\{\{lang\|[a-zA-Z\-]+\|([^{|}]+)(?=(\|[^{|}]*)*\}\})/g) || []);
                        }

                        match.forEach(result => {
                            let lang = result.match(/\|([a-zA-Z\-]+)\|/)[1];
                            result = result.replace(/.+\|/, '');

                            idx.push({
                                words: toSearchForm(result).split(' '),
                                text: result,
                                entryId: entryId,
                                formId: formId,
                                lang: lang,
                                extraScore: /^[^\}]*\|(tran|aprx)/.test(pron) ? 0 : 5
                            });
                        });
                    });
                });
            }
            hashes[name] = {
                initial: key,
                item: item
            };
        });
    });
    stats['entries'] = allEntries.length;

    // build regex from strings stored in data
    $.each(data.ipaConversion, function (key, value) {
        let newValue = {};
        $.each(value, function (key, arr) {
            let newArr = [];
            arr.forEach(function (rep) {
                newArr.push([ new RegExp(rep[0], 'g'), rep[1] ]);
            });
            newValue[key] = newArr;
        });
        ipaConversion[key] = newValue;
    });

    // search box
    $('#search-input').on('input focus', function () {
        let text = $(this).val();
        if (searchText !== text) {
            searchText = text;
            if (searchTimeout) clearTimeout(searchTimeout);
            if (text !== '') {
                searchTimeout = setTimeout(() => {
                    searchTimeout = undefined;
                    onSearch(text);
                }, 300);
            } else {
                $('.search-list-shadow-caster').hide();
                $('#search-list-container').hide();
            }
        }
    });
    
    $('#search-input').focusout(function () {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchText = undefined;
        if (!($('#search-list-container').is(':hover') || searchListHasTouch)) {
            $('.search-list-shadow-caster').hide();
            $('#search-list-container').hide();
        } else {
            $(this).addClass('fake-focus');
            $('#search-list-container').addClass('needs-to-close');
        }
    });

    $('#search-list-container').on('touchstart touchmove', function () {
        searchListHasTouch = true;
    });

    function onSearchListHoverOut() {
        const $container = $('#search-list-container');
        if ($container.hasClass('needs-to-close')) {
            $('#search-input').removeClass('fake-focus');
            $container.removeClass('needs-to-close').hide();
            $('.search-list-shadow-caster').hide();
        }
    }
    $('#search-list-container').on('mouseleave touchend touchcancel', function () {
        if (searchListHasTouch) {
            // delay touch-end event by 500ms, as if user pressed it for longer, so items could receive click event.
            setTimeout(() => {
                searchListHasTouch = false;
                onSearchListHoverOut();
            }, 500);
        } else {
            onSearchListHoverOut();
        }
    });

    // touch screen
    $('html').on('touchend', function () {
        $('.touch-highlight').removeClass('touch-highlight');
    });

    // language change
    const $langList = $('#lang-list');
    langs.forEach(lang => {
        const $item = $('<div class="lang-list-item">').data('lang', lang)
            .html( expandTemplates( '{{lang-code|' + lang + '}} {{lang|' + lang + '|' + langNames[lang] + '}}' ) );
        $langList.append($item);
    });

    $langList.find('.lang-list-item').click(function () {
        let lang = $(this).data('lang');
        langLong = lang;
        langShort = lang.replace(/-.*/, '');
        changeLanguage();
    });

    const $langContainer = $('#lang-list-container');
    $('.lang-button').click(function () {
        let containerWidth = $langContainer.outerWidth(), windowWidth = $(window).width();
        let left = $('.lang-button').position().left + $('.lang-button').outerWidth() / 2 - containerWidth / 2;
        if (left + containerWidth > windowWidth - 10) { left = windowWidth - 10 - containerWidth; }
        $langContainer.css('left', left);
        $langContainer.show(200);
    });

    $('.lang-button, .lang-container').click(function () {
        langButtonPressed = true;
        setTimeout(() => {
            langButtonPressed = false;
        }, 1000);
    });

    $('#report-button-container').click(function() {
        reportButtonPressed = true;
        setTimeout(() => {
            reportButtonPressed = false;
        }, 1000);
    });

    $('body').click(function () {
        if ($langContainer.is(':visible') && !langButtonPressed) {
            $langContainer.hide();
        }
        if ($('#report-button-container').is(':visible') && !reportButtonPressed) {
            $('#report-button-container').hide();
        }
    });

    $(window).on('resize', onResize);

    $(window).on('hashchange', onHashChange);
    onHashChange();
}

function changeLanguage() {
    $('html').attr('lang', langLong);
    document.title = getString('title') + ' – ' + getString('title-text');

    $('span[data-string-id]').each(function () {
        const str = getString($(this).data('string-id'));
        if (str) {
            $(this).html(str);
        }
    });
    $('#search-input').attr('placeholder', getString('search-box-placeholder'));
    $('.lang-button').text( data.strings['available-languages'][langLong] || langLong );
    
    if (cjkLanguages.includes(langShort)) {
        $('.content').addClass('content-cjk');
    } else {
        $('.content').removeClass('content-cjk');
    }

    onResize();

    selfHashChange = '';
    onHashChange();
}

function onResize() {
    $('#lang-list-container').hide();
    $('#ipa-explainer-container').hide();
}

function toSearchForm(text) {
    // final NFC required to treat japanese kana etc. and their diacritics as a whole
    return text.replace(/[-–·・゠,.，。、]/g, ' ').normalize('NFKD').toLowerCase().replace(diacriticsRegex, '').replace(/[^\u0000-\u007E]/g, a => diacriticsMap[a] || a).replace(/\s+/g, ' ').trim().normalize('NFC');
}

// if text matches input, highlight the matching part of text
function makeHighlights(input, text) {
    let words = toSearchForm(input).split(' '), onlyOneWord = words.length === 1;
    let titleWords = toSearchForm(text).split(' ');
    let matches = words.map(word => backtrackSearch(word, titleWords, 1, onlyOneWord ? 10000 : 1, true));
    let flag = true;
    matches.forEach(match => flag &= match.score >= 0);
    
    let newText;
    if (flag) {
        // matching, do highlight.
        let hlPattern = toSearchForm(text);
        matches.forEach(match => {
            let i = 0;
            match.hl.forEach(word => {
                for (let j = 0; j < word.length; j++, i++) {
                    if (word[j] === '+') {
                        hlPattern = hlPattern.substr(0, i) + '+' + hlPattern.substr(i + 1);
                    }
                }
                i++;
            });
        });

        i = 0; newText = ''; let originalText = text;
        while (text.length > 0) {
            let unit = text.charAt(0);
            text = text.substr(unit.length);
            let match = text.match(diacriticsAtStartRegex);
            unit += match[0];
            text = text.substr(match[0].length);

            let unitPlain = toSearchForm(unit);
            if (unitPlain === '') { 
                if (input.includes(unit)) {
                    newText += '<<' + htmlEncode(unit) + '>>';
                } else {
                    newText += htmlEncode(unit); 
                }
                continue; 
            }

            while (hlPattern[i] === ' ') i++;
            let hlUnit = hlPattern.substr(i, unitPlain.length);
            i += unitPlain.length;

            if (hlUnit.includes('+')) {
                newText += '<<' + htmlEncode(unit) + '>>'; continue;
            } else if (hlUnit === unitPlain) {
                newText += htmlEncode(unit); continue;
            } else {
                // shouldn't happen
                return htmlEncode(originalText);
            }
        }

        newText = newText.replace(/>><</g, '').replace(/<</g, '<span class="search-item-highlight">').replace(/>>/g, '</span>')
        return newText;
    } else {
        // not matching.
        return htmlEncode(text);
    }
}

function onSearch(text) {
    if (text.length > 100) text = text.substr(0, 100);
    let input = text;
    text = toSearchForm(text);

    let results = search(text);
    const $container = $('#search-list-container').css('width', $('#search-input').outerWidth() - 2); // 2px = border of container
    const $list = $container.find('#search-list').html('');

    if (results && results.length > 0) {
        $container.find('.search-list-no-results').addClass('hidden');

        results.forEach(result => {
            const $item = $('<div class="search-list-item">').data('entry-id', result.entryId);

            let header = allEntries[result.entryId].hash.replaceAll('_', ' ');
            const $header = $('<div class="search-item-header">').html(makeHighlights(input, header));
            $item.append($header);

            let entry = allEntries[result.entryId].entry;
            const $subheader = $('<div class="search-item-subheader">').html(
                htmlEncode(getString('form-type-' + entry.forms[result.formId].type)) +
                htmlEncode(result.lang ? ' (' + getString('lang-' + result.lang) + ')' : '') +
                htmlEncode(getString('colon')) +
                (result.lang ? '<span lang="' + result.lang + '">' : '') + 
                makeHighlights(input, result.text) + 
                (result.lang ? '</span>' : '')
            );
            $item.append($subheader);

            $list.append($item);
        });
    } else {
        $container.find('.search-list-no-results').removeClass('hidden');
    }

    $container.find('.search-list-item').click(function () {
        let entryId = $(this).data('entry-id');
        let hash = allEntries[entryId] && allEntries[entryId].hash;
        if (!hash) return;

        activeInitial = hashes[hash].initial;
        activeItem = hashes[hash].item;
        animateLoadActiveItem();

        $('#search-input').val('');
        $('.search-list-shadow-caster').hide();
        $('#search-list-container').hide();
    });

    $container.show();

    const $shadow = $('.search-list-shadow-caster');
    $shadow.css('width', $container.outerWidth()).css('height', $container.outerHeight() - 20).css('top', $container.position().top + 20);
    $shadow.show();
}

// text needs to be in search form
function search(text) {
    let words = text.split(' ').filter(word => word !== '');
    let isFirstWord = true, onlyOneWord = words.length === 1;
    let results = [];

    words.forEach(word => {
        (isFirstWord ? idx : results).forEach(item => {
            let score = backtrackSearch(word, item.words, 1, onlyOneWord ? 10000 : 1).score;
            if (score >= 0) {
                if (isFirstWord) {
                    results.push({
                        score: score,
                        extraScore: item.extraScore || 0,
                        words: item.words,
                        text: item.text,
                        entryId: item.entryId,
                        formId: item.formId,
                        lang: item.lang
                    });
                }
            } else {
                if (!isFirstWord) {
                    item.removed = true;
                }
            }
        });
        isFirstWord = false;
    });

    results = results.filter(item => !item.removed);
    results.sort((a, b) => b.score + b.extraScore - a.score - a.extraScore || a.entryId - b.entryId || a.formId - b.formId);

    // if non-fuzzy matches exist, then remove all fuzzy matches
    words.forEach(word => {
        results.forEach(item => {
            let score = backtrackSearch(word, item.words, 0, onlyOneWord ? 10000 : 1).score;
            if (score < 0) { item.removed = true; }
        });
    });
    let newResults = results.filter(item => !item.removed);
    if (newResults.length > 0) results = newResults;
    
    // remove duplicates
    let ids = []; newResults = [];
    for (let i = 0; i < results.length; i++) {
        let id = results[i].entryId;
        if (!ids.includes(id)) {
            // prefer full name over family name, if possible.  extraScore is not used.
            ids.push(id);
            newResults.push(results.filter(result => result.entryId === id).sort((a, b) => b.score - a.score || (a.formId === 0 ? 1 : b.formId === 0 ? -1 : a.formId - b.formId))[0]);
        } 
    }
    results = newResults;

    // return first 10 items
    if (results.length > 10) results = results.slice(0, 10);
    if (results.length === 0) return false;
    return results;
}

// returns a score which equals (# of adjacent pairs of letters) * 3 + (unused fuzzy points) * 10 + (words matching only the initial) * 1 + (full words) * 5
// fuzzy is the # of letters we are allowed to throw away from the input
// when computeHl is true, returns which letters are matched and highlighted (will be changed to '+')
const adjacentPairScore = 3, fuzzyPointScore = 10, initialOnlyBonus = 1, fullWordBonus = 5;
function backtrackSearch(text, words, fuzzy, wordLimit, computeHl) { 
    if (computeHl) {
        var hl = [];
        words.forEach(word => hl.push(word));
    }

    if (text === '') return { score: fuzzy * fuzzyPointScore, hl: hl };
    if (wordLimit === 0) return { score: -10000, hl: hl };
    if (!wordLimit) wordLimit = 10000;

    let score = -10000;
    let originalText = text;

    function addResult(result, index, textHl) {
        if (result.score > score && result.score >= 0) {
            score = result.score;
            if (computeHl) {
                hl = [];
                for (let i = 0; i < words.length; i++) {
                    if (i === index) {
                        hl.push(textHl);
                    } else if (i < index) {
                        hl.push(result.hl[i]);
                    } else if (i > index) {
                        hl.push(result.hl[i - 1]);
                    }
                }
            }
        }
    }

    for (let index = 0; index < words.length; index++) {
        text = originalText;
        let word = words[index];
        let textHl = word;
        if (word[0] === "'" && text[0] !== "'") text = "'" + text;
        if (text[0] !== word[0]) continue;
        let newWords = [], firstWordScore = 0;
        for (let i = 0; i < words.length; i++) { if (i !== index) newWords.push(words[i]); }

        let isContinuous = false, isFullWord = true;
        for (let i = 0; i < word.length; i++) {
            if (text[0] === word[i]) {
                if (isContinuous) firstWordScore += adjacentPairScore;
                isContinuous = true;

                if (computeHl && !(i === 0 && word[i] === '-')) {
                    textHl = textHl.substr(0, i) + '+' + textHl.substr(i + 1);
                }

                // try to go to the next word and see if it matches
                text = text.substr(1);
                let result = backtrackSearch(text, newWords, fuzzy, wordLimit - 1, computeHl);
                result.score += firstWordScore;
                if (i === 0) result.score += initialOnlyBonus; // extra point for matching only the initial
                if (isFullWord && i === word.length - 1) result.score += fullWordBonus;
                addResult(result, index, computeHl && textHl);
                
                if (fuzzy > 0) { 
                    // now, assume text[0] is mistyped and go to the next word
                    let result = backtrackSearch(text.substr(1), newWords, fuzzy - 1, wordLimit - 1, computeHl);
                    result.score += firstWordScore;
                    if (isFullWord && i === word.length - 1) result.score += fullWordBonus;
                    addResult(result, index, computeHl && textHl);
                }
            } else {
                isContinuous = false;
                isFullWord = false;

                if (fuzzy > 0 && text[1] && text[1] === word[i]) {
                    // now, assume the text[0] is mistyped and continue the current word
                    // put '-' in front to ensure only this word is matched
                    newWords.push('-' + word.substr(i));
                    let result = backtrackSearch('-' + text.substr(1), newWords, fuzzy - 1, wordLimit, computeHl);
                    result.score += firstWordScore;
                    if (computeHl) {
                        let newHl = result.hl.pop().replace('-', textHl.substr(0, i));
                        let swapped = text[0] === word[i + 1];
                        if (swapped && newHl[i + 1] !== '+') {
                            newHl = newHl.substr(0, i + 1) + '+' + newHl.substr(i + 2);
                            result.score += adjacentPairScore;
                        }
                        addResult(result, index, newHl);
                    } else {
                        addResult(result, index);
                    }
                    newWords.pop();
                }
            }
        }
    }
    return { score: score, hl: hl };
} 

function onHashChange() {
    if (decodeURI(window.location.hash) === selfHashChange) { // change made by code
        return;
    }
    selfHashChange = '';

    $('.tabs-container .tab').removeClass('tab-selected');

    const hash = (decodeURI(window.location.hash) || '#').substring(1);
    if (hash.length === 1 && data.items[hash]) {
        activeInitial = hash;
        $('.tabs-container .tab[data-header=' + hash + ']').addClass('tab-selected');
        loadIndex(hash);
    } else if (hashes[hash]) {
        activeInitial = hashes[hash].initial;
        activeItem = hashes[hash].item;
        loadActiveItem();
    } else if (hash.startsWith('debug-') && ipaConversion[hash.substr(6)]) {
        debugLoadLanguage(hash.substr(6));
    } else {
        activeInitial = 'A';
        $('.tabs-container .tab[data-header=A]').addClass('tab-selected');
        loadIndex('A');
    }

    if ($('html').scrollTop() > $('.content').offset().top) {
        $('html').scrollTop($('.content').offset().top);
    }
}

function debugLoadLanguage(lang) {
    $('h1#the-h1').removeClass('index-h1').text(getString('lang-' + lang));
    document.title = getString('title') + ' – ' + getString('title-text');

    const $content = $('#content');
    $content.html('');

    ipaType = 'debug';
    $('.under-header').html(getIpaSelectors());
    
    let regex = new RegExp('\\{\\{ip[ab]\\|' + lang + '\\|[^\\}]*\\}\\}');
    $.each(data.items, function (_key, value) {
        value.forEach(function (item) {
            if (!item.forms) return;
            item.forms.forEach(function (form) {
                if (!form.prons) return;
                form.prons.forEach(function (pron) {
                    let match = pron.match(regex);
                    if (match) { 
                        let str = match[0];
                        match = pron.match(/\{\{audio\|.*?\}\}/);
                        if (match) str += ' ' + match[0];
                        $content.append($('<div>').html(expandTemplates(str)));
                    }
                });
            });
        });
    });

    // audio
    $('span.audio').click(function () {
        $(this).children('audio')[0].play();
    });

    changeIpaType('std');
}

function animateLoadIndex(initial) {
    const $tab = $('.tabs-container .tab[data-header=' + initial + ']');
    if (data.items[initial]) {
        isBusy = true;
        $('.content').animate({ opacity: 0 }, 200, 'linear', function () {
            selfHashChange = '#' + initial;
            window.location.hash = '#' + initial;
            $('.tab-selected').removeClass('tab-selected');
            loadIndex(initial);
            $tab.addClass('tab-selected');
            $('.content').animate({ opacity: 1 }, 200, 'linear', function () {
                isBusy = false;
            });
        });

        if ($('html').scrollTop() > $('.content').offset().top) {
            $('html').animate({ scrollTop: $('.content').offset().top }, 300);
        }
    }
}

function getIpaSelectors(isIndex) {
    const $ipaSelectors = $('<span class="ipa-selectors">').html(getString('ipa-selector-prefix') + 
        '<span class="fake-link ipa-selector" data-ipa-type="broad">' + getString('ipa-selector-broad') +
        '</span> · <span class="fake-link ipa-selector" data-ipa-type="std' + (isIndex ? '*' : '') + '">' + getString('ipa-selector-std') +
        (isIndex ? '' : '</span><span class="hide-if-audio-is-std"> · <span class="fake-link ipa-selector" data-ipa-type="audio">' + getString('ipa-selector-audio')) + 
        (ipaType === 'debug' ? '</span> · <span class="fake-link ipa-selector" data-ipa-type="debug">Plain' : '') + 
        '</span></span>');

    if (isIndex && (ipaType === 'audio' || ipaType === 'std')) ipaType = 'std*';
    if (!isIndex && ipaType === 'std*' || ipaType === 'debug') ipaType = 'std';

    $ipaSelectors.find('span.ipa-selector[data-ipa-type=' + ipaType.replace('*', '\\*') + ']').addClass('selected');
    $ipaSelectors.find('span.ipa-selector').click(function () {
        const $this = $(this);
        if ($this.hasClass('selected')) return;
        $('span.ipa-selectors span.ipa-selector').removeClass('selected');
        $this.addClass('selected');
        changeIpaType($this.data('ipa-type'));
    });
    return $ipaSelectors;
}

function getReportButtons() {
    const $buttons = $('<div>');
        
    $buttons.append($('<span class="fake-link" data-long-string="report-an-error-long" data-href="https://github.com/mathpron/mathpron.github.io/issues/new?template=correct-an-error.md">').text(getString('report-an-error-short')));
    $buttons.append($('<span class="under-header-separator">'));
    $buttons.append($('<span class="fake-link" data-long-string="suggest-a-new-entry-long" data-href="https://github.com/mathpron/mathpron.github.io/issues/new?template=suggest-a-new-entry.md">').text(getString('suggest-a-new-entry-short')));

    $buttons.find('span.fake-link').click(function () {
        reportButtonPressed = true;
        setTimeout(() => {
            reportButtonPressed = false;
        }, 1000);

        const $container = $('#report-button-container');
        $container.html('').append(
            $('<span>').text( getString($(this).data('long-string') + '-before') )
        ).append(
            $('<a target="_blank" href="' + $(this).data('href') + '">').text( 'GitHub' )
        ).append(
            $('<span>').text( getString($(this).data('long-string') + '-after') )
        );

        let containerWidth = $container.outerWidth(), windowWidth = $(window).width();
        let left = $(this).position().left + $(this).outerWidth() / 2 - containerWidth / 2;
        if (left + containerWidth > windowWidth - 10) { left = windowWidth - 10 - containerWidth; }
        $container.css('left', left).show(200);
    });

    return $buttons;
}

function loadIndex(initial) {
    if (!data.items[initial]) return;

    const $content = $('#content');
    $content.html('');

    $('#the-h1').addClass('index-h1').text(initial);
    activeInitial = initial;
    document.title = getString('title') + ' – ' + getString('title-text');

    $('.under-header').html(getIpaSelectors(true)).append($('<div class="under-header-grow">')).append(getReportButtons());

    const translit = getTranslitRegex();

    data.items[initial].forEach(function (item) {
        const $item = $('<div class="index-item">');
        $item.data('item', item);
        $item.append($( '<span><span class="bold-term">' + item.title.replace('|', '</span>') + '</span>' ));

        if (initial.length === 1 && item.forms && item.forms[0].prons) {
            item.forms[0].prons.forEach(function (str) {
                var match = str.match(/[> ]*^\{\{(en)\|orig[^}]*\}\} \/([^\/]+)\//);
                if (match) { // native pronunciation in English
                    $item.append($( '<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="' + langName(match[1]) + '">' + match[1] + '</span> /' + expandTemplates(match[2], 'index') + '/</span>' ));
                    return;
                }
                match = str.match(/^[> ]*\{\{([^|}+]+)[^|}]*\|orig[^}]*\}\} (\{\{ip[ab]\|[^\}]+\}\})/);
                if (match) { // native pronunciation in {{ipa|lang|...}}
                    $item.append($( '<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="' + langName(match[1]) + '">' + match[1] + '</span> ' + expandTemplates(match[2], 'index') + '</span>' ));
                    return;
                }
                match = str.match(/^[> ]*\{\{([^|}+]+)[^|}]*\|orig[^}]*\}\} (.*?) (\{\{ip[ab]\|[^\}]+\}\})/);
                if (match) { // native pronunciation with a different script
                    $item.append($( '<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="' + langName(match[1]) + '">' + match[1] + '</span> ' + expandTemplates(match[2], 'index') + ' ' + expandTemplates(match[3], 'index') + '</span>' ));
                    return;
                }
                match = str.match(/^[> ]*\{\{en\|aprx[^}]*\}\} (\{\{ip[ab]\|[^\}]+\}\})/);
                if (match) { // English approximation
                    $item.append($( '<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="' + langName('en').replace(/^(.+)$/, langName('aprx')) + '">en~</span> ' + expandTemplates(match[1], 'index') + '</span>' ));
                }
                if (translit) {
                    match = str.match(translit);
                    if (match) {
                        $item.append($( '<span> <span class="center-dot">⋅</span>&nbsp;<span class="index-translit">' + match[1] + '</span>' ));
                    }
                }
            });
        }

        $item.click(onIndexItemClick);
        $item.on('touchstart', function () {
            $(this).addClass('touch-highlight');
        });

        $content.append($item);
    });

    changeIpaType(ipaType);
}

function loadActiveItem() {
    if (!activeItem) return;
    activeReferences = [];
    needIpaSelector = false;

    const $content = $('#content');
    $content.html('');

    let h1Text = activeItem['alt-title'] ? activeItem['alt-title'][langLong] || 
        activeItem['alt-title'][langShort] || 
        activeItem['alt-title']['en'] || 
        activeItem.title : activeItem.title;
    document.title = h1Text.replace('|', '') + ' - ' + getString('title');
    let h1Html = h1Text.replace('|,', ',|').replace(/\|(.*)/, '<span class="h1-lighter">$1</span>');
    if (!activeItem.forms) h1Html = '<span class="no-sc">' + h1Html + '</span>';
    $('#the-h1').removeClass('index-h1').html(h1Html);

    // add 'back' button and 'ipa: standard | broad'
    const $underHeader = $('.under-header').html('');
    if (activeInitial.length === 1) {
        const $backButton = $('<span class="fake-link">').text(getString('back-button'));
        $backButton.click(function () {
            if (activeInitial.length === 1) {
                animateLoadIndex(activeInitial);
            }
        });
        $underHeader.append($backButton);
        if (activeItem.forms) {
            $underHeader.append($('<span class="under-header-separator">'));
            $underHeader.append(getIpaSelectors());
            $underHeader.append($('<div class="under-header-grow">'));
            $underHeader.append(getReportButtons());
        }
    }

    if (activeItem.notes) {
        activeItem.notes.forEach(note => {
            let str = typeof note === 'string' ? note : (note[langLong] || note[langShort] || note['en'] || '');
            activeReferences.push(expandTemplates(str));
        });
    }

    if (activeItem.desc) {
        let desc = activeItem.desc;
        let args = desc.split('|'), html = getString('desc-template-' + args[0]);

        html = html.replaceAll('$o', '{{occ|' + args[1].replaceAll(' ', '|') + '}}');
        html = html.replaceAll('$c', '{{and|' + args[2].split(' ').map(arg => '{{string|dem-' + arg + '|' + arg + '}}').join('|') + '}}');
        let born = args[3].includes(' ') ? '{{' + args[3].replaceAll(' ', '|').replace(/^c\|/, 'circa|') + '}}' : args[3];
        if (!args[4]) {
            html = html.replaceAll('$y', '{{born|' + born + '}}');
        } else if (args[4] === '%') {
            html = html.replaceAll('$y', born);
        } else {
            let dead = args[4].includes(' ') ? '{{' + args[4].replaceAll(' ', '|').replace(/^c\|/, 'circa|') + '}}' : args[4];
            html = html.replaceAll('$y', '{{lifespan|' + born + '|' + dead + '}}');
        }
        
        $content.append($('<div class="entry-description">').html( expandTemplates(html) ));
    }

    if (activeItem.content || activeItem.intro) {
        if (activeItem.content) {
            var originalIpaType = ipaType;
            ipaType = 'std';
        }
        let content = activeItem.content || activeItem.intro;
        if (typeof content === 'object') { content = content[langLong] || content[langShort] || content['en'] || ''; }
        if (Array.isArray(content)) { content = content.join(' '); }
        $content.append($('<div class="content-article">').html( expandTemplates(content) ));
    }

    if (activeItem.forms) {
        $content.append($( '<h2>' + getString('header-pronunciation') + '</h2>' ));
        let expanderGroup = 0;
        activeItem.forms.forEach(function (form) {
            let anyStarred = false;
            $content.append($( '<h3>' + form.text + ' <span class="text-tag h3-space-before">' + getString('form-type-' + form.type) + '</span>' + '</h3>' ));
            if (form.alt) {
                $content.append($('<div class="alternative-spellings">').html( getString('alternative-spellings') + ' ' + form.alt.map(alt => '<span class="alternative-spelling">' + htmlEncode(alt) + '</span>').join(', ') ));
            }
            if (form.prons) {
                const $list = $('<ul class="pron-list">');
                form.prons.forEach(function (str) {
                    let level = 0, starred = false;
                    if (str.startsWith('*')) { starred = true; str = str.substring(1); }
                    while (str.startsWith('>')) { level++; str = str.substring(1); }
                    str = str.trim();
                    // starred item in user's language becomes unstarred
                    starred &= !( str.startsWith('{{' + langShort + '|') || str.startsWith('{{' + langShort + '}') );
                    anyStarred |= starred; 
                    
                    $list.append($('<li class="level-' + level + (starred ? ' pron-optional-' + expanderGroup + ' hidden' : '') + '">').html( expandTemplates(str) ));
                });
                $content.append($list);
            }

            if (anyStarred) {
                const $expander = $( '<div><span class="expander">⏷ ' + getString('show-more') + '<span></div>' );
                $content.append($expander);
                $expander.find('.expander').data('expanded', 'false').data('target', 'pron-optional-' + expanderGroup).click(function () {
                    const $this = $(this), target = $this.data('target');
                    if ($this.data('expanded') === 'true') {
                        $this.data('expanded', 'false').text('⏷ ' + getString('show-more'));
                        $('li.' + target).addClass('hidden');
                    } else {
                        $this.data('expanded', 'true').text('⏶ ' + getString('show-less'));
                        $('li.' + target).removeClass('hidden');
                    }
                });

                expanderGroup++;
            }
        });
    }

    if (activeItem.links) {
        $content.append($( '<h2>' + getString('header-external-links') + '</h2>' ));
        const $list = $('<ul>');
        activeItem.links.forEach(function (str) {
            str = expandTemplates(str);
            $list.append($('<li>').html( str ));
        });
        if (activeItem.wd && /Q[0-9]+/.test(activeItem.wd)) {
            $list.append($('<li>').html( expandTemplates('{{wikidata|' + activeItem.wd + '}}') ));
        }
        $content.append($list);
    }

    if (activeReferences.length > 0) {
        $content.append($( '<h2>' + getString('header-references') + '</h2>' ));
        const $list = $('<ol class="reference-list">');
        let refNum = 0;
        activeReferences.forEach(function (str) {
            str = expandTemplates('{{' + str + '}}') || expandTemplates('{{string|' + str + '}}') || expandTemplates(str);
            $list.append($('<li id="ref-' + (++refNum) + '">').html( str ));
        });
        $content.append($list);
    }

    initPage();
    if (originalIpaType) {
        ipaType = originalIpaType;
    }
}

function initPage() {
    // require
    let intendedIpaType = ipaType;
    $('div[data-require]').each(function () {
        const $this = $(this);
        let src = $this.data('require');
        $.ajax({
            url: '/content/' + src + '?_v=' + Math.floor(Date.now() / 86400000 - 1 / 6), // bust cache at 4am
            success: function (data) {
                $this.removeAttr('data-require').html( expandTemplates(data) );
                let originalIpaType = ipaType;
                ipaType = intendedIpaType;
                initPage();
                ipaType = originalIpaType;
            },
            error: function () {
                $this.removeAttr('data-require').addClass('content-ajax-fail').html( getString('content-ajax-fail') );
            }
        });
    });

    // references
    $('.ref-link').click(function () {
        let html = $('html')[0];
        $('html').animate({ scrollTop: html.scrollHeight - html.clientHeight }, 300);
    });

    // audio
    $('span.audio').click(function () {
        $(this).children('audio')[0].play();
    });

    // show ipa
    changeIpaType(ipaType);

    // set ipa selector
    if (!needIpaSelector) {
        $('.ipaSelectors').addClass('hidden');
    } else if (needIpaSelector === 'std') {
        $('span.hide-if-audio-is-std').addClass('hidden');
    }
}

function changeIpaType(type) {
    ipaType = type;
    $('span.ipa[data-src]').each(function () {
        const $this = $(this);
        $this.html(getIpa($this.data('src'), $this.data('lang'), $this.hasClass('ipa-broad') ? 'broad' : $this.hasClass('ipa-keep') ? 'keep' : type));
    });

    // ipa explanation
    $('span.ipa-word').click(onIpaClick).hover(function () {}, function () {
        clearTimeout(setTimeoutHide);
        setTimeoutHide = setTimeout(() => {
            hideIpaExplainer();
        }, 500);
    });
}

const ipaComponentMaxLength = 6;
function onIpaClick() {
    clearTimeout(setTimeoutHide);

    const $explainer = $('#ipa-explainer-container');
    const $container = $('body');
    const $this = $(this).closest('span.ipa-word');
    const ipa = $this.text().normalize('NFD');
    const position = $this.position();

    let html = '', inPrefix = false;

    for (let i = 0; i < ipa.length; i++) {
        if ('-,'.includes(ipa[i])) {
            html += '</span>' + htmlEncode(ipa[i]) + '<span class="ipa-unit">';
            continue;
        } if (ipa[i] === '.') {
            html += '</span><span class="ipa-dot">.</span><span class="ipa-unit">';
            continue;
        } if ('ˈˌ¹²'.includes(ipa[i])) {
            html += '</span><span class="ipa-stress-mark ipa-unit">' + htmlEncode(ipa[i]) + '</span><span class="ipa-unit">';
            continue;
        } if ('ꜜꜛ'.includes(ipa[i]) && ipa[i + 1] === 'ː') {
            html += '<span class="ipa-embedded-unit ipa-unit">' + ipa[i] + '</span>ː</span><span class="ipa-unit">';
            i++;
            continue;
        }

        for (var j = ipaComponentMaxLength; j > 0; j--) {
            if (i + j > ipa.length) continue; 
            if (data.ipa[ipa.substr(i, j)]) break;
        }
        if (j === 0) { 
            html += '</span><span class="ipa-unit">' + htmlEncode(ipa[i]) + '</span><span class="ipa-unit">';
            continue;
        }
        let d = data.ipa[ipa.substr(i, j)];
        if (d.startsWith('M') || d.startsWith('Z')) {
            html += htmlEncode(ipa.substr(i, j));
        } else {
            if (inPrefix) {
                html += htmlEncode(ipa.substr(i, j));
            } else {
                html += '</span><span class="ipa-unit">' + htmlEncode(ipa.substr(i, j));
            }
            inPrefix = d.startsWith('P');
        }
        i += j - 1;
    }
    html = '<span class="ipa-unit">' + html + '</span>';
    html = html.replace(/([˥˦˧˨˩])<\/span><span class="ipa-unit">(?=[˥˦˧˨˩])/g, '$1').replace(/<span class="ipa-unit"><\/span>/g, '');
    html = html.normalize('NFC');
    $explainer.find('span.ipa-display').html(html);

    $explainer.find('span.ipa-unit').click(function () {
        if ($(this).hasClass('ipa-unit-indirect-highlight')) return;
        $('.ipa-unit-highlight').removeClass('ipa-unit-highlight');
        $('.ipa-unit-indirect-highlight').removeClass('ipa-unit-indirect-highlight');
        $(this).addClass('ipa-unit-highlight').parent('.ipa-unit').addClass('ipa-unit-indirect-highlight');
        onIpaUnitClick();
    }).hover(function () {
        $(this).addClass('ipa-unit-highlight').parent('.ipa-unit').addClass('ipa-unit-indirect-highlight');
    }, function () {
        $(this).removeClass('ipa-unit-highlight').parent('.ipa-unit').removeClass('ipa-unit-indirect-highlight');
    });

    let left = position.left + $this.width() / 2 - $explainer.width() / 2;
    left = Math.min(left, $container.width() - $explainer.width() - 5);
    left = Math.max(left, 5)
    let top = position.top + $this.height() + 10;
    explainerShowing = true;
    $explainer.css('left', left).css('top', top);
    $explainer.show(200).focus();
}

function onIpaUnitClick() {
    const $this = $('span.ipa-unit.ipa-unit-highlight:not(.ipa-unit-indirect-highlight)');
    const ipa = $this.clone().children().remove().end().text().normalize('NFD'); // get text without child elements

    let seq = [], code = [];

    if (/^[˥˦˧˨˩]+$/.test(ipa)) {
        seq.push({
            text: ipa,
            data: ''
        });
    } else {
        for (let i = 0; i < ipa.length; i++) {
            for (var j = ipaComponentMaxLength; j > 0; j--) {
                if (i + j > ipa.length) continue; 
                if (data.ipa[ipa.substr(i, j)]) break;
            }
            if (j === 0) break;
    
            let d = data.ipa[ipa.substr(i, j)];
            if (d.startsWith('#')) {
                let e = d.substr(1).trim().split(' ');
                for (let k = 0; k < e.length; k++) {
                    seq.push({
                        text: e[k],
                        data: data.ipa[e[k]]
                    });
                    code.push(data.ipa[e[k]]);
                }
            } else if (d.includes('#')) {
                let index = d.indexOf('#');
                code.push(d.substr(0, index).trim());
                let e = d.substr(index + 1).trim().split(' ');
                for (let k = 0; k < e.length; k++) {
                    seq.push({
                        text: e[k],
                        data: data.ipa[e[k]]
                    });
                }
            } else {
                seq.push({
                    text: ipa.substr(i, j),
                    data: data.ipa[ipa.substr(i, j)]
                });
                code.push(data.ipa[ipa.substr(i, j)]);
            }
            i += j - 1;
        }
    }
    
    const $explainer = $('#ipa-explainer-container');
    $explainer.find('.ipa-detail-placeholder').addClass('hidden');
    const $detail = $explainer.find('.ipa-detail');
    $detail.html('').removeClass('hidden');

    seq.splice(0, 0, {
        text: ipa,
        data: code.join(' ')
    });
    
    // throw class Z symbols to the end
    let moved = 0;
    for (let i = 1; i < seq.length; i++) {
        if (seq[i - moved].data.startsWith('Z')) {
            let slice = seq.splice(i - moved, 1);
            seq.splice(seq.length, 0, slice[0]);
            moved++;
        }
    }

    // add to dom
    for (let i = 0; i < seq.length; i++) {
        const item = seq[i];
        const $item = $('<div class="ipa-detail-item level-' + (i === 0 ? 0 : 1) + '">');

        let text = item.text;
        if (text === '◌') continue;
        if ('̰̤̮̩̯̥̬̪̺̝̞̟̠̹̜̼̘̙̻͓̻̃̈̆̍̑̊̌͆͗͑̽̏̀̄́̋̂̌᷅᷄᷈̚ᵊˠʰʲʷᵝˤˀˢᶻᶴᶾᶳᶼᶝᶽʵʴ˞ːˑ⁎'.includes(text[0])) { text = '◌' + text; }
        if (text.length === 1 && 'ᵈᵗᵐⁿ'.includes(text[0])) { text = text + '◌'; }
        text = text.normalize('NFC');
        const $header = $('<span class="ipa" lang="fonipa">').text(text);
        $item.append($('<div class="ipa-detail-item-header">').append($header));

        let prevType;
        for (let j = 0; j < code.length; j++) if ('CV'.includes(code[j][0])) { prevType = code[j][0]; break; }
        const $body = $('<div class="ipa-detail-item-body">').text(getIpaName(item.text, item.data, prevType));
        $item.append($body);

        $detail.append($item);

        if (i === 0) {
            if (seq.length > 2) {
                const $subheader = $('<div class="ipa-detail-subheader no-select">').text(getString('ipa-detail-subheader'));
                $detail.append($subheader);
            } else {
                break;
            }
        }
    }
}

function getIpaName(text, code, prevType) {
    function cleanUp(result) {
        while (result.includes('  ')) result = result.replace('  ', ' ');
        result = result.trim();
        result = result[0].toUpperCase() + result.substr(1);
        return result;
    }

    if (data.strings['ipa-symbol-' + text]) {
        return cleanUp(getString('ipa-symbol-' + text));
    }
    let keyDepOnPrevType = 'ipa-symbol-after-' + (prevType === 'C' ? 'consonant' : prevType === 'V' ? 'vowel' : 'others') + '-' + text;
    if (data.strings[keyDepOnPrevType]) {
        return cleanUp(getString(keyDepOnPrevType));
    }
    if (/^[˥˦˧˨˩]+$/.test(text)) {
        return cleanUp(getString('ipa-symbol-tone-marks'));
    }

    let words = code.split(' ');
    for (let i = 0; i < words.length; i++) {
        var match = words[i].match(/^([CV])\.(\d+)\.(\d+)(\.[a-zA-Z]+)?/);
        if (match) break;
    }
    if (!match) return '';

    let type = match[1], n1 = parseInt(match[2]), n2 = parseInt(match[3]), flags = (match[4] || '.').substr(1).toLowerCase();

    // compute M.x.x.x
    for (let i = 0; i < words.length; i++) {
        const m = words[i].match(/^[MP]\.([+\-=<>0])(\d*)\.([+\-=<>0])(\d*)(\.(([+\-][a-zA-Z])+))?$/);
        if (!m) continue;
        switch (m[1]) {
            case '+': n1 += parseInt(m[2]); break;
            case '-': n1 -= parseInt(m[2]); break;
            case '=': n1  = parseInt(m[2]); break;
            case '>': n1 += Math.sign(parseInt(m[2]) - n1); break;
            case '<': n1 -= Math.sign(parseInt(m[2]) - n1); break;
        }
        switch (m[3]) {
            case '+': n2 += parseInt(m[4]); break;
            case '-': n2 -= parseInt(m[4]); break;
            case '=': n2  = parseInt(m[4]); break;
            case '>': n2 += Math.sign(parseInt(m[4]) - n2); break;
            case '<': n2 -= Math.sign(parseInt(m[4]) - n2); break;
        }
        if (m[5]) {
            for (let j = 0; j < m[6].length / 2; j++) {
                if (m[6][2 * j] === '+' && !flags.includes(m[6][2 * j + 1]))
                    flags += m[6][2 * j + 1];
                if (m[6][2 * j] === '-' && flags.includes(m[6][2 * j + 1]))
                    flags = flags.replace(m[6][2 * j + 1], '');
            }
        }
    }

    if (type === 'C') {
        let result = getString('ipa-consonant-template');
        result = result.replace('$1', data.strings['ipa-consonant-type-' + n1 + '-pos-' + n2] ? getString('ipa-consonant-type-' + n1 + '-pos-' + n2) : getString('ipa-consonant-type-' + n1));
        result = result.replace('$2', data.strings['ipa-consonant-pos-' + n2 + '-type-' + n1] ? getString('ipa-consonant-pos-' + n2 + '-type-' + n1) : getString('ipa-consonant-pos-' + n2));
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(a => {
            let key = 'ipa-consonant-attr-' + a + '-' + (flags.includes(a) ? 'true' : 'false');
            result = result.replace('$' + a, data.strings[key] ? getString(key) : '');
        });
        return cleanUp(result);
    }
    if (type === 'V') {
        let result = getString('ipa-vowel-template');
        result = result.replace('$1', getString('ipa-vowel-openness-' + n1));
        result = result.replace('$2', getString('ipa-vowel-backness-' + n2));
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(a => {
            let key = 'ipa-vowel-attr-' + a + '-' + (flags.includes(a) ? 'true' : 'false');
            result = result.replace('$' + a, data.strings[key] ? getString(key) : '');
        });
        return cleanUp(result);
    }
}

function hideIpaExplainer() {
    explainerShowing = false;
    const $explainer = $('#ipa-explainer-container');
    $explainer.hide();
    $explainer.find('.ipa-detail').addClass('hidden').html('');
    $explainer.find('.ipa-detail-placeholder').removeClass('hidden');
}

function onIndexItemClick() {
    if (isBusy) return;
    isBusy = true;

    activeItem = $(this).data('item');
    if (!activeItem) return;

    animateLoadActiveItem();
}

function animateLoadActiveItem() {
    $('.content').animate({ opacity: 0 }, 200, 'linear', function () {
        selfHashChange = '#' + activeItem.title.replace('|', '').replaceAll(' ', '_')
        window.location.hash = selfHashChange;
        $('.tab-selected').removeClass('tab-selected');
        loadActiveItem();
        $('.content').animate({ opacity: 1 }, 200, 'linear', function () {
            isBusy = false;
        });
    });

    if ($('html').scrollTop() > $('.content').offset().top) {
        $('html').animate({ scrollTop: $('.content').offset().top }, 300);
    }
}

function langName(lang) {
    const name = data.strings['lang-' + lang];
    if (!name) return lang;
    return name[langLong] || name[langShort] || name['en'] || lang;
}

function getString(stringId) {
    const str = data.strings[stringId];
    if (!str) return stringId;
    return str[langLong] || str[langShort] || str['en'];
}

const translitRegex = {
    zh: /^[>* ]*\{\{zh\|tran\}\} \{\{lang\|zh\|([^{|}]+)(\|[^{|}]*)*\}\}/
}

function getTranslitRegex() {
    return translitRegex[langLong] || translitRegex[langShort];
}

function htmlEncode(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function expandTemplates(str, mode) {
    if (typeof str !== 'string') {
        str = str[langLong] || str[langShort] || str['en'] || '';
    }

    str = str.replace(/ (\{\{(ref|audio|dialect))/g, '~$1'); // don't break the line before these

    for (let i = 0; i < str.length; i++) {
        switch (str[i]) {
            case '~':
                str = str.substring(0, i) + '&nbsp;' + str.substring(i + 1);
                i += 5;
                break;
            case '{':
                if (str[i + 1] === '{') {
                    const template = readTemplate(str, i);
                    if (template) {
                        let result = '', realName = template.name, goOn, ignoreSpace;
                        if (realName !== 'tran' && data.strings['lang-' + realName]) realName = '-lang';
                        
                        switch (realName) {
                            case '-lang':
                                let name = langName(template.name), plainName = name;
                                if (template.args[0] === 'aprx' || template.args[0] === 'tran') { template.args.splice(0, 1); }
                                while (template.args[0] && template.args[0].endsWith('*')) { template.args.splice(0, 1); }
                                result = '<span class="lang-code-light" lang="" title="' + plainName + '">' + 
                                    template.name.replace(/\+.+/, '') + '</span> ' + 
                                    template.args.map(arg => expandTemplates('{{tag' + (arg === 'orig' ? '-green' : arg.startsWith('need-') ? '-red' : '') + '|' + getString('tag-' + arg) + '}}')).join(' ') + 
                                    ' <span class="lang-name">' + expandTemplates(name) + '</span>' + getString('colon');
                                goOn = true;
                                ignoreSpace = true;
                                break;
                            case 'audio':
                                result = '<span class="audio no-select">🔊<audio preload="none" src="/audio/' + template.args[0] + '"></audio></span>';
                                break;
                            case 'ipa':
                                needIpaSelector = needIpaSelector || 'std';
                                let ipaString = template.args.length > 2 ? ('<' + template.args.slice(1).join('/') + '>') : template.args[1];
                                if (/<[^>]*\/[^>]*\//.test(ipaString)) needIpaSelector = 'audio';
                                result = '<span class="ipa" lang="fonipa" data-lang="' + htmlEncode(template.args[0]) + '" data-src="' + htmlEncode(ipaString) + '"></span>';
                                goOn = true;
                                break;
                            case 'ipb':
                                result = '<span class="ipa ipa-broad" lang="fonipa" data-lang="' + htmlEncode(template.args[0]) + '" data-src="' + htmlEncode(template.args[1]) + '"></span>';
                                goOn = true;
                                break;
                            case 'ipc':
                                result = '<span class="ipa ipa-keep" lang="fonipa" data-src="' + htmlEncode(template.args[0]) + '"></span>';
                                goOn = true;
                                break;
                            case 'ipd':
                                result = '<span class="ipa ipa-keep ipa-display" lang="fonipa" data-src="' + htmlEncode(template.args[0]) + '"></span>';
                                goOn = true;
                                break;
                            case 'lang':
                                var rtl = ['ar', 'fa', 'he', 'yi'].includes(template.args[0]);
                                result = '<span lang="' + template.args[0] + '"' + (rtl ? ' dir="rtl"' : '') + '>' + template.args[1] + '</span>';
                                if (template.args[2]) {
                                    if (mode === 'index') break;
                                    result += ' (<span class="translit" lang="' + template.args[0] + '-Latn">' + expandTemplates(template.args[2]) + '</span>)';
                                }
                                break;
                            case 'lang*':
                                if (mode !== 'index') {
                                    ignoreSpace = true;
                                    break;
                                }
                                var rtl = ['ar', 'fa', 'he', 'yi'].includes(template.args[0]);
                                result = '<span lang="' + template.args[0] + '"' + (rtl ? ' dir="rtl"' : '') + '>' + template.args[1] + '</span>';
                                break;
                            case 'lang-code':
                                let langCodeName = langName(template.args[0]);
                                result = '<span class="lang-code-light" lang="" title="' + langCodeName + '">' + template.args[0] + '</span>';
                                goOn = true;
                                break;
                            case 'link':
                                // prohibit '_' in link text, for convenience working with wikipedia links
                                result = '<a target="_blank" href="' + encodeURI(template.args[0]) + '">' + (template.args[1] ? expandTemplates(template.args[1]).replaceAll('_', ' ') : htmlEncode(template.args[0])) + '</a>';
                                goOn = true;
                                break;
                            case 'raise':
                                result = '<span style="line-height:1;vertical-align:' + encodeURI(template.args[0]) + ';">' + expandTemplates(template.args[1]) + '</span>';
                                goOn = true;
                                break;
                            case 'ref':
                            case 'note':
                                let refStr = template.args.join('|');
                                let refNum = 0;
                                if (/^\d+$/.test(refStr)) refNum = parseInt(refStr); 
                                else refNum = activeReferences.indexOf(refStr) + 1;
                                if (refNum === 0) {
                                    refNum = activeReferences.push(refStr);
                                }
                                result = '<sup><span class="ref-link" data-ref="ref-' + refNum + '">[' + (realName === 'ref' ? '' : getString('note')) + refNum + ']</span></sup>'
                                break;
                            case 'require':
                                result = '<div data-require="' + htmlEncode(template.args[0]) + '"><span class="content-ajax-loading">' + getString('content-ajax-loading') + '</span></div>';
                                break;
                            case 'ruby':
                                result = '<ruby><rb>' + expandTemplates(template.args[0]) + '</rb><rp> (</rp><rt>' + expandTemplates(template.args[1]) + '</rt><rp>) </rp></ruby>';
                                goOn = true;
                                break;
                            case 'small':
                                result = '<span class="smaller">' + expandTemplates(template.args.join(' ')) + '</span>';
                                goOn = true;
                                break;
                            case 'stat':
                                result = '<span class="stat">' + (stats[template.args[0]] || '') + '</span>';
                                goOn = true;
                                break;
                            case 'string':
                                result = (data.strings[template.args[0]] ? getString(template.args[0]) : template.args[1] || '').replaceAll('$$', '[$$]');
                                if (result) {
                                    for (let q = 1; q < template.args.length && q < 10; q++) {
                                        result = result.replaceAll('$' + q, template.args[q]);
                                    }
                                    result = result.replaceAll('[$$]', '$');
                                }
                                break;
                            case 'tag':
                            case 'tag-red':
                            case 'tag-green':
                                result = '<span class="text-' + realName + '">' + expandTemplates(template.args.join(' ')) + '</span>';
                                goOn = true;
                                break;
                            default:
                                let string = data.templates[template.name];
                                if (string && string['en']) {
                                    string = string[langLong] || string[langShort] || string[en];
                                }
                                if (string && string[template.args.length]) {
                                    let realString = string[template.args.length];
                                    if (typeof realString === 'object') {
                                        realString = realString[langLong] || realString[langShort] || realString['en'];
                                    }
                                    result = realString.replaceAll('$$', '[$$]');
                                    for (let q = 0; q < template.args.length && q < 9; q++) {
                                        result = result.replaceAll('$' + (q + 1), template.args[q]);
                                    }
                                    result = result.replaceAll('[$$]', '$');
                                }
                                break;
                        }

                        let secondPart = str.substring(template.endPosition);
                        if (ignoreSpace) { secondPart = secondPart.trim(); }
                        str = str.substring(0, i) + result + secondPart;
                        if (goOn) { 
                            i += result.length;
                        }
                        i--;
                    }
                }
                break;
        }
    }

    if (mode === 'ipa') {
        str = '<span class="ipa-word">' + str + '</span>';
    }

    return str;
}

function debugIpa(lang, str) {
    // for use in console
    return $('<div>').html(getIpa(str || '', lang, 'std')).text();
}

function getIpa(str, lang, mode) {
    str = str.normalize('NFD');

    if (mode === 'debug') {
        return '<span class="ipa-debug">[' + htmlEncode(str) + ']</span>';
    }

    let unstarredMode = mode.replace('*', '');
    if (mode !== 'keep') {
        [ 'before', lang, 'after' ].forEach(l => {
            if (unstarredMode === 'audio' && l === lang && ipaConversion[l] && ipaConversion[l]['std']) {
                ipaConversion[l]['std'].forEach(rep => str = str.replace(rep[0], rep[1]));
            } 
            if (ipaConversion[l] && ipaConversion[l][unstarredMode]) {
                ipaConversion[l][unstarredMode].forEach(rep => str = str.replace(rep[0], rep[1]));
            } 
        });
    }

    for (let i = 0; i < str.length; i++) {
        switch (str[i]) {
            case 'ˈ':
            case 'ˌ':
            case '¹':
            case '²':
                str = str.substring(0, i) + '<span class="ipa-stress-mark">' + str[i] + '</span>' + str.substring(i + 1);
                i += 37;
                break;
            case '.':
                str = str.substring(0, i) + '<span class="ipa-dot">.</span>' + str.substring(i + 1);
                i += 29;
                break;
            case '=':
                if (mode === 'std' || mode === 'audio') {
                    str = str.substring(0, i) + '</span><span class="ipa-liaison">‿</span><span class="ipa-word">' + str.substring(i + 1);
                    i += 61;
                } else {
                    str = str.substring(0, i) + '</span><span class="ipa-liaison">‿</span><span class="ipa-word-non-interactive">' + str.substring(i + 1);
                    i += 67;
                }
                break;
            case ' ':
                if (mode === 'std' || mode === 'audio') {
                    str = str.substring(0, i) + '</span><span class="ipa-space"> </span><span class="ipa-word">' + str.substring(i + 1);
                    i += 59;
                } else {
                    str = str.substring(0, i) + '</span><span class="ipa-space"> </span><span class="ipa-word-non-interactive">' + str.substring(i + 1);
                    i += 65;
                }
                break;
        }
    }

    if (mode === 'std' || mode === 'audio') {
        str = '<span class="ipa-word">' + str + '</span>';
    } else {
        str = '<span class="ipa-word-non-interactive">' + str + '</span>';
    }

    if (mode === 'std' || mode === 'std*' || mode === 'audio') {
        str = '<span class="ipa-delimiter">[</span>' + str + '<span class="ipa-delimiter">]</span>';
    } else if (mode !== 'keep') {
        str = '<span class="ipa-delimiter">/</span>' + str + '<span class="ipa-delimiter">/</span>';
    }

    // todo: latin letters won't form ligatures with greek letters,
    // todo: but using '?' isn't a good solution!
    str = str.replace(/b͡β/g, 'b͡?').replace(/t͡θ/g, 't͡?').replace(/q͡χ/g, 'q͡?');
    return str.normalize('NFC');
}

function readTemplate(str, position) {
    let i = position, list = [], templateName = '', substr = '', level = 0;
    while (str[i] === '{') i++;

    for (; i < str.length; i++) {
        if (str[i] === '|' && level === 0) {
            if (templateName) list.push(substr);
            else templateName = substr;
            substr = '';
        }
        else if (str[i] === '{' && str[i + 1] === '{') {
            level++; i++; substr += '{{';
        }
        else if (str[i] === '}' && str[i + 1] === '}') {
            if (level > 0) {
                level--; i++; substr += '}}';
            } else {
                if (templateName) list.push(substr);
                else templateName = substr;
                return {
                    name: templateName,
                    args: list,
                    endPosition: i + 2
                };
            }
        }
        else {
            substr += str[i];
        }
    }
    // return undefined;
}
