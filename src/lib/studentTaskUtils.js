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
export async function getDailyTasks(assignedEmail = "") {
  const allTasks = await dbFetch("daily_tasks", INITIAL_STUDENT_TASKS);
  if (!assignedEmail) return allTasks;
  return allTasks.filter((t) => !t.assigned_to_email || t.assigned_to_email.toLowerCase() === assignedEmail.toLowerCase());
}

/**
 * Save / Update Task Record
 */
export async function saveTaskRecord(taskRecord) {
  const allTasks = await getDailyTasks();
  const index = allTasks.findIndex((t) => t.id === taskRecord.id);
  let updated;
  if (index >= 0) {
    updated = [...allTasks];
    updated[index] = taskRecord;
  } else {
    updated = [taskRecord, ...allTasks];
  }
  await dbSaveList("daily_tasks", updated);
  return updated;
}

/**
 * Get Certificates
 */
export async function getCertificates() {
  return await dbFetch("certificates", INITIAL_CERTIFICATES);
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
