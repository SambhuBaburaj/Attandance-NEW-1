// Database setup script to create tables and initial data
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');

    // Read the SQL schema file
    const sqlFilePath = path.join(__dirname, '..', 'complete_database_schema.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ complete_database_schema.sql file not found!');
      console.log('Please make sure the file exists at:', sqlFilePath);
      process.exit(1);
    }

    const sqlSchema = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Found SQL schema file, executing...');
    
    // Execute the SQL schema
    await prisma.$executeRawUnsafe(sqlSchema);
    
    console.log('✅ Database schema created successfully!');
    
    // Test the connection by querying the users table
    const userCount = await prisma.user.count();
    console.log(`📊 Users table created. Found ${userCount} users.`);
    
    const schoolCount = await prisma.school.count();
    console.log(`🏫 Schools table created. Found ${schoolCount} schools.`);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Default login credentials:');
    console.log('  Admin: admin@school.com / admin123');
    console.log('  Teacher: teacher@school.com / teacher123');
    console.log('  Parent: parent@school.com / parent123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.code === 'P2021') {
      console.log('\n💡 Suggested solution:');
      console.log('1. Make sure your database connection is working');
      console.log('2. Run: npm run setup-db');
      console.log('3. Or manually execute the SQL file in your database');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase();