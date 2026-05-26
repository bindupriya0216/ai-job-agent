import { test } from '@playwright/test';
import fs from 'fs';

test.setTimeout(120000);

test('Scrape ONE QA job from Seek NZ', async ({ page }) => {

  // Open Seek NZ
  await page.goto('https://www.seek.co.nz/qa-jobs');

  // Wait for jobs
  await page.waitForTimeout(5000);

  // Get job cards
  const jobs = page.locator('[data-automation="normalJob"]');

  // Count jobs
  const count = await jobs.count();

  console.log(`Jobs Found: ${count}`);

  // Store scraped jobs
  const scrapedJobs = [];

  // ONLY FIRST JOB
  const job = jobs.nth(0);

  try {

    // Extract title
    const title = await job
      .locator('[data-automation="jobTitle"]')
      .textContent({ timeout: 3000 });

    // Extract company
    const company = await job
      .locator('[data-automation="jobCompany"]')
      .textContent({ timeout: 3000 })
      .catch(() => 'N/A');

    // Extract location
    const location = await job
      .locator('[data-automation="jobLocation"]')
      .textContent({ timeout: 3000 })
      .catch(() => 'N/A');

    // Extract link
    const link = await job
      .locator('[data-automation="jobTitle"]')
      .getAttribute('href');

    // Full URL
    const fullLink = `https://www.seek.co.nz${link}`;

    console.log('Opening full job page...');

    // Open job page
    await page.goto(fullLink);

    // Wait for JD
    await page.waitForTimeout(3000);

    // Extract FULL description
    const description = await page
      .locator('[data-automation="jobAdDetails"]')
      .textContent()
      .catch(() => 'No description found');

    // Store data
    scrapedJobs.push({
      title,
      company,
      location,
      link: fullLink,
      description
    });

    // Terminal logs
    console.log('--------------------');
    console.log(`Title: ${title}`);
    console.log(`Company: ${company}`);
    console.log(`Location: ${location}`);
    console.log(`Link: ${fullLink}`);

    // ONLY preview in terminal
    console.log(description?.slice(0, 300));

  } catch (error) {

    console.log('Failed to scrape first job');

  }

  // Save JSON
  fs.writeFileSync(
    'jobs.json',
    JSON.stringify(scrapedJobs, null, 2)
  );

  console.log('Jobs saved to jobs.json');

});