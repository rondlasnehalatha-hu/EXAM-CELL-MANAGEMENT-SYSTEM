
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const dataFolder = path.join(__dirname, "data");

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------------- DATA FUNCTIONS ----------------

function getData(file) {
    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder, { recursive: true });
    }

    const filePath = path.join(dataFolder, file);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]");
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveData(file, data) {
    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder, { recursive: true });
    }

    const filePath = path.join(dataFolder, file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------------- STUDENTS ----------------

// Get all students
app.get("/api/students", (req, res) => {
    res.json(getData("students.json"));
});

// Add student
app.post("/api/students", (req, res) => {
    const { name, rollNumber, department, year, dateOfBirth } = req.body;

    if (
        !name?.trim() ||
        !rollNumber?.trim() ||
        !department?.trim() ||
        !year?.trim() ||
        !dateOfBirth
    ) {
        return res.status(400).json({
            message: "Please fill all student details."
        });
    }

    const students = getData("students.json");

    const roll = rollNumber.trim();

    if (students.some(s => s.rollNumber.toLowerCase() === roll.toLowerCase())) {
        return res.status(400).json({
            message: "Roll number already exists."
        });
    }

    const student = {
        id: Date.now().toString(),
        name: name.trim(),
        rollNumber: roll,
        department: department.trim(),
        year: year.trim(),
        dateOfBirth
    };

    students.push(student);
    saveData("students.json", students);

    res.status(201).json(student);
});

// Delete student
app.delete("/api/students/:id", (req, res) => {
    const students = getData("students.json");
    const updated = students.filter(s => s.id !== req.params.id);

    if (students.length === updated.length) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    saveData("students.json", updated);

    res.json({ message: "Student deleted successfully." });
});

// ---------------- EXAMINATIONS ----------------

// Get all examinations
app.get("/api/exams", (req, res) => {
    res.json(getData("exams.json"));
});

// Add examination
app.post("/api/exams", (req, res) => {
    const { subject, examDate, examTime, room } = req.body;

    if (
        !subject?.trim() ||
        !examDate ||
        !examTime ||
        !room?.trim()
    ) {
        return res.status(400).json({
            message: "Please fill all examination details."
        });
    }

    const exams = getData("exams.json");

    const exam = {
        id: Date.now().toString(),
        subject: subject.trim(),
        examDate,
        examTime,
        room: room.trim()
    };

    exams.push(exam);
    saveData("exams.json", exams);

    res.status(201).json(exam);
});

// Delete examination
app.delete("/api/exams/:id", (req, res) => {
    const exams = getData("exams.json");
    const updated = exams.filter(e => e.id !== req.params.id);

    if (exams.length === updated.length) {
        return res.status(404).json({
            message: "Examination not found."
        });
    }

    saveData("exams.json", updated);

    res.json({ message: "Examination deleted successfully." });
});

// ---------------- HALL TICKETS ----------------

// Get all hall tickets (dashboard)
app.get("/api/halltickets", (req, res) => {
    res.json(getData("halltickets.json"));
});

// Generate hall ticket
app.post("/api/halltickets", (req, res) => {
    const { rollNumber, examId } = req.body;

    if (!rollNumber?.trim() || !examId) {
        return res.status(400).json({
            message: "Enter roll number and examination."
        });
    }

    const students = getData("students.json");
    const exams = getData("exams.json");
    const tickets = getData("halltickets.json");

    const student = students.find(
        s => s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
    );

    if (!student) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    const exam = exams.find(e => e.id === examId);

    if (!exam) {
        return res.status(404).json({
            message: "Examination not found."
        });
    }

    const existing = tickets.find(
        t => t.rollNumber.toLowerCase() === student.rollNumber.toLowerCase()
          && t.examId === exam.id
    );

    if (existing) {
        return res.status(400).json({
            message: "Hall ticket already generated for this examination."
        });
    }

    const ticket = {
        id: Date.now().toString(),
        hallTicketNumber: "HT" + Date.now(),
        rollNumber: student.rollNumber,
        studentName: student.name,
        department: student.department,
        year: student.year,
        examId: exam.id,
        subject: exam.subject,
        examDate: exam.examDate,
        examTime: exam.examTime,
        room: exam.room
    };

    tickets.push(ticket);
    saveData("halltickets.json", tickets);

    res.status(201).json(ticket);
});

// Search hall ticket by roll number
app.get("/api/halltickets/:rollNumber", (req, res) => {
    const tickets = getData("halltickets.json");

    const studentTickets = tickets.filter(
        t => t.rollNumber.toLowerCase() ===
             req.params.rollNumber.toLowerCase()
    );

    if (studentTickets.length === 0) {
        return res.status(404).json({
            message: "No hall tickets found for this roll number."
        });
    }

    res.json(studentTickets);
});

// ---------------- FEE PAYMENTS ----------------

// Get all payments (dashboard)
app.get("/api/payments", (req, res) => {
    res.json(getData("payments.json"));
});

// Record fee payment
app.post("/api/payments", (req, res) => {
    const { rollNumber, amount, purpose, paymentDate } = req.body;

    if (
        !rollNumber?.trim() ||
        amount === undefined ||
        amount === "" ||
        !purpose?.trim() ||
        !paymentDate
    ) {
        return res.status(400).json({
            message: "Please fill all payment details."
        });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({
            message: "Enter a valid payment amount."
        });
    }

    const students = getData("students.json");

    const student = students.find(
        s => s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
    );

    if (!student) {
        return res.status(404).json({
            message: "Student roll number not found."
        });
    }

    const payments = getData("payments.json");

    const payment = {
        id: Date.now().toString(),
        receiptNumber: "RCPT" + Date.now(),
        rollNumber: student.rollNumber,
        studentName: student.name,
        amount: paymentAmount,
        purpose: purpose.trim(),
        paymentDate,
        status: "Recorded"
    };

    payments.push(payment);
    saveData("payments.json", payments);

    res.status(201).json(payment);
});

// Search payment history by roll number
app.get("/api/payments/:rollNumber", (req, res) => {
    const payments = getData("payments.json");

    const history = payments.filter(
        p => p.rollNumber.toLowerCase() ===
             req.params.rollNumber.toLowerCase()
    );

    res.json(history);
});

// ---------------- RESULTS ----------------

// Get all results
app.get("/api/results", (req, res) => {
    res.json(getData("results.json"));
});

// Add result
app.post("/api/results", (req, res) => {
    const { rollNumber, subject, marks, grade } = req.body;

    if (
        !rollNumber?.trim() ||
        !subject?.trim() ||
        marks === undefined ||
        marks === "" ||
        !grade?.trim()
    ) {
        return res.status(400).json({
            message: "Please fill all result details."
        });
    }

    const markValue = Number(marks);

    if (!Number.isFinite(markValue) || markValue < 0 || markValue > 100) {
        return res.status(400).json({
            message: "Marks must be between 0 and 100."
        });
    }

    const students = getData("students.json");

    const student = students.find(
        s => s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
    );

    if (!student) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    const results = getData("results.json");

    const result = {
        id: Date.now().toString(),
        rollNumber: student.rollNumber,
        studentName: student.name,
        subject: subject.trim(),
        marks: markValue,
        grade: grade.trim()
    };

    results.push(result);
    saveData("results.json", results);

    res.status(201).json(result);
});

// Delete result
app.delete("/api/results/:id", (req, res) => {
    const results = getData("results.json");
    const updated = results.filter(r => r.id !== req.params.id);

    if (results.length === updated.length) {
        return res.status(404).json({
            message: "Result not found."
        });
    }

    saveData("results.json", updated);

    res.json({ message: "Result deleted successfully." });
});

// ---------------- START SERVER ----------------

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Exam Cell Management System running on port ${PORT}`);
});

