const { PrismaClient } = require("@prisma/client");
const whatsappService = require("./whatsappService");
const prisma = new PrismaClient();

// Helper function to send notifications for absent students
const sendAbsentNotifications = async (attendanceResults, classId, date) => {
  try {
    // Filter absent students (status = 'ABSENT')
    const absentStudents = attendanceResults.filter(
      (record) => record.status === 'ABSENT'
    );

    if (absentStudents.length === 0) {
      console.log("No absent students to notify.");
      return;
    }

    // Get class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true, grade: true, section: true },
    });

    const className = classInfo
      ? `${classInfo.name} (Grade ${classInfo.grade}, Section ${classInfo.section})`
      : "Unknown Class";

    // Format date for display
    const dateStr = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prepare notification data and create in-app notifications
    const notificationData = [];
    for (const record of absentStudents) {
      const student = record.student;
      const parent = student.parent;
      
      // Get parent phone number
      const parentPhone = parent?.phone || parent?.user?.phone || student.phone;

      // Create in-app notification
      try {
        await prisma.parentNotification.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            type: 'ABSENCE',
            title: `${student.name} was absent today`,
            message: `Your child ${student.name} was marked absent in ${className} on ${dateStr}.${record.remarks ? ` Remarks: ${record.remarks}` : ''}`,
          }
        });
        console.log(`In-app notification created for parent of ${student.name}`);
      } catch (dbError) {
        console.error(`Failed to create in-app notification for ${student.name}:`, dbError);
      }

      // Prepare WhatsApp notification data
      if (parentPhone && parent.whatsappOptIn) {
        notificationData.push({
          studentId: student.id,
          studentName: student.name,
          parentPhone: parentPhone,
          className: className,
          date: dateStr,
          remarks: record.remarks,
        });
      } else {
        if (!parentPhone) {
          console.warn(`No phone number found for parent of student: ${student.name}`);
        }
        if (!parent.whatsappOptIn) {
          console.log(`Parent of ${student.name} has opted out of WhatsApp notifications`);
        }
      }
    }

    // Send WhatsApp notifications if any parents opted in
    if (notificationData.length > 0) {
      try {
        const result = await whatsappService.sendBulkAbsentNotifications(
          notificationData
        );

        console.log(`WhatsApp notifications sent:`);
        console.log(`- Successful: ${result.sentCount}`);
        console.log(`- Failed: ${result.errorCount}`);

        if (result.errors.length > 0) {
          console.error("WhatsApp notification errors:", result.errors);
        }
      } catch (whatsappError) {
        console.error("Error sending WhatsApp notifications:", whatsappError);
      }
    }

    console.log(`Absence notifications processed for ${absentStudents.length} students`);
    console.log(`- In-app notifications: ${absentStudents.length}`);
    console.log(`- WhatsApp notifications: ${notificationData.length}`);

  } catch (error) {
    console.error("Error sending absence notifications:", error);
    // Don't throw error to avoid breaking the attendance marking process
  }
};

module.exports = {
  sendAbsentNotifications,
};
