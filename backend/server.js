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
// const schoolRoutes = require("./routes/schools");
// const teacherRoutes = require("./routes/teachers");
// const reportRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 5000;
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
// app.use("/api/schools", schoolRoutes);
// app.use("/api/teachers", teacherRoutes);
// app.use("/api/reports", reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
