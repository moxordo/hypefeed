-- Seed data for HypeGit
-- Initial popular repositories for testing

INSERT INTO "Repository" (id, name, owner, full_name, description, language, html_url, stars_count, forks_count, created_at, updated_at, last_updated, is_active, is_archived) VALUES
('microsoft/vscode', 'vscode', 'microsoft', 'microsoft/vscode', 'Visual Studio Code', 'TypeScript', 'https://github.com/microsoft/vscode', 160000, 28000, '2015-09-03T19:23:40Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('vercel/next.js', 'next.js', 'vercel', 'vercel/next.js', 'The React Framework', 'JavaScript', 'https://github.com/vercel/next.js', 125000, 26000, '2016-10-25T16:45:00Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('rust-lang/rust', 'rust', 'rust-lang', 'rust-lang/rust', 'Empowering everyone to build reliable and efficient software', 'Rust', 'https://github.com/rust-lang/rust', 95000, 12000, '2010-06-16T20:39:03Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('golang/go', 'go', 'golang', 'golang/go', 'The Go programming language', 'Go', 'https://github.com/golang/go', 122000, 17000, '2014-08-19T04:33:40Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('python/cpython', 'cpython', 'python', 'python/cpython', 'The Python programming language', 'Python', 'https://github.com/python/cpython', 61000, 29000, '2017-02-10T19:23:51Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('tensorflow/tensorflow', 'tensorflow', 'tensorflow', 'tensorflow/tensorflow', 'An Open Source Machine Learning Framework for Everyone', 'C++', 'https://github.com/tensorflow/tensorflow', 185000, 74000, '2015-11-07T01:19:20Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('facebook/react', 'react', 'facebook', 'facebook/react', 'The library for web and native user interfaces', 'JavaScript', 'https://github.com/facebook/react', 227000, 46000, '2013-05-24T16:15:54Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('vuejs/vue', 'vue', 'vuejs', 'vuejs/vue', 'Progressive JavaScript Framework', 'TypeScript', 'https://github.com/vuejs/vue', 207000, 33000, '2013-07-29T03:24:51Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('angular/angular', 'angular', 'angular', 'angular/angular', 'Deliver web apps with confidence', 'TypeScript', 'https://github.com/angular/angular', 95000, 25000, '2014-09-18T16:12:01Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0),
('pytorch/pytorch', 'pytorch', 'pytorch', 'pytorch/pytorch', 'Tensors and Dynamic neural networks in Python', 'Python', 'https://github.com/pytorch/pytorch', 81000, 21000, '2016-08-13T19:28:30Z', '2025-01-15T10:00:00Z', datetime('now'), 1, 0);

-- Create initial star snapshots
INSERT INTO "StarSnapshot" (id, repo_id, stars_count, forks_count, captured_at) VALUES
('snap-001', 'microsoft/vscode', 160000, 28000, datetime('now')),
('snap-002', 'vercel/next.js', 125000, 26000, datetime('now')),
('snap-003', 'rust-lang/rust', 95000, 12000, datetime('now')),
('snap-004', 'golang/go', 122000, 17000, datetime('now')),
('snap-005', 'python/cpython', 61000, 29000, datetime('now')),
('snap-006', 'tensorflow/tensorflow', 185000, 74000, datetime('now')),
('snap-007', 'facebook/react', 227000, 46000, datetime('now')),
('snap-008', 'vuejs/vue', 207000, 33000, datetime('now')),
('snap-009', 'angular/angular', 95000, 25000, datetime('now')),
('snap-010', 'pytorch/pytorch', 81000, 21000, datetime('now'));

-- Create some sample topics
INSERT INTO "Topic" (id, name, category) VALUES
('topic-001', 'machine-learning', 'AI/ML'),
('topic-002', 'web-framework', 'Web'),
('topic-003', 'programming-language', 'Languages'),
('topic-004', 'typescript', 'Languages'),
('topic-005', 'javascript', 'Languages'),
('topic-006', 'python', 'Languages'),
('topic-007', 'rust', 'Languages'),
('topic-008', 'go', 'Languages');

-- Link repos to topics
INSERT INTO "RepositoryTopic" (repo_id, topic_id) VALUES
('microsoft/vscode', 'topic-004'),
('vercel/next.js', 'topic-002'),
('vercel/next.js', 'topic-005'),
('rust-lang/rust', 'topic-003'),
('rust-lang/rust', 'topic-007'),
('golang/go', 'topic-003'),
('golang/go', 'topic-008'),
('python/cpython', 'topic-003'),
('python/cpython', 'topic-006'),
('tensorflow/tensorflow', 'topic-001'),
('tensorflow/tensorflow', 'topic-006'),
('facebook/react', 'topic-002'),
('facebook/react', 'topic-005'),
('vuejs/vue', 'topic-002'),
('vuejs/vue', 'topic-004'),
('angular/angular', 'topic-002'),
('angular/angular', 'topic-004'),
('pytorch/pytorch', 'topic-001'),
('pytorch/pytorch', 'topic-006');
