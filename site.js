let loaded,data,isBusy,activeItem,activeReferences,needIpaSelector,activeInitial,selfHashChange,setTimeoutHide,explainerShowing,searchTimeout,searchText,searchListHasTouch,langButtonPressed,reportButtonPressed,ipaConversion={},ipaType="broad",langLong=navigator.language||"en-US",langShort=langLong.replace(/-.+/,"");const hashes={},allEntries=[],stats={},idx=[],diacriticsMap={},diacriticsRegex=/[\u0300-\u036F]/g,diacriticsAtStartRegex=/^[\u0300-\u036F]*/,cjkLanguages=["zh"],cdnPrefix="https://cdn.jsdelivr.net/gh/mathpron/mathpron.github.io@master",diacriticsRemovalMap=[{base:"a",letters:"ⱥ"},{base:"aa",letters:"ꜳ"},{base:"ae",letters:"æ"},{base:"ao",letters:"ꜵ"},{base:"au",letters:"ꜷ"},{base:"av",letters:"ꜹꜻ"},{base:"ay",letters:"ꜽ"},{base:"b",letters:"ƀƃɓ"},{base:"c",letters:"ƈȼ"},{base:"d",letters:"đƌɖɗꝺ"},{base:"e",letters:"ɇ"},{base:"f",letters:"ƒꝼ"},{base:"g",letters:"ǥɠꞡᵹ"},{base:"h",letters:"ħⱨ"},{base:"hv",letters:"ƕ"},{base:"i",letters:"ɨı"},{base:"j",letters:"ɉ"},{base:"k",letters:"ƙⱪꝁꝃꝅꞣ"},{base:"l",letters:"łƚɫⱡꝉꞁꝇ"},{base:"m",letters:"ɱ"},{base:"n",letters:"ƞɲꞑꞥ"},{base:"o",letters:"øøꝋꝍɵ"},{base:"oi",letters:"ƣ"},{base:"ou",letters:"ȣ"},{base:"oo",letters:"ꝏ"},{base:"p",letters:"ƥᵽꝑꝓꝕ"},{base:"q",letters:"ɋꝗꝙ"},{base:"r",letters:"ɍɽꝛꞧꞃ"},{base:"s",letters:"ȿꞩꞅ"},{base:"ss",letters:"ß"},{base:"t",letters:"ŧƭʈⱦꞇ"},{base:"tz",letters:"ꜩ"},{base:"u",letters:"ʉ"},{base:"v",letters:"ʋꝟ"},{base:"vy",letters:"ꝡ"},{base:"w",letters:"ⱳ"},{base:"y",letters:"ƴɏỿ"},{base:"z",letters:"ƶȥɀⱬꝣ"},{base:"'",letters:"‘’"}];function initialise(){$("html").attr("lang",langLong),document.title=getString("title")+" – "+getString("title-text"),$("h1").removeClass("hidden");let e=data.strings["available-languages"],t=[];$.each(e,(function(e,a){t.push(e)})),t.includes(langLong)||(t.includes(langShort)||(langShort="en"),langLong=langShort),$("span[data-string-id]").each((function(){const e=getString($(this).data("string-id"));e&&$(this).html(e)})),$("#search-input").attr("placeholder",getString("search-box-placeholder")),$(".lang-button").text(e[langLong]),cjkLanguages.includes(langShort)&&$(".content").addClass("content-cjk"),$(".tabs-container .tab").each((function(){const e=$(this).data("header");data.items[e]&&$(this).removeClass("tab-disabled")})),$(".tabs-container .tab").click((function(){if(isBusy)return;const e=$(this);if(e.hasClass("tab-selected")||e.hasClass("tab-disabled"))return;animateLoadIndex(e.data("header"))})),$("#ipa-explainer-container").hover((function(){clearTimeout(setTimeoutHide)}),hideIpaExplainer).focusout(hideIpaExplainer),$("#ipa-explainer .ipa-notes-button").click((function(){"#IPA_Notes"!==window.location.hash?window.open("#IPA_Notes"):hideIpaExplainer()}));for(var a=0;a<diacriticsRemovalMap.length;a++)for(var s=diacriticsRemovalMap[a].letters,n=0;n<s.length;n++)diacriticsMap[s[n]]=diacriticsRemovalMap[a].base;function i(){const e=$("#search-list-container");e.hasClass("needs-to-close")&&($("#search-input").removeClass("fake-focus"),e.removeClass("needs-to-close").hide(),$(".search-list-shadow-caster").hide())}$.each(data.items,(function(e,t){t.forEach((function(t){let a=t.title.replaceAll("|","").replaceAll(" ","_");if(t.forms){let e=allEntries.push({hash:a,entry:t})-1,s=-1;t.forms.forEach(t=>{s++,t.type&&t.text&&t.prons&&t.type.endsWith("name")&&(idx.push({words:toSearchForm(t.text).split(" "),text:t.text,entryId:e,formId:s,extraScore:0===s?10:5}),t.alt&&t.alt.forEach(t=>{idx.push({words:toSearchForm(t).split(" "),text:t,entryId:e,formId:s,extraScore:0===s?8:5})}),t.prons.forEach(t=>{let a=t.match(/\{\{lang\|[a-zA-Z\-]+\|([^{|}]+)(?=(\|[^{|}]*)*\}\})/g);if(a||(a=[]),t.includes("{{ruby|")){let e=t.replace(/\{\{ruby\|([^\{\|\}]+)\|([^\{\|\}]+)\}\}/g,"$1"),s=t.replace(/\{\{ruby\|([^\{\|\}]+)\|([^\{\|\}]+)\}\}/g,"$2");a=a.concat(e.match(/\{\{lang\|[a-zA-Z\-]+\|([^{|}]+)(?=(\|[^{|}]*)*\}\})/g)||[]).concat(s.match(/\{\{lang\|[a-zA-Z\-]+\|([^{|}]+)(?=(\|[^{|}]*)*\}\})/g)||[])}a.forEach(a=>{let n=a.match(/\|([a-zA-Z\-]+)\|/)[1];a=a.replace(/.+\|/,""),idx.push({words:toSearchForm(a).split(" "),text:a,entryId:e,formId:s,lang:n,extraScore:/^[^\}]*\|(tran|aprx)/.test(t)?0:5})})}))})}hashes[a]={initial:e,item:t}}))})),stats.entries=allEntries.length,$.each(data.ipaConversion,(function(e,t){let a={};$.each(t,(function(e,t){let s=[];t.forEach((function(e){s.push([new RegExp(e[0],"g"),e[1]])})),a[e]=s})),ipaConversion[e]=a})),$("#search-input").on("input focus",(function(){let e=$(this).val();searchText!==e&&(searchText=e,searchTimeout&&clearTimeout(searchTimeout),""!==e?searchTimeout=setTimeout(()=>{searchTimeout=void 0,onSearch(e)},300):($(".search-list-shadow-caster").hide(),$("#search-list-container").hide()))})),$("#search-input").focusout((function(){searchTimeout&&clearTimeout(searchTimeout),searchText=void 0,$("#search-list-container").is(":hover")||searchListHasTouch?($(this).addClass("fake-focus"),$("#search-list-container").addClass("needs-to-close")):($(".search-list-shadow-caster").hide(),$("#search-list-container").hide())})),$("#search-list-container").on("touchstart touchmove",(function(){searchListHasTouch=!0})),$("#search-list-container").on("mouseleave touchend touchcancel",(function(){searchListHasTouch?setTimeout(()=>{searchListHasTouch=!1,i()},500):i()})),$("html").on("touchend",(function(){$(".touch-highlight").removeClass("touch-highlight")}));const r=$("#lang-list");t.forEach(t=>{const a=$('<div class="lang-list-item">').data("lang",t).html(expandTemplates("{{lang-code|"+t+"}} {{lang|"+t+"|"+e[t]+"}}"));r.append(a)}),r.find(".lang-list-item").click((function(){let e=$(this).data("lang");langLong=e,langShort=e.replace(/-.*/,""),changeLanguage()}));const l=$("#lang-list-container");$(".lang-button").click((function(){let e=l.outerWidth(),t=$(window).width(),a=$(".lang-button").position().left+$(".lang-button").outerWidth()/2-e/2;a+e>t-10&&(a=t-10-e),l.css("left",a),l.show(200)})),$(".lang-button, .lang-container").click((function(){langButtonPressed=!0,setTimeout(()=>{langButtonPressed=!1},1e3)})),$("#report-button-container").click((function(){reportButtonPressed=!0,setTimeout(()=>{reportButtonPressed=!1},1e3)})),$("body").click((function(){l.is(":visible")&&!langButtonPressed&&l.hide(),$("#report-button-container").is(":visible")&&!reportButtonPressed&&$("#report-button-container").hide()})),$(window).on("resize",onResize),$(window).on("hashchange",onHashChange),onHashChange()}function changeLanguage(){$("html").attr("lang",langLong),document.title=getString("title")+" – "+getString("title-text"),$("span[data-string-id]").each((function(){const e=getString($(this).data("string-id"));e&&$(this).html(e)})),$("#search-input").attr("placeholder",getString("search-box-placeholder")),$(".lang-button").text(data.strings["available-languages"][langLong]||langLong),cjkLanguages.includes(langShort)?$(".content").addClass("content-cjk"):$(".content").removeClass("content-cjk"),onResize(),selfHashChange="",onHashChange()}function onResize(){$("#lang-list-container").hide(),$("#ipa-explainer-container").hide()}function toSearchForm(e){return e.replace(/[-–·・゠,.，。、]/g," ").normalize("NFKD").toLowerCase().replace(diacriticsRegex,"").replace(/[^\u0000-\u007E]/g,e=>diacriticsMap[e]||e).replace(/\s+/g," ").trim().normalize("NFC")}function makeHighlights(e,t){let a,s=toSearchForm(e).split(" "),n=1===s.length,r=toSearchForm(t).split(" "),l=s.map(e=>backtrackSearch(e,r,1,n?1e4:1,!0)),o=!0;if(l.forEach(e=>o&=e.score>=0),o){let s=toSearchForm(t);l.forEach(e=>{let t=0;e.hl.forEach(e=>{for(let a=0;a<e.length;a++,t++)"+"===e[a]&&(s=s.substr(0,t)+"+"+s.substr(t+1));t++})}),i=0,a="";let n=t;for(;t.length>0;){let r=t.charAt(0),l=(t=t.substr(r.length)).match(diacriticsAtStartRegex);r+=l[0],t=t.substr(l[0].length);let o=toSearchForm(r);if(""===o){e.includes(r)?a+="<<"+htmlEncode(r)+">>":a+=htmlEncode(r);continue}for(;" "===s[i];)i++;let c=s.substr(i,o.length);if(i+=o.length,c.includes("+"))a+="<<"+htmlEncode(r)+">>";else{if(c!==o)return htmlEncode(n);a+=htmlEncode(r)}}return a=a.replace(/>><</g,"").replace(/<</g,'<span class="search-item-highlight">').replace(/>>/g,"</span>"),a}return htmlEncode(t)}function onSearch(e){e.length>100&&(e=e.substr(0,100));let t=e,a=search(e=toSearchForm(e));const s=$("#search-list-container").css("width",$("#search-input").outerWidth()-2),n=s.find("#search-list").html("");a&&a.length>0?(s.find(".search-list-no-results").addClass("hidden"),a.forEach(e=>{const a=$('<div class="search-list-item">').data("entry-id",e.entryId);let s=allEntries[e.entryId].hash.replaceAll("_"," ");const i=$('<div class="search-item-header">').html(makeHighlights(t,s));a.append(i);let r=allEntries[e.entryId].entry;const l=$('<div class="search-item-subheader">').html(htmlEncode(getString("form-type-"+r.forms[e.formId].type))+htmlEncode(e.lang?" ("+getString("lang-"+e.lang)+")":"")+htmlEncode(getString("colon"))+(e.lang?'<span lang="'+e.lang+'">':"")+makeHighlights(t,e.text)+(e.lang?"</span>":""));a.append(l),n.append(a)})):s.find(".search-list-no-results").removeClass("hidden"),s.find(".search-list-item").click((function(){let e=$(this).data("entry-id"),t=allEntries[e]&&allEntries[e].hash;t&&(activeInitial=hashes[t].initial,activeItem=hashes[t].item,animateLoadActiveItem(),$("#search-input").val(""),$(".search-list-shadow-caster").hide(),$("#search-list-container").hide())})),s.show();const i=$(".search-list-shadow-caster");i.css("width",s.outerWidth()).css("height",s.outerHeight()-20).css("top",s.position().top+20),i.show()}function search(e){let t=e.split(" ").filter(e=>""!==e),a=!0,s=1===t.length,n=[];t.forEach(e=>{(a?idx:n).forEach(t=>{let i=backtrackSearch(e,t.words,1,s?1e4:1).score;i>=0?a&&n.push({score:i,extraScore:t.extraScore||0,words:t.words,text:t.text,entryId:t.entryId,formId:t.formId,lang:t.lang}):a||(t.removed=!0)}),a=!1}),n=n.filter(e=>!e.removed),n.sort((e,t)=>t.score+t.extraScore-e.score-e.extraScore||e.entryId-t.entryId||e.formId-t.formId),t.forEach(e=>{n.forEach(t=>{backtrackSearch(e,t.words,0,s?1e4:1).score<0&&(t.removed=!0)})});let i=n.filter(e=>!e.removed);i.length>0&&(n=i);let r=[];i=[];for(let e=0;e<n.length;e++){let t=n[e].entryId;r.includes(t)||(r.push(t),i.push(n.filter(e=>e.entryId===t).sort((e,t)=>t.score-e.score||(0===e.formId?1:0===t.formId?-1:e.formId-t.formId))[0]))}return n=i,n.length>10&&(n=n.slice(0,10)),0!==n.length&&n}$.getJSON(cdnPrefix+"/data.json",(function(e){data=e,loaded&&initialise()})),$((function(){loaded=!0,data&&initialise()})),String.prototype.replaceAll=function(e,t){if("string"==typeof e){t=t.toString();let a=0,s=this;for(;;){let n=s.indexOf(e,a);if(-1===n)break;s=s.substring(0,n)+t+s.substring(n+e.length),a=n+t.length}return s}};const adjacentPairScore=3,fuzzyPointScore=10,initialOnlyBonus=1,fullWordBonus=5;function backtrackSearch(e,t,a,s,n){if(n){var i=[];t.forEach(e=>i.push(e))}if(""===e)return{score:10*a,hl:i};if(0===s)return{score:-1e4,hl:i};s||(s=1e4);let r=-1e4,l=e;function o(e,a,s){if(e.score>r&&e.score>=0&&(r=e.score,n)){i=[];for(let n=0;n<t.length;n++)n===a?i.push(s):n<a?i.push(e.hl[n]):n>a&&i.push(e.hl[n-1])}}for(let i=0;i<t.length;i++){e=l;let r=t[i],c=r;if("'"===r[0]&&"'"!==e[0]&&(e="'"+e),e[0]!==r[0])continue;let p=[],d=0;for(let e=0;e<t.length;e++)e!==i&&p.push(t[e]);let h=!1,g=!0;for(let t=0;t<r.length;t++)if(e[0]===r[t]){h&&(d+=3),h=!0,!n||0===t&&"-"===r[t]||(c=c.substr(0,t)+"+"+c.substr(t+1));let l=backtrackSearch(e=e.substr(1),p,a,s-1,n);if(l.score+=d,0===t&&(l.score+=1),g&&t===r.length-1&&(l.score+=5),o(l,i,n&&c),a>0){let l=backtrackSearch(e.substr(1),p,a-1,s-1,n);l.score+=d,g&&t===r.length-1&&(l.score+=5),o(l,i,n&&c)}}else if(h=!1,g=!1,a>0&&e[1]&&e[1]===r[t]){p.push("-"+r.substr(t));let l=backtrackSearch("-"+e.substr(1),p,a-1,s,n);if(l.score+=d,n){let a=l.hl.pop().replace("-",c.substr(0,t));e[0]===r[t+1]&&"+"!==a[t+1]&&(a=a.substr(0,t+1)+"+"+a.substr(t+2),l.score+=3),o(l,i,a)}else o(l,i);p.pop()}}return{score:r,hl:i}}function onHashChange(){if(decodeURI(window.location.hash)===selfHashChange&&selfHashChange)return;selfHashChange="",$(".tabs-container .tab").removeClass("tab-selected");const e=(decodeURI(window.location.hash)||"#").substring(1);1===e.length&&data.items[e]?(activeInitial=e,$(".tabs-container .tab[data-header="+e+"]").addClass("tab-selected"),loadIndex(e)):hashes[e]?(activeInitial=hashes[e].initial,activeItem=hashes[e].item,loadActiveItem()):e.startsWith("debug-")&&ipaConversion[e.substr(6)]?debugLoadLanguage(e.substr(6)):(activeInitial="A",$(".tabs-container .tab[data-header=A]").addClass("tab-selected"),loadIndex("A")),$("html").scrollTop()>$(".content").offset().top&&$("html").scrollTop($(".content").offset().top)}function debugLoadLanguage(e){$("h1#the-h1").removeClass("index-h1").text(getString("lang-"+e)),document.title=getString("title")+" – "+getString("title-text");const t=$("#content");t.html(""),ipaType="debug",$(".under-header").html(getIpaSelectors());let a=new RegExp("\\{\\{ip[ab]\\|"+e+"\\|[^\\}]*\\}\\}");$.each(data.items,(function(e,s){s.forEach((function(e){e.forms&&e.forms.forEach((function(e){e.prons&&e.prons.forEach((function(e){let s=e.match(a);if(s){let a=s[0];s=e.match(/\{\{audio\|.*?\}\}/),s&&(a+=" "+s[0]),t.append($("<div>").html(expandTemplates(a)))}}))}))}))})),$("span.audio").click((function(){$(this).children("audio")[0].play()})),changeIpaType("std")}function animateLoadIndex(e){const t=$(".tabs-container .tab[data-header="+e+"]");data.items[e]&&(isBusy=!0,$(".content").animate({opacity:0},200,"linear",(function(){selfHashChange="#"+e,window.location.hash="#"+e,$(".tab-selected").removeClass("tab-selected"),loadIndex(e),t.addClass("tab-selected"),$(".content").animate({opacity:1},200,"linear",(function(){isBusy=!1}))})),$("html").scrollTop()>$(".content").offset().top&&$("html").animate({scrollTop:$(".content").offset().top},300))}function getIpaSelectors(e){const t=$('<span class="ipa-selectors">').html(getString("ipa-selector-prefix")+'<span class="fake-link ipa-selector" data-ipa-type="broad">'+getString("ipa-selector-broad")+'</span> · <span class="fake-link ipa-selector" data-ipa-type="std'+(e?"*":"")+'">'+getString("ipa-selector-std")+(e?"":'</span><span class="hide-if-audio-is-std"> · <span class="fake-link ipa-selector" data-ipa-type="audio">'+getString("ipa-selector-audio"))+("debug"===ipaType?'</span> · <span class="fake-link ipa-selector" data-ipa-type="debug">Plain':"")+"</span></span>");return!e||"audio"!==ipaType&&"std"!==ipaType||(ipaType="std*"),(!e&&"std*"===ipaType||"debug"===ipaType)&&(ipaType="std"),t.find("span.ipa-selector[data-ipa-type="+ipaType.replace("*","\\*")+"]").addClass("selected"),t.find("span.ipa-selector").click((function(){const e=$(this);e.hasClass("selected")||($("span.ipa-selectors span.ipa-selector").removeClass("selected"),e.addClass("selected"),changeIpaType(e.data("ipa-type")))})),t}function getReportButtons(e){const t=$("<div>");return e&&(e=e.replace(/[ _]/g," ").replace(/[‘’]/g,"'"),t.append($('<span class="fake-link" data-long-string="propose-an-edit-long" data-href="https://github.com/mathpron/mathpron.github.io/issues/new?template=propose-an-edit.md&title='+encodeURIComponent("Edit: "+e)+'">').text(getString("propose-an-edit-short"))),t.append($('<span class="under-header-separator">'))),t.append($('<span class="fake-link" data-long-string="suggest-a-new-entry-long" data-href="https://github.com/mathpron/mathpron.github.io/issues/new?template=suggest-a-new-entry.md&title='+encodeURIComponent("New entry: ")+'">').text(getString("suggest-a-new-entry-short"))),t.find("span.fake-link").click((function(){reportButtonPressed=!0,setTimeout(()=>{reportButtonPressed=!1},1e3);const e=$("#report-button-container");e.html("").append($("<span>").text(getString($(this).data("long-string")+"-before"))).append($('<a target="_blank" href="'+$(this).data("href")+'">').text("GitHub")).append($("<span>").text(getString($(this).data("long-string")+"-after")));let t=e.outerWidth(),a=$(window).width(),s=$(this).position().left+$(this).outerWidth()/2-t/2;s+t>a-10&&(s=a-10-t),e.css("left",s).show(200)})),t}function loadIndex(e){if(!data.items[e])return;const t=$("#content");t.html(""),$("#the-h1").addClass("index-h1").text(e),activeInitial=e,document.title=getString("title")+" – "+getString("title-text"),$(".under-header").html(getIpaSelectors(!0)).append($('<div class="under-header-grow">')).append(getReportButtons());const a=getTranslitRegex();data.items[e].forEach((function(s){const n=$('<div class="index-item">');n.data("item",s),n.append($('<span><span class="bold-term">'+s.title.replace("|","</span>")+"</span>")),1===e.length&&s.forms&&s.forms[0].prons&&s.forms[0].prons.forEach((function(e){var t=e.match(/[> ]*^\{\{(en)\|orig[^}]*\}\} \/([^\/]+)\//);t?n.append($('<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="'+langName(t[1])+'">'+t[1]+"</span> /"+expandTemplates(t[2],"index")+"/</span>")):(t=e.match(/^[> ]*\{\{([^|}+]+)[^|}]*\|orig[^}]*\}\} (\{\{ip[ab]\|[^\}]+\}\})/))?n.append($('<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="'+langName(t[1])+'">'+t[1]+"</span> "+expandTemplates(t[2],"index")+"</span>")):(t=e.match(/^[> ]*\{\{([^|}+]+)[^|}]*\|orig[^}]*\}\} (.*?) (\{\{ip[ab]\|[^\}]+\}\})/))?n.append($('<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="'+langName(t[1])+'">'+t[1]+"</span> "+expandTemplates(t[2],"index")+" "+expandTemplates(t[3],"index")+"</span>")):((t=e.match(/^[> ]*\{\{en\|aprx[^}]*\}\} (\{\{ip[ab]\|[^\}]+\}\})/))&&n.append($('<span> <span class="center-dot">⋅</span>&nbsp;<span class="lang-code" title="'+langName("en").replace(/^(.+)$/,langName("aprx"))+'">en~</span> '+expandTemplates(t[1],"index")+"</span>")),a&&(t=e.match(a))&&n.append($('<span> <span class="center-dot">⋅</span>&nbsp;<span class="index-translit">'+t[1]+"</span>")))})),n.click(onIndexItemClick),n.on("touchstart",(function(){$(this).addClass("touch-highlight")})),t.append(n)})),changeIpaType(ipaType)}function loadActiveItem(){if(!activeItem)return;activeReferences=[],needIpaSelector=!1;const e=$("#content");e.html("");let t=activeItem["alt-title"]&&(activeItem["alt-title"][langLong]||activeItem["alt-title"][langShort]||activeItem["alt-title"].en)||activeItem.title;document.title=t.replace("|","")+" - "+getString("title");let a=t.replace("|,",",|").replace(/\|(.*)/,'<span class="h1-lighter">$1</span>');activeItem.forms||(a='<span class="no-sc">'+a+"</span>"),$("#the-h1").removeClass("index-h1").html(a);const s=$(".under-header").html("");if(1===activeInitial.length){const e=$('<span class="fake-link">').text(getString("back-button"));e.click((function(){1===activeInitial.length&&animateLoadIndex(activeInitial)})),s.append(e),activeItem.forms&&(s.append($('<span class="under-header-separator">')),s.append(getIpaSelectors()),s.append($('<div class="under-header-grow">')),s.append(getReportButtons(activeItem.title.replace("|",""))))}if(activeItem.notes&&activeItem.notes.forEach(e=>{let t="string"==typeof e?e:e[langLong]||e[langShort]||e.en||"";activeReferences.push(expandTemplates(t))}),activeItem.desc){let t=activeItem.desc.split("|"),a=getString("desc-template-"+t[0]);a=a.replaceAll("$o","{{occ|"+t[1].replaceAll(" ","|")+"}}"),a=a.replaceAll("$c","{{and|"+t[2].split(" ").map(e=>"{{string|dem-"+e+"|"+e+"}}").join("|")+"}}");let s=t[3].includes(" ")?"{{"+t[3].replaceAll(" ","|").replace(/^c\|/,"circa|")+"}}":t[3];if(t[4])if("%"===t[4])a=a.replaceAll("$y",s);else{let e=t[4].includes(" ")?"{{"+t[4].replaceAll(" ","|").replace(/^c\|/,"circa|")+"}}":t[4];a=a.replaceAll("$y","{{lifespan|"+s+"|"+e+"}}")}else a=a.replaceAll("$y","{{born|"+s+"}}");e.append($('<div class="entry-description">').html(expandTemplates(a)))}if(activeItem.content||activeItem.intro){if(activeItem.content){var n=ipaType;ipaType="std"}let t=activeItem.content||activeItem.intro;"object"==typeof t&&(t=t[langLong]||t[langShort]||t.en||""),Array.isArray(t)&&(t=t.join(" ")),e.append($('<div class="content-article">').html(expandTemplates(t)))}if(activeItem.forms){e.append($("<h2>"+getString("header-pronunciation")+"</h2>"));let t=0;activeItem.forms.forEach((function(a){let s=!1;if(e.append($("<h3>"+a.text+' <span class="text-tag h3-space-before">'+getString("form-type-"+a.type)+"</span></h3>")),a.alt&&e.append($('<div class="alternative-spellings">').html(getString("alternative-spellings")+" "+a.alt.map(e=>'<span class="alternative-spelling">'+htmlEncode(e)+"</span>").join(", "))),a.prons){const n=$('<ul class="pron-list">');a.prons.forEach((function(e){let a=0,i=!1;for(e.startsWith("*")&&(i=!0,e=e.substring(1));e.startsWith(">");)a++,e=e.substring(1);i&=!((e=e.trim()).startsWith("{{"+langShort+"|")||e.startsWith("{{"+langShort+"}")),s|=i,n.append($('<li class="level-'+a+(i?" pron-optional-"+t+" hidden":"")+'">').html(expandTemplates(e)))})),e.append(n)}if(s){const a=$('<div><span class="expander">⏷ '+getString("show-more")+"<span></div>");e.append(a),a.find(".expander").data("expanded","false").data("target","pron-optional-"+t).click((function(){const e=$(this),t=e.data("target");"true"===e.data("expanded")?(e.data("expanded","false").text("⏷ "+getString("show-more")),$("li."+t).addClass("hidden")):(e.data("expanded","true").text("⏶ "+getString("show-less")),$("li."+t).removeClass("hidden"))})),t++}}))}if(activeItem.links){e.append($("<h2>"+getString("header-external-links")+"</h2>"));const t=$("<ul>");activeItem.links.forEach((function(e){e=expandTemplates(e),t.append($("<li>").html(e))})),activeItem.wd&&/Q[0-9]+/.test(activeItem.wd)&&t.append($("<li>").html(expandTemplates("{{wikidata|"+activeItem.wd+"}}"))),e.append(t)}if(activeReferences.length>0){e.append($("<h2>"+getString("header-references")+"</h2>"));const t=$('<ol class="reference-list">');let a=0;activeReferences.forEach((function(e){e=expandTemplates("{{"+e+"}}")||expandTemplates("{{string|"+e+"}}")||expandTemplates(e),t.append($('<li id="ref-'+ ++a+'">').html(e))})),e.append(t)}initPage(),n&&(ipaType=n)}function initPage(){let e=ipaType;$("div[data-require]").each((function(){const t=$(this);let a=t.data("require");$.ajax({url:cdnPrefix+"/content/"+a,success:function(a){t.removeAttr("data-require").html(expandTemplates(a));let s=ipaType;ipaType=e,initPage(),ipaType=s},error:function(){t.removeAttr("data-require").addClass("content-ajax-fail").html(getString("content-ajax-fail"))}})})),$(".ref-link").click((function(){let e=$("html")[0];$("html").animate({scrollTop:e.scrollHeight-e.clientHeight},300)})),$("span.audio").click((function(){$(this).children("audio")[0].play()})),changeIpaType(ipaType),needIpaSelector?"std"===needIpaSelector&&$("span.hide-if-audio-is-std").addClass("hidden"):$(".ipaSelectors").addClass("hidden")}function changeIpaType(e){ipaType=e,$("span.ipa[data-src]").each((function(){const t=$(this);t.html(getIpa(t.data("src"),t.data("lang"),t.hasClass("ipa-broad")?"broad":t.hasClass("ipa-keep")?"keep":e))})),$("span.ipa-word").click(onIpaClick).hover((function(){}),(function(){clearTimeout(setTimeoutHide),setTimeoutHide=setTimeout(()=>{hideIpaExplainer()},500)}))}const ipaComponentMaxLength=6;function onIpaClick(){clearTimeout(setTimeoutHide);const e=$("#ipa-explainer-container"),t=$("body"),a=$(this).closest("span.ipa-word"),s=a.text().normalize("NFD"),n=a.position();let i="",r=!1;for(let e=0;e<s.length;e++){if("-,".includes(s[e])){i+="</span>"+htmlEncode(s[e])+'<span class="ipa-unit">';continue}if("."===s[e]){i+='</span><span class="ipa-dot">.</span><span class="ipa-unit">';continue}if("ˈˌ¹²".includes(s[e])){i+='</span><span class="ipa-stress-mark ipa-unit">'+htmlEncode(s[e])+'</span><span class="ipa-unit">';continue}if("ꜜꜛ".includes(s[e])&&"ː"===s[e+1]){i+='<span class="ipa-embedded-unit ipa-unit">'+s[e]+'</span>ː</span><span class="ipa-unit">',e++;continue}for(var l=6;l>0&&(e+l>s.length||!data.ipa[s.substr(e,l)]);l--);if(0===l){i+='</span><span class="ipa-unit">'+htmlEncode(s[e])+'</span><span class="ipa-unit">';continue}let t=data.ipa[s.substr(e,l)];t.startsWith("M")||t.startsWith("Z")?i+=htmlEncode(s.substr(e,l)):(i+=r?htmlEncode(s.substr(e,l)):'</span><span class="ipa-unit">'+htmlEncode(s.substr(e,l)),r=t.startsWith("P")),e+=l-1}i='<span class="ipa-unit">'+i+"</span>",i=i.replace(/([˥˦˧˨˩])<\/span><span class="ipa-unit">(?=[˥˦˧˨˩])/g,"$1").replace(/<span class="ipa-unit"><\/span>/g,""),i=i.normalize("NFC"),e.find("span.ipa-display").html(i),e.find("span.ipa-unit").click((function(){$(this).hasClass("ipa-unit-indirect-highlight")||($(".ipa-unit-highlight").removeClass("ipa-unit-highlight"),$(".ipa-unit-indirect-highlight").removeClass("ipa-unit-indirect-highlight"),$(this).addClass("ipa-unit-highlight").parent(".ipa-unit").addClass("ipa-unit-indirect-highlight"),onIpaUnitClick())})).hover((function(){$(this).addClass("ipa-unit-highlight").parent(".ipa-unit").addClass("ipa-unit-indirect-highlight")}),(function(){$(this).removeClass("ipa-unit-highlight").parent(".ipa-unit").removeClass("ipa-unit-indirect-highlight")}));let o=n.left+a.width()/2-e.width()/2;o=Math.min(o,t.width()-e.width()-5),o=Math.max(o,5);let c=n.top+a.height()+10;explainerShowing=!0,e.css("left",o).css("top",c),e.show(200).focus()}function onIpaUnitClick(){const e=$("span.ipa-unit.ipa-unit-highlight:not(.ipa-unit-indirect-highlight)").clone().children().remove().end().text().normalize("NFD");let t=[],a=[];if(/^[˥˦˧˨˩]+$/.test(e))t.push({text:e,data:""});else for(let n=0;n<e.length;n++){for(var s=6;s>0&&(n+s>e.length||!data.ipa[e.substr(n,s)]);s--);if(0===s)break;let i=data.ipa[e.substr(n,s)];if(i.startsWith("#")){let e=i.substr(1).trim().split(" ");for(let s=0;s<e.length;s++)t.push({text:e[s],data:data.ipa[e[s]]}),a.push(data.ipa[e[s]])}else if(i.includes("#")){let e=i.indexOf("#");a.push(i.substr(0,e).trim());let s=i.substr(e+1).trim().split(" ");for(let e=0;e<s.length;e++)t.push({text:s[e],data:data.ipa[s[e]]})}else t.push({text:e.substr(n,s),data:data.ipa[e.substr(n,s)]}),a.push(data.ipa[e.substr(n,s)]);n+=s-1}const n=$("#ipa-explainer-container");n.find(".ipa-detail-placeholder").addClass("hidden");const i=n.find(".ipa-detail");i.html("").removeClass("hidden"),t.splice(0,0,{text:e,data:a.join(" ")});let r=0;for(let e=1;e<t.length;e++)if(t[e-r].data.startsWith("Z")){let a=t.splice(e-r,1);t.splice(t.length,0,a[0]),r++}for(let e=0;e<t.length;e++){const s=t[e],n=$('<div class="ipa-detail-item level-'+(0===e?0:1)+'">');let r=s.text;if("◌"===r)continue;"̰̤̮̩̯̥̬̪̺̝̞̟̠̹̜̼̘̙̻͓̻̃̈̆̍̑̊̌͆͗͑̽̏̀̄́̋̂̌᷅᷄᷈̚ᵊˠʰʲʷᵝˤˀˢᶻᶴᶾᶳᶼᶝᶽʵʴ˞ːˑ⁎".includes(r[0])&&(r="◌"+r),1===r.length&&"ᵈᵗᵐⁿ".includes(r[0])&&(r+="◌"),r=r.normalize("NFC");const l=$('<span class="ipa" lang="fonipa">').text(r);let o;n.append($('<div class="ipa-detail-item-header">').append(l));for(let e=0;e<a.length;e++)if("CV".includes(a[e][0])){o=a[e][0];break}const c=$('<div class="ipa-detail-item-body">').text(getIpaName(s.text,s.data,o));if(n.append(c),i.append(n),0===e){if(!(t.length>2))break;{const e=$('<div class="ipa-detail-subheader no-select">').text(getString("ipa-detail-subheader"));i.append(e)}}}}function getIpaName(e,t,a){function s(e){for(;e.includes("  ");)e=e.replace("  "," ");return e=(e=e.trim())[0].toUpperCase()+e.substr(1)}if(data.strings["ipa-symbol-"+e])return s(getString("ipa-symbol-"+e));let n="ipa-symbol-after-"+("C"===a?"consonant":"V"===a?"vowel":"others")+"-"+e;if(data.strings[n])return s(getString(n));if(/^[˥˦˧˨˩]+$/.test(e))return s(getString("ipa-symbol-tone-marks"));let i=t.split(" ");for(let e=0;e<i.length;e++){var r=i[e].match(/^([CV])\.(\d+)\.(\d+)(\.[a-zA-Z]+)?/);if(r)break}if(!r)return"";let l=r[1],o=parseInt(r[2]),c=parseInt(r[3]),p=(r[4]||".").substr(1).toLowerCase();for(let e=0;e<i.length;e++){const t=i[e].match(/^[MP]\.([+\-=<>0])(\d*)\.([+\-=<>0])(\d*)(\.(([+\-][a-zA-Z])+))?$/);if(t){switch(t[1]){case"+":o+=parseInt(t[2]);break;case"-":o-=parseInt(t[2]);break;case"=":o=parseInt(t[2]);break;case">":o+=Math.sign(parseInt(t[2])-o);break;case"<":o-=Math.sign(parseInt(t[2])-o)}switch(t[3]){case"+":c+=parseInt(t[4]);break;case"-":c-=parseInt(t[4]);break;case"=":c=parseInt(t[4]);break;case">":c+=Math.sign(parseInt(t[4])-c);break;case"<":c-=Math.sign(parseInt(t[4])-c)}if(t[5])for(let e=0;e<t[6].length/2;e++)"+"!==t[6][2*e]||p.includes(t[6][2*e+1])||(p+=t[6][2*e+1]),"-"===t[6][2*e]&&p.includes(t[6][2*e+1])&&(p=p.replace(t[6][2*e+1],""))}}if("C"===l){let e=getString("ipa-consonant-template");return e=e.replace("$1",data.strings["ipa-consonant-type-"+o+"-pos-"+c]?getString("ipa-consonant-type-"+o+"-pos-"+c):getString("ipa-consonant-type-"+o)),e=e.replace("$2",data.strings["ipa-consonant-pos-"+c+"-type-"+o]?getString("ipa-consonant-pos-"+c+"-type-"+o):getString("ipa-consonant-pos-"+c)),"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(t=>{let a="ipa-consonant-attr-"+t+"-"+(p.includes(t)?"true":"false");e=e.replace("$"+t,data.strings[a]?getString(a):"")}),s(e)}if("V"===l){let e=getString("ipa-vowel-template");return e=e.replace("$1",getString("ipa-vowel-openness-"+o)),e=e.replace("$2",getString("ipa-vowel-backness-"+c)),"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(t=>{let a="ipa-vowel-attr-"+t+"-"+(p.includes(t)?"true":"false");e=e.replace("$"+t,data.strings[a]?getString(a):"")}),s(e)}}function hideIpaExplainer(){explainerShowing=!1;const e=$("#ipa-explainer-container");e.hide(),e.find(".ipa-detail").addClass("hidden").html(""),e.find(".ipa-detail-placeholder").removeClass("hidden")}function onIndexItemClick(){isBusy||(isBusy=!0,activeItem=$(this).data("item"),activeItem&&animateLoadActiveItem())}function animateLoadActiveItem(){$(".content").animate({opacity:0},200,"linear",(function(){selfHashChange="#"+activeItem.title.replace("|","").replaceAll(" ","_"),window.location.hash=selfHashChange,$(".tab-selected").removeClass("tab-selected"),loadActiveItem(),$(".content").animate({opacity:1},200,"linear",(function(){isBusy=!1}))})),$("html").scrollTop()>$(".content").offset().top&&$("html").animate({scrollTop:$(".content").offset().top},300)}function langName(e){const t=data.strings["lang-"+e];return t&&(t[langLong]||t[langShort]||t.en)||e}function getString(e){const t=data.strings[e];return t?t[langLong]||t[langShort]||t.en:e}const translitRegex={zh:/^[>* ]*\{\{zh\|tran\}\} \{\{lang\|zh\|([^{|}]+)(\|[^{|}]*)*\}\}/};function getTranslitRegex(){return translitRegex[langLong]||translitRegex[langShort]}function htmlEncode(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function expandTemplates(e,t){"string"!=typeof e&&(e=e[langLong]||e[langShort]||e.en||""),e=e.replace(/ (\{\{(ref|audio|dialect))/g,"~$1");for(let s=0;s<e.length;s++)switch(e[s]){case"~":e=e.substring(0,s)+"&nbsp;"+e.substring(s+1),s+=5;break;case"{":if("{"===e[s+1]){const n=readTemplate(e,s);if(n){let i,r,l="",o=n.name;switch("tran"!==o&&data.strings["lang-"+o]&&(o="-lang"),o){case"-lang":let e=langName(n.name),s=e;for("aprx"!==n.args[0]&&"tran"!==n.args[0]||n.args.splice(0,1);n.args[0]&&n.args[0].endsWith("*");)n.args.splice(0,1);l='<span class="lang-code-light" lang="" title="'+s+'">'+n.name.replace(/\+.+/,"")+"</span> "+n.args.map(e=>expandTemplates("{{tag"+("orig"===e?"-green":e.startsWith("need-")?"-red":"")+"|"+getString("tag-"+e)+"}}")).join(" ")+' <span class="lang-name">'+expandTemplates(e)+"</span>"+getString("colon"),i=!0,r=!0;break;case"audio":l='<span class="audio no-select">🔊<audio preload="none" src="/audio/'+n.args[0]+'"></audio></span>';break;case"ipa":needIpaSelector=needIpaSelector||"std";let c=n.args.length>2?"<"+n.args.slice(1).join("/")+">":n.args[1];/<[^>]*\/[^>]*\//.test(c)&&(needIpaSelector="audio"),l='<span class="ipa" lang="fonipa" data-lang="'+htmlEncode(n.args[0])+'" data-src="'+htmlEncode(c)+'"></span>',i=!0;break;case"ipb":l='<span class="ipa ipa-broad" lang="fonipa" data-lang="'+htmlEncode(n.args[0])+'" data-src="'+htmlEncode(n.args[1])+'"></span>',i=!0;break;case"ipc":l='<span class="ipa ipa-keep" lang="fonipa" data-src="'+htmlEncode(n.args[0])+'"></span>',i=!0;break;case"ipd":l='<span class="ipa ipa-keep ipa-display" lang="fonipa" data-src="'+htmlEncode(n.args[0])+'"></span>',i=!0;break;case"lang":var a=["ar","fa","he","yi"].includes(n.args[0]);if(l='<span lang="'+n.args[0]+'"'+(a?' dir="rtl"':"")+">"+n.args[1]+"</span>",n.args[2]){if("index"===t)break;l+=' (<span class="translit" lang="'+n.args[0]+'-Latn">'+expandTemplates(n.args[2])+"</span>)"}break;case"lang*":if("index"!==t){r=!0;break}a=["ar","fa","he","yi"].includes(n.args[0]);l='<span lang="'+n.args[0]+'"'+(a?' dir="rtl"':"")+">"+n.args[1]+"</span>";break;case"lang-code":l='<span class="lang-code-light" lang="" title="'+langName(n.args[0])+'">'+n.args[0]+"</span>",i=!0;break;case"link":l='<a target="_blank" href="'+encodeURI(n.args[0])+'">'+(n.args[1]?expandTemplates(n.args[1]).replaceAll("_"," "):htmlEncode(n.args[0]))+"</a>",i=!0;break;case"raise":l='<span style="line-height:1;vertical-align:'+encodeURI(n.args[0])+';">'+expandTemplates(n.args[1])+"</span>",i=!0;break;case"ref":case"note":let p=n.args.join("|"),d=0;d=/^\d+$/.test(p)?parseInt(p):activeReferences.indexOf(p)+1,0===d&&(d=activeReferences.push(p)),l='<sup><span class="ref-link" data-ref="ref-'+d+'">['+("ref"===o?"":getString("note"))+d+"]</span></sup>";break;case"require":l='<div data-require="'+htmlEncode(n.args[0])+'"><span class="content-ajax-loading">'+getString("content-ajax-loading")+"</span></div>";break;case"ruby":l="<ruby><rb>"+expandTemplates(n.args[0])+"</rb><rp> (</rp><rt>"+expandTemplates(n.args[1])+"</rt><rp>) </rp></ruby>",i=!0;break;case"small":l='<span class="smaller">'+expandTemplates(n.args.join(" "))+"</span>",i=!0;break;case"stat":l='<span class="stat">'+(stats[n.args[0]]||"")+"</span>",i=!0;break;case"string":if(l=(data.strings[n.args[0]]?getString(n.args[0]):n.args[1]||"").replaceAll("$$","[$$]"),l){for(let e=1;e<n.args.length&&e<10;e++)l=l.replaceAll("$"+e,n.args[e]);l=l.replaceAll("[$$]","$")}break;case"tag":case"tag-red":case"tag-green":l='<span class="text-'+o+'">'+expandTemplates(n.args.join(" "))+"</span>",i=!0;break;default:let h=data.templates[n.name];if(h&&h.en&&(h=h[langLong]||h[langShort]||h[en]),h&&h[n.args.length]){let e=h[n.args.length];"object"==typeof e&&(e=e[langLong]||e[langShort]||e.en),l=e.replaceAll("$$","[$$]");for(let e=0;e<n.args.length&&e<9;e++)l=l.replaceAll("$"+(e+1),n.args[e]);l=l.replaceAll("[$$]","$")}}let c=e.substring(n.endPosition);r&&(c=c.trim()),e=e.substring(0,s)+l+c,i&&(s+=l.length),s--}}}return"ipa"===t&&(e='<span class="ipa-word">'+e+"</span>"),e}function debugIpa(e,t){return $("<div>").html(getIpa(t||"",e,"std")).text()}function getIpa(e,t,a){if(e=e.normalize("NFD"),"debug"===a)return'<span class="ipa-debug">['+htmlEncode(e)+"]</span>";let s=a.replace("*","");"keep"!==a&&["before",t,"after"].forEach(a=>{"audio"===s&&a===t&&ipaConversion[a]&&ipaConversion[a].std&&ipaConversion[a].std.forEach(t=>e=e.replace(t[0],t[1])),ipaConversion[a]&&ipaConversion[a][s]&&ipaConversion[a][s].forEach(t=>e=e.replace(t[0],t[1]))});for(let t=0;t<e.length;t++)switch(e[t]){case"ˈ":case"ˌ":case"¹":case"²":e=e.substring(0,t)+'<span class="ipa-stress-mark">'+e[t]+"</span>"+e.substring(t+1),t+=37;break;case".":e=e.substring(0,t)+'<span class="ipa-dot">.</span>'+e.substring(t+1),t+=29;break;case"=":"std"===a||"audio"===a?(e=e.substring(0,t)+'</span><span class="ipa-liaison">‿</span><span class="ipa-word">'+e.substring(t+1),t+=61):(e=e.substring(0,t)+'</span><span class="ipa-liaison">‿</span><span class="ipa-word-non-interactive">'+e.substring(t+1),t+=67);break;case" ":"std"===a||"audio"===a?(e=e.substring(0,t)+'</span><span class="ipa-space"> </span><span class="ipa-word">'+e.substring(t+1),t+=59):(e=e.substring(0,t)+'</span><span class="ipa-space"> </span><span class="ipa-word-non-interactive">'+e.substring(t+1),t+=65)}return e="std"===a||"audio"===a?'<span class="ipa-word">'+e+"</span>":'<span class="ipa-word-non-interactive">'+e+"</span>","std"===a||"std*"===a||"audio"===a?e='<span class="ipa-delimiter">[</span>'+e+'<span class="ipa-delimiter">]</span>':"keep"!==a&&(e='<span class="ipa-delimiter">/</span>'+e+'<span class="ipa-delimiter">/</span>'),(e=e.replace(/b͡β/g,"b͡?").replace(/t͡θ/g,"t͡?").replace(/q͡χ/g,"q͡?")).normalize("NFC")}function readTemplate(e,t){let a=t,s=[],n="",i="",r=0;for(;"{"===e[a];)a++;for(;a<e.length;a++)if("|"===e[a]&&0===r)n?s.push(i):n=i,i="";else if("{"===e[a]&&"{"===e[a+1])r++,a++,i+="{{";else if("}"===e[a]&&"}"===e[a+1]){if(!(r>0))return n?s.push(i):n=i,{name:n,args:s,endPosition:a+2};r--,a++,i+="}}"}else i+=e[a]}