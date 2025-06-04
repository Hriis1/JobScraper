//Puppeteer
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

//File stream
const fs = require('fs');
const path = require('path');

//Custom
const { getPageHTML } = require('./getPageHTML.js');
const { extractJobsData } = require('./extractJobsData.js');
const { count } = require('console');

const allowed = JSON.parse(fs.readFileSync('./allowed.json', 'utf8')); //json data about the allowed urls

function getURLData(inputUrl) {
    const hostname = new URL(inputUrl).hostname.replace(/^www\./, '').toLowerCase();

    const found = allowed.find(obj => {
        const allowedHost = obj.host.replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        return hostname === allowedHost;
    });

    return found || false;
}

function getAvailableFileName(baseName, dir) {
    baseName = baseName.replace(/[^\w\-]+/g, '_'); //non letter or numbers with _
    let idx = 1;
    let fileName;
    do {
        fileName = `${baseName}_data_${idx}.json`;
        idx++;
    } while (fs.existsSync(path.join(dir, fileName)));
    return path.join(dir, fileName);
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

    /* console.log(await page.content()); */
    /* console.log(jobLinks.length);
    console.log(jobLinks);

    await browser.close();
    return; */


    let jobsData = await extractJobsData(page, browser, jobLinks, urlData);
    jobsData.link_given = url;

    //Save to a file
    const jobsDir = path.join(__dirname, 'jobs_data');
    const filePath = getAvailableFileName(urlData.site, jobsDir);
    fs.writeFileSync(filePath, JSON.stringify(jobsData, null, 2), 'utf8');
    console.log(`Job data for ${url} saved`, filePath);

    // Done with Puppeteer, close browser!
    await browser.close();

})();
