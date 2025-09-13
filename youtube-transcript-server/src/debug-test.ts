// Debug test to understand what's happening
async function debugTest() {
  const videoId = '0SQor2z2QAU';
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  console.log(`Fetching ${url}...`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  const html = await response.text();
  console.log(`HTML length: ${html.length}`);
  
  // Check for ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (playerResponseMatch) {
    console.log('Found ytInitialPlayerResponse');
    try {
      const playerResponse = JSON.parse(playerResponseMatch[1]);
      const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (captions) {
        console.log(`Found ${captions.length} caption tracks:`);
        captions.forEach((track: any) => {
          console.log(`  - ${track.languageCode}: ${track.name?.simpleText || track.name?.runs?.[0]?.text}`);
          console.log(`    URL: ${track.baseUrl?.substring(0, 100)}...`);
        });
        
        // Try fetching both caption tracks
        for (let i = 0; i < Math.min(captions.length, 2); i++) {
          if (captions[i]?.baseUrl) {
            console.log(`\n=== Testing caption track ${i + 1} ===`);
            console.log(`Language: ${captions[i].languageCode}`);
            console.log(`Name: ${captions[i].name?.simpleText || captions[i].name?.runs?.[0]?.text}`);
          
            // Try without modifying the URL first
            console.log('\nAttempt 1: Using original URL as-is');
            let captionUrl = captions[i].baseUrl;
            console.log(`URL: ${captionUrl.substring(0, 150)}...`);
          
          let captionResponse = await fetch(captionUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          
          let xml = await captionResponse.text();
          console.log(`Result: ${xml.length} bytes`);
          if (xml.length > 0) {
            console.log(`First 300 chars: ${xml.substring(0, 300)}`);
          }
          
            // Try with fmt=srv3
            console.log('\nAttempt 2: Adding fmt=srv3');
            const urlWithFormat = new URL(captions[i].baseUrl);
            urlWithFormat.searchParams.set('fmt', 'srv3');
            
            captionResponse = await fetch(urlWithFormat.toString());
            xml = await captionResponse.text();
            console.log(`Result: ${xml.length} bytes`);
            if (xml.length > 0) {
              console.log(`First 300 chars: ${xml.substring(0, 300)}`);
            }
            
            // Try with fmt=vtt (WebVTT format)
            console.log('\nAttempt 3: Using fmt=vtt');
            urlWithFormat.searchParams.set('fmt', 'vtt');
            
            captionResponse = await fetch(urlWithFormat.toString());
            const vtt = await captionResponse.text();
            console.log(`Result: ${vtt.length} bytes`);
            if (vtt.length > 0) {
              console.log(`First 300 chars: ${vtt.substring(0, 300)}`);
            }
          }
        }
      } else {
        console.log('No captions found in playerResponse');
      }
    } catch (e) {
      console.log('Error parsing playerResponse:', e);
    }
  } else {
    console.log('No ytInitialPlayerResponse found');
    
    // Try the fallback regex
    const captionRegex = /"captionTracks":\[(.+?)\]/;
    const match = html.match(captionRegex);
    if (match) {
      console.log('Found captionTracks via regex');
    } else {
      console.log('No captionTracks found via regex either');
    }
  }
}

debugTest().catch(console.error);