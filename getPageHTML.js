//Puppeteer
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

//File stream
const fs = require('fs');

async function getPageHTML(page, browser, url) {
    try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        const status = response?.status();

        if (status == 200) {
            //optionally write the html to a file
            /* const html = await page.content();
            fs.writeFileSync("testPage.html", html); */

            return [1, ""];
        } else {
            return [0, `Fail for ${url}! Request status: ${status}`];
        }

    } catch (err) {
        return returnVal = [0, `Failed to load ${url}: ${err}`];
    }
}

module.exports = { getPageHTML };
