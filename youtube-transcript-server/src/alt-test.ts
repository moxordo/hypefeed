// Alternative approach - try to get transcript using a simpler method
async function testAlternative() {
  const videoId = '0SQor2z2QAU';
  
  // Try a direct API approach that some tools use
  const apiUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
  
  console.log(`Trying direct API: ${apiUrl}`);
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': `https://www.youtube.com/watch?v=${videoId}`,
      'Origin': 'https://www.youtube.com'
    }
  });
  
  const text = await response.text();
  console.log(`Response length: ${text.length}`);
  if (text.length > 0) {
    console.log(`First 500 chars: ${text.substring(0, 500)}`);
  }
  
  // Try with different lang codes
  const langs = ['en', 'en-US', 'a.en'];
  for (const lang of langs) {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`;
    console.log(`\nTrying lang=${lang}`);
    const resp = await fetch(url);
    const content = await resp.text();
    console.log(`  Result: ${content.length} bytes`);
  }
}

testAlternative().catch(console.error);