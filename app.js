const { getPageHTML } = require('./getPageHTML.js');
const fs = require('fs');

const allowed = JSON.parse(fs.readFileSync('./allowed.json', 'utf8')); //json data about the allowed urls

function isUrlAllowed(inputUrl) {
    const hostname = new URL(inputUrl).hostname.replace(/^www\./, '');

    return allowed.some(obj => {
        const allowedHost = new URL(obj.base_url).hostname.replace(/^www\./, '');
        return hostname === allowedHost;
    });
}

(async () => {
    const url = 'https://www.flexjobs.com/remote-jobs/bilingual';

    if (!isUrlAllowed(url)) {
        console.log('URL not recognized!');
        return;
    }

    const result = await getPageHTML(url);
    console.log(result[0] ? 'Success! HTML for' + url + ' returned and saved!' : 'Error:' + result[1]);
})();
