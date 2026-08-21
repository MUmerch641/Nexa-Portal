import { dbFetch, dbSaveList } from "./dbPersistence";

export const DEFAULT_MCQ_EXAMS = [
  {
    id: "exam-mern-101",
    title: "MERN Stack Mid-Term Evaluation",
    description: "Comprehensive mid-term evaluation covering React components, Node.js Express APIs, and MongoDB schemas.",
    course: "Full Stack MERN Web Development",
    time_limit: 10, // Minutes
    passing_score: 50, // Percentage
    due_date: "2026-08-30",
    status: "Active",
    assigned_to_email: "all", // "all" or specific email
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        question: "Which database type is MongoDB?",
        option_a: "Relational SQL Database",
        option_b: "NoSQL Document Database",
        option_c: "In-Memory Key-Value Store",
        option_d: "Graph Database",
        correct_answer: "option_b",
      },
      {
        id: "q2",
        question: "In React, which Hook is primarily used for handling component state?",
        option_a: "useEffect",
        option_b: "useContext",
        option_c: "useState",
        option_d: "useReducer",
        correct_answer: "option_c",
      },
      {
        id: "q3",
        question: "What is the primary role of Express.js in the MERN Stack?",
        option_a: "Client-side Routing",
        option_b: "Backend Web Application Framework for Node.js",
        option_c: "Database Query Engine",
        option_d: "CSS Styling Compiler",
        correct_answer: "option_b",
      },
      {
        id: "q4",
        question: "In Node.js Express, what parameter represents the next middleware callback?",
        option_a: "req",
        option_b: "res",
        option_c: "next",
        option_d: "callback",
        correct_answer: "option_c",
      },
    ],
  },
];

/**
 * Fetch all MCQ Exams from database storage
 */
export async function getAllMcqExams() {
  const exams = await dbFetch("mcq_exams", DEFAULT_MCQ_EXAMS).catch(() => DEFAULT_MCQ_EXAMS);
  return exams && exams.length > 0 ? exams : DEFAULT_MCQ_EXAMS;
}

/**
 * Fetch MCQ Exams assigned to a specific user email
 */
export async function getAssignedExamsForUser(userEmail = "") {
  const allExams = await getAllMcqExams();
  const normalizedEmail = (userEmail || "").trim().toLowerCase();
  
  if (!normalizedEmail) return allExams;

  return allExams.filter((exam) => {
    const assignee = (exam.assigned_to_email || "all").trim().toLowerCase();
    return assignee === "all" || assignee === normalizedEmail || assignee.includes(normalizedEmail);
  });
}

/**
 * Save or Update an MCQ Exam
 */
export async function saveMcqExam(examRecord) {
  const allExams = await getAllMcqExams();
  const existingIndex = allExams.findIndex((e) => e.id === examRecord.id);
  
  let updated;
  if (existingIndex >= 0) {
    updated = [...allExams];
    updated[existingIndex] = { ...examRecord, updated_at: new Date().toISOString() };
  } else {
    updated = [{ ...examRecord, id: examRecord.id || `exam-${Date.now()}`, created_at: new Date().toISOString() }, ...allExams];
  }

  await dbSaveList("mcq_exams", updated).catch(() => {});
  return updated;
}

/**
 * Delete an MCQ Exam by ID
 */
export async function deleteMcqExam(examId) {
  const allExams = await getAllMcqExams();
  const updated = allExams.filter((e) => e.id !== examId);
  await dbSaveList("mcq_exams", updated).catch(() => {});
  return updated;
}

/**
 * Fetch all Exam Attempt Results
 */
export async function getAllExamAttempts() {
  return await dbFetch("mcq_attempts", []).catch(() => []);
}

/**
 * Fetch Exam Attempts for a specific user email
 */
export async function getExamAttemptsForUser(userEmail = "") {
  const allAttempts = await getAllExamAttempts();
  const normalizedEmail = (userEmail || "").trim().toLowerCase();

  if (!normalizedEmail) return allAttempts;

  return allAttempts.filter(
    (a) => (a.user_email || a.email || "").trim().toLowerCase() === normalizedEmail
  );
}

/**
 * Auto-Grade and Save Exam Attempt
 */
export async function submitExamAttempt({
  exam,
  userEmail,
  userName,
  userRole = "student",
  userAnswers = {}, // { q1: "option_b", q2: "option_c" }
  timeTakenSeconds = 0,
}) {
  const questions = exam.questions || [];
  const totalQuestions = questions.length;
  let correctAnswers = 0;

  questions.forEach((q) => {
    const selected = userAnswers[q.id];
    if (selected && selected === q.correct_answer) {
      correctAnswers += 1;
    }
  });

  const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passingScore = Number(exam.passing_score || 50);
  const isPassed = percentage >= passingScore;

  const attemptRecord = {
    id: `attempt-${Date.now()}`,
    exam_id: exam.id,
    exam_title: exam.title,
    user_email: userEmail,
    user_name: userName || userEmail.split("@")[0],
    user_role: userRole,
    started_at: new Date(Date.now() - timeTakenSeconds * 1000).toISOString(),
    submitted_at: new Date().toISOString(),
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    wrong_answers: wrongAnswers,
    score: `${correctAnswers}/${totalQuestions}`,
    percentage: percentage,
    passing_score: passingScore,
    result: isPassed ? "PASSED" : "FAILED",
    time_taken_seconds: timeTakenSeconds,
    user_answers: userAnswers,
  };

  const allAttempts = await getAllExamAttempts();
  const updatedAttempts = [attemptRecord, ...allAttempts.filter(a => a.id !== attemptRecord.id)];
  await dbSaveList("mcq_attempts", updatedAttempts).catch(() => {});

  return attemptRecord;
}
