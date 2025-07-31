const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getMyChildren = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Fetching children for user:", userId);
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },

      include: {
        children: {
          where: { isActive: true },
          include: {
            class: {
              include: {
                teacher: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!parentProfile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    res.json(parentProfile.children);
  } catch (error) {
    console.error("Error fetching parent children:", error);
    res.status(500).json({ error: "Failed to fetch children" });
  }
};

const getChildAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify this student belongs to the logged-in parent
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          where: { id: studentId, isActive: true },
        },
      },
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied - student not found or not your child" });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        student: {
          select: {
            name: true,
            rollNumber: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate summary statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(
      (record) => record.status === "PRESENT"
    ).length;
    const absentDays = attendance.filter(
      (record) => record.status === "ABSENT"
    ).length;
    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      attendance,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage,
      },
    });
  } catch (error) {
    console.error("Error fetching child attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find parent profile with all children
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          where: { isActive: true },
          include: {
            class: true,
            attendance: {
              where: {
                date: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
                },
              },
            },
          },
        },
      },
    });

    if (!parentProfile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    // Calculate summary for each child
    const childrenSummary = parentProfile.children.map((student) => {
      const totalDays = student.attendance.length;
      const presentDays = student.attendance.filter(
        (record) => record.status === "PRESENT"
      ).length;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        className: student.class.name,
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage,
      };
    });

    // Overall summary
    const totalChildren = parentProfile.children.length;
    const overallAttendance =
      childrenSummary.length > 0
        ? Math.round(
            childrenSummary.reduce(
              (sum, child) => sum + child.attendancePercentage,
              0
            ) / childrenSummary.length
          )
        : 0;

    res.json({
      totalChildren,
      overallAttendance,
      children: childrenSummary,
    });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({ error: "Failed to fetch attendance summary" });
  }
};

const getChildTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find parent profile with all children and today's attendance
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          where: { isActive: true },
          include: {
            class: true,
            attendance: {
              where: {
                date: {
                  gte: today,
                  lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
    });

    if (!parentProfile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    const todayStatus = parentProfile.children.map((student) => {
      const todayAttendance = student.attendance[0] || null;

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        className: student.class.name,
        status: todayAttendance ? todayAttendance.status : "NOT_MARKED",
        remarks: todayAttendance ? todayAttendance.remarks : null,
      };
    });

    res.json(todayStatus);
  } catch (error) {
    console.error("Error fetching today attendance:", error);
    res.status(500).json({ error: "Failed to fetch today attendance" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      phone,
      alternatePhone,
      address,
      occupation,
      workAddress,
      emergencyContact,
      emergencyContactName,
      relationship,
      notifications,
      whatsappOptIn,
      emailOptIn,
    } = req.body;

    const updatedProfile = await prisma.parentProfile.update({
      where: { userId },
      data: {
        ...(phone !== undefined && { phone }),
        ...(alternatePhone !== undefined && { alternatePhone }),
        ...(address !== undefined && { address }),
        ...(occupation !== undefined && { occupation }),
        ...(workAddress !== undefined && { workAddress }),
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(emergencyContactName !== undefined && { emergencyContactName }),
        ...(relationship !== undefined && { relationship }),
        ...(notifications !== undefined && { notifications }),
        ...(whatsappOptIn !== undefined && { whatsappOptIn }),
        ...(emailOptIn !== undefined && { emailOptIn }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating parent profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching parent profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!parentProfile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    const whereClause = {
      parentId: parentProfile.id,
      ...(unreadOnly === "true" && { isRead: false }),
    };

    const [notifications, totalCount] = await Promise.all([
      prisma.parentNotification.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              name: true,
              rollNumber: true,
            },
          },
        },
        orderBy: {
          sentAt: "desc",
        },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.parentNotification.count({
        where: whereClause,
      }),
    ]);

    res.json({
      notifications,
      totalCount,
      hasMore: parseInt(offset) + notifications.length < totalCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!parentProfile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    const notification = await prisma.parentNotification.findFirst({
      where: {
        id: notificationId,
        parentId: parentProfile.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updatedNotification = await prisma.parentNotification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!parentProfile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    const result = await prisma.parentNotification.updateMany({
      where: {
        parentId: parentProfile.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ message: `Marked ${result.count} notifications as read` });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};

const sendMessageToTeacher = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId, subject, message } = req.body;

    if (!studentId || !subject || !message) {
      return res.status(400).json({
        error: "Student ID, subject, and message are required",
      });
    }

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          where: { id: studentId, isActive: true },
          include: {
            class: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return res.status(403).json({
        error: "Access denied - student not found or not your child",
      });
    }

    const student = parentProfile.children[0];
    if (!student.class.teacher) {
      return res.status(400).json({
        error: "No teacher assigned to this class",
      });
    }

    const newMessage = await prisma.parentMessage.create({
      data: {
        parentId: parentProfile.id,
        teacherId: student.class.teacher.id,
        studentId: student.id,
        subject,
        message,
      },
      include: {
        student: {
          select: {
            name: true,
            rollNumber: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message to teacher:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, studentId } = req.query;

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!parentProfile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    const whereClause = {
      parentId: parentProfile.id,
      ...(studentId && { studentId }),
    };

    const [messages, totalCount] = await Promise.all([
      prisma.parentMessage.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              name: true,
              rollNumber: true,
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          replies: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.parentMessage.count({
        where: whereClause,
      }),
    ]);

    res.json({
      messages,
      totalCount,
      hasMore: parseInt(offset) + messages.length < totalCount,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId, month, year } = req.query;

    if (!studentId || !month || !year) {
      return res.status(400).json({
        error: "Student ID, month, and year are required",
      });
    }

    // Verify this student belongs to the logged-in parent
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          where: { id: studentId, isActive: true },
        },
      },
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      return res.status(403).json({
        error: "Access denied - student not found or not your child",
      });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: {
          select: {
            name: true,
            rollNumber: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(
      (record) => record.status === "PRESENT"
    ).length;
    const absentDays = attendance.filter(
      (record) => record.status === "ABSENT"
    ).length;
    const lateDays = attendance.filter(
      (record) => record.status === "LATE"
    ).length;
    const excusedDays = attendance.filter(
      (record) => record.status === "EXCUSED"
    ).length;
    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      student: parentProfile.children[0],
      month: parseInt(month),
      year: parseInt(year),
      attendance,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendancePercentage,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    res.status(500).json({ error: "Failed to fetch attendance report" });
  }
};

// Update push token for parent
const updatePushToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pushToken, platform } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    // Find parent profile
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId }
    });

    if (!parentProfile) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    // Update or create push token record
    await prisma.parentProfile.update({
      where: { userId },
      data: {
        pushToken: pushToken,
        pushTokenPlatform: platform || 'unknown',
        pushTokenUpdatedAt: new Date()
      }
    });

    console.log(`Push token updated for parent ${parentProfile.id}: ${pushToken}`);
    
    res.json({ 
      message: 'Push token updated successfully',
      success: true 
    });

  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ error: 'Failed to update push token' });
  }
};

module.exports = {
  getMyChildren,
  getChildAttendance,
  getAttendanceSummary,
  getChildTodayAttendance,
  updateProfile,
  getProfile,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendMessageToTeacher,
  getMessages,
  getAttendanceReport,
  updatePushToken,
};
