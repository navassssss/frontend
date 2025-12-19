// Academic Mock Data - Attendance & CCE Modules

// ============= TYPES =============

export interface ClassForAttendance {
    id: string;
    name: string;
    grade: number;
    section: string;
    teacherId: string;
    teacherName: string;
    studentCount: number;
}

export interface StudentForAttendance {
    id: string;
    name: string;
    rollNumber: string;
    classId: string;
}

export interface AttendanceSession {
    id: string;
    classId: string;
    className: string;
    date: string;
    session: 'morning' | 'afternoon';
    teacherId: string;
    teacherName: string;
    presentCount: number;
    absentCount: number;
    absentStudentIds: string[];
    submittedAt: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    classId: string;
    className: string;
    teacherId: string;
    teacherName: string;
    finalMaxMarks: number;
    isLocked: boolean;
}

export interface CCEWork {
    id: string;
    subjectId: string;
    subjectName: string;
    classId: string;
    className: string;
    level: 1 | 2 | 3 | 4;
    week: number;
    title: string;
    description: string;
    toolMethod: string;
    issuedDate: string;
    dueDate: string;
    maxMarks: number;
    submissionType: 'online' | 'offline';
    createdBy: string;
}

export interface CCESubmission {
    id: string;
    workId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    submittedAt?: string;
    fileUrl?: string;
    marksObtained?: number;
    feedback?: string;
    evaluatedBy?: string;
    evaluatedAt?: string;
    status: 'pending' | 'submitted' | 'evaluated';
}

export interface StudentSubjectMarks {
    studentId: string;
    studentName: string;
    rollNumber: string;
    subjectId: string;
    totalObtained: number;
    totalPossible: number;
    normalizedMarks: number;
    submissions: CCESubmission[];
}

// ============= MOCK DATA =============

// Classes for attendance (1-10 only, no Class 12)
export const mockAttendanceClasses: ClassForAttendance[] = [
    { id: 'ac-1', name: 'Class 1A', grade: 1, section: 'A', teacherId: 't1', teacherName: 'Mrs. Sharma', studentCount: 30 },
    { id: 'ac-2', name: 'Class 2B', grade: 2, section: 'B', teacherId: 't2', teacherName: 'Mr. Gupta', studentCount: 28 },
    { id: 'ac-3', name: 'Class 5A', grade: 5, section: 'A', teacherId: 't3', teacherName: 'Ms. Patel', studentCount: 32 },
    { id: 'ac-4', name: 'Class 8A', grade: 8, section: 'A', teacherId: 't4', teacherName: 'Mr. Singh', studentCount: 35 },
    { id: 'ac-5', name: 'Class 9A', grade: 9, section: 'A', teacherId: 't5', teacherName: 'Mrs. Kumar', studentCount: 34 },
    { id: 'ac-6', name: 'Class 10A', grade: 10, section: 'A', teacherId: 't6', teacherName: 'Mr. Verma', studentCount: 36 },
];

// Students per class for autocomplete
export const mockStudentsForAttendance: StudentForAttendance[] = [
    // Class 1A students
    { id: 's1-1', name: 'Aarav Sharma', rollNumber: '01', classId: 'ac-1' },
    { id: 's1-2', name: 'Ananya Gupta', rollNumber: '02', classId: 'ac-1' },
    { id: 's1-3', name: 'Arjun Patel', rollNumber: '03', classId: 'ac-1' },
    { id: 's1-4', name: 'Diya Verma', rollNumber: '04', classId: 'ac-1' },
    { id: 's1-5', name: 'Ishaan Kumar', rollNumber: '05', classId: 'ac-1' },
    // Class 9A students
    { id: 's9-1', name: 'Rahul Sharma', rollNumber: '01', classId: 'ac-5' },
    { id: 's9-2', name: 'Priya Patel', rollNumber: '02', classId: 'ac-5' },
    { id: 's9-3', name: 'Amit Singh', rollNumber: '03', classId: 'ac-5' },
    { id: 's9-4', name: 'Sneha Rao', rollNumber: '04', classId: 'ac-5' },
    { id: 's9-5', name: 'Vikram Joshi', rollNumber: '05', classId: 'ac-5' },
    { id: 's9-6', name: 'Kavya Reddy', rollNumber: '06', classId: 'ac-5' },
    { id: 's9-7', name: 'Rohan Mehta', rollNumber: '07', classId: 'ac-5' },
    { id: 's9-8', name: 'Anjali Nair', rollNumber: '08', classId: 'ac-5' },
    // Class 10A students
    { id: 's10-1', name: 'Aditya Kumar', rollNumber: '01', classId: 'ac-6' },
    { id: 's10-2', name: 'Meera Shah', rollNumber: '02', classId: 'ac-6' },
    { id: 's10-3', name: 'Karan Malhotra', rollNumber: '03', classId: 'ac-6' },
    { id: 's10-4', name: 'Nisha Agarwal', rollNumber: '04', classId: 'ac-6' },
    { id: 's10-5', name: 'Siddharth Bose', rollNumber: '05', classId: 'ac-6' },
];

// Attendance records
export let mockAttendanceRecords: AttendanceSession[] = [
    {
        id: 'att-1',
        classId: 'ac-5',
        className: 'Class 9A',
        date: '2024-12-13',
        session: 'morning',
        teacherId: 't5',
        teacherName: 'Mrs. Kumar',
        presentCount: 32,
        absentCount: 2,
        absentStudentIds: ['s9-3', 's9-7'],
        submittedAt: '2024-12-13T08:15:00Z'
    },
    {
        id: 'att-2',
        classId: 'ac-5',
        className: 'Class 9A',
        date: '2024-12-13',
        session: 'afternoon',
        teacherId: 't5',
        teacherName: 'Mrs. Kumar',
        presentCount: 33,
        absentCount: 1,
        absentStudentIds: ['s9-3'],
        submittedAt: '2024-12-13T14:10:00Z'
    },
    {
        id: 'att-3',
        classId: 'ac-6',
        className: 'Class 10A',
        date: '2024-12-13',
        session: 'morning',
        teacherId: 't6',
        teacherName: 'Mr. Verma',
        presentCount: 34,
        absentCount: 2,
        absentStudentIds: ['s10-2', 's10-4'],
        submittedAt: '2024-12-13T08:20:00Z'
    }
];

// Subjects
export const mockSubjects: Subject[] = [
    { id: 'sub-1', name: 'Mathematics', code: 'MATH', classId: 'ac-5', className: 'Class 9A', teacherId: 't5', teacherName: 'Mrs. Kumar', finalMaxMarks: 30, isLocked: false },
    { id: 'sub-2', name: 'Science', code: 'SCI', classId: 'ac-5', className: 'Class 9A', teacherId: 't5', teacherName: 'Mrs. Kumar', finalMaxMarks: 30, isLocked: false },
    { id: 'sub-3', name: 'English', code: 'ENG', classId: 'ac-5', className: 'Class 9A', teacherId: 't5', teacherName: 'Mrs. Kumar', finalMaxMarks: 30, isLocked: false },
    { id: 'sub-4', name: 'Hindi', code: 'HIN', classId: 'ac-5', className: 'Class 9A', teacherId: 't5', teacherName: 'Mrs. Kumar', finalMaxMarks: 30, isLocked: false },
    { id: 'sub-5', name: 'Social Studies', code: 'SST', classId: 'ac-5', className: 'Class 9A', teacherId: 't5', teacherName: 'Mrs. Kumar', finalMaxMarks: 30, isLocked: false },
    { id: 'sub-6', name: 'Mathematics', code: 'MATH', classId: 'ac-6', className: 'Class 10A', teacherId: 't6', teacherName: 'Mr. Verma', finalMaxMarks: 30, isLocked: false },
    { id: 'sub-7', name: 'Science', code: 'SCI', classId: 'ac-6', className: 'Class 10A', teacherId: 't6', teacherName: 'Mr. Verma', finalMaxMarks: 30, isLocked: true },
];

// CCE Works
export let mockCCEWorks: CCEWork[] = [
    {
        id: 'cce-1',
        subjectId: 'sub-1',
        subjectName: 'Mathematics',
        classId: 'ac-5',
        className: 'Class 9A',
        level: 1,
        week: 1,
        title: 'Number Systems Quiz',
        description: 'Quiz on rational and irrational numbers',
        toolMethod: 'Written Quiz',
        issuedDate: '2024-12-01',
        dueDate: '2024-12-08',
        maxMarks: 10,
        submissionType: 'offline',
        createdBy: 'Mrs. Kumar'
    },
    {
        id: 'cce-2',
        subjectId: 'sub-1',
        subjectName: 'Mathematics',
        classId: 'ac-5',
        className: 'Class 9A',
        level: 1,
        week: 2,
        title: 'Polynomials Assignment',
        description: 'Solve polynomial equations and factorization',
        toolMethod: 'Assignment',
        issuedDate: '2024-12-08',
        dueDate: '2024-12-15',
        maxMarks: 15,
        submissionType: 'offline',
        createdBy: 'Mrs. Kumar'
    },
    {
        id: 'cce-3',
        subjectId: 'sub-1',
        subjectName: 'Mathematics',
        classId: 'ac-5',
        className: 'Class 9A',
        level: 2,
        week: 3,
        title: 'Geometry Project',
        description: 'Create models demonstrating geometric theorems',
        toolMethod: 'Project Work',
        issuedDate: '2024-12-10',
        dueDate: '2024-12-20',
        maxMarks: 20,
        submissionType: 'online',
        createdBy: 'Mrs. Kumar'
    },
    {
        id: 'cce-4',
        subjectId: 'sub-2',
        subjectName: 'Science',
        classId: 'ac-5',
        className: 'Class 9A',
        level: 1,
        week: 1,
        title: 'Cell Structure Diagram',
        description: 'Draw and label plant and animal cell diagrams',
        toolMethod: 'Diagram',
        issuedDate: '2024-12-01',
        dueDate: '2024-12-07',
        maxMarks: 10,
        submissionType: 'offline',
        createdBy: 'Mrs. Kumar'
    },
    {
        id: 'cce-5',
        subjectId: 'sub-2',
        subjectName: 'Science',
        classId: 'ac-5',
        className: 'Class 9A',
        level: 2,
        week: 2,
        title: 'Lab Experiment Report',
        description: 'Conduct and report on osmosis experiment',
        toolMethod: 'Lab Report',
        issuedDate: '2024-12-08',
        dueDate: '2024-12-14',
        maxMarks: 15,
        submissionType: 'online',
        createdBy: 'Mrs. Kumar'
    },
];

// CCE Submissions
export let mockCCESubmissions: CCESubmission[] = [
    { id: 'sub-1-1', workId: 'cce-1', studentId: 's9-1', studentName: 'Rahul Sharma', rollNumber: '01', marksObtained: 8, feedback: 'Good work!', evaluatedBy: 'Mrs. Kumar', evaluatedAt: '2024-12-09', status: 'evaluated' },
    { id: 'sub-1-2', workId: 'cce-1', studentId: 's9-2', studentName: 'Priya Patel', rollNumber: '02', marksObtained: 9, feedback: 'Excellent!', evaluatedBy: 'Mrs. Kumar', evaluatedAt: '2024-12-09', status: 'evaluated' },
    { id: 'sub-1-3', workId: 'cce-1', studentId: 's9-3', studentName: 'Amit Singh', rollNumber: '03', marksObtained: 7, feedback: 'Good effort', evaluatedBy: 'Mrs. Kumar', evaluatedAt: '2024-12-09', status: 'evaluated' },
    { id: 'sub-1-4', workId: 'cce-1', studentId: 's9-4', studentName: 'Sneha Rao', rollNumber: '04', marksObtained: 10, feedback: 'Perfect!', evaluatedBy: 'Mrs. Kumar', evaluatedAt: '2024-12-09', status: 'evaluated' },
    { id: 'sub-2-1', workId: 'cce-2', studentId: 's9-1', studentName: 'Rahul Sharma', rollNumber: '01', submittedAt: '2024-12-14', status: 'submitted' },
    { id: 'sub-2-2', workId: 'cce-2', studentId: 's9-2', studentName: 'Priya Patel', rollNumber: '02', status: 'pending' },
    { id: 'sub-3-1', workId: 'cce-3', studentId: 's9-1', studentName: 'Rahul Sharma', rollNumber: '01', submittedAt: '2024-12-15', fileUrl: '/uploads/geometry_project.pdf', status: 'submitted' },
    { id: 'sub-4-1', workId: 'cce-4', studentId: 's9-1', studentName: 'Rahul Sharma', rollNumber: '01', marksObtained: 9, feedback: 'Very neat diagrams', evaluatedBy: 'Mrs. Kumar', evaluatedAt: '2024-12-08', status: 'evaluated' },
    { id: 'sub-4-2', workId: 'cce-4', studentId: 's9-2', studentName: 'Priya Patel', rollNumber: '02', marksObtained: 8, feedback: 'Good labels', evaluatedBy: 'Mrs. Kumar', evaluatedAt: '2024-12-08', status: 'evaluated' },
];

// CCE Tool/Method options
export const cceToolMethods = [
    'Written Quiz',
    'Assignment',
    'Project Work',
    'Lab Report',
    'Diagram',
    'Oral Test',
    'Group Discussion',
    'Presentation',
    'Practical',
    'Portfolio',
    'Field Trip Report',
    'Other'
];

// ============= HELPER FUNCTIONS =============

export async function getClassesForAttendance(): Promise<ClassForAttendance[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAttendanceClasses;
}

export async function getStudentsByClass(classId: string): Promise<StudentForAttendance[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockStudentsForAttendance.filter(s => s.classId === classId);
}

export async function getAttendanceRecords(filters?: { classId?: string; date?: string }): Promise<AttendanceSession[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    let records = [...mockAttendanceRecords];
    if (filters?.classId) records = records.filter(r => r.classId === filters.classId);
    if (filters?.date) records = records.filter(r => r.date === filters.date);
    return records;
}

export async function checkDuplicateAttendance(classId: string, date: string, session: 'morning' | 'afternoon'): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockAttendanceRecords.some(r => r.classId === classId && r.date === date && r.session === session);
}

export async function submitAttendance(
    classId: string,
    className: string,
    date: string,
    session: 'morning' | 'afternoon',
    absentStudentIds: string[],
    teacherId: string,
    teacherName: string
): Promise<AttendanceSession> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const classInfo = mockAttendanceClasses.find(c => c.id === classId);
    const totalStudents = classInfo?.studentCount || 0;

    const record: AttendanceSession = {
        id: `att-${Date.now()}`,
        classId,
        className,
        date,
        session,
        teacherId,
        teacherName,
        presentCount: totalStudents - absentStudentIds.length,
        absentCount: absentStudentIds.length,
        absentStudentIds,
        submittedAt: new Date().toISOString()
    };

    mockAttendanceRecords.push(record);
    return record;
}

export async function getSubjects(classId?: string): Promise<Subject[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (classId) return mockSubjects.filter(s => s.classId === classId);
    return mockSubjects;
}

export async function getCCEWorks(filters?: { subjectId?: string; classId?: string; level?: number }): Promise<CCEWork[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    let works = [...mockCCEWorks];
    if (filters?.subjectId) works = works.filter(w => w.subjectId === filters.subjectId);
    if (filters?.classId) works = works.filter(w => w.classId === filters.classId);
    if (filters?.level) works = works.filter(w => w.level === filters.level);
    return works;
}

export async function createCCEWork(work: Omit<CCEWork, 'id'>): Promise<CCEWork> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newWork: CCEWork = { ...work, id: `cce-${Date.now()}` };
    mockCCEWorks.push(newWork);
    return newWork;
}

export async function getSubmissionsForWork(workId: string): Promise<CCESubmission[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockCCESubmissions.filter(s => s.workId === workId);
}

export async function getSubmissionsForStudent(studentId: string): Promise<CCESubmission[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockCCESubmissions.filter(s => s.studentId === studentId);
}

export async function evaluateSubmission(
    submissionId: string,
    marks: number,
    feedback: string,
    evaluatedBy: string
): Promise<CCESubmission> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const submission = mockCCESubmissions.find(s => s.id === submissionId);
    if (!submission) throw new Error('Submission not found');

    submission.marksObtained = marks;
    submission.feedback = feedback;
    submission.evaluatedBy = evaluatedBy;
    submission.evaluatedAt = new Date().toISOString().split('T')[0];
    submission.status = 'evaluated';

    return submission;
}

export async function submitWork(workId: string, studentId: string, studentName: string, rollNumber: string, fileUrl?: string): Promise<CCESubmission> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let submission = mockCCESubmissions.find(s => s.workId === workId && s.studentId === studentId);

    if (submission) {
        submission.submittedAt = new Date().toISOString();
        submission.fileUrl = fileUrl;
        submission.status = 'submitted';
    } else {
        submission = {
            id: `sub-${Date.now()}`,
            workId,
            studentId,
            studentName,
            rollNumber,
            submittedAt: new Date().toISOString(),
            fileUrl,
            status: 'submitted'
        };
        mockCCESubmissions.push(submission);
    }

    return submission;
}

export function calculateNormalizedMarks(totalObtained: number, totalPossible: number, finalMaxMarks: number): number {
    if (totalPossible === 0) return 0;
    return Math.round((totalObtained / totalPossible) * finalMaxMarks * 100) / 100;
}

export async function getStudentSubjectMarks(subjectId: string): Promise<StudentSubjectMarks[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const subject = mockSubjects.find(s => s.id === subjectId);
    if (!subject) return [];

    const works = mockCCEWorks.filter(w => w.subjectId === subjectId);
    const students = mockStudentsForAttendance.filter(s => s.classId === subject.classId);

    return students.map(student => {
        const submissions = mockCCESubmissions.filter(
            s => s.studentId === student.id && works.some(w => w.id === s.workId)
        );

        const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated');
        const totalObtained = evaluatedSubmissions.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
        const totalPossible = works
            .filter(w => evaluatedSubmissions.some(s => s.workId === w.id))
            .reduce((sum, w) => sum + w.maxMarks, 0);

        return {
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            subjectId,
            totalObtained,
            totalPossible,
            normalizedMarks: calculateNormalizedMarks(totalObtained, totalPossible, subject.finalMaxMarks),
            submissions
        };
    });
}

export async function setSubjectFinalMarks(subjectId: string, finalMaxMarks: number): Promise<Subject> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const subject = mockSubjects.find(s => s.id === subjectId);
    if (!subject) throw new Error('Subject not found');
    subject.finalMaxMarks = finalMaxMarks;
    return subject;
}

export async function toggleSubjectLock(subjectId: string): Promise<Subject> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const subject = mockSubjects.find(s => s.id === subjectId);
    if (!subject) throw new Error('Subject not found');
    subject.isLocked = !subject.isLocked;
    return subject;
}