// Complete database setup script - creates all tables step by step
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAllTables() {
  try {
    console.log('🚀 Starting complete database setup...');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Create all tables in correct order (respecting foreign key dependencies)
    
    // 1. Teacher profiles table
    console.log('👨‍🏫 Creating teacher_profiles table...');
    await prisma.$executeRaw`
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
    `;
    
    // 2. Parent profiles table
    console.log('👨‍👩‍👧‍👦 Creating parent_profiles table...');
    await prisma.$executeRaw`
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
    `;
    
    // 3. Classes table
    console.log('📚 Creating classes table...');
    await prisma.$executeRaw`
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
    `;
    
    // 4. Students table
    console.log('👨‍🎓 Creating students table...');
    await prisma.$executeRaw`
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
    `;
    
    // 5. Attendance table
    console.log('📊 Creating attendance table...');
    await prisma.$executeRaw`
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
    `;
    
    // 6. Parent notifications table
    console.log('📢 Creating parent_notifications table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "parent_notifications" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 7. Parent messages table
    console.log('💬 Creating parent_messages table...');
    await prisma.$executeRaw`
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
    `;
    
    // 8. Subjects table
    console.log('📖 Creating subjects table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "subjects" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 9. Class subjects table
    console.log('📚📖 Creating class_subjects table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "class_subjects" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "classId" TEXT NOT NULL,
        "subjectId" TEXT NOT NULL,
        "teacherId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("classId", "subjectId")
      );
    `;
    
    // 10. Holidays table
    console.log('🎉 Creating holidays table...');
    await prisma.$executeRaw`
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
    `;
    
    // 11. Attendance settings table
    console.log('⚙️ Creating attendance_settings table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "attendance_settings" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "schoolId" TEXT NOT NULL UNIQUE,
        "autoMarkAbsentAfter" TEXT DEFAULT '10:00:00',
        "lateThresholdMinutes" INTEGER DEFAULT 15,
        "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
        "dailySummaryTime" TEXT DEFAULT '18:00:00',
        "weeklySummaryDay" INTEGER DEFAULT 5,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('🔗 Adding foreign key constraints...');
    
    // First check if foreign key constraints already exist before adding them
    
    // Add foreign keys with try-catch for each constraint
    try {
      await prisma.$executeRaw`
        ALTER TABLE "teacher_profiles" 
        ADD CONSTRAINT "teacher_profiles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
      `;
      console.log('✅ teacher_profiles foreign key added');
    } catch (error) {
      console.log('⚠️ teacher_profiles constraint might already exist');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "parent_profiles" 
        ADD CONSTRAINT "parent_profiles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
      `;
      console.log('✅ parent_profiles foreign key added');
    } catch (error) {
      console.log('⚠️ parent_profiles constraint might already exist');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "classes" 
        ADD CONSTRAINT "classes_schoolId_fkey" 
        FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE;
      `;
      console.log('✅ classes-schools foreign key added');
    } catch (error) {
      console.log('⚠️ classes-schools constraint might already exist');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "classes" 
        ADD CONSTRAINT "classes_teacherId_fkey" 
        FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL;
      `;
      console.log('✅ classes-teachers foreign key added');
    } catch (error) {
      console.log('⚠️ classes-teachers constraint might already exist');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "students" 
        ADD CONSTRAINT "students_classId_fkey" 
        FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE;
      `;
      console.log('✅ students-classes foreign key added');
    } catch (error) {
      console.log('⚠️ students-classes constraint might already exist');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "students" 
        ADD CONSTRAINT "students_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE;
      `;
      console.log('✅ students-parents foreign key added');
    } catch (error) {
      console.log('⚠️ students-parents constraint might already exist');
    }
    
    console.log('📈 Creating additional indexes...');
    
    // Create important indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_userId_key" ON "teacher_profiles"("userId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "teacher_profiles_employeeId_key" ON "teacher_profiles"("employeeId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "parent_profiles_userId_key" ON "parent_profiles"("userId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "students_rollNumber_key" ON "students"("rollNumber");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_key" ON "subjects"("code");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "attendance_studentId_date_key" ON "attendance"("studentId", "date");`;
    
    console.log('📊 Inserting sample data...');
    
    // Insert default subjects
    await prisma.$executeRaw`
      INSERT INTO "subjects" ("name", "code", "description", "isActive") VALUES
      ('Mathematics', 'MATH', 'Mathematics and numerical skills', true),
      ('English Language Arts', 'ELA', 'English language and literature', true),
      ('Science', 'SCI', 'General science and scientific method', true),
      ('Social Studies', 'SOC', 'Social studies, history, and geography', true),
      ('Physical Education', 'PE', 'Physical education and health', true)
      ON CONFLICT ("code") DO NOTHING;
    `;
    
    // Insert default attendance settings
    await prisma.$executeRaw`
      INSERT INTO "attendance_settings" ("schoolId") VALUES ('school-001')
      ON CONFLICT ("schoolId") DO NOTHING;
    `;
    
    console.log('🧪 Testing all tables...');
    
    // Test all tables
    const counts = {
      users: await prisma.user.count(),
      schools: await prisma.school.count(),
      subjects: await prisma.subject.count(),
      attendanceSettings: await prisma.attendanceSettings.count()
    };
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Table counts:', counts);
    console.log('\n📝 Default login credentials:');
    console.log('  Admin: admin@school.com / admin123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the complete setup
createAllTables().catch(console.error);