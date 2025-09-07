const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSchoolSettings = async (req, res) => {
  try {
    const settings = await prisma.schoolSettings.findFirst();
    
    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        schoolName: '',
        schoolAddress: '',
        schoolPhone: '',
        schoolEmail: '',
        principalName: '',
        sessionStartTime: '09:00:00',
        sessionEndTime: '15:00:00',
        workingDays: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
        timeZone: 'UTC',
        academicYearStart: new Date().toISOString(),
        academicYearEnd: new Date(new Date().getFullYear() + 1, 5, 30).toISOString()
      };
      return res.json(defaultSettings);
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching school settings:', error);
    res.status(500).json({ error: 'Failed to fetch school settings' });
  }
};

const updateSchoolSettings = async (req, res) => {
  try {
    const {
      schoolName,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      principalName,
      sessionStartTime,
      sessionEndTime,
      workingDays,
      timeZone,
      academicYearStart,
      academicYearEnd,
      notificationSettings
    } = req.body;

    // Check if settings exist
    const existingSettings = await prisma.schoolSettings.findFirst();
    
    const settingsData = {
      schoolName: schoolName || '',
      schoolAddress,
      schoolPhone,
      schoolEmail,
      principalName,
      sessionStartTime: sessionStartTime || '09:00:00',
      sessionEndTime: sessionEndTime || '15:00:00',
      workingDays: workingDays || 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
      timeZone: timeZone || 'UTC',
      academicYearStart: academicYearStart ? new Date(academicYearStart) : new Date(),
      academicYearEnd: academicYearEnd ? new Date(academicYearEnd) : new Date(new Date().getFullYear() + 1, 5, 30),
      notificationSettings
    };

    let settings;
    if (existingSettings) {
      settings = await prisma.schoolSettings.update({
        where: { id: existingSettings.id },
        data: settingsData
      });
    } else {
      settings = await prisma.schoolSettings.create({
        data: settingsData
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating school settings:', error);
    res.status(500).json({ error: 'Failed to update school settings' });
  }
};

const getAttendanceSettings = async (req, res) => {
  try {
    const settings = await prisma.attendanceSettings.findFirst();
    
    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        autoMarkAbsentAfter: '10:00:00',
        lateThresholdMinutes: 15,
        notificationEnabled: true,
        dailySummaryTime: '18:00:00',
        weeklySummaryDay: 5
      };
      return res.json(defaultSettings);
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching attendance settings:', error);
    res.status(500).json({ error: 'Failed to fetch attendance settings' });
  }
};

const updateAttendanceSettings = async (req, res) => {
  try {
    const {
      autoMarkAbsentAfter,
      lateThresholdMinutes,
      notificationEnabled,
      dailySummaryTime,
      weeklySummaryDay
    } = req.body;

    // Check if settings exist
    const existingSettings = await prisma.attendanceSettings.findFirst();
    
    const settingsData = {
      autoMarkAbsentAfter: autoMarkAbsentAfter || '10:00:00',
      lateThresholdMinutes: lateThresholdMinutes || 15,
      notificationEnabled: notificationEnabled !== undefined ? notificationEnabled : true,
      dailySummaryTime: dailySummaryTime || '18:00:00',
      weeklySummaryDay: weeklySummaryDay || 5
    };

    let settings;
    if (existingSettings) {
      settings = await prisma.attendanceSettings.update({
        where: { id: existingSettings.id },
        data: settingsData
      });
    } else {
      settings = await prisma.attendanceSettings.create({
        data: settingsData
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating attendance settings:', error);
    res.status(500).json({ error: 'Failed to update attendance settings' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const [
      totalTeachers,
      totalClasses,
      totalStudents,
      totalParents
    ] = await Promise.all([
      prisma.teacherProfile.count({ where: { isActive: true } }),
      prisma.class.count({ where: { isActive: true } }),
      prisma.student.count({ where: { isActive: true } }),
      prisma.parentProfile.count()
    ]);

    // Get today's attendance stats
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

    const todayStats = {
      present: todayAttendance.filter(a => a.status === 'PRESENT').length,
      absent: todayAttendance.filter(a => a.status === 'ABSENT').length,
      late: todayAttendance.filter(a => a.status === 'LATE').length,
      excused: todayAttendance.filter(a => a.status === 'EXCUSED').length,
      total: todayAttendance.length
    };

    // Get this week's stats
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weeklyAttendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: startOfWeek,
          lt: tomorrow
        }
      },
      _count: {
        status: true
      }
    });

    const weeklyStats = weeklyAttendance.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.status;
      return acc;
    }, {});

    // Get recent notifications
    const recentNotifications = await prisma.parentNotification.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      include: {
        parent: {
          include: { user: { select: { name: true } } }
        },
        student: { select: { name: true } }
      }
    });

    // Get classes with low attendance (less than 70% this week)
    const classesWithAttendance = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        students: {
          where: { isActive: true },
          select: { id: true }
        },
        attendance: {
          where: {
            date: {
              gte: startOfWeek,
              lt: tomorrow
            }
          }
        },
        teacher: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    const lowAttendanceClasses = classesWithAttendance
      .map(cls => {
        const totalStudents = cls.students.length;
        const presentCount = cls.attendance.filter(a => a.status === 'PRESENT').length;
        const attendanceRate = totalStudents > 0 ? (presentCount / (totalStudents * 5)) * 100 : 0; // Assuming 5 days
        
        return {
          id: cls.id,
          name: `${cls.name} - Grade ${cls.grade}${cls.section ? ` (${cls.section})` : ''}`,
          teacher: cls.teacher?.user?.name || 'No teacher assigned',
          attendanceRate: Math.round(attendanceRate),
          totalStudents
        };
      })
      .filter(cls => cls.attendanceRate < 70)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 5);

    const stats = {
      overview: {
        totalTeachers,
        totalClasses,
        totalStudents,
        totalParents
      },
      todayStats,
      weeklyStats,
      lowAttendanceClasses,
      recentNotifications: recentNotifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        parentName: notification.parent.user.name,
        studentName: notification.student?.name,
        sentAt: notification.sentAt,
        isRead: notification.isRead
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

module.exports = {
  getSchoolSettings,
  updateSchoolSettings,
  getAttendanceSettings,
  updateAttendanceSettings,
  getDashboardStats
};