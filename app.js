const { getPageHTML } = require('./getPageHTML.js');
const fs = require('fs');

const allowed = JSON.parse(fs.readFileSync('./allowed.json', 'utf8')); //json data about the allowed urls

function getURLData(inputUrl) {
    const hostname = new URL(inputUrl).hostname.replace(/^www\./, '').toLowerCase();

    const found = allowed.find(obj => {
        const allowedHost = obj.host.replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        return hostname === allowedHost;
    });

    return found || false;
}


(async () => {
    const url = 'https://www.flexjobs.com/remote-jobs/bilingual';
    const urlData = getURLData(url);

    if (!urlData) {
        console.log('URL not recognized!');
        return;
    }

    const result = await getPageHTML(url);
    console.log(result[0] ? 'Success! HTML for' + url + ' returned and saved!' : 'Error:' + result[1]);
})();
