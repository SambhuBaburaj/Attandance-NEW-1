# Attendance Management System - Setup Instructions

## Database Setup

### For New Installation
Use the comprehensive database schema:
```sql
-- Run the complete_database_schema.sql file
psql -d your_database -f complete_database_schema.sql
```

### For Existing Installation
Update your existing database with new fields and tables:
```sql
-- Run the update script for existing databases
psql -d your_database -f backend/update_database.sql
```

## New Features Added

### 1. School Management
- **Frontend**: `ManageSchools.js` screen
- **Backend**: `/api/schools` endpoints
- **Features**: 
  - Create/Edit/Delete schools
  - School information (contact, principal, established year)
  - School statistics

### 2. Teacher Management  
- **Frontend**: `ManageTeachers.js` screen
- **Backend**: `/api/teachers` endpoints
- **Features**:
  - Create/Edit/Delete teachers
  - Teacher profiles (qualifications, experience, salary)
  - Class assignments

### 3. Advanced Reports
- **Frontend**: `ViewReports.js` screen
- **Backend**: `/api/reports` endpoints
- **Report Types**:
  - Attendance reports with statistics
  - Class performance reports
  - Student analytics
  - Teacher reports
  - Dashboard statistics

### 4. Enhanced Database Schema
- **Extended Tables**: Schools, Teachers, Students, Classes
- **New Tables**: Subjects, ClassSubjects, Holidays, AttendanceSettings
- **Additional Fields**: 
  - Student: admission date, blood group, medical conditions
  - Attendance: check-in/check-out times
  - Classes: room numbers, active status

## Frontend Integration

All new screens are integrated into the navigation:
- `ManageSchools` - School management interface
- `ManageTeachers` - Teacher management interface  
- `ViewReports` - Comprehensive reporting system

## Service Layer

New service files for frontend integration:
- `schoolService.js` - School CRUD operations
- `teacherService.js` - Teacher management
- `reportService.js` - Report generation

## API Endpoints

### Schools API (`/api/schools`)
- `GET /` - Get all schools
- `GET /:id` - Get school by ID
- `POST /` - Create new school
- `PUT /:id` - Update school
- `DELETE /:id` - Delete school
- `GET /:id/stats` - Get school statistics

### Teachers API (`/api/teachers`)
- `GET /` - Get all teachers
- `GET /:id` - Get teacher by ID
- `POST /` - Create new teacher
- `PUT /:id` - Update teacher
- `DELETE /:id` - Delete teacher
- `GET /:id/classes` - Get teacher's classes
- `POST /:id/assign-class` - Assign teacher to class
- `POST /:id/unassign-class` - Unassign teacher from class

### Reports API (`/api/reports`)
- `GET /attendance` - Get attendance report
- `GET /class` - Get class report
- `GET /student` - Get student report
- `GET /teacher` - Get teacher report
- `GET /dashboard-stats` - Get dashboard statistics

## Testing

1. **Backend Testing**:
   ```bash
   cd backend
   npm start
   ```

2. **Frontend Testing**:
   ```bash
   cd frontend
   npm start
   ```

3. **Database Testing**:
   - Verify all tables exist
   - Check new fields are added
   - Test foreign key relationships

## Troubleshooting

### Common Issues

1. **Database Schema Mismatch**:
   - Run the update script: `backend/update_database.sql`
   - Ensure Prisma schema matches database

2. **Missing Routes Error**:
   - Check if controllers are properly exported
   - Verify route imports in server.js

3. **Frontend Service Errors**:
   - Ensure backend APIs are running
   - Check API endpoint URLs in service files

### Database Migration

If you need to reset the database completely:
```sql
-- Drop existing tables (CAUTION: This will delete all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then run the complete schema
psql -d your_database -f complete_database_schema.sql
```

## Production Deployment

1. Update environment variables
2. Run database migration scripts
3. Build frontend for production
4. Deploy backend with proper authentication
5. Configure CORS for production domains

## Security Notes

- All APIs require authentication
- Input validation on all endpoints
- SQL injection protection via Prisma
- Proper error handling and logging