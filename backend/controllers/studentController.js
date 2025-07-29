const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const getAllStudents = async (req, res) => {
  try {
    const { classId } = req.query;
    
    const whereClause = classId ? { classId } : {};
    
    const students = await prisma.student.findMany({
      where: {
        ...whereClause,
        isActive: true
      },
      include: {
        class: {
          include: {
            school: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        },
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
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            school: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        },
        parent: {
          include: {
            user: true
          }
        },
        attendance: {
          orderBy: {
            date: 'desc'
          },
          take: 30
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

const createStudent = async (req, res) => {
  try {
    const { 
      name, 
      rollNumber, 
      dateOfBirth, 
      gender, 
      address, 
      phone, 
      email, 
      classId, 
      parentId,
      admissionDate,
      bloodGroup,
      medicalConditions,
      profilePicture,
      // Parent information for new parent creation
      parentInfo
    } = req.body;

    if (!name || !rollNumber || !classId) {
      return res.status(400).json({ 
        error: 'Name, roll number, and class ID are required' 
      });
    }

    // If parentInfo is provided, create new parent; otherwise use existing parentId
    if (!parentId && !parentInfo) {
      return res.status(400).json({ 
        error: 'Either parent ID or parent information is required' 
      });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { rollNumber }
    });

    if (existingStudent) {
      return res.status(400).json({ 
        error: 'Student with this roll number already exists' 
      });
    }

    const classExists = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classExists) {
      return res.status(400).json({ error: 'Class not found' });
    }

    let finalParentId = parentId;

    // Create new parent if parentInfo is provided
    if (parentInfo) {
      const { parentName, parentEmail, parentPhone, parentAddress, occupation, emergencyContact } = parentInfo;
      
      if (!parentName || !parentEmail) {
        return res.status(400).json({ 
          error: 'Parent name and email are required' 
        });
      }

      // Check if parent email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: parentEmail }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'A user with this email already exists' 
        });
      }

      // Create parent user and profile in a transaction
      const parentCreation = await prisma.$transaction(async (prisma) => {
        // Create user for parent
        const parentUser = await prisma.user.create({
          data: {
            email: parentEmail,
            password: await bcrypt.hash('123456', 12), // Default password: 123456
            name: parentName,
            role: 'PARENT'
          }
        });

        // Create parent profile
        const parentProfile = await prisma.parentProfile.create({
          data: {
            userId: parentUser.id,
            phone: parentPhone,
            address: parentAddress,
            occupation: occupation,
            emergencyContact: emergencyContact
          }
        });

        return parentProfile;
      });

      finalParentId = parentCreation.id;
    } else {
      // Verify existing parent exists
      const parentExists = await prisma.parentProfile.findUnique({
        where: { id: parentId }
      });

      if (!parentExists) {
        return res.status(400).json({ error: 'Parent not found' });
      }
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        rollNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        phone,
        email,
        classId,
        parentId: finalParentId,
        admissionDate: admissionDate ? new Date(admissionDate) : null,
        bloodGroup,
        medicalConditions,
        profilePicture,
        isActive: true
      },
      include: {
        class: {
          include: {
            school: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        },
        parent: {
          include: {
            user: true
          }
        }
      }
    });

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      rollNumber, 
      dateOfBirth, 
      gender, 
      address, 
      phone, 
      email, 
      classId, 
      parentId,
      admissionDate,
      bloodGroup,
      medicalConditions,
      profilePicture,
      isActive 
    } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id }
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (rollNumber && rollNumber !== existingStudent.rollNumber) {
      const duplicateRollNumber = await prisma.student.findUnique({
        where: { rollNumber }
      });

      if (duplicateRollNumber) {
        return res.status(400).json({ 
          error: 'Student with this roll number already exists' 
        });
      }
    }

    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!classExists) {
        return res.status(400).json({ error: 'Class not found' });
      }
    }

    if (parentId) {
      const parentExists = await prisma.parentProfile.findUnique({
        where: { id: parentId }
      });

      if (!parentExists) {
        return res.status(400).json({ error: 'Parent not found' });
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(rollNumber && { rollNumber }),
        ...(dateOfBirth !== undefined && { 
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null 
        }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(classId && { classId }),
        ...(parentId && { parentId }),
        ...(admissionDate !== undefined && { 
          admissionDate: admissionDate ? new Date(admissionDate) : null 
        }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(medicalConditions !== undefined && { medicalConditions }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        class: {
          include: {
            school: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        },
        parent: {
          include: {
            user: true
          }
        }
      }
    });

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const existingStudent = await prisma.student.findUnique({
      where: { id }
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.student.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating student:', error);
    res.status(500).json({ error: 'Failed to deactivate student' });
  }
};

const getAvailableParents = async (req, res) => {
  try {
    const parents = await prisma.parentProfile.findMany({
      include: {
        user: true,
        children: true
      }
    });

    res.json(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ error: 'Failed to fetch parents' });
  }
};

const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
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

    res.json(students);
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getAvailableParents,
  getStudentsByClass
};