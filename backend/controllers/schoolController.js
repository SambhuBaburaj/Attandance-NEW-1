const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllSchools = async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: { classes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};

const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            teacher: {
              include: { user: true }
            },
            _count: {
              select: { students: true }
            }
          }
        },
        _count: {
          select: { classes: true }
        }
      }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json(school);
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
};

const createSchool = async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      email,
      principalName,
      establishedYear,
      website
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    const school = await prisma.school.create({
      data: {
        name,
        address,
        phone,
        email,
        principalName,
        establishedYear,
        website,
        isActive: true
      }
    });

    res.status(201).json(school);
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ error: 'Failed to create school' });
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      phone,
      email,
      principalName,
      establishedYear,
      website,
      isActive
    } = req.body;

    const school = await prisma.school.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        email,
        principalName,
        establishedYear,
        website,
        isActive
      }
    });

    res.json(school);
  } catch (error) {
    console.error('Error updating school:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'School not found' });
    }
    res.status(500).json({ error: 'Failed to update school' });
  }
};

const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if school has classes
    const classCount = await prisma.class.count({
      where: { schoolId: id }
    });

    if (classCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete school with existing classes. Please delete or reassign classes first.' 
      });
    }

    await prisma.school.delete({
      where: { id }
    });

    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'School not found' });
    }
    res.status(500).json({ error: 'Failed to delete school' });
  }
};

const getSchoolStats = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            students: true,
            teacher: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const totalClasses = school.classes.length;
    const totalStudents = school.classes.reduce((sum, cls) => sum + cls.students.length, 0);
    const totalTeachers = school.classes.filter(cls => cls.teacher).length;
    const activeClasses = school.classes.filter(cls => cls.isActive).length;

    // Get attendance stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: thirtyDaysAgo
        },
        class: {
          schoolId: id
        }
      },
      _count: {
        status: true
      }
    });

    const stats = {
      totalClasses,
      totalStudents,
      totalTeachers,
      activeClasses,
      attendanceStats: attendanceStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching school stats:', error);
    res.status(500).json({ error: 'Failed to fetch school stats' });
  }
};

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats
};