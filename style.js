// ===================================
// 1. LOAD SAVED DATA
// ===================================

let students = JSON.parse(
    localStorage.getItem("students")
) || [];

let courses = JSON.parse(
    localStorage.getItem("courses")
) || [];

let selectedCourseId = null;


// SAVE EVERYTHING
function saveData() {

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    localStorage.setItem(
        "courses",
        JSON.stringify(courses)
    );

}


// SAFE DISPLAY
function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

}


// ===================================
// 2. ADD STUDENT TO CENTRAL REGISTER
// ===================================

document.getElementById("studentForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    let name = document.getElementById("studentName").value.trim();

    let matric = document.getElementById("matricNumber").value.trim();

    let exists = students.some(student =>
        student.matric.toLowerCase() === matric.toLowerCase()
    );

    if (exists) {
        alert("This matric number already exists.");
        return;
    }

    let newStudent = {
        id: Date.now(),
        name: name,
        matric: matric
    };

    students.push(newStudent);

    // ADD NEW STUDENT TO ALL EXISTING COURSE REGISTERS
    courses.forEach(course => {

        course.attendance.push({

            studentId: newStudent.id,

            present: false

        });

    });

    saveData();

    document.getElementById("studentForm").reset();

    document.getElementById("studentMessage").textContent =
        "Student added successfully.";

    displayStudents();

    displayCourses();

    if (selectedCourseId !== null) {
        openCourse(selectedCourseId);
    }

    updateDashboard();

});


// ===================================
// 3. DISPLAY CENTRAL STUDENT REGISTER
// ===================================

function displayStudents() {

    let tbody = document.getElementById("registeredStudents");

    tbody.innerHTML = "";

    students.forEach((student, index) => {

        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.matric)}</td>
            </tr>
        `;

    });

}


// ===================================
// 4. CREATE NEW COURSE SESSION
// ===================================

document.getElementById("courseForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    let code = document.getElementById("courseCode").value.trim();

    let title = document.getElementById("courseTitle").value.trim();

    let date = document.getElementById("courseDate").value;

    if (students.length === 0) {

        alert("Register students before creating a course.");

        return;

    }

    let newCourse = {

        id: Date.now(),

        code: code,

        title: title,

        date: date,

        attendance: students.map(student => ({

            studentId: student.id,

            present: false

        }))

    };

    courses.unshift(newCourse);

    selectedCourseId = newCourse.id;

    saveData();

    document.getElementById("courseForm").reset();

    document.getElementById("courseDate").value =
        new Date().toLocaleDateString("en-CA");

    displayCourses();

    openCourse(newCourse.id);

    document.getElementById("courseMessage").textContent =
        "Course session created successfully.";

    updateDashboard();

});


// ===================================
// 5. DISPLAY COURSE CARDS
// ===================================

function displayCourses() {

    let container = document.getElementById("courseCards");

    container.innerHTML = "";

    if (courses.length === 0) {

        container.innerHTML =
            `<p class="empty">No course sessions created yet.</p>`;

        return;

    }

    courses.forEach(course => {

        let present = course.attendance.filter(
            item => item.present
        ).length;

        let card = document.createElement("div");

        card.className = "course-card";

        if (course.id === selectedCourseId) {
            card.classList.add("active");
        }

        card.innerHTML = `

            <h4>${escapeHTML(course.code)}</h4>

            <p>${escapeHTML(course.title)}</p>

            <p>Date: ${escapeHTML(course.date)}</p>

            <p>Present: ${present} / ${course.attendance.length}</p>

            <button type="button">Open Attendance</button>

        `;

        card.querySelector("button").addEventListener("click", () => {

            openCourse(course.id);

        });

        container.appendChild(card);

    });

}


// ===================================
// 6. OPEN SELECTED COURSE
// ===================================

function openCourse(id) {

    selectedCourseId = id;

    let course = courses.find(item => item.id === id);

    if (!course) return;

    document.getElementById("selectedCourse").textContent =
        course.code + " - " + course.title;

    document.getElementById("selectedDate").textContent =
        "Attendance date: " + course.date;

    let tbody = document.getElementById("attendanceList");

    tbody.innerHTML = "";

    students.forEach((student, index) => {

        // FIND THIS STUDENT'S STATUS IN THIS COURSE ONLY
        let record = course.attendance.find(
            item => item.studentId === student.id
        );

        if (!record) {

            record = {
                studentId: student.id,
                present: false
            };

            course.attendance.push(record);

        }

        let row = document.createElement("tr");

        row.innerHTML = `

            <td>${index + 1}</td>

            <td>${escapeHTML(student.name)}</td>

            <td>${escapeHTML(student.matric)}</td>

            <td>
                <input
                    type="checkbox"
                    class="attendance-checkbox"
                    data-id="${student.id}"
                    ${record.present ? "checked" : ""}
                >
            </td>

        `;

        tbody.appendChild(row);

    });


    // CONNECT EACH CHECKBOX TO ITS STUDENT
    document.querySelectorAll(".attendance-checkbox")
    .forEach(box => {

        box.addEventListener("change", function() {

            updateAttendance(
                Number(this.dataset.id),
                this.checked
            );

        });

    });

    displayCourses();

    updateCounts();

    updateDashboard();

}


// ===================================
// 7. UPDATE ATTENDANCE STATUS
// ===================================

function updateAttendance(studentId, status) {

    let course = courses.find(
        item => item.id === selectedCourseId
    );

    if (!course) return;

    let record = course.attendance.find(
        item => item.studentId === studentId
    );

    if (!record) return;

    record.present = status;

    saveData();

    updateCounts();

    displayCourses();

    updateDashboard();

}


// ===================================
// 8. COUNT PRESENT AND ABSENT
// ===================================

function updateCounts() {

    let course = courses.find(
        item => item.id === selectedCourseId
    );

    if (!course) return;

    let present = course.attendance.filter(
        item => item.present
    ).length;

    let absent = course.attendance.length - present;

    document.getElementById("presentCount").textContent =
        present;

    document.getElementById("absentCount").textContent =
        absent;

}


// ===================================
// 9. SAVE ATTENDANCE BUTTON
// ===================================

document.getElementById("saveButton")
.addEventListener("click", function() {

    if (selectedCourseId === null) {

        alert("Select a course first.");

        return;

    }

    saveData();

    alert("Attendance saved successfully.");

});


// ===================================
// 10. UPDATE DASHBOARD
// ===================================

function updateDashboard() {

    document.getElementById("studentTotal").textContent =
        students.length;

    document.getElementById("courseTotal").textContent =
        courses.length;

    let course = courses.find(
        item => item.id === selectedCourseId
    );

    let present = course
        ? course.attendance.filter(item => item.present).length
        : 0;

    document.getElementById("presentTotal").textContent =
        present;

}


// ===================================
// 11. INITIALIZE SYSTEM
// ===================================

function initializeSystem() {

    document.getElementById("courseDate").value =
        new Date().toLocaleDateString("en-CA");

    displayStudents();

    displayCourses();

    updateDashboard();

}

initializeSystem();