
const API = "/api";

// Common API request function
async function request(url, options = {}) {
    const response = await fetch(API + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function showMessage(message) {
    alert(message);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ---------------- STUDENTS ----------------

async function loadStudents() {
    try {
        const students = await request("/students");

        document.getElementById("totalStudents").textContent =
            students.length;

        const list = document.getElementById("studentList");
        const search = document.getElementById("studentSearch")
            .value.toLowerCase();

        list.innerHTML = "";

        students.filter(s =>
            s.name.toLowerCase().includes(search) ||
            s.rollNumber.toLowerCase().includes(search)
        ).forEach(student => {
            list.innerHTML += `
                <tr>
                    <td>${escapeHTML(student.name)}</td>
                    <td>${escapeHTML(student.rollNumber)}</td>
                    <td>${escapeHTML(student.department)}</td>
                    <td>${escapeHTML(student.year)}</td>
                    <td>
                        <button onclick="deleteStudent('${student.id}')">
                            Delete
                        </button>
                    </td>
                </tr>`;
        });

    } catch (error) {
        showMessage(error.message);
    }
}

document.getElementById("studentForm").addEventListener("submit", async e => {
    e.preventDefault();

    const student = {
        name: document.getElementById("studentName").value,
        rollNumber: document.getElementById("rollNumber").value,
        department: document.getElementById("department").value,
        year: document.getElementById("year").value,
        dateOfBirth: document.getElementById("dateOfBirth").value
    };

    try {
        await request("/students", {
            method: "POST",
            body: JSON.stringify(student)
        });

        showMessage("Student added successfully!");
        e.target.reset();
        loadStudents();
    } catch (error) {
        showMessage(error.message);
    }
});

async function deleteStudent(id) {
    if (!confirm("Delete this student?")) return;

    try {
        await request("/students/" + id, { method: "DELETE" });
        loadStudents();
    } catch (error) {
        showMessage(error.message);
    }
}

document.getElementById("studentSearch")
    .addEventListener("input", loadStudents);

// ---------------- EXAMINATIONS ----------------

async function loadExams() {
    try {
        const exams = await request("/exams");

        document.getElementById("totalExams").textContent =
            exams.length;

        const list = document.getElementById("examList");
        const select = document.getElementById("ticketExam");

        list.innerHTML = "";
        select.innerHTML = '<option value="">Select Examination</option>';

        exams.forEach(exam => {
            list.innerHTML += `
                <tr>
                    <td>${escapeHTML(exam.subject)}</td>
                    <td>${escapeHTML(exam.examDate)}</td>
                    <td>${escapeHTML(exam.examTime)}</td>
                    <td>${escapeHTML(exam.room)}</td>
                    <td>
                        <button onclick="deleteExam('${exam.id}')">
                            Delete
                        </button>
                    </td>
                </tr>`;

            select.innerHTML += `
                <option value="${escapeHTML(exam.id)}">
                    ${escapeHTML(exam.subject)} - ${escapeHTML(exam.examDate)}
                </option>`;
        });

    } catch (error) {
        showMessage(error.message);
    }
}

document.getElementById("examForm").addEventListener("submit", async e => {
    e.preventDefault();

    const exam = {
        subject: document.getElementById("subject").value,
        examDate: document.getElementById("examDate").value,
        examTime: document.getElementById("examTime").value,
        room: document.getElementById("room").value
    };

    try {
        await request("/exams", {
            method: "POST",
            body: JSON.stringify(exam)
        });

        showMessage("Examination added successfully!");
        e.target.reset();
        loadExams();
    } catch (error) {
        showMessage(error.message);
    }
});

async function deleteExam(id) {
    if (!confirm("Delete this examination?")) return;

    try {
        await request("/exams/" + id, { method: "DELETE" });
        loadExams();
    } catch (error) {
        showMessage(error.message);
    }
}

// ---------------- HALL TICKETS ----------------

// Generate hall ticket
document.getElementById("ticketForm").addEventListener("submit", async e => {
    e.preventDefault();

    const ticket = {
        rollNumber: document.getElementById("ticketRollNumber").value,
        examId: document.getElementById("ticketExam").value
    };

    try {
        await request("/halltickets", {
            method: "POST",
            body: JSON.stringify(ticket)
        });

        showMessage("Hall ticket generated successfully!");
        e.target.reset();
        loadDashboard();
    } catch (error) {
        showMessage(error.message);
    }
});

// Search hall ticket
document.getElementById("ticketSearchForm")
    .addEventListener("submit", async e => {
        e.preventDefault();

        const roll = document.getElementById("searchTicketRoll").value.trim();

        try {
            const tickets = await request(
                "/halltickets/" + encodeURIComponent(roll)
            );

            displayTickets(tickets);
        } catch (error) {
            document.getElementById("ticketResult").innerHTML = "";
            showMessage(error.message);
        }
    });

function displayTickets(tickets) {
    const result = document.getElementById("ticketResult");

    result.innerHTML = tickets.map(ticket => `
        <div class="hall-ticket">
            <h3>EXAMINATION HALL TICKET</h3>
            <hr>
            <p><strong>Student Name:</strong> ${escapeHTML(ticket.studentName)}</p>
            <p><strong>Roll Number:</strong> ${escapeHTML(ticket.rollNumber)}</p>
            <p><strong>Department:</strong> ${escapeHTML(ticket.department)}</p>
            <p><strong>Year:</strong> ${escapeHTML(ticket.year)}</p>
            <p><strong>Subject:</strong> ${escapeHTML(ticket.subject)}</p>
            <p><strong>Exam Date:</strong> ${escapeHTML(ticket.examDate)}</p>
            <p><strong>Exam Time:</strong> ${escapeHTML(ticket.examTime)}</p>
            <p><strong>Exam Room:</strong> ${escapeHTML(ticket.room)}</p>
            <hr>
            <p>Student Signature: __________________</p>
            <p>Authorized Signature: _______________</p>
            <button onclick="window.print()">Download / Print Hall Ticket</button>
        </div>
    `).join("");
}

// ---------------- FEE PAYMENTS ----------------

document.getElementById("paymentForm").addEventListener("submit", async e => {
    e.preventDefault();

    const payment = {
        rollNumber: document.getElementById("paymentRoll").value,
        amount: document.getElementById("paymentAmount").value,
        purpose: document.getElementById("paymentPurpose").value,
        paymentDate: document.getElementById("paymentDate").value
    };

    try {
        await request("/payments", {
            method: "POST",
            body: JSON.stringify(payment)
        });

        showMessage("Payment record saved successfully!");
        e.target.reset();
        loadDashboard();
    } catch (error) {
        showMessage(error.message);
    }
});

// Search fee history
document.getElementById("paymentSearchForm")
    .addEventListener("submit", async e => {
        e.preventDefault();

        const roll = document.getElementById("searchPaymentRoll").value.trim();

        try {
            const payments = await request(
                "/payments/" + encodeURIComponent(roll)
            );

            const list = document.getElementById("paymentList");
            list.innerHTML = "";

            payments.forEach(payment => {
                list.innerHTML += `
                    <tr>
                        <td>${escapeHTML(payment.studentName)}</td>
                        <td>${escapeHTML(payment.rollNumber)}</td>
                        <td>₹${Number(payment.amount).toFixed(2)}</td>
                        <td>${escapeHTML(payment.purpose)}</td>
                        <td>${escapeHTML(payment.paymentDate)}</td>
                        <td>${escapeHTML(payment.status)}</td>
                    </tr>`;
            });

            if (payments.length === 0) {
                list.innerHTML =
                    '<tr><td colspan="6">No payment records found.</td></tr>';
            }
        } catch (error) {
            showMessage(error.message);
        }
    });

// ---------------- RESULTS ----------------

async function loadResults() {
    try {
        const results = await request("/results");
        const list = document.getElementById("resultList");

        list.innerHTML = "";

        results.forEach(result => {
            list.innerHTML += `
                <tr>
                    <td>${escapeHTML(result.studentName)}</td>
                    <td>${escapeHTML(result.rollNumber)}</td>
                    <td>${escapeHTML(result.subject)}</td>
                    <td>${escapeHTML(result.marks)}</td>
                    <td>${escapeHTML(result.grade)}</td>
                    <td>
                        <button onclick="deleteResult('${result.id}')">
                            Delete
                        </button>
                    </td>
                </tr>`;
        });

    } catch (error) {
        showMessage(error.message);
    }
}

document.getElementById("resultForm").addEventListener("submit", async e => {
    e.preventDefault();

    const result = {
        rollNumber: document.getElementById("resultRoll").value,
        subject: document.getElementById("resultSubject").value,
        marks: document.getElementById("marks").value,
        grade: document.getElementById("grade").value
    };

    try {
        await request("/results", {
            method: "POST",
            body: JSON.stringify(result)
        });

        showMessage("Result added successfully!");
        e.target.reset();
        loadResults();
    } catch (error) {
        showMessage(error.message);
    }
});

async function deleteResult(id) {
    if (!confirm("Delete this result?")) return;

    try {
        await request("/results/" + id, { method: "DELETE" });
        loadResults();
    } catch (error) {
        showMessage(error.message);
    }
}

// ---------------- DASHBOARD ----------------

async function loadDashboard() {
    try {
        const [students, exams, tickets, payments] = await Promise.all([
            request("/students"),
            request("/exams"),
            request("/halltickets"),
            request("/payments")
        ]);

        document.getElementById("totalStudents").textContent =
            students.length;

        document.getElementById("totalExams").textContent =
            exams.length;

        document.getElementById("totalTickets").textContent =
            tickets.length;

        document.getElementById("totalPayments").textContent =
            payments.length;

    } catch (error) {
        console.error(error);
    }
}

// Load all records when the website opens
async function initializeApp() {
    await Promise.all([
        loadStudents(),
        loadExams(),
        loadResults()
    ]);

    await loadDashboard();
}

initializeApp();
