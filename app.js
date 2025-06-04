const { getPageHTML } = require('./getPageHTML.js');
const fs = require('fs');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

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
    //URL and its data from allowed.json
    const url = 'https://weworkremotely.com/categories/remote-full-stack-programming-jobs';
    const urlData = getURLData(url);

    //if url not in allowed.json or there is no link_selector
    if (!urlData) {
        console.log('URL not recognized!');
        return;
    }
    if (!urlData.board_selectors || !urlData.board_selectors.link_selector) {
        console.log('No link selector configured for this site!');
        return;
    }

    //Create a browser and a page
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    //Get the contents of the listings page
    const result = await getPageHTML(page, browser, url);

    if (result[0] == 0) { //fail
        await browser.close();
        console.log('Error:' + result[1]);
        return;
    }

    //Got the html successfully
    // Extract job links
    const jobLinks = await page.$$eval(
        urlData.board_selectors.link_selector,
        links => links.map(link => link.href)
    );
    console.log(jobLinks);

    // Done with Puppeteer, close browser!
    await browser.close();

})();
