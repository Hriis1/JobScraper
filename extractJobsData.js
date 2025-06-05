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

async function extractJobsData(page, browser, jobLinks, urlData) {

    //Return data structure
    let returnData = {
        site: urlData.site,
        link_given: "",
        total: 0,
        jobs_data: [],
        error: []
    };

    //check if page selectors are present
    const hasPageSelectors = !!(urlData.page_selectors && Object.keys(urlData.page_selectors).length);

    //Break after this many tries if there is no application/ld+json - "@type" : "JobPosting" and no page selectors and job_data is empty
    const baseBreakCounter = 3;
    let breakCounter = baseBreakCounter;

    //Set max num of jobs to take
    const maxLen = Math.min(100, jobLinks.length);

    //Take info for each job
    for (let i = 0; i < maxLen; i++) {
        const link = jobLinks[i];

        // Open a new page for this job
        const jobPage = await browser.newPage();

        //Get the contents of the curr job page
        const result = await getPageHTML(jobPage, browser, link);

        //error
        if (result[0] == 0) {
            returnData.error.push(result[1]);
            await jobPage.close();
            continue;
        }

        //success

        //check if page has application/ld+json - "@type" : "JobPosting"
        const jobPostingData = await jobPage.$$eval(
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
                                category: json.occupationalCategory || "",
                                minSalary: (json.baseSalary && json.baseSalary.value && json.baseSalary.value.minValue) ? json.baseSalary.value.minValue.toString() : "",
                                maxSalary: (json.baseSalary && json.baseSalary.value && json.baseSalary.value.maxValue) ? json.baseSalary.value.maxValue.toString() : "",
                                currency: (json.baseSalary && json.baseSalary.currency) ? json.baseSalary.currency : "",
                                unitText: (json.baseSalary && json.baseSalary.value && json.baseSalary.value.unitText) ? json.baseSalary.value.unitText : "",
                                salaryOverAll: "",
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
            //Reset break counter
            breakCounter = baseBreakCounter;

            //Decode needed fields to html
            jobPostingData.title = he.decode(he.decode(jobPostingData.title) || "");
            jobPostingData.description = he.decode(he.decode(jobPostingData.description) || "");

            //Push to final data
            returnData.total++;
            returnData.jobs_data.push(jobPostingData);
            await jobPage.close();
            continue;
        }

        //No application/ld+json - "@type" : "JobPosting"
        //returnData.error.push(`No JobPosting for ${link}`);

        //if page selectors are there
        if (hasPageSelectors) {

            // Default structure for manual extraction
            let manualJobData = {
                title: "",
                description: "",
                datePosted: "",
                validThrough: "",
                employmentType: "",
                hiringOrganization: "",
                location: "",
                category: "",
                minSalary: "",
                maxSalary: "",
                currency: "",
                unitText: "",
                salaryOverAll: ""
            };

            // Extract using selectors if set
            const selectors = urlData.page_selectors;

            // Helper to get single element text
            async function getText(selector, takeHTML = false) {
                if (!selector) return "";
                try {
                    if (!takeHTML) {
                        return await jobPage.$eval(selector, el => el.textContent.trim());
                    } else {
                        // Returns the HTML inside the element, not including the element tag itself
                        return await jobPage.$eval(selector, el => el.innerHTML.trim());
                    }
                } catch (e) {
                    return "";
                }
            }

            // helper to collapse multiple spaces into one, and trim ends
            function normalize(text) {
                return text.replace(/\s{2,}/g, ' ').trim();
            }

            /* const html = await jobPage.content();
            console.log(html); */

            // Extract each field
            manualJobData.title = await getText(selectors.title_selector);
            manualJobData.description = await getText(selectors.description_selector, true);
            manualJobData.datePosted = await getText(selectors.date_posted_selector);
            manualJobData.validThrough = await getText(selectors.valid_through_selector);
            manualJobData.employmentType = await getText(selectors.employment_type_selector);
            manualJobData.hiringOrganization = await getText(selectors.hiring_organization_selector);
            manualJobData.location = await getText(selectors.location_selector);

            // Categories (all <a> text joined)
            manualJobData.category = await getText(selectors.category_selector);

            // Salary
            manualJobData.salaryOverAll = await getText(selectors.salary_selector);
            // If there are no digits anywhere in the string, clear it
            if (!/\d/.test(manualJobData.salaryOverAll)) {
                manualJobData.salaryOverAll = "";
            }

            // Decode HTML entities
            manualJobData.title = he.decode(he.decode(manualJobData.title) || "");
            manualJobData.description = he.decode(he.decode(manualJobData.description) || "");
            manualJobData.datePosted = he.decode(he.decode(manualJobData.datePosted) || "");
            manualJobData.validThrough = he.decode(he.decode(manualJobData.validThrough) || "");
            manualJobData.employmentType = he.decode(he.decode(manualJobData.employmentType) || "");
            manualJobData.hiringOrganization = he.decode(he.decode(manualJobData.hiringOrganization) || "");
            manualJobData.location = he.decode(he.decode(manualJobData.location) || "");
            manualJobData.category = he.decode(he.decode(manualJobData.category) || "");
            manualJobData.salaryOverAll = he.decode(he.decode(manualJobData.salaryOverAll) || "");

            //Removem multiple spaces
            manualJobData.title = normalize(manualJobData.title);
            manualJobData.datePosted = normalize(manualJobData.datePosted);
            manualJobData.validThrough = normalize(manualJobData.validThrough);
            manualJobData.employmentType = normalize(manualJobData.employmentType);
            manualJobData.hiringOrganization = normalize(manualJobData.hiringOrganization);
            manualJobData.location = normalize(manualJobData.location);
            manualJobData.category = normalize(manualJobData.category);
            manualJobData.salaryOverAll = normalize(manualJobData.salaryOverAll);


            // Push to return data if at least one main field is found (optional, you can skip this if you want everything)
            if (
                manualJobData.title || manualJobData.description || manualJobData.datePosted
            ) {
                returnData.total++;
                returnData.jobs_data.push(manualJobData);
            } else {
                returnData.error.push(`No data found by selectors for ${link}, ${selectors.title_selector}, ${selectors.description_selector}, ${selectors.date_posted_selector}`);
            }

        } else { //if page selectors arent there
            returnData.error.push(`No page selectors or JobPosting data for ${link}`);

            //If no job was yet taken
            if (returnData.jobs_data.length == 0) {
                //if break counter reaches 0 break
                if (--breakCounter == 0) {
                    returnData.error.push(`No selectors or JobPosting data for over all`);
                    break;
                }
            }
        }

        await jobPage.close();
    }

    return returnData;
}

module.exports = { extractJobsData };