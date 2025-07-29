-- Complete Database Schema for Attendance Management System
-- Generated from Prisma schema with all current backend code requirements
-- PostgreSQL Database Schema

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

-- Users table (Core authentication and user management)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
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
    "schoolId" TEXT NOT NULL,
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

-- Parent Notifications table (Push notifications and messages to parents)
CREATE TABLE IF NOT EXISTS "parent_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT, -- Made optional for general notifications
    "type" TEXT NOT NULL, -- 'ABSENCE', 'ATTENDANCE_SUMMARY', 'SCHOOL_ANNOUNCEMENT', 'CUSTOM', 'GENERAL'
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentBy" TEXT, -- ID of user who sent the notification
    "priority" TEXT NOT NULL DEFAULT 'NORMAL', -- 'HIGH', 'NORMAL', 'LOW'
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

-- Holidays table (School holidays and special days)
CREATE TABLE IF NOT EXISTS "holidays" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Settings table (School-specific attendance configuration)
CREATE TABLE IF NOT EXISTS "attendance_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "schoolId" TEXT NOT NULL UNIQUE,
    "autoMarkAbsentAfter" TEXT DEFAULT '10:00:00',
    "lateThresholdMinutes" INTEGER DEFAULT 15,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailySummaryTime" TEXT DEFAULT '18:00:00',
    "weeklySummaryDay" INTEGER DEFAULT 5, -- Friday
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_userId_key" ON "teacher_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_employeeId_key" ON "teacher_profiles"("employeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "parent_profiles_userId_key" ON "parent_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "students_rollNumber_key" ON "students"("rollNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_studentId_date_key" ON "attendance"("studentId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_key" ON "subjects"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_settings_schoolId_key" ON "attendance_settings"("schoolId");

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_schools_isActive" ON "schools"("isActive");
CREATE INDEX IF NOT EXISTS "idx_classes_schoolId" ON "classes"("schoolId");
CREATE INDEX IF NOT EXISTS "idx_classes_teacherId" ON "classes"("teacherId");
CREATE INDEX IF NOT EXISTS "idx_classes_isActive" ON "classes"("isActive");
CREATE INDEX IF NOT EXISTS "idx_teacher_profiles_isActive" ON "teacher_profiles"("isActive");
CREATE INDEX IF NOT EXISTS "idx_students_classId" ON "students"("classId");
CREATE INDEX IF NOT EXISTS "idx_students_parentId" ON "students"("parentId");
CREATE INDEX IF NOT EXISTS "idx_students_isActive" ON "students"("isActive");
CREATE INDEX IF NOT EXISTS "idx_attendance_classId" ON "attendance"("classId");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance"("date");
CREATE INDEX IF NOT EXISTS "idx_attendance_classId_date" ON "attendance"("classId", "date");
CREATE INDEX IF NOT EXISTS "idx_attendance_markedBy" ON "attendance"("markedBy");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_parentId" ON "parent_notifications"("parentId");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_studentId" ON "parent_notifications"("studentId");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_type" ON "parent_notifications"("type");
CREATE INDEX IF NOT EXISTS "idx_parent_notifications_sentBy" ON "parent_notifications"("sentBy");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_parentId" ON "parent_messages"("parentId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_teacherId" ON "parent_messages"("teacherId");
CREATE INDEX IF NOT EXISTS "idx_parent_messages_studentId" ON "parent_messages"("studentId");
CREATE INDEX IF NOT EXISTS "idx_subjects_isActive" ON "subjects"("isActive");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_classId" ON "class_subjects"("classId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_subjectId" ON "class_subjects"("subjectId");
CREATE INDEX IF NOT EXISTS "idx_class_subjects_teacherId" ON "class_subjects"("teacherId");
CREATE INDEX IF NOT EXISTS "idx_holidays_schoolId" ON "holidays"("schoolId");
CREATE INDEX IF NOT EXISTS "idx_holidays_date" ON "holidays"("date");

-- Add foreign key constraints
ALTER TABLE "teacher_profiles" ADD CONSTRAINT IF NOT EXISTS "teacher_profiles_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_profiles" ADD CONSTRAINT IF NOT EXISTS "parent_profiles_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "classes" ADD CONSTRAINT IF NOT EXISTS "classes_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "classes" ADD CONSTRAINT IF NOT EXISTS "classes_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT IF NOT EXISTS "students_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT IF NOT EXISTS "students_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT IF NOT EXISTS "attendance_markedBy_fkey" 
    FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_notifications" ADD CONSTRAINT IF NOT EXISTS "parent_notifications_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_notifications" ADD CONSTRAINT IF NOT EXISTS "parent_notifications_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_notifications" ADD CONSTRAINT IF NOT EXISTS "parent_notifications_sentBy_fkey" 
    FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT IF NOT EXISTS "parent_messages_replyToId_fkey" 
    FOREIGN KEY ("replyToId") REFERENCES "parent_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "class_subjects" ADD CONSTRAINT IF NOT EXISTS "class_subjects_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class_subjects" ADD CONSTRAINT IF NOT EXISTS "class_subjects_subjectId_fkey" 
    FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class_subjects" ADD CONSTRAINT IF NOT EXISTS "class_subjects_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "holidays" ADD CONSTRAINT IF NOT EXISTS "holidays_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_settings" ADD CONSTRAINT IF NOT EXISTS "attendance_settings_schoolId_fkey" 
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
('New Year''s Day', '2024-01-01', 'New Year Holiday', 'school-001', true),
('Independence Day', '2024-07-04', 'Independence Day Holiday', 'school-001', true),
('Thanksgiving', '2024-11-28', 'Thanksgiving Holiday', 'school-001', false),
('Winter Break Start', '2024-12-20', 'Start of Winter Break', 'school-001', false)
ON CONFLICT DO NOTHING;

-- Create sample notification
INSERT INTO "parent_notifications" ("parentId", "studentId", "type", "title", "message", "sentBy", "priority") VALUES 
('parent-profile-001', 'student-001', 'ATTENDANCE_SUMMARY', 'Weekly Attendance Summary', 'Alice had perfect attendance this week with 5/5 days present.', 'admin-001', 'NORMAL')
ON CONFLICT DO NOTHING;

COMMIT;