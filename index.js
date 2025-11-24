const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/config');
const cors = require('cors');
const app = express();

const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/Studentroutes');
const coursesRoutes = require('./src/routes/coursesroutes');
const admitcardRoutes = require('./src/routes/admitcardroutes');
const attendanceRoutes = require('./src/routes/attendenceroute');
const employeeRoutes = require('./src/routes/employeesroutes');
const sessionRoutes = require('./src/routes/session');
const accountRoutes = require('./src/routes/accountroutes');
const messageRoutes = require('./src/routes/messageroutes');
dotenv.config();

const PORT = process.env.PORT || 4001;
connectDB();
app.use(cors());
app.use(express.json());
app.use(express.static("public/Uploads"))


app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/admitcards', admitcardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/messages', messageRoutes);





app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});