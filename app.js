const { getPageHTML } = require('./getPageHTML.js');

(async () => {
    const url = 'https://empllo.com/';
    const result = await getPageHTML(url);
    console.log(result[0] ? 'Success! HTML saved and returned!' : 'Error:' + result[1]);
})();
