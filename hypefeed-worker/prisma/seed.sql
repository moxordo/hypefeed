
-- Seed Categories

    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      '62c8c3ad-17b9-46ef-9927-c1b06c86e97b',
      'research_analysis',
      'Research Analysis',
      'AI research papers and breakthrough analysis',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  

    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      '4ecf83f8-9581-4062-ad8d-d879f9c89255',
      'education_tutorials',
      'Education & Tutorials',
      'Educational content and hands-on tutorials',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  

    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      '3841772e-5676-4dfd-a1c4-dee92873a46b',
      'tools_practical',
      'Tools & Practical',
      'AI tools exploration and practical applications',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  

    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      '3597b745-f860-4410-89da-c1039582b933',
      'education_academic',
      'Education Academic',
      'Academic and structured learning content',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  

    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      '62eb4c94-e313-4f8c-b6d6-37603661d806',
      'programming_tutorials',
      'Programming Tutorials',
      'Coding tutorials and programming guides',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  

    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      '94a983d4-6fce-4e1a-a169-b8cafdaefa24',
      'ai_video_production',
      'AI Video Production',
      'AI for video and content creation',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  

    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      'dc0d0aac-1be7-4145-b460-5a1d7b328e0d',
      'deep_learning_expert',
      'Deep Learning Expert',
      'Advanced deep learning and neural networks',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  

-- Seed Channels

    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      '51b7eab5-5329-423b-b528-51b03329aeef',
      'Two Minute Papers',
      '@TwoMinutePapers',
      'UCbfYPyITQ-7l4upoX8nvctg',
      'https://youtube.com/@TwoMinutePapers',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg',
      '1.66M',
      'Research paper summaries and AI breakthroughs explained by Károly Zsolnai-Fehér',
      '13 videos/month',
      'research_analysis',
      'LIVE',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  

    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      'b7101320-e3ad-45dc-b6bf-31badd004dc0',
      'Krish Naik',
      '@krishnaik06',
      'UCjWY5hREA6FFYrthD0rZNIw',
      'https://youtube.com/@krishnaik06',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCjWY5hREA6FFYrthD0rZNIw',
      '1.25M',
      'Machine learning, data science, and AI tutorials with practical projects',
      'Regular uploads',
      'education_tutorials',
      'LIVE',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  

    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      'af252587-e6e2-4547-b97c-bd1e662a531d',
      'Matt Wolfe',
      '@mreflow',
      'UCuK2Mf5As9OKfWU7XV6yzCg',
      'https://youtube.com/@mreflow',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCuK2Mf5As9OKfWU7XV6yzCg',
      '785K',
      'AI tools exploration and practical applications, creator of FutureTools.io',
      'Weekly uploads',
      'tools_practical',
      'LIVE',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  

    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      'fde7bf72-dac4-4dbd-8948-e6352194834c',
      'DeepLearning.AI',
      '@Deeplearningai',
      'UCcIXc5mJsHVYTZR1maL5l9w',
      'https://youtube.com/@Deeplearningai',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCcIXc5mJsHVYTZR1maL5l9w',
      '429K',
      'Educational AI content by Andrew Ng and DeepLearning.AI team',
      'Regular uploads',
      'education_academic',
      'LIVE',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  

    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      '7e9dec0a-443e-4e25-ba6d-952eb491648b',
      'Sentdex',
      '@sentdex',
      'UCQALLeQPoZdZC4JNUboVEUg',
      'https://youtube.com/@sentdex',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCQALLeQPoZdZC4JNUboVEUg',
      '273K',
      'Python programming for ML, data analysis, and AI by Harrison Kinsley',
      '3 videos/week',
      'programming_tutorials',
      'LIVE',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  

    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      '085dd9b7-7447-43d4-9588-c812fc17916d',
      'MattVidPro AI',
      '@MattVidPro',
      'UC06GdmaEdCdCFwR3NvszloQ',
      'https://youtube.com/@MattVidPro',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UC06GdmaEdCdCFwR3NvszloQ',
      '245K',
      'AI for video production and filmmaking by Matthew Pierce',
      'Regular uploads',
      'ai_video_production',
      'LIVE',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  

    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      'ab7e9285-119c-4480-96cd-3905e994d7b1',
      'Andrej Karpathy',
      '@karpathy',
      'UCe4jUOmQPKMDvOkzJpDfMRQ',
      'https://youtube.com/@karpathy',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCe4jUOmQPKMDvOkzJpDfMRQ',
      '220K',
      'Deep learning and LLM tutorials from ex-OpenAI/Tesla AI director',
      'Educational series',
      'deep_learning_expert',
      'LIVE',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  
