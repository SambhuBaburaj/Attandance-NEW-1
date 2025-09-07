const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await prisma.teacherProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        classes: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        },
        _count: {
          select: { classes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        classes: {
          include: {
            students: true,
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
};

const createTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      phone,
      address,
      qualification,
      experience,
      salary,
      joiningDate
    } = req.body;

    if (!name || !email || !password || !employeeId) {
      return res.status(400).json({ 
        error: 'Name, email, password, and employee ID are required' 
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if employee ID already exists
    const existingTeacher = await prisma.teacherProfile.findUnique({
      where: { employeeId }
    });

    if (existingTeacher) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and teacher profile in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'TEACHER'
        }
      });

      const teacher = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          employeeId,
          phone,
          address,
          qualification,
          experience: experience ? parseInt(experience) : null,
          salary: salary ? parseFloat(salary) : null,
          joiningDate: joiningDate ? new Date(joiningDate) : null,
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        }
      });

      return teacher;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      employeeId,
      phone,
      address,
      qualification,
      experience,
      salary,
      joiningDate,
      isActive
    } = req.body;

    // Get the teacher with user info
    const existingTeacher = await prisma.teacherProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingTeacher.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Check if employee ID is being changed and if it already exists
    if (employeeId && employeeId !== existingTeacher.employeeId) {
      const existingTeacherWithId = await prisma.teacherProfile.findUnique({
        where: { employeeId }
      });

      if (existingTeacherWithId) {
        return res.status(400).json({ error: 'Employee ID already exists' });
      }
    }

    // Update user and teacher profile in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update user
      await prisma.user.update({
        where: { id: existingTeacher.userId },
        data: {
          name,
          email
        }
      });

      // Update teacher profile
      const teacher = await prisma.teacherProfile.update({
        where: { id },
        data: {
          employeeId,
          phone,
          address,
          qualification,
          experience: experience ? parseInt(experience) : null,
          salary: salary ? parseFloat(salary) : null,
          joiningDate: joiningDate ? new Date(joiningDate) : null,
          isActive
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        }
      });

      return teacher;
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating teacher:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.status(500).json({ error: 'Failed to update teacher' });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the teacher with user info
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id },
      include: { 
        user: true,
        classes: true
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if teacher has assigned classes
    if (teacher.classes.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete teacher with assigned classes. Please unassign classes first.' 
      });
    }

    // Delete teacher profile and user in a transaction
    await prisma.$transaction(async (prisma) => {
      await prisma.teacherProfile.delete({
        where: { id }
      });

      await prisma.user.delete({
        where: { id: teacher.userId }
      });
    });

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};

const getTeacherClasses = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            students: true,
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher.classes);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ error: 'Failed to fetch teacher classes' });
  }
};

const assignTeacherToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Check if teacher exists
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if class exists
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if class already has a teacher
    if (classObj.teacherId) {
      return res.status(400).json({ error: 'Class already has a teacher assigned' });
    }

    // Assign teacher to class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { teacherId: id }
    });

    res.json({ message: 'Teacher assigned to class successfully', class: updatedClass });
  } catch (error) {
    console.error('Error assigning teacher to class:', error);
    res.status(500).json({ error: 'Failed to assign teacher to class' });
  }
};

const unassignTeacherFromClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Check if class exists and is assigned to this teacher
    const classObj = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (classObj.teacherId !== id) {
      return res.status(400).json({ error: 'Class is not assigned to this teacher' });
    }

    // Unassign teacher from class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { teacherId: null }
    });

    res.json({ message: 'Teacher unassigned from class successfully', class: updatedClass });
  } catch (error) {
    console.error('Error unassigning teacher from class:', error);
    res.status(500).json({ error: 'Failed to unassign teacher from class' });
  }
};

// Get current teacher's profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        classes: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    if (!teacherProfile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    res.json(teacherProfile);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ error: 'Failed to fetch teacher profile' });
  }
};

// Update current teacher's profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phone,
      address,
      qualification,
      experience
    } = req.body;

    // Get existing profile
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!existingProfile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    // Update in transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update user info
      if (name) {
        await prisma.user.update({
          where: { id: userId },
          data: { name }
        });
      }

      // Update teacher profile
      const updatedProfile = await prisma.teacherProfile.update({
        where: { userId },
        data: {
          phone,
          address,
          qualification,
          experience: experience ? parseInt(experience) : null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        }
      });

      return updatedProfile;
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({ error: 'Failed to update teacher profile' });
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  assignTeacherToClass,
  unassignTeacherFromClass,
  getProfile,
  updateProfile
};