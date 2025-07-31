const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllClasses = async (req, res) => {
  try {
    console.log("Fetching all classes");
    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        students: true,
        _count: {
          select: { students: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
};

const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        students: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }

    res.json(classData);
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({ error: "Failed to fetch class" });
  }
};

const createClass = async (req, res) => {
  try {
    console.log("Creating a new class");
    const { name, grade, section, capacity, teacherId, description, roomNumber } =
      req.body;

    if (!name || !grade) {
      return res
        .status(400)
        .json({ error: "Name and grade are required" });
    }

    console.log("Creating class with data:", req.body);
    const newClass = await prisma.class.create({
      data: {
        name,
        grade,
        section: section || "A",
        capacity: capacity || 30,
        teacherId: teacherId || null,
        description: description || null,
        roomNumber: roomNumber || null,
        isActive: true,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ error: "Failed to create class" });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, section, capacity, teacherId, description, roomNumber, isActive } = req.body;

    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(grade && { grade }),
        ...(section && { section }),
        ...(capacity && { capacity }),
        ...(teacherId !== undefined && { teacherId }),
        ...(description !== undefined && { description }),
        ...(roomNumber !== undefined && { roomNumber }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        students: true,
      },
    });

    res.json(updatedClass);
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ error: "Failed to update class" });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });

    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    if (existingClass.students.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete class with enrolled students. Please reassign students first.",
      });
    }

    await prisma.class.delete({
      where: { id },
    });

    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ error: "Failed to delete class" });
  }
};

const getAvailableTeachers = async (req, res) => {
  try {
    console.log("coming here");
    const teachers = await prisma.teacherProfile.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: true,
        classes: true,
      },
    });

    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getAvailableTeachers,
};
