-- Attendance Management System Database Schema
-- Generated from Prisma schema

-- Create ENUM types
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- Users table
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Schools table
CREATE TABLE "schools" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Teacher profiles table
CREATE TABLE "teacher_profiles" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL,
    "employeeId" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Parent profiles table
CREATE TABLE "parent_profiles" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Classes table
CREATE TABLE "classes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'A',
    "capacity" INTEGER DEFAULT 30,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Students table
CREATE TABLE "students" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT UNIQUE NOT NULL,
    "dateOfBirth" DATE,
    "gender" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "classId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Attendance table
CREATE TABLE "attendance" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "markedBy" TEXT NOT NULL,
    "remarks" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Unique constraint to prevent duplicate attendance records for same student on same date
    CONSTRAINT "attendance_studentId_date_key" UNIQUE ("studentId", "date")
);

-- Parent notifications table
CREATE TABLE "parent_notifications" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentBy" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "parent_notifications_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parent_notifications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parent_notifications_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Parent messages table
CREATE TABLE "parent_messages" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "parentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "parent_messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parent_messages_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parent_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parent_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "parent_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");

CREATE INDEX "classes_schoolId_idx" ON "classes"("schoolId");
CREATE INDEX "classes_teacherId_idx" ON "classes"("teacherId");

CREATE INDEX "students_classId_idx" ON "students"("classId");
CREATE INDEX "students_parentId_idx" ON "students"("parentId");
CREATE INDEX "students_rollNumber_idx" ON "students"("rollNumber");
CREATE INDEX "students_isActive_idx" ON "students"("isActive");

CREATE INDEX "attendance_classId_date_idx" ON "attendance"("classId", "date");
CREATE INDEX "attendance_date_idx" ON "attendance"("date");
CREATE INDEX "attendance_studentId_idx" ON "attendance"("studentId");
CREATE INDEX "attendance_markedBy_idx" ON "attendance"("markedBy");

CREATE INDEX "parent_notifications_parentId_idx" ON "parent_notifications"("parentId");
CREATE INDEX "parent_notifications_studentId_idx" ON "parent_notifications"("studentId");
CREATE INDEX "parent_notifications_type_idx" ON "parent_notifications"("type");
CREATE INDEX "parent_notifications_sentBy_idx" ON "parent_notifications"("sentBy");
CREATE INDEX "parent_notifications_sentAt_idx" ON "parent_notifications"("sentAt");

CREATE INDEX "parent_messages_parentId_idx" ON "parent_messages"("parentId");
CREATE INDEX "parent_messages_teacherId_idx" ON "parent_messages"("teacherId");
CREATE INDEX "parent_messages_studentId_idx" ON "parent_messages"("studentId");
CREATE INDEX "parent_messages_createdAt_idx" ON "parent_messages"("createdAt");

-- Add triggers for updated_at timestamps (PostgreSQL specific)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON "schools"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON "teacher_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_profiles_updated_at BEFORE UPDATE ON "parent_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON "classes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON "students"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON "attendance"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_notifications_updated_at BEFORE UPDATE ON "parent_notifications"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_messages_updated_at BEFORE UPDATE ON "parent_messages"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (optional)
-- Uncomment the following lines to insert sample data

/*
-- Insert sample school
INSERT INTO "schools" ("id", "name", "address") VALUES 
('school_001', 'Greenwood Elementary School', '123 Main Street, City, State 12345');

-- Insert sample admin user
INSERT INTO "users" ("id", "email", "password", "name", "role") VALUES 
('admin_001', 'admin@school.edu', '$2b$10$hashedpassword', 'John Administrator', 'ADMIN');

-- Insert sample teacher
INSERT INTO "users" ("id", "email", "password", "name", "role") VALUES 
('teacher_001', 'teacher@school.edu', '$2b$10$hashedpassword', 'Jane Teacher', 'TEACHER');

INSERT INTO "teacher_profiles" ("id", "userId", "employeeId") VALUES 
('tprof_001', 'teacher_001', 'EMP001');
  
-- Insert sample parent
INSERT INTO "users" ("id", "email", "password", "name", "role") VALUES 
('parent_001', 'parent@email.com', '$2b$10$hashedpassword', 'Bob Parent', 'PARENT');

INSERT INTO "parent_profiles" ("id", "userId", "phone", "address") VALUES 
('pprof_001', 'parent_001', '+1234567890', '456 Oak Avenue, City, State 12345');

-- Insert sample class
INSERT INTO "classes" ("id", "name", "grade", "section", "schoolId", "teacherId") VALUES 
('class_001', 'Mathematics', '5', 'A', 'school_001', 'tprof_001');

-- Insert sample student
INSERT INTO "students" ("id", "name", "rollNumber", "classId", "parentId") VALUES 
('student_001', 'Alice Student', 'ROLL001', 'class_001', 'pprof_001');
*/