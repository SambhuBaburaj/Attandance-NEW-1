# Attendance App Backend

## Setup Instructions

1. Install PostgreSQL and create a database named `attendance_db`

2. Update the `.env` file with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/attendance_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
```

3. Install dependencies:
```bash
npm install
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma db push
```

5. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/create-user` - Create new user (Admin only)

## Default Admin Account

To create the first admin account, you'll need to manually insert into the database or modify the schema to allow initial admin creation.

## Database Schema

The app supports three roles:
- **ADMIN**: Can create teachers and parents, manage classes
- **TEACHER**: Can mark attendance for their assigned classes
- **PARENT**: Can view their children's attendance

## Features

- Role-based authentication
- JWT token-based authorization
- Password hashing with bcrypt
- PostgreSQL database with Prisma ORM