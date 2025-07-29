-- Attendance App Database Schema
-- PostgreSQL SQL for table creation

-- Create ENUM for user roles
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- Users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Schools table
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- Teacher profiles table
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- Parent profiles table
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- Classes table
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'A',
    "capacity" INTEGER DEFAULT 30,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- Students table
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "gender" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "classId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- Create ENUM for attendance status
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- Attendance table
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "markedBy" TEXT NOT NULL,
    "remarks" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");
CREATE UNIQUE INDEX "teacher_profiles_employeeId_key" ON "teacher_profiles"("employeeId");
CREATE UNIQUE INDEX "parent_profiles_userId_key" ON "parent_profiles"("userId");
CREATE UNIQUE INDEX "students_rollNumber_key" ON "students"("rollNumber");
CREATE UNIQUE INDEX "attendance_studentId_date_key" ON "attendance"("studentId", "date");
CREATE INDEX "attendance_classId_date_idx" ON "attendance"("classId", "date");
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- Add foreign key constraints
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT "attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance" ADD CONSTRAINT "attendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Parent notifications table
CREATE TABLE "parent_notifications" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'ABSENCE', 'ATTENDANCE_SUMMARY', 'SCHOOL_ANNOUNCEMENT'
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_notifications_pkey" PRIMARY KEY ("id")
);

-- Parent messages table (for communication with teachers)
CREATE TABLE "parent_messages" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_messages_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints for new tables
ALTER TABLE "parent_notifications" ADD CONSTRAINT "parent_notifications_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_notifications" ADD CONSTRAINT "parent_notifications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT "parent_messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT "parent_messages_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT "parent_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_messages" ADD CONSTRAINT "parent_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "parent_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for better performance
CREATE INDEX "parent_notifications_parentId_idx" ON "parent_notifications"("parentId");
CREATE INDEX "parent_notifications_studentId_idx" ON "parent_notifications"("studentId");
CREATE INDEX "parent_notifications_type_idx" ON "parent_notifications"("type");
CREATE INDEX "parent_messages_parentId_idx" ON "parent_messages"("parentId");
CREATE INDEX "parent_messages_teacherId_idx" ON "parent_messages"("teacherId");
CREATE INDEX "parent_messages_studentId_idx" ON "parent_messages"("studentId");

-- Insert sample data

-- Create a default school
INSERT INTO "schools" ("id", "name", "address", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h9', 'Demo School', '123 Education Street, Learning City', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create default admin user (password: admin123)
INSERT INTO "users" ("id", "email", "password", "name", "role", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h0', 'admin@school.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeYBQ5IIDM5Z9XJP2', 'School Administrator', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create sample teacher user (password: teacher123)  
INSERT INTO "users" ("id", "email", "password", "name", "role", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h1', 'teacher@school.com', '$2a$12$8k9L0m1N2o3P4q5R6s7T8u9V0w1X2y3Z4a5B6c7D8e9F0g1H2i3J4', 'John Teacher', 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create sample parent user (password: parent123)
INSERT INTO "users" ("id", "email", "password", "name", "role", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h2', 'parent@school.com', '$2a$12$9l0M1n2O3p4Q5r6S7t8U9v0W1x2Y3z4A5b6C7d8E9f0G1h2I3j4K5', 'Jane Parent', 'PARENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create teacher profile
INSERT INTO "teacher_profiles" ("id", "userId", "employeeId", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h3', 'clq1a2b3c4d5e6f7g8h1', 'EMP001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create parent profile
INSERT INTO "parent_profiles" ("id", "userId", "phone", "alternatePhone", "address", "occupation", "workAddress", "emergencyContact", "emergencyContactName", "relationship", "notifications", "whatsappOptIn", "emailOptIn", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h4', 'clq1a2b3c4d5e6f7g8h2', '+1234567890', '+1234567892', '789 Parent Avenue', 'Software Engineer', '123 Tech Street', '+1234567891', 'John Emergency', 'Father', true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create sample class
INSERT INTO "classes" ("id", "name", "grade", "section", "capacity", "schoolId", "teacherId", "description", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h5', 'Grade 5A', '5', 'A', 30, 'clq1a2b3c4d5e6f7g8h9', 'clq1a2b3c4d5e6f7g8h3', 'Primary grade 5 section A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create sample student
INSERT INTO "students" ("id", "name", "rollNumber", "dateOfBirth", "gender", "address", "phone", "email", "classId", "parentId", "isActive", "createdAt", "updatedAt") 
VALUES ('clq1a2b3c4d5e6f7g8h6', 'Alice Student', 'STU001', '2015-05-15', 'Female', '456 Student Lane', '+1234567891', 'alice.student@example.com', 'clq1a2b3c4d5e6f7g8h5', 'clq1a2b3c4d5e6f7g8h4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample attendance records
INSERT INTO "attendance" ("id", "studentId", "classId", "date", "status", "markedBy", "remarks", "markedAt", "createdAt", "updatedAt") 
VALUES 
('clq1a2b3c4d5e6f7g8h7', 'clq1a2b3c4d5e6f7g8h6', 'clq1a2b3c4d5e6f7g8h5', CURRENT_DATE - INTERVAL '1 day', 'PRESENT', 'clq1a2b3c4d5e6f7g8h0', 'Present and active in class', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('clq1a2b3c4d5e6f7g8h8', 'clq1a2b3c4d5e6f7g8h6', 'clq1a2b3c4d5e6f7g8h5', CURRENT_DATE, 'PRESENT', 'clq1a2b3c4d5e6f7g8h0', null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);