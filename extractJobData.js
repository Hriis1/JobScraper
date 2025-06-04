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

    const maxLen = Math.min(5, jobLinks.length);


    for (let i = 0; i < maxLen; i++) {
        const link = jobLinks[i];

        //Get the contents of the curr job page
        const result = await getPageHTML(page, browser, link);

        //error
        if (result[0] == 0) {
            returnData.error.push(result[1]);
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
                                title: json.title || "",
                                description: json.description || "",
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
            //Decode needed fields to html
            jobPostingData.title = he.decode(jobPostingData.title || "");
            jobPostingData.description = he.decode(jobPostingData.description || "");

            //Push to final data
            returnData.jobs_data.push(jobPostingData);
            continue;
        }

        //No application/ld+json - "@type" : "JobPosting"

    }

    return returnData;
}

module.exports = { extractJobData };