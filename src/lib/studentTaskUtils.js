import { dbFetch, dbSaveList, dbSaveRecord } from "@/lib/dbPersistence";

export const STUDENT_STORAGE_KEYS = {
  students: "persistent_courses",
  tasks: "student_daily_tasks",
  exams: "student_examinations",
  attempts: "student_exam_attempts",
  certificates: "student_certificates",
  fees: "student_fee_records",
};

// Initial Seed Tasks (Clean empty array so deleted tasks do not reappear)
export const INITIAL_STUDENT_TASKS = [];

// Initial Seed Certificates for Testing Verification
export const INITIAL_CERTIFICATES = [
  {
    id: "cert-901",
    certificate_number: "CERT-NEXA-2026-9901",
    student_id: "s-101",
    student_name: "Ali Hassan",
    student_email: "student@gmail.com",
    course_name: "Full Stack MERN Web Development",
    completion_date: "2026-08-01",
    grade: "A+ (98% Score)",
    instructor_name: "Engr. Hamza (Lead Instructor)",
    qr_code_url: "/verify-certificate?id=CERT-NEXA-2026-9901",
    status: "Valid",
  },
];

// Sample MCQ Examination
export const SAMPLE_MCQ_EXAM = {
  id: "exam-201",
  title: "MERN Stack Mid-Term Evaluation",
  course_name: "Full Stack MERN Web Development",
  exam_type: "MCQ",
  total_marks: 100,
  pass_percentage: 70,
  duration_minutes: 15,
  questions: [
    {
      id: "q1",
      question: "Which hook is used in React to manage side effects like fetching data?",
      options: ["useState", "useEffect", "useContext", "useReducer"],
      correctIndex: 1,
    },
    {
      id: "q2",
      question: "What does RLS stand for in PostgreSQL / Supabase?",
      options: ["Row Level Security", "Remote Link Storage", "Reactive Logic Schema", "Root Level System"],
      correctIndex: 0,
    },
    {
      id: "q3",
      question: "Which HTTP method is idempotent and typically used to update a resource?",
      options: ["POST", "PUT", "DELETE", "CONNECT"],
      correctIndex: 1,
    },
    {
      id: "q4",
      question: "In Node.js Express, what parameter represents the next middleware callback?",
      options: ["req", "res", "next", "callback"],
      correctIndex: 2,
    },
  ],
};

/**
 * Fetch daily tasks assigned to email
 */
export async function getDailyTasks(assignedEmail = "", audienceRole = "student") {
  const allTasks = await dbFetch("daily_tasks", INITIAL_STUDENT_TASKS);
  if (!assignedEmail) return allTasks;
  const cleanEmail = assignedEmail.toLowerCase().trim();
  const namePart = cleanEmail.split("@")[0];

  const matchesTarget = (t) => {
    const tEmail = (t.assigned_to_email || t.assignedToEmail || t.email || "").toLowerCase().trim();
    const tName = (t.assigned_to_name || t.assignedTo || "").toLowerCase().trim();
    const targetAud = (t.targetAudience || "").toLowerCase();

    const personalMatch = (
      (cleanEmail && tEmail === cleanEmail) ||
      (cleanEmail && tEmail.includes(cleanEmail)) ||
      (namePart && tName.includes(namePart))
    );
    const studentAudience = targetAud.includes("all enrolled students") || targetAud.includes("all students");
    const internAudience = targetAud.includes("all remote & onsite interns") || targetAud.includes("all interns");
    const employeeAudience = targetAud.includes("all paid staff") || targetAud.includes("all staff") || targetAud.includes("all employees");
    return personalMatch || (audienceRole === "student" && studentAudience) || (audienceRole === "intern" && internAudience) || (audienceRole === "employee" && employeeAudience);
  };

  const baseTasks = allTasks.filter((task) => !task.base_task_id && matchesTarget(task));
  const progressByTaskId = new Map(
    allTasks
      .filter((task) => task.base_task_id && (task.assigned_to_email || task.email || "").toLowerCase().trim() === cleanEmail)
      .map((task) => [String(task.base_task_id), task])
  );

  return baseTasks.map((task) => {
    const progress = progressByTaskId.get(String(task.id));
    return progress
      ? { ...task, ...progress, id: task.id, base_task_id: task.id, progress_record_id: progress.id }
      : task;
  });
}

/**
 * Save / Update Task Record
 */
export async function saveTaskRecord(taskRecord, assignedEmail = "", audienceRole = "student") {
  const cleanEmail = String(assignedEmail || "").toLowerCase().trim();
  const assignedTaskEmail = String(taskRecord.assigned_to_email || taskRecord.assignedToEmail || taskRecord.email || "").toLowerCase().trim();
  const isPersonalProgress = Boolean(taskRecord.progress_record_id || taskRecord.base_task_id || (cleanEmail && assignedTaskEmail !== cleanEmail));
  let recordToSave = taskRecord;

  if (isPersonalProgress) {
    if (!cleanEmail) throw new Error("The signed-in email is required to save task progress.");
    const baseTaskId = String(taskRecord.base_task_id || taskRecord.id);
    recordToSave = {
      ...taskRecord,
      id: taskRecord.progress_record_id || `task-progress:${baseTaskId}:${cleanEmail}`,
      base_task_id: baseTaskId,
      assigned_to_email: cleanEmail,
      assignedToEmail: cleanEmail,
      targetAudience: "Individual",
    };
    delete recordToSave.progress_record_id;
  }

  const savedTask = await dbSaveRecord("daily_tasks", recordToSave);
  if (!savedTask) throw new Error("The server did not confirm the task update.");
  if (cleanEmail) return getDailyTasks(cleanEmail, audienceRole);

  const allTasks = await getDailyTasks();
  return allTasks.map((task) => task.id === savedTask.id ? savedTask : task);
}

/**
 * Get Certificates
 */
export async function getCertificates() {
  return await dbFetch("certificates", [], true);
}

/**
 * Save Certificate
 */
export async function saveCertificate(certRecord) {
  const certs = await getCertificates();
  const updated = [certRecord, ...certs];
  await dbSaveList("certificates", updated);
  return updated;
}

/**
 * Verify Certificate by Certificate Number
 */
export async function verifyCertificateById(certNo) {
  const certs = await getCertificates();
  if (!certNo) return null;
  const match = certs.find((c) => c.certificate_number?.toLowerCase().trim() === certNo.toLowerCase().trim() || c.id === certNo);
  return match || null;
}
