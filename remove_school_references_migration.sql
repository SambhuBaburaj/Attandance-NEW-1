-- Migration to remove all school ID references from the database
-- This migration removes schoolId fields and constraints from all tables

BEGIN;

-- First, remove all foreign key constraints that reference schools table
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_schoolId_fkey";
ALTER TABLE "holidays" DROP CONSTRAINT IF EXISTS "holidays_schoolId_fkey";
ALTER TABLE "attendance_settings" DROP CONSTRAINT IF EXISTS "attendance_settings_schoolId_fkey";

-- Remove schoolId columns from tables
ALTER TABLE "classes" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "holidays" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "attendance_settings" DROP COLUMN IF EXISTS "schoolId";

-- Remove indexes related to schoolId
DROP INDEX IF EXISTS "idx_classes_schoolId";
DROP INDEX IF EXISTS "idx_holidays_schoolId";
DROP INDEX IF EXISTS "attendance_settings_schoolId_key";

-- Drop the schools table entirely since it's no longer needed
DROP TABLE IF EXISTS "schools" CASCADE;

-- Remove any remaining references to schools in views
DROP VIEW IF EXISTS "class_attendance_stats";

-- Recreate the class_attendance_stats view without school references
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

-- Remove the unique constraint on attendance_settings.schoolId since the column is being dropped
-- The table will now have a simpler structure without school-specific settings

-- Make attendance_settings a single global configuration
-- If there are existing records, we'll keep the first one and delete the rest
DELETE FROM "attendance_settings" WHERE "id" NOT IN (
    SELECT "id" FROM "attendance_settings" LIMIT 1
);

-- Update any sample data that might still reference the dropped school
-- Remove school references from sample inserts in the schema

COMMIT;

-- Success message
SELECT 'School ID references have been successfully removed from the database' as result;