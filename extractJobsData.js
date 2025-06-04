//Puppeteer
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

//File stream
const fs = require('fs');

//Decode html
const he = require('he');

//Custom
const { getPageHTML } = require('./getPageHTML.js');

async function extractJobsData(page, browser, jobLinks) {

    //Return data structure
    let returnData = {
        total: 0,
        jobs_data: [],
        error: []
    };

    const maxLen = Math.min(100, jobLinks.length);


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
                    let text = script.textContent;
                    // Remove unescaped control characters
                    text = text.replace(/[\u0000-\u001F]+/g, ' ');
                    try {
                        const json = JSON.parse(text);
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
                    } catch (e) { return { error: e.message }; }
                }
                return null;
            }
        );

        //if there was application/ld+json - "@type" : "JobPosting"
        if (jobPostingData) {
            //Decode needed fields to html
            jobPostingData.title = he.decode(he.decode(jobPostingData.title) || "");
            jobPostingData.description = he.decode(he.decode(jobPostingData.description) || "");

            //Push to final data
            returnData.total++;
            returnData.jobs_data.push(jobPostingData);
            continue;
        }
        returnData.error.push(`No JobPosting for ${link}`);

        //No application/ld+json - "@type" : "JobPosting"

    }

    return returnData;
}

module.exports = { extractJobsData };