# MCP Schema Fix Summary

## Issue
Claude's API returned error 400: `input_schema does not support oneOf, allOf, or anyOf at the top level`

## Root Cause
The YouTube Transcript MCP Server was using `oneOf` in its input schema to specify that either `url` OR `video_id` was required. This JSON Schema feature is not supported by Claude's MCP implementation.

## Solution Applied

### YouTube Transcript MCP Server (v1.0.1)
**Changed:**
- Removed `oneOf` from both tool schemas
- Changed to `required: []` (making all fields optional in the schema)
- Added runtime validation to ensure at least one field is provided
- Added explicit error messages when neither field is provided

**Before:**
```json
{
  "properties": { ... },
  "oneOf": [
    { "required": ["url"] },
    { "required": ["video_id"] }
  ]
}
```

**After:**
```json
{
  "properties": { ... },
  "required": []
}
```

**Runtime Validation Added:**
```javascript
if (!args?.url && !args?.video_id) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: 'Either "url" or "video_id" parameter is required'
      }, null, 2)
    }]
  };
}
```

### YouTube RSS MCP Server
No changes needed - it was already using simple `required: ['url']` which is supported.

## Updated Packages

1. **youtube-transcript-mcp-server**
   - Version: 1.0.0 → 1.0.1
   - Status: ✅ Published
   - NPM: https://www.npmjs.com/package/youtube-transcript-mcp-server

2. **youtube-rss-mcp-server**
   - Version: 1.0.0 (unchanged)
   - Status: ✅ No changes needed
   - NPM: https://www.npmjs.com/package/youtube-rss-mcp-server

## Testing

The tools should now work in Claude. Test with:

```
# For YouTube RSS:
Can you extract the RSS feed link for https://www.youtube.com/watch?v=0SQor2z2QAU

# For YouTube Transcript:
Can you get the transcript for https://www.youtube.com/watch?v=0SQor2z2QAU
```

## Key Learning
Claude's MCP implementation doesn't support complex JSON Schema features like `oneOf`, `allOf`, or `anyOf` at the top level of input schemas. Use simple schemas with runtime validation instead.