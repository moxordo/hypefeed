#!/bin/bash

# Scrape all Priority 2 and 3 languages for HypeGit
# Usage: ./scripts/scrape-all-languages.sh

API_URL="https://hypegit.andrew-kim0810.workers.dev/api/refresh-sync"
RANGE="daily"

# Priority 2 languages
PRIORITY_2=("java" "c++" "c%23" "c" "kotlin" "swift" "ruby" "php")

# Priority 3 languages
PRIORITY_3=("dart" "elixir" "scala" "zig" "html" "css" "shell")

# All languages combined
ALL_LANG="all"

echo "======================================"
echo "HypeGit Language Scraper"
echo "======================================"
echo ""

echo "📊 Scraping Priority 2 languages..."
for lang in "${PRIORITY_2[@]}"; do
  echo "  → Scraping $lang ($RANGE)..."
  result=$(curl -s -X POST "$API_URL?language=$lang&range=$RANGE")
  repos=$(echo "$result" | grep -o '"reposFound":[0-9]*' | grep -o '[0-9]*')
  processed=$(echo "$result" | grep -o '"processed":[0-9]*' | grep -o '[0-9]*')
  echo "     ✓ Found: $repos repos, Processed: $processed"
  sleep 2
done

echo ""
echo "📊 Scraping Priority 3 languages..."
for lang in "${PRIORITY_3[@]}"; do
  echo "  → Scraping $lang ($RANGE)..."
  result=$(curl -s -X POST "$API_URL?language=$lang&range=$RANGE")
  repos=$(echo "$result" | grep -o '"reposFound":[0-9]*' | grep -o '[0-9]*')
  processed=$(echo "$result" | grep -o '"processed":[0-9]*' | grep -o '[0-9]*')
  echo "     ✓ Found: $repos repos, Processed: $processed"
  sleep 2
done

echo ""
echo "📊 Scraping All Languages..."
result=$(curl -s -X POST "$API_URL?language=$ALL_LANG&range=$RANGE")
repos=$(echo "$result" | grep -o '"reposFound":[0-9]*' | grep -o '[0-9]*')
processed=$(echo "$result" | grep -o '"processed":[0-9]*' | grep -o '[0-9]*')
echo "  ✓ Found: $repos repos, Processed: $processed"

echo ""
echo "======================================"
echo "✅ Scraping complete!"
echo "======================================"
