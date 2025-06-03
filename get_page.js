const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Try non-headless for less detection
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        const response = await page.goto('https://www.flexjobs.com/remote-jobs/bilingual', { waitUntil: 'domcontentloaded' });
        console.log('Request status: ', response?.status());

        const html = await page.content();
        fs.writeFileSync('testPage.html', html);
    } catch (err) {
        console.log('Failed to load:', err)
    }
    await browser.close()
})()
