-- Complete Database Schema for Attendance Management System
-- Updated to include push notification features and new changes
-- PostgreSQL Database Schema
-- Version: 2.0 - January 2025

-- Drop existing schema if needed (CAUTION: This will delete all data)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('ABSENCE', 'ATTENDANCE_SUMMARY', 'SCHOOL_ANNOUNCEMENT', 'CUSTOM', 'GENERAL', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (Core authentication and user management)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "profilePicture" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Schools table (Educational institutions)
CREATE TABLE IF NOT EXISTS "schools" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "principalName" TEXT,
    "establishedYear" INTEGER,
    "website" TEXT,
    "logo" TEXT,
    "timezone" TEXT DEFAULT 'America/New_York',
    "currency" TEXT DEFAULT 'USD',
    "academicYearStart" DATE,
    "academicYearEnd" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Teacher Profiles table (Extended teacher information)
CREATE TABLE IF NOT EXISTS "teacher_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "employeeId" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "address" TEXT,
    "qualification" TEXT,
    "experience" INTEGER,
    "salary" DECIMAL(10,2),
    "joiningDate" DATE,
    "department" TEXT,
    "specialization" TEXT,
    "emergencyContact" TEXT,
    "emergencyContactName" TEXT,
    "pushToken" TEXT,
    "pushTokenPlatform" TEXT,
    "pushTokenUpdatedAt" TIMESTAMP(3),
    "notificationPreferences" JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parent Profiles table (Parent/Guardian information)
CREATE TABLE IF NOT EXISTS "parent_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "address" TEXT,
    "occupation" TEXT,
    "workAddress" TEXT,
    "emergencyContact" TEXT,
    "emergencyContactName" TEXT,
    "relationship" TEXT DEFAULT 'Father',
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT true,
    "emailOptIn" BOOLEAN NOT NULL DEFAULT true,
    "smsOptIn" BOOLEAN NOT NULL DEFAULT false,
    "pushToken" TEXT,
    "pushTokenPlatform" TEXT,
    "pushTokenUpdatedAt" TIMESTAMP(3),
    "notificationPreferences" JSONB DEFAULT '{"absence": true, "summary": true, "announcements": true, "custom": true}',
    "lastLoginAt" TIMESTAMP(3),
    "profilePicture" TEXT,
    "language" TEXT DEFAULT 'en',
    "timezone" TEXT DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Classes table (School classes/sections)
CREATE TABLE IF NOT EXISTS "classes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'A',
    "capacity" INTEGER DEFAULT 30,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT,
    "description" TEXT,
    "roomNumber" TEXT,
    "schedule" JSONB,
    "academicYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Students table (Student information and enrollment)
CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL UNIQUE,
    "dateOfBirth" DATE,
    "gender" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "classId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "admissionDate" DATE,
    "bloodGroup" TEXT,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "profilePicture" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianRelation" TEXT,
    "transportMode" TEXT DEFAULT 'PARENT',
    "busRoute" TEXT,
    "pickupPoint" TEXT,
    "previousSchool" TEXT,
    "academicYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table (Daily attendance records)
CREATE TABLE IF NOT EXISTS "attendance" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "markedBy" TEXT NOT NULL,
    "remarks" TEXT,
    "checkInTime" TIME,
    "checkOutTime" TIME,
    "lateMinutes" INTEGER DEFAULT 0,
    "isLate" BOOLEAN DEFAULT false,
    "isExcused" BOOLEAN DEFAULT false,
    "excusedBy" TEXT,
    "excusedReason" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3),
    "modifiedBy" TEXT,
    "gpsLocation" JSONB,
    "deviceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parent Notifications table (Push notifications and messages to parents)
CREATE TABLE IF NOT EXISTS "parent_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentBy" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "expiresAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "deliveryStatus" "MessageStatus" DEFAULT 'SENT',
    "pushNotificationSent" BOOLEAN DEFAULT false,
    "emailSent" BOOLEAN DEFAULT false,
    "whatsappSent" BOOLEAN DEFAULT false,
    "smsSent" BOOLEAN DEFAULT false,
    "pushDeliveredAt" TIMESTAMP(3),
    "emailDeliveredAt" TIMESTAMP(3),
    "whatsappDeliveredAt" TIMESTAMP(3),
    "smsDeliveredAt" TIMESTAMP(3),
    "retryCount" INTEGER DEFAULT 0,
    "maxRetries" INTEGER DEFAULT 3,
    "attachments" JSONB,
    "actionData" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parent Messages table (Two-way communication between parents and teachers)
CREATE TABLE IF NOT EXISTS "parent_messages" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "parentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "replyToId" TEXT,
    "messageType" TEXT DEFAULT 'TEXT',
    "attachments" JSONB,
    "priority" "NotificationPriority" DEFAULT 'NORMAL',
    "status" "MessageStatus" DEFAULT 'SENT',
    "deliveredAt" TIMESTAMP(3),
    "threadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table (Academic subjects)
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "icon" TEXT,
    "category" TEXT,
    "isCore" BOOLEAN DEFAULT true,
    "creditHours" INTEGER DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Class Subjects table (Many-to-many relationship between classes and subjects)
CREATE TABLE IF NOT EXISTS "class_subjects" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,
    "schedule" JSONB,
    "room" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("classId", "subjectId")
);

-- Holidays table (School holidays and special days)
CREATE TABLE IF NOT EXISTS "holidays" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "description" TEXT,
    "type" TEXT DEFAULT 'HOLIDAY',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" JSONB,
    "schoolId" TEXT,
    "color" TEXT DEFAULT '#EF4444',
    "notifyParents" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Settings table (School-specific attendance configuration)
CREATE TABLE IF NOT EXISTS "attendance_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "schoolId" TEXT NOT NULL UNIQUE,
    "autoMarkAbsentAfter" TIME DEFAULT '10:00:00',
    "lateThresholdMinutes" INTEGER DEFAULT 15,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailySummaryTime" TIME DEFAULT '18:00:00',
    "weeklySummaryDay" INTEGER DEFAULT 5,
    "monthlyReportDay" INTEGER DEFAULT 1,
    "allowLateCheckIn" BOOLEAN DEFAULT true,
    "lateCheckInDeadline" TIME DEFAULT '12:00:00',
    "requireRemarks" BOOLEAN DEFAULT false,
    "allowBulkAttendance" BOOLEAN DEFAULT true,
    "gpsTrackingEnabled" BOOLEAN DEFAULT false,
    "gpsRadius" INTEGER DEFAULT 100,
    "schoolLatitude" DECIMAL(10, 8),
    "schoolLongitude" DECIMAL(11, 8),
    "workingDays" JSONB DEFAULT '[1,2,3,4,5]',
    "holidayAutoMark" BOOLEAN DEFAULT true,
    "notificationSettings" JSONB DEFAULT '{"absence": true, "late": true, "summary": true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Push Notification Logs table (Track push notification delivery)
CREATE TABLE IF NOT EXISTS "push_notification_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "notificationId" TEXT,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'PARENT',
    "pushToken" TEXT NOT NULL,
    "platform" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "status" "MessageStatus" DEFAULT 'SENT',
    "expoTicketId" TEXT,
    "expoReceiptId" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Message Logs table (Track WhatsApp message delivery)
CREATE TABLE IF NOT EXISTS "whatsapp_message_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "notificationId" TEXT,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'PARENT',
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT DEFAULT 'TEXT',
    "whatsappMessageId" TEXT,
    "status" "MessageStatus" DEFAULT 'SENT',
    "errorMessage" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email Logs table (Track email delivery)
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "notificationId" TEXT,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'PARENT',
    "emailAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT DEFAULT 'HTML',
    "emailServiceId" TEXT,
    "status" "MessageStatus" DEFAULT 'SENT',
    "errorMessage" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System Settings table (Application-wide settings)
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "type" TEXT DEFAULT 'STRING',
    "description" TEXT,
    "category" TEXT DEFAULT 'GENERAL',
    "isPublic" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table (Track system changes and activities)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance

-- User indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_isActive" ON "users"("isActive");
CREATE INDEX IF NOT EXISTS "idx_users_lastLoginAt" ON "users"("lastLoginAt");

-- Teacher profile indexes
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_userId_key" ON "teacher_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_employeeId_key" ON "teacher_profiles"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_teacher_profiles_isActive" ON "teacher_profiles"("isActive");
CREATE INDEX IF NOT EXISTS "idx_teacher_profiles_pushToken" ON "teacher_profiles"("pushToken");

-- Parent profile indexes
CREATE UNIQUE INDEX IF NOT EXISTS "parent_profiles_userId_key" ON "parent_profiles"("userId");
CREATE INDEX IF NOT EXISTS "idx_parent_profiles_phone" ON "parent_profiles"("phone");
CREATE INDEX IF NOT EXISTS "idx_parent_profiles_pushToken" ON "parent_profiles"("pushToken");
CREATE INDEX IF NOT EXISTS "idx_parent_profiles_notifications" ON "parent_profiles"("notifications");
CREATE INDEX IF NOT EXISTS "idx_parent_profiles_whatsappOptIn" ON "parent_profiles"("whatsappOptIn");

-- School indexes
CREATE INDEX IF NOT EXISTS "idx_schools_isActive" ON "schools"("isActive");

-- Class indexes
CREATE INDEX IF NOT EXISTS "idx_classes_schoolId" ON "classes"("schoolId");
CREATE INDEX IF NOT EXISTS "idx_classes_teacherId" ON "classes"("teacherId");
CREATE INDEX IF NOT EXISTS "idx_classes_isActive" ON "classes"("isActive");
CREATE INDEX IF NOT EXISTS "idx_classes_academicYear" ON "classes"("academicYear");

-- Student indexes
CREATE UNIQUE INDEX IF NOT EXISTS "students_rollNumber_key" ON "students"("rollNumber");
CREATE INDEX IF NOT EXISTS "idx_students_classId" ON "students"("classId");
CREATE INDEX IF NOT EXISTS "idx_students_parentId" ON "students"("parentId");
CREATE INDEX IF NOT EXISTS "idx_students_isActive" ON "students"("isActive");
CREATE INDEX IF NOT EXISTS "idx_students_academicYear" ON "students"("academicYear");

-- Attendance indexes
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_studentId_date_key" ON "attendance"("studentId", "date");
CREATE INDEX IF NOT EXISTS "idx_attendance_classId" ON "attendance"("classId");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance"("date");
CREATE INDEX IF NOT EXISTS "idx_attendance_classId_date" ON "attendance"("classId", "date");
CREATE INDEX IF NOT EXISTS "idx_attendance_markedBy" ON "attendance"("markedBy");
CREATE INDEX IF NOT EXISTS "idx_attendance_status" ON "attendance"("status");
CREATE INDEX IF NOT EXISTS "idx_attendance_isLate" ON "attendance"("isLate");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_parentId" ON "parent_notifications"("parentId");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_studentId" ON "parent_notifications"("studentId");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_type" ON "parent_notifications"("type");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_sentBy" ON "parent_notifications"("sentBy");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_isRead" ON "parent_notifications"("isRead");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_priority" ON "parent_notifications"("priority");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_sentAt" ON "parent_notifications"("sentAt");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_scheduledFor" ON "parent_notifications"("scheduledFor");

-- Message indexes
CREATE INDEX IF NOT EXISTS "idx_parent_messages_parentId" ON "parent_messages"("parentId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_teacherId" ON "parent_messages"("teacherId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_studentId" ON "parent_messages"("studentId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_threadId" ON "parent_messages"("threadId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_status" ON "parent_messages"("status");

-- Subject indexes
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_key" ON "subjects"("code");
CREATE INDEX IF NOT EXISTS "idx_subjects_isActive" ON "subjects"("isActive");
CREATE INDEX IF NOT EXISTS "idx_subjects_category" ON "subjects"("category");

-- Class subject indexes
CREATE UNIQUE INDEX IF NOT EXISTS "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_classId" ON "class_subjects"("classId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_subjectId" ON "class_subjects"("subjectId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_teacherId" ON "class_subjects"("teacherId");

-- Holiday indexes
CREATE INDEX IF NOT EXISTS "idx_holidays_schoolId" ON "holidays"("schoolId");
CREATE INDEX IF NOT EXISTS "idx_holidays_date" ON "holidays"("date");
CREATE INDEX IF NOT EXISTS "idx_holidays_isActive" ON "holidays"("isActive");

-- Settings indexes
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_settings_schoolId_key" ON "attendance_settings"("schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_key_key" ON "system_settings"("key");
CREATE INDEX IF NOT EXISTS "idx_system_settings_category" ON "system_settings"("category");

-- Log indexes
CREATE INDEX IF NOT EXISTS "idx_push_notification_logs_recipientId" ON "push_notification_logs"("recipientId");
CREATE INDEX IF NOT EXISTS "idx_push_notification_logs_status" ON "push_notification_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_push_notification_logs_createdAt" ON "push_notification_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_logs_recipientId" ON "whatsapp_message_logs"("recipientId");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_logs_status" ON "whatsapp_message_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_logs_createdAt" ON "whatsapp_message_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_email_logs_recipientId" ON "email_logs"("recipientId");
CREATE INDEX IF NOT EXISTS "idx_email_logs_status" ON "email_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_email_logs_createdAt" ON "email_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_audit_logs_userId" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entityType" ON "audit_logs"("entityType");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entityId" ON "audit_logs"("entityId");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_createdAt" ON "audit_logs"("createdAt");

-- Add foreign key constraints

-- Teacher profiles
ALTER TABLE "teacher_profiles" ADD CONSTRAINT IF NOT EXISTS "teacher_profiles_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Parent profiles
ALTER TABLE "parent_profiles" ADD CONSTRAINT IF NOT EXISTS "parent_profiles_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Classes
ALTER TABLE "classes" ADD CONSTRAINT IF NOT EXISTS "classes_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "classes" ADD CONSTRAINT IF NOT EXISTS "classes_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Students
ALTER TABLE "students" ADD CONSTRAINT IF NOT EXISTS "students_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT IF NOT EXISTS "students_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Attendance
ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_markedBy_fkey" 
    FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_excusedBy_fkey" 
    FOREIGN KEY ("excusedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_modifiedBy_fkey" 
    FOREIGN KEY ("modifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Parent notifications
ALTER TABLE "parent_notifications" ADD CONSTRAINT IF NOT EXISTS "parent_notifications_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_notifications" ADD CONSTRAINT IF NOT EXISTS "parent_notifications_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_notifications" ADD CONSTRAINT IF NOT EXISTS "parent_notifications_sentBy_fkey" 
    FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Parent messages
ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_replyToId_fkey" 
    FOREIGN KEY ("replyToId") REFERENCES "parent_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Class subjects
ALTER TABLE "class_subjects" ADD CONSTRAINT IF NOT EXISTS "class_subjects_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class_subjects" ADD CONSTRAINT IF NOT EXISTS "class_subjects_subjectId_fkey" 
    FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class_subjects" ADD CONSTRAINT IF NOT EXISTS "class_subjects_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Holidays
ALTER TABLE "holidays" ADD CONSTRAINT IF NOT EXISTS "holidays_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Attendance settings
ALTER TABLE "attendance_settings" ADD CONSTRAINT IF NOT EXISTS "attendance_settings_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Push notification logs
ALTER TABLE "push_notification_logs" ADD CONSTRAINT IF NOT EXISTS "push_notification_logs_notificationId_fkey" 
    FOREIGN KEY ("notificationId") REFERENCES "parent_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- WhatsApp message logs
ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT IF NOT EXISTS "whatsapp_message_logs_notificationId_fkey" 
    FOREIGN KEY ("notificationId") REFERENCES "parent_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Email logs
ALTER TABLE "email_logs" ADD CONSTRAINT IF NOT EXISTS "email_logs_notificationId_fkey" 
    FOREIGN KEY ("notificationId") REFERENCES "parent_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit logs
ALTER TABLE "audit_logs" ADD CONSTRAINT IF NOT EXISTS "audit_logs_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schools_updated_at ON "schools";
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON "schools"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_profiles_updated_at ON "teacher_profiles";
CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON "teacher_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_profiles_updated_at ON "parent_profiles";
CREATE TRIGGER update_parent_profiles_updated_at BEFORE UPDATE ON "parent_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON "classes";
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON "classes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON "students";
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON "students"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON "attendance";
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON "attendance"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_notifications_updated_at ON "parent_notifications";
CREATE TRIGGER update_parent_notifications_updated_at BEFORE UPDATE ON "parent_notifications"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_messages_updated_at ON "parent_messages";
CREATE TRIGGER update_parent_messages_updated_at BEFORE UPDATE ON "parent_messages"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON "subjects";
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON "subjects"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_holidays_updated_at ON "holidays";
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON "holidays"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_settings_updated_at ON "attendance_settings";
CREATE TRIGGER update_attendance_settings_updated_at BEFORE UPDATE ON "attendance_settings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_push_notification_logs_updated_at ON "push_notification_logs";
CREATE TRIGGER update_push_notification_logs_updated_at BEFORE UPDATE ON "push_notification_logs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_message_logs_updated_at ON "whatsapp_message_logs";
CREATE TRIGGER update_whatsapp_message_logs_updated_at BEFORE UPDATE ON "whatsapp_message_logs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON "email_logs";
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON "email_logs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON "system_settings";
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON "system_settings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing and demonstration

-- Create default admin user (password: 'admin123' - hashed with bcrypt)
INSERT INTO "users" ("id", "email", "password", "name", "role") VALUES 
('admin-001', 'admin@school.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeYBQ5IIDM5Z9XJP2', 'System Administrator', 'ADMIN')
ON CONFLICT ("email") DO NOTHING;

-- Create sample teacher user (password: 'teacher123' - hashed with bcrypt)
INSERT INTO "users" ("id", "email", "password", "name", "role") VALUES 
('teacher-001', 'teacher@school.com', '$2a$12$8k9L0m1N2o3P4q5R6s7T8u9V0w1X2y3Z4a5B6c7D8e9F0g1H2i3J4', 'John Teacher', 'TEACHER')
ON CONFLICT ("email") DO NOTHING;

-- Create sample parent user (password: 'parent123' - hashed with bcrypt)
INSERT INTO "users" ("id", "email", "password", "name", "role") VALUES 
('parent-001', 'parent@school.com', '$2a$12$9l0M1n2O3p4Q5r6S7t8U9v0W1x2Y3z4A5b6C7d8E9f0G1h2I3j4K5', 'Jane Parent', 'PARENT')
ON CONFLICT ("email") DO NOTHING;

-- Create sample school
INSERT INTO "schools" ("id", "name", "address", "phone", "email", "principalName", "establishedYear", "isActive") VALUES 
('school-001', 'Demo Elementary School', '123 Education Street, Learning City, State 12345', '+1-555-123-4567', 'info@demoschool.edu', 'Dr. Sarah Principal', 2010, true)
ON CONFLICT ("id") DO NOTHING;

-- Create teacher profile
INSERT INTO "teacher_profiles" ("id", "userId", "employeeId", "phone", "qualification", "experience", "salary", "isActive") VALUES 
('teacher-profile-001', 'teacher-001', 'EMP001', '+1-555-234-5678', 'M.Ed. Elementary Education', 5, 45000.00, true)
ON CONFLICT ("userId") DO NOTHING;

-- Create parent profile
INSERT INTO "parent_profiles" ("id", "userId", "phone", "alternatePhone", "address", "occupation", "emergencyContact", "emergencyContactName") VALUES 
('parent-profile-001', 'parent-001', '+1-555-345-6789', '+1-555-345-6790', '456 Parent Avenue, Family City, State 54321', 'Software Engineer', '+1-555-911-0000', 'Emergency Contact')
ON CONFLICT ("userId") DO NOTHING;

-- Create sample class
INSERT INTO "classes" ("id", "name", "grade", "section", "capacity", "schoolId", "teacherId", "description", "roomNumber", "isActive") VALUES 
('class-001', 'Grade 3A', '3', 'A', 25, 'school-001', 'teacher-profile-001', 'Third grade section A', 'Room 101', true)
ON CONFLICT ("id") DO NOTHING;

-- Create sample student
INSERT INTO "students" ("id", "name", "rollNumber", "dateOfBirth", "gender", "classId", "parentId", "admissionDate", "bloodGroup", "isActive") VALUES 
('student-001', 'Alice Johnson', 'STU2024001', '2016-05-15', 'Female', 'class-001', 'parent-profile-001', '2024-01-15', 'A+', true)
ON CONFLICT ("rollNumber") DO NOTHING;

-- Create default subjects
INSERT INTO "subjects" ("name", "code", "description", "isActive") VALUES
('Mathematics', 'MATH', 'Mathematics and numerical skills', true),
('English Language Arts', 'ELA', 'English language and literature', true),
('Science', 'SCI', 'General science and scientific method', true),
('Social Studies', 'SOC', 'Social studies, history, and geography', true),
('Physical Education', 'PE', 'Physical education and health', true),
('Art', 'ART', 'Creative arts and crafts', true),
('Music', 'MUS', 'Music education and appreciation', true),
('Computer Science', 'CS', 'Basic computer skills and programming', true)
ON CONFLICT ("code") DO NOTHING;

-- Assign subjects to the sample class
INSERT INTO "class_subjects" ("classId", "subjectId", "teacherId") 
SELECT 'class-001', s."id", 'teacher-profile-001'
FROM "subjects" s 
WHERE s."code" IN ('MATH', 'ELA', 'SCI', 'SOC')
ON CONFLICT ("classId", "subjectId") DO NOTHING;

-- Create default attendance settings for the sample school
INSERT INTO "attendance_settings" ("schoolId", "autoMarkAbsentAfter", "lateThresholdMinutes", "notificationEnabled", "dailySummaryTime", "weeklySummaryDay") VALUES 
('school-001', '09:30:00', 15, true, '17:00:00', 5)
ON CONFLICT ("schoolId") DO NOTHING;

-- Create sample attendance record (yesterday)
INSERT INTO "attendance" ("studentId", "classId", "date", "status", "markedBy", "remarks", "checkInTime") VALUES 
('student-001', 'class-001', CURRENT_DATE - INTERVAL '1 day', 'PRESENT', 'teacher-001', 'On time and attentive', '08:15:00')
ON CONFLICT ("studentId", "date") DO NOTHING;

-- Create sample attendance record (today)
INSERT INTO "attendance" ("studentId", "classId", "date", "status", "markedBy", "checkInTime") VALUES 
('student-001', 'class-001', CURRENT_DATE, 'PRESENT', 'teacher-001', '08:20:00')
ON CONFLICT ("studentId", "date") DO NOTHING;

-- Create sample holiday
INSERT INTO "holidays" ("name", "date", "description", "schoolId", "isRecurring") VALUES 
('New Year''s Day', '2025-01-01', 'New Year Holiday', 'school-001', true),
('Independence Day', '2025-07-04', 'Independence Day Holiday', 'school-001', true),
('Thanksgiving', '2025-11-27', 'Thanksgiving Holiday', 'school-001', false),
('Winter Break Start', '2025-12-20', 'Start of Winter Break', 'school-001', false)
ON CONFLICT DO NOTHING;

-- Create sample notification
INSERT INTO "parent_notifications" ("parentId", "studentId", "type", "title", "message", "sentBy", "priority") VALUES 
('parent-profile-001', 'student-001', 'ATTENDANCE_SUMMARY', 'Weekly Attendance Summary', 'Alice had perfect attendance this week with 5/5 days present.', 'admin-001', 'NORMAL')
ON CONFLICT DO NOTHING;

-- Insert system settings
INSERT INTO "system_settings" ("key", "value", "description", "category") VALUES
('app_name', 'SchoolSync Attendance', 'Application name', 'GENERAL'),
('app_version', '2.0.0', 'Current application version', 'GENERAL'),
('default_timezone', 'America/New_York', 'Default timezone for the application', 'GENERAL'),
('default_language', 'en', 'Default language for the application', 'GENERAL'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'SYSTEM'),
('session_timeout', '3600', 'Session timeout in seconds (1 hour)', 'SECURITY'),
('password_min_length', '8', 'Minimum password length', 'SECURITY'),
('enable_push_notifications', 'true', 'Enable push notifications globally', 'NOTIFICATIONS'),
('enable_whatsapp_notifications', 'true', 'Enable WhatsApp notifications globally', 'NOTIFICATIONS'),
('enable_email_notifications', 'true', 'Enable email notifications globally', 'NOTIFICATIONS'),
('backup_retention_days', '30', 'Number of days to retain backups', 'SYSTEM')
ON CONFLICT ("key") DO NOTHING;

COMMIT;

-- Additional views for common queries

-- View for student attendance summary
CREATE OR REPLACE VIEW "student_attendance_summary" AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.rollNumber as roll_number,
    c.name as class_name,
    c.grade,
    c.section,
    COUNT(a.id) as total_days,
    COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent_days,
    COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as late_days,
    COUNT(CASE WHEN a.status = 'EXCUSED' THEN 1 END) as excused_days,
    ROUND(
        (COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2
    ) as attendance_percentage
FROM students s
LEFT JOIN classes c ON s.classId = c.id
LEFT JOIN attendance a ON s.id = a.studentId 
    AND a.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE s.isActive = true
GROUP BY s.id, s.name, s.rollNumber, c.name, c.grade, c.section;

-- View for parent notification summary
CREATE OR REPLACE VIEW "parent_notification_summary" AS
SELECT 
    pp.id as parent_id,
    u.name as parent_name,
    u.email as parent_email,
    COUNT(pn.id) as total_notifications,
    COUNT(CASE WHEN pn.isRead = false THEN 1 END) as unread_notifications,
    COUNT(CASE WHEN pn.type = 'ABSENCE' THEN 1 END) as absence_notifications,
    COUNT(CASE WHEN pn.priority = 'HIGH' THEN 1 END) as high_priority_notifications,
    MAX(pn.sentAt) as last_notification_sent
FROM parent_profiles pp
JOIN users u ON pp.userId = u.id
LEFT JOIN parent_notifications pn ON pp.id = pn.parentId 
    AND pn.sentAt >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pp.id, u.name, u.email;

-- View for class attendance statistics
CREATE OR REPLACE VIEW "class_attendance_stats" AS
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.grade,
    c.section,
    a.date,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as late_count,
    ROUND(
        (COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(DISTINCT s.id), 0)), 2
    ) as attendance_percentage
FROM classes c
LEFT JOIN students s ON c.id = s.classId AND s.isActive = true
LEFT JOIN attendance a ON s.id = a.studentId
WHERE c.isActive = true
GROUP BY c.id, c.name, c.grade, c.section, a.date
ORDER BY a.date DESC, c.grade, c.section;

-- Comments for documentation
COMMENT ON TABLE "users" IS 'Core user authentication and profile information';
COMMENT ON TABLE "schools" IS 'Educational institution information and settings';
COMMENT ON TABLE "teacher_profiles" IS 'Extended profile information for teachers';
COMMENT ON TABLE "parent_profiles" IS 'Extended profile information for parents/guardians';
COMMENT ON TABLE "classes" IS 'Class/section information within schools';
COMMENT ON TABLE "students" IS 'Student enrollment and profile information';
COMMENT ON TABLE "attendance" IS 'Daily attendance records for students';
COMMENT ON TABLE "parent_notifications" IS 'Push notifications and messages sent to parents';
COMMENT ON TABLE "parent_messages" IS 'Two-way communication between parents and teachers';
COMMENT ON TABLE "subjects" IS 'Academic subjects offered by the school';
COMMENT ON TABLE "class_subjects" IS 'Assignment of subjects to classes with teachers';
COMMENT ON TABLE "holidays" IS 'School holidays and special days';
COMMENT ON TABLE "attendance_settings" IS 'School-specific attendance configuration';
COMMENT ON TABLE "push_notification_logs" IS 'Delivery tracking for push notifications';
COMMENT ON TABLE "whatsapp_message_logs" IS 'Delivery tracking for WhatsApp messages';
COMMENT ON TABLE "email_logs" IS 'Delivery tracking for email messages';
COMMENT ON TABLE "system_settings" IS 'Application-wide configuration settings';
COMMENT ON TABLE "audit_logs" IS 'System activity and change tracking';

COMMENT ON COLUMN "parent_profiles"."pushToken" IS 'Expo push notification token for mobile app';
COMMENT ON COLUMN "parent_profiles"."pushTokenPlatform" IS 'Platform (ios/android) for push token';
COMMENT ON COLUMN "parent_profiles"."notificationPreferences" IS 'JSON object storing notification preferences';
COMMENT ON COLUMN "attendance"."checkInTime" IS 'Time when student checked in (TIME format)';
COMMENT ON COLUMN "attendance"."checkOutTime" IS 'Time when student checked out (TIME format)';
COMMENT ON COLUMN "attendance"."gpsLocation" IS 'GPS coordinates where attendance was marked';
COMMENT ON COLUMN "parent_notifications"."type" IS 'Type of notification: ABSENCE, ATTENDANCE_SUMMARY, SCHOOL_ANNOUNCEMENT, CUSTOM, GENERAL, SYSTEM';
COMMENT ON COLUMN "parent_notifications"."deliveryStatus" IS 'Overall delivery status across all channels';
COMMENT ON COLUMN "parent_notifications"."actionData" IS 'JSON data for notification actions (buttons, links, etc.)';

-- Utility functions

-- Function to calculate attendance percentage for a student
CREATE OR REPLACE FUNCTION calculate_student_attendance_percentage(
    student_id TEXT,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_days INTEGER;
    present_days INTEGER;
    percentage DECIMAL(5,2);
BEGIN
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present
    INTO total_days, present_days
    FROM attendance 
    WHERE studentId = student_id 
        AND date BETWEEN start_date AND end_date;
    
    IF total_days = 0 THEN
        RETURN 0.00;
    END IF;
    
    percentage := (present_days * 100.0 / total_days);
    RETURN ROUND(percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count for a parent
CREATE OR REPLACE FUNCTION get_parent_unread_notification_count(parent_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO unread_count
    FROM parent_notifications 
    WHERE parentId = parent_id AND isRead = false;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to mark old notifications as expired
CREATE OR REPLACE FUNCTION expire_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    WITH expired_notifications AS (
        UPDATE parent_notifications 
        SET deliveryStatus = 'FAILED'
        WHERE expiresAt IS NOT NULL 
            AND expiresAt < CURRENT_TIMESTAMP
            AND deliveryStatus NOT IN ('DELIVERED', 'READ')
        RETURNING id
    )
    SELECT COUNT(*) INTO expired_count FROM expired_notifications;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old logs (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-logs', '0 2 * * *', 'SELECT expire_old_notifications();');

COMMENT ON FUNCTION calculate_student_attendance_percentage IS 'Calculate attendance percentage for a student within a date range';
COMMENT ON FUNCTION get_parent_unread_notification_count IS 'Get count of unread notifications for a parent';
COMMENT ON FUNCTION expire_old_notifications IS 'Mark old notifications as expired based on expiresAt timestamp';