import type { Channel, FeedMetadata } from '../types/bindings';

// Channel configuration derived from the scraped data
export const AI_CHANNELS: Channel[] = [
  {
    name: "Two Minute Papers",
    handle: "@TwoMinutePapers",
    channel_id: "UCbfYPyITQ-7l4upoX8nvctg",
    youtube_url: "https://youtube.com/@TwoMinutePapers",
    rss_feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg",
    subscribers: "1.66M",
    description: "Research paper summaries and AI breakthroughs explained by Károly Zsolnai-Fehér",
    posting_frequency: "13 videos/month",
    category: "research_analysis",
    status: "LIVE"
  },
  {
    name: "Krish Naik",
    handle: "@krishnaik06",
    channel_id: "UCjWY5hREA6FFYrthD0rZNIw",
    youtube_url: "https://youtube.com/@krishnaik06",
    rss_feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCjWY5hREA6FFYrthD0rZNIw",
    subscribers: "1.25M",
    description: "Machine learning, data science, and AI tutorials with practical projects",
    posting_frequency: "Regular uploads",
    category: "education_tutorials",
    status: "LIVE"
  },
  {
    name: "Matt Wolfe",
    handle: "@mreflow",
    channel_id: "UCuK2Mf5As9OKfWU7XV6yzCg",
    youtube_url: "https://youtube.com/@mreflow",
    rss_feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCuK2Mf5As9OKfWU7XV6yzCg",
    subscribers: "785K",
    description: "AI tools exploration and practical applications, creator of FutureTools.io",
    posting_frequency: "Weekly uploads",
    category: "tools_practical",
    status: "LIVE"
  },
  {
    name: "DeepLearning.AI",
    handle: "@Deeplearningai",
    channel_id: "UCcIXc5mJsHVYTZR1maL5l9w",
    youtube_url: "https://youtube.com/@Deeplearningai",
    rss_feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCcIXc5mJsHVYTZR1maL5l9w",
    subscribers: "429K",
    description: "Educational AI content by Andrew Ng and DeepLearning.AI team",
    posting_frequency: "Regular uploads",
    category: "education_academic",
    status: "LIVE"
  },
  {
    name: "Sentdex",
    handle: "@sentdex",
    channel_id: "UCQALLeQPoZdZC4JNUboVEUg",
    youtube_url: "https://youtube.com/@sentdex",
    rss_feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCQALLeQPoZdZC4JNUboVEUg",
    subscribers: "273K",
    description: "Python programming for ML, data analysis, and AI by Harrison Kinsley",
    posting_frequency: "3 videos/week",
    category: "programming_tutorials",
    status: "LIVE"
  },
  {
    name: "MattVidPro AI",
    handle: "@MattVidPro",
    channel_id: "UC06GdmaEdCdCFwR3NvszloQ",
    youtube_url: "https://youtube.com/@MattVidPro",
    rss_feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC06GdmaEdCdCFwR3NvszloQ",
    subscribers: "245K",
    description: "AI for video production and filmmaking by Matthew Pierce",
    posting_frequency: "Regular uploads",
    category: "ai_video_production",
    status: "LIVE"
  },
  {
    name: "Andrej Karpathy",
    handle: "@karpathy",
    channel_id: "UCe4jUOmQPKMDvOkzJpDfMRQ",
    youtube_url: "https://youtube.com/@karpathy",
    rss_feed_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCe4jUOmQPKMDvOkzJpDfMRQ",
    subscribers: "220K",
    description: "Deep learning and LLM tutorials from ex-OpenAI/Tesla AI director",
    posting_frequency: "Educational series",
    category: "deep_learning_expert",
    status: "LIVE"
  }
];

// Filter only active channels for RSS aggregation
export function getActiveChannels(): Channel[] {
  return AI_CHANNELS.filter(channel => 
    channel.status === 'LIVE' || 
    channel.status === 'TRYOUT' || 
    channel.status === 'CANDIDATE'
  );
}

// Get channel by ID
export function getChannelById(channelId: string): Channel | undefined {
  return AI_CHANNELS.find(channel => channel.channel_id === channelId);
}

// Get channels by category
export function getChannelsByCategory(category: string): Channel[] {
  return AI_CHANNELS.filter(channel => channel.category === category);
}

// Generate metadata for the combined feed
export function generateFeedMetadata(): FeedMetadata {
  const activeChannels = getActiveChannels();
  
  return {
    title: "AI Pioneer YouTube Channels RSS Feeds",
    description: "RSS feeds for top AI pioneer YouTube channels meeting criteria: 100K+ subscribers, 2+ posts/month, 1M+ monthly views",
    generated_at: new Date().toISOString(),
    total_channels: activeChannels.length,
    success_count: activeChannels.length,
    failure_count: 0,
    channels: activeChannels
  };
}

// Categories for organizing content
export const CATEGORIES = {
  RESEARCH_ANALYSIS: 'research_analysis',
  EDUCATION_TUTORIALS: 'education_tutorials',
  TOOLS_PRACTICAL: 'tools_practical',
  EDUCATION_ACADEMIC: 'education_academic',
  PROGRAMMING_TUTORIALS: 'programming_tutorials',
  AI_VIDEO_PRODUCTION: 'ai_video_production',
  DEEP_LEARNING_EXPERT: 'deep_learning_expert',
} as const;

export type CategoryType = typeof CATEGORIES[keyof typeof CATEGORIES];