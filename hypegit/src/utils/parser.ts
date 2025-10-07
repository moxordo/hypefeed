/**
 * HTML parsing utilities for GitHub trending pages
 */

import type { TrendingRepo } from '../types/bindings';
import { ScraperError } from '../types/bindings';

/**
 * Parse GitHub trending HTML to extract repository information
 */
export function parseTrendingHTML(html: string): TrendingRepo[] {
  const repos: TrendingRepo[] = [];

  try {
    // GitHub trending uses article.Box-row for each repository
    // Extract using regex patterns (more reliable than DOM parsing in Workers)

    // Match each repository article block
    const articlePattern = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
    const articles = Array.from(html.matchAll(articlePattern));

    for (const [, articleContent] of articles) {
      try {
        const repo = parseRepoArticle(articleContent);
        if (repo) {
          repos.push(repo);
        }
      } catch (error) {
        console.warn('Failed to parse repo article:', error);
        // Continue with next repo
      }
    }

    if (repos.length === 0) {
      console.warn('No repositories found in trending HTML');
    }

    return repos;

  } catch (error) {
    throw new ScraperError(
      `Failed to parse trending HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse individual repository article
 */
function parseRepoArticle(articleContent: string): TrendingRepo | null {
  // Extract repository full name (owner/name)
  const fullNameMatch = articleContent.match(/<h2[^>]*>[\s\S]*?href="\/([^"]+)"[^>]*>/);
  if (!fullNameMatch) return null;

  const fullName = fullNameMatch[1];
  const [owner, name] = fullName.split('/');

  if (!owner || !name) return null;

  // Extract description
  let description = '';
  const descMatch = articleContent.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  if (descMatch) {
    description = cleanText(descMatch[1]);
  }

  // Extract language
  let language: string | null = null;
  const langMatch = articleContent.match(/itemprop="programmingLanguage"[^>]*>([\s\S]*?)<\/span>/);
  if (langMatch) {
    language = cleanText(langMatch[1]);
  }

  // Extract stars today
  let starsToday: number | null = null;
  const starsTodayMatch = articleContent.match(/(\d+(?:,\d+)?)\s+stars?\s+(?:today|this week|this month)/i);
  if (starsTodayMatch) {
    starsToday = parseInt(starsTodayMatch[1].replace(/,/g, ''), 10);
  }

  // Extract total stars (from star counter)
  let starsCount = 0;
  const starsMatch = articleContent.match(/href="\/[^"]+\/stargazers"[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*([\d,]+)/);
  if (starsMatch) {
    starsCount = parseInt(starsMatch[1].replace(/,/g, ''), 10);
  }

  return {
    owner,
    name,
    full_name: fullName,
    description,
    language,
    stars_count: starsCount,
    stars_today: starsToday,
    html_url: `https://github.com/${fullName}`
  };
}

/**
 * Clean HTML text content
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/&nbsp;/g, ' ')           // Replace &nbsp;
    .replace(/&amp;/g, '&')            // Replace &amp;
    .replace(/&lt;/g, '<')             // Replace &lt;
    .replace(/&gt;/g, '>')             // Replace &gt;
    .replace(/&quot;/g, '"')           // Replace &quot;
    .replace(/&#39;/g, "'")            // Replace &#39;
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .trim();
}
