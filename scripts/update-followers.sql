-- File: /scripts/update-followers.sql
-- Run this on your Supabase database

-- Ensure users table has proper follow columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Create followers table if it doesn't exist
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_status ON followers(status);

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    -- Update following count for follower
    UPDATE users 
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;
    
    -- Update follower count for following
    UPDATE users 
    SET follower_count = COALESCE(follower_count, 0) + 1
    WHERE id = NEW.following_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed from pending to accepted
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
      UPDATE users 
      SET following_count = COALESCE(following_count, 0) + 1
      WHERE id = NEW.follower_id;
      
      UPDATE users 
      SET follower_count = COALESCE(follower_count, 0) + 1
      WHERE id = NEW.following_id;
    
    -- If status changed from accepted to something else
    ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
      UPDATE users 
      SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
      WHERE id = NEW.follower_id;
      
      UPDATE users 
      SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0)
      WHERE id = NEW.following_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    UPDATE users 
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;
    
    UPDATE users 
    SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0)
    WHERE id = OLD.following_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON followers;
CREATE TRIGGER update_follower_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON followers
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();