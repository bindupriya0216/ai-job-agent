import { expect, test, type Locator, type Page } from '@playwright/test';
import * as fs from 'node:fs';

type ScrapedJob = {
  title: string;
  company: string;
  location: string;
  link: string;
  description: string;
  matchedKeywords: string[];
  matchScore: number;
};

type JobSummary = {
  title: string;
  company: string;
  location: string;
  link: string;
  fallbackDescription: string;
};

const searchUrl = process.env.SEARCH_URL ?? 'https://www.seek.co.nz/qa-jobs';
const requestedMaxJobs = Number(process.env.MAX_JOBS ?? 3);
const maxJobs = Number.isFinite(requestedMaxJobs) && requestedMaxJobs > 0 ? requestedMaxJobs : 3;
const outputPath = process.env.OUTPUT_PATH ?? 'jobs.json';
const keywords = (process.env.KEYWORDS ?? 'qa,tester,automation,playwright,selenium,api,testing')
  .split(',')
  .map((keyword) => keyword.trim().toLowerCase())
  .filter(Boolean);

test.describe('QA job discovery assistant', () => {
  test('scrapes and ranks QA jobs from Seek NZ', async ({ page }) => {
    const jobs = await scrapeSeekJobs(page);

    expect(jobs.length, 'at least one job should be scraped').toBeGreaterThan(0);
    expect(jobs.length, 'scraper should respect MAX_JOBS').toBeLessThanOrEqual(maxJobs);

    for (const job of jobs) {
      expect(job.title, 'job title is required').not.toEqual('');
      expect(job.link, 'job link should be a Seek URL').toContain('seek.co.nz');
      expect(job.description, 'job description is required').not.toEqual('');
    }

    const rankedJobs = rankJobsByKeywordMatch(jobs);

    fs.writeFileSync(outputPath, `${repairEncodingArtifacts(JSON.stringify(rankedJobs, null, 2))}\n`);

    console.log(`Scraped ${rankedJobs.length} job(s) from ${searchUrl}`);
    console.log(`Saved ranked jobs to ${outputPath}`);
    console.log(`Top match: ${rankedJobs[0]?.title ?? 'No match found'}`);
  });
});

async function scrapeSeekJobs(page: Page): Promise<ScrapedJob[]> {
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

  const jobCards = page.locator('[data-automation="normalJob"]');
  await expect(jobCards.first(), 'Seek job cards should load').toBeVisible({ timeout: 20_000 });

  const jobsToScrape = Math.min(await jobCards.count(), maxJobs);
  const summaries: JobSummary[] = [];

  for (let index = 0; index < jobsToScrape; index += 1) {
    const jobCard = jobCards.nth(index);
    const titleLink = jobCard.locator('[data-automation="jobTitle"]');
    const relativeLink = await titleLink.getAttribute('href');

    summaries.push({
      title: cleanText(await titleLink.textContent()),
      company: await optionalText(jobCard, '[data-automation="jobCompany"]'),
      location: await optionalText(jobCard, '[data-automation="jobLocation"]'),
      link: toSeekUrl(relativeLink),
      fallbackDescription: cleanText(await jobCard.textContent())
    });
  }

  const scrapedJobs: ScrapedJob[] = [];

  for (const summary of summaries) {
    let description = summary.fallbackDescription;

    try {
      await page.goto(summary.link, { waitUntil: 'domcontentloaded', timeout: 20_000 });

      description = cleanText(
        await page
          .locator('[data-automation="jobAdDetails"]')
          .textContent({ timeout: 10_000 })
          .catch(() => summary.fallbackDescription)
      );
    } catch (error) {
      console.warn(`Detail page was slow or unavailable, using result-card text for: ${summary.title}`);
    }

    scrapedJobs.push({
      title: summary.title,
      company: summary.company,
      location: summary.location,
      link: summary.link,
      description,
      matchedKeywords: [],
      matchScore: 0
    });
  }

  return scrapedJobs;
}

function rankJobsByKeywordMatch(jobs: ScrapedJob[]): ScrapedJob[] {
  return jobs
    .map((job) => {
      const searchableText = `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase();
      const matchedKeywords = keywords.filter((keyword) => searchableText.includes(keyword));

      return {
        ...job,
        matchedKeywords,
        matchScore: matchedKeywords.length
      };
    })
    .sort((left, right) => right.matchScore - left.matchScore || left.title.localeCompare(right.title));
}

async function optionalText(parent: Locator, selector: string): Promise<string> {
  return cleanText(await parent.locator(selector).textContent({ timeout: 3_000 }).catch(() => 'N/A'));
}

function cleanText(value: string | null | undefined): string {
  return repairEncodingArtifacts(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function repairEncodingArtifacts(value: string): string {
  let repairedValue = '';

  for (let index = 0; index < value.length; index += 1) {
    const current = value.charCodeAt(index);
    const next = value.charCodeAt(index + 1);
    const marker = value.charCodeAt(index + 2);

    if (current === 0x00e2 && next === 0x20ac) {
      if (marker === 0x2122 || marker === 0x02dc) {
        repairedValue += "'";
        index += 2;
        continue;
      }

      if (marker === 0x0153 || marker === 0xfffd) {
        repairedValue += '"';
        index += 2;
        continue;
      }

      if (marker === 0x201c || marker === 0x201d || marker === 0x2018) {
        repairedValue += '-';
        index += 2;
        continue;
      }

      if (marker === 0x00a2) {
        repairedValue += '-';
        index += 2;
        continue;
      }
    }

    if (current !== 0x00c2) {
      repairedValue += value[index];
    }
  }

  return repairedValue;
}

function toSeekUrl(relativeLink: string | null): string {
  if (!relativeLink) {
    throw new Error('Job link was missing from the Seek result card.');
  }

  return relativeLink.startsWith('http') ? relativeLink : `https://www.seek.co.nz${relativeLink}`;
}
