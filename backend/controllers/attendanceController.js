const { PrismaClient } = require('@prisma/client');
const { sendAbsentNotifications } = require('../services/notificationService');
const prisma = new PrismaClient();

// Get attendance for a specific class and date
const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.query;

    if (!classId || !date) {
      return res.status(400).json({ error: 'Class ID and date are required' });
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId,
        isActive: true
      },
      include: {
        parent: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        rollNumber: 'asc'
      }
    });

    // Get existing attendance records for the date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        date: new Date(date)
      },
      include: {
        student: true,
        marker: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create attendance map for easy lookup
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.studentId] = record;
    });

    // Combine student data with attendance status
    const attendanceData = students.map(student => ({
      student,
      attendance: attendanceMap[student.id] || null
    }));

    res.json({
      classId,
      date,
      students: attendanceData,
      totalStudents: students.length,
      presentCount: attendanceRecords.filter(r => r.status === 'PRESENT').length,
      absentCount: attendanceRecords.filter(r => r.status === 'ABSENT').length,
      lateCount: attendanceRecords.filter(r => r.status === 'LATE').length,
      excusedCount: attendanceRecords.filter(r => r.status === 'EXCUSED').length,
      unmarkedCount: students.length - attendanceRecords.length
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// Mark attendance for students
const markAttendance = async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;
    const userId = req.user.id;

    if (!classId || !date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ 
        error: 'Class ID, date, and attendance data are required' 
      });
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const attendanceDate = new Date(date);
    const results = [];

    // Process each student's attendance
    for (const studentAttendance of attendanceData) {
      const { studentId, status, remarks } = studentAttendance;

      // Validate status
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
      if (!validStatuses.includes(status)) {
        continue; // Skip invalid status
      }

      // Check if attendance already exists
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          studentId_date: {
            studentId,
            date: attendanceDate
          }
        }
      });

      if (existingAttendance) {
        // Update existing attendance
        const updated = await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            status,
            remarks: remarks || null,
            markedBy: userId,
            markedAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            student: {
              include: {
                parent: {
                  include: {
                    user: true
                  }
                }
              }
            },
            marker: {
              select: { id: true, name: true }
            }
          }
        });
        results.push(updated);
      } else {
        // Create new attendance record
        const created = await prisma.attendance.create({
          data: {
            studentId,
            classId,
            date: attendanceDate,
            status,
            remarks: remarks || null,
            markedBy: userId,
            markedAt: new Date()
          },
          include: {
            student: {
              include: {
                parent: {
                  include: {
                    user: true
                  }
                }
              }
            },
            marker: {
              select: { id: true, name: true }
            }
          }
        });
        results.push(created);
      }
    }

    // Send notifications for absent students
    await sendAbsentNotifications(results, classId, attendanceDate);

    res.json({
      message: 'Attendance marked successfully',
      recordsProcessed: results.length,
      attendanceRecords: results
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Get attendance history for a class
const getAttendanceHistory = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, limit = 30, offset = 0 } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    } else if (startDate) {
      dateFilter.gte = new Date(startDate);
    } else if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get attendance records grouped by date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      include: {
        student: true,
        marker: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { date: 'desc' },
        { student: { rollNumber: 'asc' } }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Group by date
    const groupedByDate = {};
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          records: [],
          totalPresent: 0,
          totalAbsent: 0
        };
      }
      groupedByDate[dateKey].records.push(record);
      if (record.status === 'PRESENT') {
        groupedByDate[dateKey].totalPresent++;
      } else if (record.status === 'ABSENT') {
        groupedByDate[dateKey].totalAbsent++;
      }
    });

    // Convert to array and sort by date
    const historyData = Object.values(groupedByDate).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    // Get total count for pagination
    const totalRecords = await prisma.attendance.groupBy({
      by: ['date'],
      where: {
        classId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      }
    });

    res.json({
      classId,
      history: historyData,
      pagination: {
        total: totalRecords.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalRecords.length > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
};

// Get attendance statistics for a class
const getAttendanceStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          where: { isActive: true }
        },
        _count: {
          select: { students: true }
        }
      }
    });

    if (!classInfo) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get attendance statistics
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        classId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      _count: {
        status: true
      }
    });

    // Calculate statistics
    const presentCount = attendanceStats.find(stat => stat.status === 'PRESENT')?._count.status || 0;
    const absentCount = attendanceStats.find(stat => stat.status === 'ABSENT')?._count.status || 0;
    const lateCount = attendanceStats.find(stat => stat.status === 'LATE')?._count.status || 0;
    const excusedCount = attendanceStats.find(stat => stat.status === 'EXCUSED')?._count.status || 0;
    const totalRecords = presentCount + absentCount + lateCount + excusedCount;

    // Get attendance by student
    const studentStats = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: {
        classId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      _count: {
        status: true
      }
    });

    // Process student statistics
    const studentStatsMap = {};
    studentStats.forEach(stat => {
      if (!studentStatsMap[stat.studentId]) {
        studentStatsMap[stat.studentId] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      const status = stat.status.toLowerCase();
      studentStatsMap[stat.studentId][status] = stat._count.status;
    });

    res.json({
      classInfo: {
        id: classInfo.id,
        name: classInfo.name,
        grade: classInfo.grade,
        section: classInfo.section,
        totalStudents: classInfo._count.students
      },
      overallStats: {
        totalAttendanceRecords: totalRecords,
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLate: lateCount,
        totalExcused: excusedCount,
        attendanceRate: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0
      },
      studentStats: studentStatsMap,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
};

// Get detailed attendance for a specific date with student names
const getDetailedAttendanceByDate = async (req, res) => {
  try {
    const { classId, date } = req.query;

    if (!classId || !date) {
      return res.status(400).json({ error: 'Class ID and date are required' });
    }

    // Get attendance records for the specific date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        date: new Date(date)
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true
          }
        },
        marker: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        student: {
          rollNumber: 'asc'
        }
      }
    });

    // Group students by attendance status
    const presentStudents = attendanceRecords
      .filter(record => record.status === 'PRESENT')
      .map(record => ({
        id: record.student.id,
        name: record.student.name,
        rollNumber: record.student.rollNumber,
        status: record.status,
        remarks: record.remarks
      }));

    const absentStudents = attendanceRecords
      .filter(record => record.status === 'ABSENT')
      .map(record => ({
        id: record.student.id,
        name: record.student.name,
        rollNumber: record.student.rollNumber,
        status: record.status,
        remarks: record.remarks
      }));

    const lateStudents = attendanceRecords
      .filter(record => record.status === 'LATE')
      .map(record => ({
        id: record.student.id,
        name: record.student.name,
        rollNumber: record.student.rollNumber,
        status: record.status,
        remarks: record.remarks
      }));

    const excusedStudents = attendanceRecords
      .filter(record => record.status === 'EXCUSED')
      .map(record => ({
        id: record.student.id,
        name: record.student.name,
        rollNumber: record.student.rollNumber,
        status: record.status,
        remarks: record.remarks
      }));

    res.json({
      classId,
      date,
      presentStudents,
      absentStudents,
      lateStudents,
      excusedStudents,
      totalPresent: presentStudents.length,
      totalAbsent: absentStudents.length,
      totalLate: lateStudents.length,
      totalExcused: excusedStudents.length,
      totalMarked: attendanceRecords.length
    });
  } catch (error) {
    console.error('Error fetching detailed attendance:', error);
    res.status(500).json({ error: 'Failed to fetch detailed attendance' });
  }
};

// Delete attendance record
const deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRecord = await prisma.attendance.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    await prisma.attendance.delete({
      where: { id }
    });

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
};

module.exports = {
  getAttendanceByClassAndDate,
  markAttendance,
  getAttendanceHistory,
  getAttendanceStats,
  getDetailedAttendanceByDate,
  deleteAttendanceRecord
};