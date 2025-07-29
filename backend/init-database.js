// Simple database initialization script
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function initDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Test connection first
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Try to create tables using raw SQL - one at a time
    console.log('📊 Creating ENUM types...');
    
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('✅ Role enum created');
    } catch (error) {
      console.log('⚠️ Role enum might already exist:', error.message);
    }
    
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('✅ AttendanceStatus enum created');
    } catch (error) {
      console.log('⚠️ AttendanceStatus enum might already exist:', error.message);
    }
    
    // Create users table
    console.log('👥 Creating users table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "Role" NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Users table created');
    
    // Create schools table
    console.log('🏫 Creating schools table...');
    await prisma.$executeRaw`
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
    `;
    console.log('✅ Schools table created');
    
    // Create indexes
    console.log('📈 Creating indexes...');
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_schools_isActive" ON "schools"("isActive");`;
    
    // Insert default admin user if not exists
    console.log('👤 Creating default admin user...');
    await prisma.$executeRaw`
      INSERT INTO "users" ("id", "email", "password", "name", "role") VALUES 
      ('admin-001', 'admin@school.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeYBQ5IIDM5Z9XJP2', 'System Administrator', 'ADMIN')
      ON CONFLICT ("email") DO NOTHING;
    `;
    
    // Insert default school
    console.log('🏫 Creating default school...');
    await prisma.$executeRaw`
      INSERT INTO "schools" ("id", "name", "address", "phone", "email", "principalName", "establishedYear", "isActive") VALUES 
      ('school-001', 'Demo Elementary School', '123 Education Street, Learning City, State 12345', '+1-555-123-4567', 'info@demoschool.edu', 'Dr. Sarah Principal', 2010, true)
      ON CONFLICT ("id") DO NOTHING;
    `;
    
    // Test queries
    console.log('🧪 Testing database queries...');
    const userCount = await prisma.user.count();
    const schoolCount = await prisma.school.count();
    
    console.log(`✅ Found ${userCount} users and ${schoolCount} schools`);
    
    console.log('🎉 Basic database initialization completed!');
    console.log('\n📝 Default login credentials:');
    console.log('  Admin: admin@school.com / admin123');
    console.log('\n⚠️ Note: This created only basic tables. Run the full schema for complete setup.');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Ensure your database is accessible');
    console.log('3. Check if you have proper permissions');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initDatabase();