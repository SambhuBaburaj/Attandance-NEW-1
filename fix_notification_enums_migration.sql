-- Migration to fix notification type and priority enums
-- Run this to update your database schema

-- Create the enum types
CREATE TYPE "NotificationType" AS ENUM ('ABSENCE', 'ATTENDANCE_SUMMARY', 'SCHOOL_ANNOUNCEMENT', 'CUSTOM', 'GENERAL');
CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

-- Update the parent_notifications table to use the new enum types
ALTER TABLE "parent_notifications" 
  ALTER COLUMN "type" TYPE "NotificationType" USING "type"::"NotificationType",
  ALTER COLUMN "priority" TYPE "NotificationPriority" USING "priority"::"NotificationPriority";

-- Set default value for priority
ALTER TABLE "parent_notifications" 
  ALTER COLUMN "priority" SET DEFAULT 'NORMAL';