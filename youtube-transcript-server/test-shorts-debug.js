#!/usr/bin/env node
import https from 'https';

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function debugShorts() {
  const videoId = 'dQw4w9WgXcQ'; // Rick Roll - known to have captions
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  console.log('Fetching YouTube page for video:', videoId);
  console.log('URL:', url);
  console.log('');
  
  try {
    const html = await fetchPage(url);
    console.log('Page fetched, size:', html.length, 'bytes');
    
    // Look for ytInitialPlayerResponse
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    
    if (playerResponseMatch) {
      console.log('✅ Found ytInitialPlayerResponse');
      
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        
        // Check video details
        const videoDetails = playerResponse.videoDetails;
        if (videoDetails) {
          console.log('');
          console.log('Video Details:');
          console.log('  Title:', videoDetails.title);
          console.log('  Duration:', videoDetails.lengthSeconds, 'seconds');
          console.log('  Author:', videoDetails.author);
          console.log('  Is Live:', videoDetails.isLiveContent);
        }
        
        // Check for captions
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer;
        
        if (captions) {
          console.log('');
          console.log('✅ Captions data found');
          
          const captionTracks = captions.captionTracks;
          if (captionTracks && captionTracks.length > 0) {
            console.log(`Found ${captionTracks.length} caption track(s):`);
            console.log('');
            
            captionTracks.forEach((track, i) => {
              console.log(`Track ${i + 1}:`);
              console.log('  Language Code:', track.languageCode);
              console.log('  Language Name:', track.name?.simpleText || track.name?.runs?.[0]?.text);
              console.log('  Kind:', track.kind || 'manual');
              console.log('  Base URL:', track.baseUrl ? '✅ Present' : '❌ Missing');
              
              if (track.baseUrl) {
                // Try to fetch the actual caption
                console.log('  Fetching caption content...');
                
                const captionUrl = new URL(track.baseUrl);
                captionUrl.searchParams.set('fmt', 'srv3');
                
                fetchPage(captionUrl.toString()).then(xml => {
                  console.log(`  Caption XML size: ${xml.length} bytes`);
                  
                  // Count actual text entries
                  const textMatches = xml.match(/<text[^>]*>/g);
                  console.log(`  Text entries found: ${textMatches ? textMatches.length : 0}`);
                  
                  // Show first text entry if exists
                  const firstText = xml.match(/<text[^>]*>([^<]*)<\/text>/);
                  if (firstText) {
                    console.log(`  First caption: "${firstText[1].substring(0, 50)}..."`);
                  } else {
                    console.log('  ⚠️ No text content in caption XML');
                  }
                }).catch(err => {
                  console.log('  ❌ Error fetching caption:', err.message);
                });
              }
              console.log('');
            });
          } else {
            console.log('❌ No caption tracks available');
          }
        } else {
          console.log('❌ No captions data in player response');
        }
        
        // Check playability status
        const playabilityStatus = playerResponse.playabilityStatus;
        if (playabilityStatus) {
          console.log('');
          console.log('Playability Status:', playabilityStatus.status);
          if (playabilityStatus.reason) {
            console.log('Reason:', playabilityStatus.reason);
          }
        }
        
      } catch (e) {
        console.error('❌ Error parsing player response:', e.message);
      }
    } else {
      console.log('❌ Could not find ytInitialPlayerResponse');
      
      // Try alternative patterns
      const captionRegex = /"captionTracks":\[(.+?)\]/;
      const captionMatch = html.match(captionRegex);
      
      if (captionMatch) {
        console.log('✅ Found captions via regex pattern');
      } else {
        console.log('❌ No caption data found in page');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugShorts().catch(console.error);