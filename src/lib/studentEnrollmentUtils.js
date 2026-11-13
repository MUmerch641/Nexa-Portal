import { dbFetch, dbSaveRecord, dbSaveList } from "@/lib/dbPersistence";

/**
 * Calculates 30-day recurring fee cycles for course students.
 * For a 3-month course, creates 3 distinct 30-day cycles with dates & balances.
 */
export function calculate30DayFeeCycles({
  studentId,
  enrollmentDate,
  totalFee = 0,
  submittedFee = 0,
  courseMonths = 3,
}) {
  const cycles = [];
  const total = Number(totalFee) || 0;
  let remainingPaidPool = Number(submittedFee) || 0;
  const cycleAmount = Math.round(total / courseMonths);

  const startDate = enrollmentDate ? new Date(enrollmentDate) : new Date();

  for (let i = 1; i <= courseMonths; i++) {
    const cycleStart = new Date(startDate);
    cycleStart.setDate(cycleStart.getDate() + (i - 1) * 30);

    const cycleEnd = new Date(startDate);
    cycleEnd.setDate(cycleEnd.getDate() + i * 30);

    const dueDate = new Date(cycleEnd);

    // Calculate paid and remaining amount for this cycle
    let paidAmount = 0;
    if (remainingPaidPool >= cycleAmount) {
      paidAmount = cycleAmount;
      remainingPaidPool -= cycleAmount;
    } else {
      paidAmount = remainingPaidPool;
      remainingPaidPool = 0;
    }

    const remainingAmount = Math.max(0, cycleAmount - paidAmount);
    let status = "Pending Due";
    if (remainingAmount === 0) {
      status = "Paid";
    } else if (new Date() > dueDate) {
      status = "Overdue";
    }

    cycles.push({
      id: `cyc_${studentId}_${i}`,
      student_id: studentId,
      cycle_number: i,
      cycle_start_date: cycleStart.toISOString().split("T")[0],
      cycle_end_date: cycleEnd.toISOString().split("T")[0],
      due_date: dueDate.toISOString().split("T")[0],
      amount: cycleAmount,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      status: status,
      created_at: new Date().toISOString(),
    });
  }

  return cycles;
}

/**
 * Check whether an email already belongs to an account across all system tables.
 */
export async function checkDuplicateAccountEmail(email) {
  if (!email || !email.trim()) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Check DB students, interns, and employees active records
  try {
    const students = await dbFetch("students").catch(() => []);
    const studentMatch = (students || []).find(
      (s) => s && (s.email || "").trim().toLowerCase() === cleanEmail
    );
    if (studentMatch) return true;

    const interns = await dbFetch("interns").catch(() => []);
    const internMatch = (interns || []).find(
      (i) => i && (i.email || "").trim().toLowerCase() === cleanEmail
    );
    if (internMatch) return true;

    const employees = await dbFetch("employees").catch(() => []);
    const empMatch = (employees || []).find(
      (e) => e && (e.email || "").trim().toLowerCase() === cleanEmail
    );
    if (empMatch) return true;
  } catch (e) {}

  return false;
}

/**
 * Enroll a student profile and fee schedule. Account credentials are created
 * only by the student through Supabase Auth; the admin grants the role later.
 */
export async function enrollStudentWithCredentials({ studentData }) {
  const cleanEmail = (studentData.email || "").trim().toLowerCase();
  const cleanName = (studentData.full_name || "").trim();
  if (!cleanEmail) throw new Error("Student email address is required.");
  if (!cleanName) throw new Error("Student full name is required.");
  if (await checkDuplicateAccountEmail(cleanEmail)) throw new Error("An account already exists with this email address.");

  const totalFee = Number(studentData.course_fee || studentData.total_fee || 25000);
  const submittedFee = Number(studentData.fee_paid || studentData.submitted_fee || 0);
  const remainingFee = Math.max(0, totalFee - submittedFee);
  const studentId = studentData.id || `s-${Date.now()}`;
  const enrollmentDate = studentData.start_date || new Date().toISOString().split("T")[0];
  const completionDate = new Date(new Date(enrollmentDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const studentProfile = {
    id: studentId, student_id: studentId, full_name: cleanName, student_name: cleanName, email: cleanEmail,
    phone: studentData.phone || "", emergency_contact: studentData.emergency_phone || studentData.emergency_contact || "",
    guardian_phone: studentData.guardian_phone || "", cnic: studentData.cnic || "",
    course_name: studentData.course_name || "Full Stack MERN Web Development", course: studentData.course_name || "Full Stack MERN Web Development",
    batch: studentData.batch || "Batch #14 (Morning)", total_fee: totalFee, course_fee: totalFee,
    submitted_fee: submittedFee, fee_paid: submittedFee, remaining_fee: remainingFee,
    enrollment_date: enrollmentDate, start_date: enrollmentDate, completion_date: completionDate, end_date: completionDate,
    role: "student", status: "active", fee_status: remainingFee === 0 ? "Paid" : "Pending Due", created_at: new Date().toISOString(),
  };
  const feeCycles = calculate30DayFeeCycles({ studentId, enrollmentDate, totalFee, submittedFee, courseMonths: 3 });
  await dbSaveRecord("students", studentProfile);
  await dbSaveList("student_fee_cycles", feeCycles);
  return { student: studentProfile, feeCycles, authUserId: null };
}

/**
 * Create an employee directory record. Staff create their own Supabase Auth
 * account and are assigned the employee role by an administrator.
 */
export async function registerEmployeeWithCredentials({ employeeData }) {
  const cleanEmail = (employeeData.email || "").trim().toLowerCase();
  const cleanName = (employeeData.full_name || "").trim();
  if (!cleanEmail) throw new Error("Employee email address is required.");
  if (!cleanName) throw new Error("Employee full name is required.");
  if (await checkDuplicateAccountEmail(cleanEmail)) throw new Error("An account already exists with this email address.");

  const employeeProfile = {
    id: employeeData.id || `emp-${Date.now()}`, full_name: cleanName, email: cleanEmail,
    phone: employeeData.phone || "", department: employeeData.department || "Engineering",
    designation: employeeData.designation || "Staff Member",
    employment_type: employeeData.employment_type || "Paid Staff (Full Time)",
    joining_date: employeeData.joining_date || new Date().toISOString().split("T")[0],
    role: "employee", status: "active", created_at: new Date().toISOString(),
  };
  await dbSaveRecord("employees", employeeProfile);
  return { employee: employeeProfile, authUserId: null };
}

/**
 * Create an intern directory record. Interns use their own Supabase Auth
 * account; an administrator assigns the intern role after verifying identity.
 */
export async function registerInternWithCredentials({ internData }) {
  const cleanEmail = (internData.email || "").trim().toLowerCase();
  const cleanName = (internData.full_name || "").trim();
  if (!cleanEmail) throw new Error("Intern email address is required.");
  if (!cleanName) throw new Error("Intern full name is required.");
  if (await checkDuplicateAccountEmail(cleanEmail)) throw new Error("An account already exists with this email address.");

  const intern = {
    id: internData.id || `i-${Date.now()}`, full_name: cleanName, email: cleanEmail,
    phone: internData.phone || "", course_name: internData.course_name || internData.tech_domain || "Full Stack MERN Web Development",
    internship_mode: internData.internship_mode || "On-Site / Offline",
    start_date: internData.start_date || new Date().toISOString().split("T")[0],
    progress: Number(internData.progress || 0), status: "active",
  };
  await dbSaveRecord("interns", intern);
  return { intern, authUserId: null };
}
