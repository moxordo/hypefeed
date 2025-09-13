---
command: "/scrape"
category: "Analysis & Investigation"
purpose: "AI YouTube channel discovery and evaluation workflow"
wave-enabled: false
performance-profile: "standard"
parameters:
  - name: "topic"
    type: "string"
    default: "AI pioneer"
    description: "Topic or niche to search for (e.g., 'AI pioneer', 'ML research', 'tech review')"
  - name: "count"
    type: "number"
    default: 50
    description: "Number of channels to find"
  - name: "min_subscribers"
    type: "number"
    default: 100000
    description: "Minimum subscriber count (e.g., 100000 for 100K)"
  - name: "posts_per_month"
    type: "number"
    default: 2
    description: "Minimum posts per month"
  - name: "min_monthly_views"
    type: "number"
    default: 1000000
    description: "Minimum monthly views (e.g., 1000000 for 1M)"
  - name: "exclude_existing"
    type: "boolean"
    default: true
    description: "Filter out channels already in database"
usage: "/scrape [topic] [--count N] [--min-subscribers N] [--posts-per-month N] [--min-monthly-views N] [--no-exclude-existing]"
examples:
  - "/scrape \"ML research\" --count 25"
  - "/scrape --min-subscribers 500000 --count 30"
  - "/scrape \"tech tutorials\" --no-exclude-existing"
---

## Scrape
Using the Web Search() tool, I want you to search for the top {{count}} {{topic}} youtube channels that meet the criteria below

Criteria:
- They have more than {{min_subscribers}} subscribers
- They are posting regularly (Posts more than {{posts_per_month}} times a month)
- They generate more than {{min_monthly_views}} views a month

Rules:
{{#if exclude_existing}}
- Filter out any channels that are already in the database. {{Channel}}
{{/if}}

## Comparison
- During this step, your role is to identify new channels that we've not met before.
- New channels should be indexed into our {{database}} and marked for evaluation as PENDING_EVALUATION

## Evaluation
- Currently the responsibility of the {{entity.operator}}
- The operator will evaluate the channel to see if the recent contents it has been providing is legit enough.
- We might put the channel into different levels
    - LIVE
    - TRYOUT
    - NEW
    - REVISIT
    - DROP

- TRYOUT
    - Contents that the channel in TRYOUT phase generates will be sent down to the "tryout" feed stream.
    - The operator can evaluate the contents in the TRYOUT feed stream and make {{ChannelContentEvaluations}} to provide evaluation and feedback

- CANDIDATE
    - Gets index into the database into {{ChannelCandidates}}
    - Contents get streamed into the "candidate" feed stream
        - the {{evaluator}} taps into the feed stream to evaluate the content
            - summary, implication, mentioned entities
                - the mentioned entities will be looked up from the db to "connect the dots"
    - The operator can decide whether or not to include the candidate in to the TRYOUTs
