-- File: /scripts/search-functions.sql

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'all',
  count INTEGER DEFAULT 1,
  last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, query, type)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_last_searched ON search_history(last_searched DESC);

-- Function to get trending topics
CREATE OR REPLACE FUNCTION get_trending_topics(
  hours INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  tag TEXT,
  count BIGINT,
  latest_post_id UUID,
  latest_post_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_posts AS (
    SELECT id, tags, created_at
    FROM posts
    WHERE created_at >= NOW() - (hours || ' hours')::INTERVAL
      AND is_deleted = false
      AND tags IS NOT NULL
  ),
  tag_counts AS (
    SELECT 
      UNNEST(tags) as tag,
      COUNT(*) as count,
      MAX(created_at) as latest_post_time,
      (ARRAY_AGG(id ORDER BY created_at DESC))[1] as latest_post_id
    FROM recent_posts
    GROUP BY tag
  )
  SELECT 
    tag_counts.tag,
    tag_counts.count,
    tag_counts.latest_post_id,
    tag_counts.latest_post_time
  FROM tag_counts
  WHERE tag_counts.count >= 2
  ORDER BY tag_counts.count DESC, tag_counts.latest_post_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending posts
CREATE OR REPLACE FUNCTION get_trending_posts(
  hours INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH post_scores AS (
    SELECT 
      p.id,
      (
        -- Base score from age (newer = higher)
        (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600) ^ -0.5 * 100 +
        -- Engagement score
        (COALESCE(p.likes_count, 0) * 1.0) +
        (COALESCE(p.echoes_count, 0) * 1.5) +
        (COALESCE(p.comments_count, 0) * 2.0) +
        -- Media bonus
        CASE WHEN p.media_urls IS NOT NULL THEN 50 ELSE 0 END
      ) as score
    FROM posts p
    WHERE p.created_at >= NOW() - (hours || ' hours')::INTERVAL
      AND p.is_deleted = false
      AND p.visibility = 'public'
  )
  SELECT 
    post_scores.id,
    post_scores.score
  FROM post_scores
  ORDER BY post_scores.score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get suggested users
CREATE OR REPLACE FUNCTION get_suggested_users(
  current_user_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  username VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN,
  followers_count INTEGER,
  mutual_followers_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_following AS (
    SELECT following_id
    FROM followers
    WHERE follower_id = current_user_id
      AND status = 'accepted'
  ),
  suggested_users AS (
    SELECT 
      u.id,
      u.username,
      u.display_name,
      u.avatar_url,
      u.bio,
      u.is_verified,
      u.followers_count,
      COUNT(DISTINCT f.follower_id) as mutual_followers_count
    FROM users u
    LEFT JOIN followers f ON f.following_id = u.id
    WHERE u.id != current_user_id
      AND u.id NOT IN (SELECT following_id FROM user_following)
      AND u.is_private = false
    GROUP BY u.id
    HAVING COUNT(DISTINCT f.follower_id) > 0
  )
  SELECT *
  FROM suggested_users
  ORDER BY mutual_followers_count DESC, followers_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search tags
CREATE OR REPLACE FUNCTION search_tags(
  search_query TEXT,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  name TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH tag_stats AS (
    SELECT 
      UNNEST(tags) as tag_name,
      COUNT(*) as post_count
    FROM posts
    WHERE is_deleted = false
      AND tags IS NOT NULL
      AND LOWER(UNNEST(tags)) LIKE '%' || LOWER(search_query) || '%'
    GROUP BY tag_name
  )
  SELECT 
    tag_stats.tag_name as name,
    tag_stats.post_count as count
  FROM tag_stats
  ORDER BY tag_stats.post_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup search history
CREATE OR REPLACE FUNCTION cleanup_search_history(
  user_id_param UUID,
  keep_count INTEGER DEFAULT 50
)
RETURNS void AS $$
BEGIN
  DELETE FROM search_history
  WHERE user_id = user_id_param
    AND id NOT IN (
      SELECT id
      FROM search_history
      WHERE user_id = user_id_param
      ORDER BY last_searched DESC
      LIMIT keep_count
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING GIN(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN(
  to_tsvector('english', 
    COALESCE(username, '') || ' ' || 
    COALESCE(display_name, '') || ' ' || 
    COALESCE(bio, '')
  )
);