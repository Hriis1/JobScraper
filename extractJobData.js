//Puppeteer
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

//Decode html
const he = require('he');

//Custom
const { getPageHTML } = require('./getPageHTML.js');

async function extractJobData(page, browser, jobLinks) {

    //Return data structure
    let returnData = {
        jobs_data: [],
        error: []
    };


    for (let i = 0; i < jobLinks.length; i++) {
        const link = jobLinks[i];

        //Get the contents of the curr job page
        const result = await getPageHTML(page, browser, link);

        //error
        if (result[0] == 0) {
            returnData["error"].push(result[1]);
            continue;
        }

        //success

        //check if page has application/ld+json - "@type" : "JobPosting"
        const jobPostingData = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => {
                for (const script of scripts) {
                    try {
                        const json = JSON.parse(script.textContent);
                        if ((json['@type'] === 'JobPosting') || (Array.isArray(json['@type']) && json['@type'].includes('JobPosting'))) {
                            return {
                                title: he.decode(json.title || ""),
                                description: he.decode(json.description || ""),
                                datePosted: json.datePosted || "",
                                validThrough: json.validThrough || "",
                                employmentType: json.employmentType || "",
                                hiringOrganization: (json.hiringOrganization && json.hiringOrganization.name) || "",
                                location: json.jobLocationType || "",
                                // add other fields as needed
                            };
                        }
                    } catch (e) { }
                }
                return null;
            }
        );

        //if there was application/ld+json - "@type" : "JobPosting"
        if (jobPostingData) {
            returnData.jobs_data.push(jobPostingData);
            continue;
        }

        //No application/ld+json - "@type" : "JobPosting"

    }

    return returnData;
}

module.exports = { extractJobData };