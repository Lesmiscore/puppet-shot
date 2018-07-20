const puppeteer = require('puppeteer');
module.exports = async function screenshot(urls, opts) {
    const {
        headless,
        longShot,
        width,
        height
    } = Object.assign({}, {
        headless: true,
        longShot: false,
        width: 1024,
        height: 768
    }, opts);
    const browser = await puppeteer.launch({
        headless
    });
    const promises = [];
    for (let key in urls) {
        const url = urls[key];
        promises.push((async () => {
            let buff = null;
            const page = await browser.newPage();
            try {
                await page.setViewport({
                    width,
                    height
                });
                await page.goto(url, {
                    timeout: 3000 * 1000
                });
                buff = await page.screenshot({
                    fullPage: !!longShot
                });
            } catch (e) {} finally {
                await page.close();
            }
            return buff;
        })());
    }
    const results = await Promise.all(promises);
    await browser.close();
    return results;
}