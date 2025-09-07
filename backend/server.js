const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const classRoutes = require("./routes/classes");
const studentRoutes = require("./routes/students");
const attendanceRoutes = require("./routes/attendance");
const whatsappRoutes = require("./routes/whatsapp");
const parentRoutes = require("./routes/parents");
const notificationRoutes = require("./routes/notifications");
const teacherRoutes = require("./routes/teachers");
const reportRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3001;
console.log("fr9uhg");
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Attendance App Backend API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

// Test routes (development only)
if (process.env.NODE_ENV !== 'production') {
  const testRoutes = require("./routes/test");
  app.use("/api/test", testRoutes);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
