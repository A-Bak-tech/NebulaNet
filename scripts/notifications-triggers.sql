-- File: /scripts/notifications-triggers.sql
-- Add to your existing notifications setup

-- Trigger to update unread count when notification is created
CREATE OR REPLACE FUNCTION update_unread_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET unread_notifications_count = COALESCE(unread_notifications_count, 0) + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_unread_count_insert ON notifications;
CREATE TRIGGER trigger_update_unread_count_insert
AFTER INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION update_unread_count_on_insert();

-- Trigger to update unread count when notification is marked as read
CREATE OR REPLACE FUNCTION update_unread_count_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    UPDATE users 
    SET unread_notifications_count = GREATEST(COALESCE(unread_notifications_count, 1) - 1, 0)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_unread_count_update ON notifications;
CREATE TRIGGER trigger_update_unread_count_update
AFTER UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_unread_count_on_update();

-- Trigger to update unread count when notification is deleted
CREATE OR REPLACE FUNCTION update_unread_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_read = FALSE THEN
    UPDATE users 
    SET unread_notifications_count = GREATEST(COALESCE(unread_notifications_count, 1) - 1, 0)
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_unread_count_delete ON notifications;
CREATE TRIGGER trigger_update_unread_count_delete
AFTER DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_unread_count_on_delete();

-- Function to send push notifications
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_title VARCHAR(255),
  p_body TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  v_device_token TEXT;
  v_preference_enabled BOOLEAN;
BEGIN
  -- Check if user has push notifications enabled
  SELECT enabled INTO v_preference_enabled
  FROM notification_preferences
  WHERE user_id = p_user_id
    AND type = p_data->>'type'
    AND channel = 'push';
    
  IF v_preference_enabled THEN
    -- Get user's device token (in a real app, you'd have a devices table)
    SELECT device_token INTO v_device_token
    FROM user_devices
    WHERE user_id = p_user_id
      AND is_active = TRUE
    LIMIT 1;
    
    IF v_device_token IS NOT NULL THEN
      -- In production, you would call a push notification service here
      -- This is a placeholder for the actual push notification logic
      RAISE NOTICE 'Sending push notification to user %: % - %', 
        p_user_id, p_title, p_body;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;