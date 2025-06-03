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
    const url = 'https://weworkremotely.com/categories/remote-sales-and-marketing-jobs';
    const urlData = getURLData(url);

    if (!urlData) {
        console.log('URL not recognized!');
        return;
    }
    if (!urlData.board_selectors || !urlData.board_selectors.link_selector) {
        console.log('No link selector configured for this site!');
        return;
    }

    const result = await getPageHTML(url);
    if (result[0] == 0) { //Ok fail
        console.log('Error:' + result[1]);
        return;
    }

    //Got the html successfully
    const page = result[1];
    const browser = result[2];

    // Extract job links
    const jobLinks = await page.$$eval(
        urlData.board_selectors.link_selector,
        links => links.map(link => link.href)
    );
    console.log(jobLinks);

    // Done with Puppeteer, close browser!
    await browser.close();

})();
