const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function getPageHTML(url) {
    let returnVal = null;
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        const status = response?.status();

        if (status == 200) {
            const html = await page.content();

            fs.writeFileSync("testPage.html", html); //optionally write the html to a file

            returnVal = [1, html];
        } else {
            returnVal = [0, "Fail! Request status: " + status];
        }

    } catch (err) {
        returnVal = [0, `Failed to load: ${err}`];
    }
    await browser.close();

    return returnVal;
}

module.exports = { getPageHTML };
