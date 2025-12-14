-- File: /scripts/add-post-comment-functions.sql

-- Increment post comments count
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement post comments count
CREATE OR REPLACE FUNCTION decrement_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = GREATEST(COALESCE(comments_count, 1) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment comment likes count
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement comment likes count
CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments 
  SET likes_count = GREATEST(COALESCE(likes_count, 1) - 1, 0)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Increment comment replies count
CREATE OR REPLACE FUNCTION increment_comment_replies(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments 
  SET replies_count = COALESCE(replies_count, 0) + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement comment replies count
CREATE OR REPLACE FUNCTION decrement_comment_replies(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments 
  SET replies_count = GREATEST(COALESCE(replies_count, 1) - 1, 0)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Increment post likes count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement post likes count
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = GREATEST(COALESCE(likes_count, 1) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment post echoes count
CREATE OR REPLACE FUNCTION increment_post_echoes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET echoes_count = COALESCE(echoes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement post echoes count
CREATE OR REPLACE FUNCTION decrement_post_echoes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET echoes_count = GREATEST(COALESCE(echoes_count, 1) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;