-- Insert sample users
INSERT INTO users (id, email, username, full_name, role, is_verified) VALUES
('user1', 'john@example.com', 'johndoe', 'John Doe', 'user', true),
('user2', 'sarah@example.com', 'sarahj', 'Sarah Johnson', 'user', true),
('user3', 'admin@nebulanet.space', 'admin', 'System Admin', 'admin', true),
('user4', 'mod@nebulanet.space', 'moderator', 'Content Moderator', 'moderator', true);

-- Insert sample posts
INSERT INTO posts (id, user_id, content, ai_enhanced, likes_count, comments_count, shares_count) VALUES
('post1', 'user1', 'Just discovered this amazing platform! The AI features are incredible. #NebulaNet #AI', true, 24, 5, 3),
('post2', 'user2', 'Working on some exciting new projects with AI enhancement. The future is here! 🚀', true, 15, 3, 2),
('post3', 'user1', 'Anyone else amazed by how well the content suggestions work?', false, 8, 2, 1);

-- Insert sample waitlist entries
INSERT INTO waitlist_entries (email, position, status) VALUES
('waiting1@example.com', 1, 'approved'),
('waiting2@example.com', 2, 'pending'),
('waiting3@example.com', 3, 'pending');