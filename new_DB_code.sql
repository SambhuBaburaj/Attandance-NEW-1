-- New Database Schema for Attendance Management System
-- Generated based on current backend Prisma schema
-- PostgreSQL Database Schema
-- Version: 3.0 - No School Dependencies

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
    CREATE TYPE "NotificationType" AS ENUM ('ABSENCE', 'ATTENDANCE_SUMMARY', 'SCHOOL_ANNOUNCEMENT', 'CUSTOM', 'GENERAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Core Tables

-- Users table (Authentication and basic user information)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Teacher Profiles table (Extended teacher information)
CREATE TABLE IF NOT EXISTS "teacher_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "employeeId" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "address" TEXT,
    "qualification" TEXT,
    "experience" INTEGER,
    "salary" DECIMAL(10,2),
    "joiningDate" DATE,
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
    "pushToken" TEXT,
    "pushTokenPlatform" TEXT,
    "pushTokenUpdatedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "profilePicture" TEXT,
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
    "teacherId" TEXT,
    "description" TEXT,
    "roomNumber" TEXT,
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
    "profilePicture" TEXT,
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
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parent Notifications table (Notifications to parents)
CREATE TABLE IF NOT EXISTS "parent_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentBy" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table (Academic subjects)
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("classId", "subjectId")
);

-- Holidays table (Holidays and special days)
CREATE TABLE IF NOT EXISTS "holidays" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Settings table (Global attendance configuration)
CREATE TABLE IF NOT EXISTS "attendance_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "autoMarkAbsentAfter" TEXT DEFAULT '10:00:00',
    "lateThresholdMinutes" INTEGER DEFAULT 15,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailySummaryTime" TEXT DEFAULT '18:00:00',
    "weeklySummaryDay" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance

-- User indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");

-- Teacher profile indexes
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_userId_key" ON "teacher_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_employeeId_key" ON "teacher_profiles"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_teacher_profiles_isActive" ON "teacher_profiles"("isActive");

-- Parent profile indexes
CREATE UNIQUE INDEX IF NOT EXISTS "parent_profiles_userId_key" ON "parent_profiles"("userId");
CREATE INDEX IF NOT EXISTS "idx_parent_profiles_phone" ON "parent_profiles"("phone");
CREATE INDEX IF NOT EXISTS "idx_parent_profiles_pushToken" ON "parent_profiles"("pushToken");

-- Class indexes
CREATE INDEX IF NOT EXISTS "idx_classes_teacherId" ON "classes"("teacherId");
CREATE INDEX IF NOT EXISTS "idx_classes_isActive" ON "classes"("isActive");

-- Student indexes
CREATE UNIQUE INDEX IF NOT EXISTS "students_rollNumber_key" ON "students"("rollNumber");
CREATE INDEX IF NOT EXISTS "idx_students_classId" ON "students"("classId");
CREATE INDEX IF NOT EXISTS "idx_students_parentId" ON "students"("parentId");
CREATE INDEX IF NOT EXISTS "idx_students_isActive" ON "students"("isActive");

-- Attendance indexes
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_studentId_date_key" ON "attendance"("studentId", "date");
CREATE INDEX IF NOT EXISTS "idx_attendance_classId_date" ON "attendance"("classId", "date");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance"("date");
CREATE INDEX IF NOT EXISTS "idx_attendance_markedBy" ON "attendance"("markedBy");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_parentId" ON "parent_notifications"("parentId");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_studentId" ON "parent_notifications"("studentId");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_type" ON "parent_notifications"("type");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_sentBy" ON "parent_notifications"("sentBy");

-- Message indexes
CREATE INDEX IF NOT EXISTS "idx_parent_messages_parentId" ON "parent_messages"("parentId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_teacherId" ON "parent_messages"("teacherId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_studentId" ON "parent_messages"("studentId");

-- Subject indexes
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_key" ON "subjects"("code");
CREATE INDEX IF NOT EXISTS "idx_subjects_isActive" ON "subjects"("isActive");

-- Class subject indexes
CREATE UNIQUE INDEX IF NOT EXISTS "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_classId" ON "class_subjects"("classId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_subjectId" ON "class_subjects"("subjectId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_teacherId" ON "class_subjects"("teacherId");

-- Holiday indexes
CREATE INDEX IF NOT EXISTS "idx_holidays_date" ON "holidays"("date");

-- Add foreign key constraints

-- Teacher profiles
ALTER TABLE "teacher_profiles" ADD CONSTRAINT IF NOT EXISTS "teacher_profiles_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Parent profiles
ALTER TABLE "parent_profiles" ADD CONSTRAINT IF NOT EXISTS "parent_profiles_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Classes
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

-- Insert sample data for testing

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

-- Create teacher profile
INSERT INTO "teacher_profiles" ("id", "userId", "employeeId", "phone", "qualification", "experience", "salary", "isActive") VALUES 
('teacher-profile-001', 'teacher-001', 'EMP001', '+1-555-234-5678', 'M.Ed. Elementary Education', 5, 45000.00, true)
ON CONFLICT ("userId") DO NOTHING;

-- Create parent profile
INSERT INTO "parent_profiles" ("id", "userId", "phone", "alternatePhone", "address", "occupation", "emergencyContact", "emergencyContactName") VALUES 
('parent-profile-001', 'parent-001', '+1-555-345-6789', '+1-555-345-6790', '456 Parent Avenue, Family City, State 54321', 'Software Engineer', '+1-555-911-0000', 'Emergency Contact')
ON CONFLICT ("userId") DO NOTHING;

-- Create sample class
INSERT INTO "classes" ("id", "name", "grade", "section", "capacity", "teacherId", "description", "roomNumber", "isActive") VALUES 
('class-001', 'Grade 3A', '3', 'A', 25, 'teacher-profile-001', 'Third grade section A', 'Room 101', true)
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

-- Create default attendance settings
INSERT INTO "attendance_settings" ("autoMarkAbsentAfter", "lateThresholdMinutes", "notificationEnabled", "dailySummaryTime", "weeklySummaryDay") VALUES 
('09:30:00', 15, true, '17:00:00', 5)
ON CONFLICT DO NOTHING;

-- Create sample attendance record (yesterday)
INSERT INTO "attendance" ("studentId", "classId", "date", "status", "markedBy", "remarks", "checkInTime") VALUES 
('student-001', 'class-001', CURRENT_DATE - INTERVAL '1 day', 'PRESENT', 'teacher-001', 'On time and attentive', '08:15:00')
ON CONFLICT ("studentId", "date") DO NOTHING;

-- Create sample attendance record (today)
INSERT INTO "attendance" ("studentId", "classId", "date", "status", "markedBy", "checkInTime") VALUES 
('student-001', 'class-001', CURRENT_DATE, 'PRESENT', 'teacher-001', '08:20:00')
ON CONFLICT ("studentId", "date") DO NOTHING;

-- Create sample holiday
INSERT INTO "holidays" ("name", "date", "description", "isRecurring") VALUES 
('New Year''s Day', '2025-01-01', 'New Year Holiday', true),
('Independence Day', '2025-07-04', 'Independence Day Holiday', true),
('Thanksgiving', '2025-11-27', 'Thanksgiving Holiday', false),
('Winter Break Start', '2025-12-20', 'Start of Winter Break', false)
ON CONFLICT DO NOTHING;

-- Create sample notification
INSERT INTO "parent_notifications" ("parentId", "studentId", "type", "title", "message", "sentBy", "priority") VALUES 
('parent-profile-001', 'student-001', 'ATTENDANCE_SUMMARY', 'Weekly Attendance Summary', 'Alice had perfect attendance this week with 5/5 days present.', 'admin-001', 'NORMAL')
ON CONFLICT DO NOTHING;

-- Create useful views for common queries

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

COMMIT;

-- Table comments for documentation
COMMENT ON TABLE "users" IS 'Core user authentication and profile information';
COMMENT ON TABLE "teacher_profiles" IS 'Extended profile information for teachers';
COMMENT ON TABLE "parent_profiles" IS 'Extended profile information for parents/guardians';
COMMENT ON TABLE "classes" IS 'Class/section information';
COMMENT ON TABLE "students" IS 'Student enrollment and profile information';
COMMENT ON TABLE "attendance" IS 'Daily attendance records for students';
COMMENT ON TABLE "parent_notifications" IS 'Notifications sent to parents';
COMMENT ON TABLE "parent_messages" IS 'Two-way communication between parents and teachers';
COMMENT ON TABLE "subjects" IS 'Academic subjects';
COMMENT ON TABLE "class_subjects" IS 'Assignment of subjects to classes with teachers';
COMMENT ON TABLE "holidays" IS 'Holidays and special days';
COMMENT ON TABLE "attendance_settings" IS 'Global attendance configuration';

-- Column comments
COMMENT ON COLUMN "parent_profiles"."pushToken" IS 'Push notification token for mobile app';
COMMENT ON COLUMN "parent_profiles"."pushTokenPlatform" IS 'Platform (ios/android) for push token';
COMMENT ON COLUMN "attendance"."checkInTime" IS 'Time when student checked in';
COMMENT ON COLUMN "attendance"."checkOutTime" IS 'Time when student checked out';
COMMENT ON COLUMN "parent_notifications"."type" IS 'Type of notification: ABSENCE, ATTENDANCE_SUMMARY, SCHOOL_ANNOUNCEMENT, CUSTOM, GENERAL';

COMMENT ON FUNCTION calculate_student_attendance_percentage IS 'Calculate attendance percentage for a student within a date range';
COMMENT ON FUNCTION get_parent_unread_notification_count IS 'Get count of unread notifications for a parent';

-- Success message
SELECT 'Database schema created successfully! Ready for attendance management without school dependencies.' as result;