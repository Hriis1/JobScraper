const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

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
            return [0, "Fail! Request status: " + status];
        }

    } catch (err) {
        return returnVal = [0, `Failed to load: ${err}`];
    }
}

module.exports = { getPageHTML };
