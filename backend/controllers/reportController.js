const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, classId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const whereClause = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (classId) {
      whereClause.classId = classId;
    }

    // Get attendance data
    const attendanceData = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate statistics
    const totalPresent = attendanceData.filter(a => a.status === 'PRESENT').length;
    const totalAbsent = attendanceData.filter(a => a.status === 'ABSENT').length;
    const totalLate = attendanceData.filter(a => a.status === 'LATE').length;
    const totalExcused = attendanceData.filter(a => a.status === 'EXCUSED').length;
    const totalRecords = attendanceData.length;

    const attendancePercentage = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

    // Group by date for daily statistics
    const dailyStats = {};
    attendanceData.forEach(record => {
      const date = record.date.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      dailyStats[date][record.status.toLowerCase()]++;
    });

    const dailyStatsArray = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats
    }));

    const report = {
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      totalRecords,
      attendancePercentage,
      dailyStats: dailyStatsArray,
      attendanceData
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ error: 'Failed to generate attendance report' });
  }
};

const getClassReport = async (req, res) => {
  try {
    const { startDate, endDate, classId } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Get class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        school: true,
        teacher: {
          include: { user: true }
        },
        students: true
      }
    });

    if (!classInfo) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const whereClause = {
      classId,
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get attendance data for the class
    const attendanceData = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true
          }
        }
      }
    });

    // Calculate student-wise attendance
    const studentAttendance = {};
    classInfo.students.forEach(student => {
      studentAttendance[student.id] = {
        student,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0
      };
    });

    attendanceData.forEach(record => {
      if (studentAttendance[record.studentId]) {
        studentAttendance[record.studentId][record.status.toLowerCase()]++;
        studentAttendance[record.studentId].total++;
      }
    });

    // Calculate attendance percentages and find top performers
    const studentsWithPercentage = Object.values(studentAttendance).map(data => ({
      ...data,
      attendancePercentage: data.total > 0 ? (data.present / data.total) * 100 : 0
    }));

    const topPerformers = studentsWithPercentage
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
      .slice(0, 5)
      .map(data => ({
        name: data.student.name,
        rollNumber: data.student.rollNumber,
        attendancePercentage: data.attendancePercentage
      }));

    const totalStudents = classInfo.students.length;
    const activeStudents = classInfo.students.filter(s => s.isActive).length;
    const averageAttendance = studentsWithPercentage.reduce((sum, data) => 
      sum + data.attendancePercentage, 0) / studentsWithPercentage.length || 0;

    const report = {
      className: `${classInfo.name} (${classInfo.grade}-${classInfo.section})`,
      school: classInfo.school.name,
      teacher: classInfo.teacher ? classInfo.teacher.user.name : 'No teacher assigned',
      totalStudents,
      activeStudents,
      averageAttendance,
      topPerformers,
      studentsWithPercentage
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating class report:', error);
    res.status(500).json({ error: 'Failed to generate class report' });
  }
};

const getStudentReport = async (req, res) => {
  try {
    const { startDate, endDate, studentId, classId } = req.query;

    let whereClause = {};

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (classId) {
      whereClause.classId = classId;
    }

    // Get students based on filters
    let students;
    if (studentId) {
      students = await prisma.student.findMany({
        where: { id: studentId },
        include: {
          class: true,
          parent: {
            include: { user: true }
          }
        }
      });
    } else if (classId) {
      students = await prisma.student.findMany({
        where: { classId },
        include: {
          class: true,
          parent: {
            include: { user: true }
          }
        }
      });
    } else {
      students = await prisma.student.findMany({
        include: {
          class: true,
          parent: {
            include: { user: true }
          }
        }
      });
    }

    // Get attendance data
    const attendanceData = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: true,
        class: true
      }
    });

    // Process data for each student
    const studentReports = students.map(student => {
      const studentAttendance = attendanceData.filter(a => a.studentId === student.id);
      
      const present = studentAttendance.filter(a => a.status === 'PRESENT').length;
      const absent = studentAttendance.filter(a => a.status === 'ABSENT').length;
      const late = studentAttendance.filter(a => a.status === 'LATE').length;
      const excused = studentAttendance.filter(a => a.status === 'EXCUSED').length;
      const total = studentAttendance.length;
      
      const attendancePercentage = total > 0 ? (present / total) * 100 : 0;

      return {
        student: {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          class: `${student.class.name} (${student.class.grade}-${student.class.section})`,
          parent: student.parent.user.name
        },
        attendance: {
          present,
          absent,
          late,
          excused,
          total,
          attendancePercentage
        },
        recentAttendance: studentAttendance.slice(-10).map(a => ({
          date: a.date,
          status: a.status,
          remarks: a.remarks
        }))
      };
    });

    const report = {
      totalStudents: students.length,
      studentReports
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating student report:', error);
    res.status(500).json({ error: 'Failed to generate student report' });
  }
};

const getTeacherReport = async (req, res) => {
  try {
    const { startDate, endDate, teacherId } = req.query;

    let whereClause = {};
    if (teacherId) {
      whereClause.id = teacherId;
    }

    // Get teachers
    const teachers = await prisma.teacherProfile.findMany({
      where: whereClause,
      include: {
        user: true,
        classes: {
          include: {
            school: true,
            students: true,
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    // Get attendance data marked by teachers
    const attendanceWhereClause = {
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const teacherReports = await Promise.all(teachers.map(async (teacher) => {
      // Get attendance marked by this teacher
      const attendanceMarked = await prisma.attendance.findMany({
        where: {
          ...attendanceWhereClause,
          markedBy: teacher.userId
        },
        include: {
          student: true,
          class: true
        }
      });

      const totalClasses = teacher.classes.length;
      const totalStudents = teacher.classes.reduce((sum, cls) => sum + cls._count.students, 0);
      const attendanceRecordsMarked = attendanceMarked.length;

      // Calculate attendance statistics for teacher's classes
      const classStats = teacher.classes.map(cls => {
        const classAttendance = attendanceMarked.filter(a => a.classId === cls.id);
        const present = classAttendance.filter(a => a.status === 'PRESENT').length;
        const total = classAttendance.length;
        
        return {
          className: `${cls.name} (${cls.grade}-${cls.section})`,
          school: cls.school.name,
          totalStudents: cls._count.students,
          attendanceRecords: total,
          presentCount: present,
          attendanceRate: total > 0 ? (present / total) * 100 : 0
        };
      });

      return {
        teacher: {
          id: teacher.id,
          name: teacher.user.name,
          email: teacher.user.email,
          employeeId: teacher.employeeId,
          experience: teacher.experience,
          qualification: teacher.qualification
        },
        summary: {
          totalClasses,
          totalStudents,
          attendanceRecordsMarked
        },
        classStats
      };
    }));

    const report = {
      totalTeachers: teachers.length,
      teacherReports
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating teacher report:', error);
    res.status(500).json({ error: 'Failed to generate teacher report' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalSchools = await prisma.school.count({ where: { isActive: true } });
    const totalTeachers = await prisma.teacherProfile.count({ where: { isActive: true } });
    const totalClasses = await prisma.class.count({ where: { isActive: true } });
    const totalStudents = await prisma.student.count({ where: { isActive: true } });
    const totalParents = await prisma.parentProfile.count();

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const todayPresent = todayAttendance.filter(a => a.status === 'PRESENT').length;
    const todayAbsent = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const todayLate = todayAttendance.filter(a => a.status === 'LATE').length;

    // Get this month's attendance statistics
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyAttendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _count: {
        status: true
      }
    });

    const monthlyStats = monthlyAttendance.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {});

    // Get recent notifications
    const recentNotifications = await prisma.parentNotification.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      include: {
        parent: {
          include: { user: true }
        },
        student: true
      }
    });

    const stats = {
      overview: {
        totalSchools,
        totalTeachers,
        totalClasses,
        totalStudents,
        totalParents
      },
      todayAttendance: {
        present: todayPresent,
        absent: todayAbsent,
        late: todayLate,
        total: todayAttendance.length
      },
      monthlyStats,
      recentNotifications
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = {
  getAttendanceReport,
  getClassReport,
  getStudentReport,
  getTeacherReport,
  getDashboardStats
};