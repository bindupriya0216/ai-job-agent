import { test } from '@playwright/test';
import fs from 'fs';

test.setTimeout(120000);

test('Scrape QA jobs from Seek NZ', async ({ page }) => {

  // Open Seek NZ QA jobs page
  await page.goto('https://www.seek.co.nz/qa-jobs');

  // Wait for jobs to load
  await page.waitForTimeout(5000);

  // Get all job cards
  const jobs = page.locator('[data-automation="normalJob"]');

  // Count total jobs
  const count = await jobs.count();

  // Store scraped jobs
  const scrapedJobs = [];

  console.log(`Jobs Found: ${count}`);

  // Loop through job cards
  for (let i = 0; i < Math.min(count, 10); i++) {

    const job = jobs.nth(i);

    try {

      // Extract title
      const title = await job
        .locator('[data-automation="jobTitle"]')
        .textContent({ timeout: 3000 });

      // Extract job link
      const link = await job
        .locator('[data-automation="jobTitle"]')
        .getAttribute('href');

      // Convert to full URL
      const fullLink = `https://www.seek.co.nz${link}`;

      // Extract company safely
      const company = await job
        .locator('[data-automation="jobCompany"]')
        .textContent({ timeout: 3000 })
        .catch(() => 'N/A');

      // Extract location safely
      const location = await job
        .locator('[data-automation="jobLocation"]')
        .textContent({ timeout: 3000 })
        .catch(() => 'N/A');

      // Store job data
      scrapedJobs.push({
        title,
        company,
        location,
        link: fullLink
      });

      // Print extracted data
      console.log('--------------------');
      console.log(`Title: ${title}`);
      console.log(`Company: ${company}`);
      console.log(`Location: ${location}`);
      console.log(`Link: ${fullLink}`);

    } catch (error) {

      console.log(`Skipping broken job card: ${i}`);

    }

  }

  // Save jobs to JSON file
  fs.writeFileSync(
    'jobs.json',
    JSON.stringify(scrapedJobs, null, 2)
  );

  console.log('Jobs saved to jobs.json');

});