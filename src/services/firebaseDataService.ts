import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Question, Quiz, Student } from '../types';

const QUESTIONS_COLLECTION = 'questions';
const QUIZZES_COLLECTION = 'quizzes';
const STUDENTS_COLLECTION = 'students';

/**
 * Fetch questions from Firestore with standardized error handling
 */
export async function fetchQuestionsFromFirestore(): Promise<Question[]> {
  try {
    const q = query(collection(db, QUESTIONS_COLLECTION), limit(100));
    const snapshot = await getDocs(q);
    const questions: Question[] = [];
    snapshot.forEach((docSnap) => {
      questions.push(docSnap.data() as Question);
    });
    return questions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, QUESTIONS_COLLECTION);
  }
}

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): any {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = sanitizeForFirestore(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Save or update a question in Firestore
 */
export async function saveQuestionToFirestore(question: Question): Promise<void> {
  const docRef = doc(db, QUESTIONS_COLLECTION, question.id);
  try {
    const sanitized = sanitizeForFirestore({
      ...question,
      updated_at: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${QUESTIONS_COLLECTION}/${question.id}`);
  }
}

/**
 * Delete a question from Firestore
 */
export async function deleteQuestionFromFirestore(questionId: string): Promise<void> {
  const docRef = doc(db, QUESTIONS_COLLECTION, questionId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${QUESTIONS_COLLECTION}/${questionId}`);
  }
}

/**
 * Fetch quizzes from Firestore
 */
export async function fetchQuizzesFromFirestore(): Promise<Quiz[]> {
  try {
    const q = query(collection(db, QUIZZES_COLLECTION), limit(50));
    const snapshot = await getDocs(q);
    const quizzes: Quiz[] = [];
    snapshot.forEach((docSnap) => {
      quizzes.push(docSnap.data() as Quiz);
    });
    return quizzes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, QUIZZES_COLLECTION);
  }
}

/**
 * Save a quiz to Firestore
 */
export async function saveQuizToFirestore(quiz: Quiz): Promise<void> {
  const docRef = doc(db, QUIZZES_COLLECTION, quiz.id);
  try {
    const sanitized = sanitizeForFirestore(quiz);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${QUIZZES_COLLECTION}/${quiz.id}`);
  }
}

/**
 * Fetch students from Firestore
 */
export async function fetchStudentsFromFirestore(classId?: string): Promise<Student[]> {
  try {
    const q = query(collection(db, STUDENTS_COLLECTION), limit(300));
    const snapshot = await getDocs(q);
    const students: Student[] = [];
    snapshot.forEach((docSnap) => {
      students.push(docSnap.data() as Student);
    });
    if (classId && classId !== 'all') {
      return students.filter((s) => s.class_id === classId);
    }
    return students;
  } catch (error) {
    console.warn('Could not fetch students from Firestore:', error);
    return [];
  }
}

/**
 * Save or update a student document in Firestore
 */
export async function saveStudentToFirestore(student: Student): Promise<void> {
  const docRef = doc(db, STUDENTS_COLLECTION, student.id);
  try {
    const sanitized = sanitizeForFirestore(student);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.warn('Could not save student to Firestore:', error);
  }
}

/**
 * Delete a student from Firestore
 */
export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  const docRef = doc(db, STUDENTS_COLLECTION, studentId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not delete student from Firestore:', error);
  }
}

/**
 * Batch save multiple students to Firestore
 */
export async function batchSaveStudentsToFirestore(students: Student[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    students.forEach((student) => {
      const docRef = doc(db, STUDENTS_COLLECTION, student.id);
      const sanitized = sanitizeForFirestore(student);
      batch.set(docRef, sanitized, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.warn('Could not batch save students to Firestore:', error);
  }
}
