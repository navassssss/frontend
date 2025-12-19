// Fee Management Mock Data

export interface AcademicYear {
    id: string;
    name: string; // e.g., "2024-25"
    startDate: string;
    endDate: string;
    isCurrent: boolean;
}

export interface StudentFee {
    id: string;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    academicYearId: string;
}

export interface MonthlyFeeExpectation {
    id: string;
    studentFeeId: string;
    month: string; // YYYY-MM format
    expectedAmount: number;
    originalAmount: number; // For tracking adjustments
    adjustmentReason?: string;
    adjustedAt?: string;
    adjustedBy?: string;
}

export interface Payment {
    id: string;
    studentFeeId: string;
    amount: number;
    date: string;
    remarks?: string;
    receiptIssued: boolean;
    createdAt: string;
    createdBy: string;
}

export interface PaymentAllocation {
    id: string;
    paymentId: string;
    monthlyFeeId: string;
    amount: number;
}

export interface MonthlyFeeStatus {
    month: string;
    expectedAmount: number;
    paidAmount: number;
    balance: number;
    status: 'paid' | 'partial' | 'due';
}

// Mock Data
export const mockAcademicYears: AcademicYear[] = [
    {
        id: 'ay-2024-25',
        name: '2024-25',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
        isCurrent: true,
    },
    {
        id: 'ay-2023-24',
        name: '2023-24',
        startDate: '2023-04-01',
        endDate: '2024-03-31',
        isCurrent: false,
    },
];

export const mockStudentFees: StudentFee[] = [
    {
        id: 'sf-1',
        studentId: 'stu-1',
        studentName: 'Aarav Sharma',
        classId: 'class-5',
        className: 'Class 5',
        academicYearId: 'ay-2024-25',
    },
    {
        id: 'sf-2',
        studentId: 'stu-2',
        studentName: 'Priya Patel',
        classId: 'class-5',
        className: 'Class 5',
        academicYearId: 'ay-2024-25',
    },
    {
        id: 'sf-3',
        studentId: 'stu-3',
        studentName: 'Rohan Gupta',
        classId: 'class-6',
        className: 'Class 6',
        academicYearId: 'ay-2024-25',
    },
    {
        id: 'sf-4',
        studentId: 'stu-4',
        studentName: 'Ananya Singh',
        classId: 'class-7',
        className: 'Class 7',
        academicYearId: 'ay-2024-25',
    },
    {
        id: 'sf-5',
        studentId: 'stu-5',
        studentName: 'Vikram Reddy',
        classId: 'class-8',
        className: 'Class 8',
        academicYearId: 'ay-2024-25',
    },
];

export const mockMonthlyFees: MonthlyFeeExpectation[] = [
    // Student 1 - Aarav
    { id: 'mf-1-1', studentFeeId: 'sf-1', month: '2024-04', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-2', studentFeeId: 'sf-1', month: '2024-05', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-3', studentFeeId: 'sf-1', month: '2024-06', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-4', studentFeeId: 'sf-1', month: '2024-07', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-5', studentFeeId: 'sf-1', month: '2024-08', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-6', studentFeeId: 'sf-1', month: '2024-09', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-7', studentFeeId: 'sf-1', month: '2024-10', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-8', studentFeeId: 'sf-1', month: '2024-11', expectedAmount: 500, originalAmount: 500 },
    { id: 'mf-1-9', studentFeeId: 'sf-1', month: '2024-12', expectedAmount: 500, originalAmount: 500 },

    // Student 2 - Priya (with adjusted fees)
    { id: 'mf-2-1', studentFeeId: 'sf-2', month: '2024-04', expectedAmount: 600, originalAmount: 600 },
    { id: 'mf-2-2', studentFeeId: 'sf-2', month: '2024-05', expectedAmount: 600, originalAmount: 600 },
    { id: 'mf-2-3', studentFeeId: 'sf-2', month: '2024-06', expectedAmount: 400, originalAmount: 600, adjustmentReason: 'Financial hardship', adjustedAt: '2024-06-15' },
    { id: 'mf-2-4', studentFeeId: 'sf-2', month: '2024-07', expectedAmount: 400, originalAmount: 600, adjustmentReason: 'Financial hardship', adjustedAt: '2024-06-15' },
    { id: 'mf-2-5', studentFeeId: 'sf-2', month: '2024-08', expectedAmount: 600, originalAmount: 600 },
    { id: 'mf-2-6', studentFeeId: 'sf-2', month: '2024-09', expectedAmount: 600, originalAmount: 600 },
    { id: 'mf-2-7', studentFeeId: 'sf-2', month: '2024-10', expectedAmount: 600, originalAmount: 600 },
    { id: 'mf-2-8', studentFeeId: 'sf-2', month: '2024-11', expectedAmount: 600, originalAmount: 600 },
    { id: 'mf-2-9', studentFeeId: 'sf-2', month: '2024-12', expectedAmount: 600, originalAmount: 600 },

    // Student 3 - Rohan
    { id: 'mf-3-1', studentFeeId: 'sf-3', month: '2024-04', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-2', studentFeeId: 'sf-3', month: '2024-05', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-3', studentFeeId: 'sf-3', month: '2024-06', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-4', studentFeeId: 'sf-3', month: '2024-07', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-5', studentFeeId: 'sf-3', month: '2024-08', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-6', studentFeeId: 'sf-3', month: '2024-09', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-7', studentFeeId: 'sf-3', month: '2024-10', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-8', studentFeeId: 'sf-3', month: '2024-11', expectedAmount: 700, originalAmount: 700 },
    { id: 'mf-3-9', studentFeeId: 'sf-3', month: '2024-12', expectedAmount: 700, originalAmount: 700 },

    // Student 4 - Ananya
    { id: 'mf-4-1', studentFeeId: 'sf-4', month: '2024-04', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-2', studentFeeId: 'sf-4', month: '2024-05', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-3', studentFeeId: 'sf-4', month: '2024-06', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-4', studentFeeId: 'sf-4', month: '2024-07', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-5', studentFeeId: 'sf-4', month: '2024-08', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-6', studentFeeId: 'sf-4', month: '2024-09', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-7', studentFeeId: 'sf-4', month: '2024-10', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-8', studentFeeId: 'sf-4', month: '2024-11', expectedAmount: 550, originalAmount: 550 },
    { id: 'mf-4-9', studentFeeId: 'sf-4', month: '2024-12', expectedAmount: 550, originalAmount: 550 },

    // Student 5 - Vikram
    { id: 'mf-5-1', studentFeeId: 'sf-5', month: '2024-04', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-2', studentFeeId: 'sf-5', month: '2024-05', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-3', studentFeeId: 'sf-5', month: '2024-06', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-4', studentFeeId: 'sf-5', month: '2024-07', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-5', studentFeeId: 'sf-5', month: '2024-08', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-6', studentFeeId: 'sf-5', month: '2024-09', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-7', studentFeeId: 'sf-5', month: '2024-10', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-8', studentFeeId: 'sf-5', month: '2024-11', expectedAmount: 800, originalAmount: 800 },
    { id: 'mf-5-9', studentFeeId: 'sf-5', month: '2024-12', expectedAmount: 800, originalAmount: 800 },
];

export const mockPayments: Payment[] = [
    // Aarav - fully paid through June
    { id: 'pay-1', studentFeeId: 'sf-1', amount: 1500, date: '2024-06-01', receiptIssued: true, createdAt: '2024-06-01', createdBy: 'Manager' },
    // Priya - partial payment
    { id: 'pay-2', studentFeeId: 'sf-2', amount: 1000, date: '2024-05-15', receiptIssued: true, createdAt: '2024-05-15', createdBy: 'Manager' },
    { id: 'pay-3', studentFeeId: 'sf-2', amount: 800, date: '2024-07-10', remarks: 'Partial payment for pending months', receiptIssued: false, createdAt: '2024-07-10', createdBy: 'Manager' },
    // Rohan - fully paid through August
    { id: 'pay-4', studentFeeId: 'sf-3', amount: 3500, date: '2024-08-05', receiptIssued: true, createdAt: '2024-08-05', createdBy: 'Manager' },
    // Ananya - only April paid
    { id: 'pay-5', studentFeeId: 'sf-4', amount: 550, date: '2024-04-20', receiptIssued: true, createdAt: '2024-04-20', createdBy: 'Manager' },
    // Vikram - no payments
];

export const mockPaymentAllocations: PaymentAllocation[] = [
    // Aarav's payment covers Apr, May, Jun
    { id: 'pa-1-1', paymentId: 'pay-1', monthlyFeeId: 'mf-1-1', amount: 500 },
    { id: 'pa-1-2', paymentId: 'pay-1', monthlyFeeId: 'mf-1-2', amount: 500 },
    { id: 'pa-1-3', paymentId: 'pay-1', monthlyFeeId: 'mf-1-3', amount: 500 },
    // Priya's first payment covers Apr, May (partial)
    { id: 'pa-2-1', paymentId: 'pay-2', monthlyFeeId: 'mf-2-1', amount: 600 },
    { id: 'pa-2-2', paymentId: 'pay-2', monthlyFeeId: 'mf-2-2', amount: 400 },
    // Priya's second payment covers rest of May, Jun, Jul (partial)
    { id: 'pa-3-1', paymentId: 'pay-3', monthlyFeeId: 'mf-2-2', amount: 200 },
    { id: 'pa-3-2', paymentId: 'pay-3', monthlyFeeId: 'mf-2-3', amount: 400 },
    { id: 'pa-3-3', paymentId: 'pay-3', monthlyFeeId: 'mf-2-4', amount: 200 },
    // Rohan's payment covers Apr through Aug
    { id: 'pa-4-1', paymentId: 'pay-4', monthlyFeeId: 'mf-3-1', amount: 700 },
    { id: 'pa-4-2', paymentId: 'pay-4', monthlyFeeId: 'mf-3-2', amount: 700 },
    { id: 'pa-4-3', paymentId: 'pay-4', monthlyFeeId: 'mf-3-3', amount: 700 },
    { id: 'pa-4-4', paymentId: 'pay-4', monthlyFeeId: 'mf-3-4', amount: 700 },
    { id: 'pa-4-5', paymentId: 'pay-4', monthlyFeeId: 'mf-3-5', amount: 700 },
    // Ananya's payment covers Apr
    { id: 'pa-5-1', paymentId: 'pay-5', monthlyFeeId: 'mf-4-1', amount: 550 },
];

// Helper functions
export const getAcademicYears = async (): Promise<AcademicYear[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockAcademicYears;
};

export const getCurrentAcademicYear = (): AcademicYear => {
    return mockAcademicYears.find((y) => y.isCurrent) || mockAcademicYears[0];
};

export const getStudentFees = async (academicYearId?: string): Promise<StudentFee[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (academicYearId) {
        return mockStudentFees.filter((sf) => sf.academicYearId === academicYearId);
    }
    return mockStudentFees;
};

export const getStudentFeeById = async (id: string): Promise<StudentFee | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockStudentFees.find((sf) => sf.id === id);
};

export const getStudentFeeByStudentId = async (studentId: string, academicYearId?: string): Promise<StudentFee | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const yearId = academicYearId || getCurrentAcademicYear().id;
    return mockStudentFees.find((sf) => sf.studentId === studentId && sf.academicYearId === yearId);
};

export const getMonthlyFees = async (studentFeeId: string): Promise<MonthlyFeeExpectation[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockMonthlyFees
        .filter((mf) => mf.studentFeeId === studentFeeId)
        .sort((a, b) => a.month.localeCompare(b.month));
};

export const getPayments = async (studentFeeId: string): Promise<Payment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockPayments
        .filter((p) => p.studentFeeId === studentFeeId)
        .sort((a, b) => b.date.localeCompare(a.date));
};

export const getPaymentAllocations = async (paymentId: string): Promise<PaymentAllocation[]> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockPaymentAllocations.filter((pa) => pa.paymentId === paymentId);
};

export const calculateMonthlyFeeStatus = (
    monthlyFees: MonthlyFeeExpectation[],
    allocations: PaymentAllocation[]
): MonthlyFeeStatus[] => {
    return monthlyFees.map((mf) => {
        const paidAmount = allocations
            .filter((a) => a.monthlyFeeId === mf.id)
            .reduce((sum, a) => sum + a.amount, 0);
        const balance = mf.expectedAmount - paidAmount;

        let status: 'paid' | 'partial' | 'due' = 'due';
        if (balance <= 0) status = 'paid';
        else if (paidAmount > 0) status = 'partial';

        return {
            month: mf.month,
            expectedAmount: mf.expectedAmount,
            paidAmount,
            balance: Math.max(0, balance),
            status,
        };
    });
};

export const getStudentFeeOverview = async (studentFeeId: string): Promise<{
    totalExpected: number;
    totalPaid: number;
    totalPending: number;
    monthlyStatus: MonthlyFeeStatus[];
    lastPaymentDate: string | null;
}> => {
    const monthlyFees = await getMonthlyFees(studentFeeId);
    const payments = await getPayments(studentFeeId);

    // Get all allocations for this student's payments
    const allAllocations: PaymentAllocation[] = [];
    for (const payment of payments) {
        const allocations = await getPaymentAllocations(payment.id);
        allAllocations.push(...allocations);
    }

    const monthlyStatus = calculateMonthlyFeeStatus(monthlyFees, allAllocations);
    const totalExpected = monthlyFees.reduce((sum, mf) => sum + mf.expectedAmount, 0);
    const totalPaid = allAllocations.reduce((sum, a) => sum + a.amount, 0);
    const lastPaymentDate = payments.length > 0 ? payments[0].date : null;

    return {
        totalExpected,
        totalPaid,
        totalPending: totalExpected - totalPaid,
        monthlyStatus,
        lastPaymentDate,
    };
};

// Add payment with auto-clearing logic
export const addPayment = async (
    studentFeeId: string,
    amount: number,
    date: string,
    remarks?: string,
    receiptIssued: boolean = false
): Promise<{ payment: Payment; allocations: PaymentAllocation[] }> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const monthlyFees = await getMonthlyFees(studentFeeId);
    const payments = await getPayments(studentFeeId);

    // Get all existing allocations
    const existingAllocations: PaymentAllocation[] = [];
    for (const payment of payments) {
        const allocations = await getPaymentAllocations(payment.id);
        existingAllocations.push(...allocations);
    }

    // Calculate unpaid amounts per month
    const monthlyStatus = calculateMonthlyFeeStatus(monthlyFees, existingAllocations);

    // Create new payment
    const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        studentFeeId,
        amount,
        date,
        remarks,
        receiptIssued,
        createdAt: new Date().toISOString(),
        createdBy: 'Manager',
    };

    // Auto-allocate to oldest unpaid months first
    let remainingAmount = amount;
    const newAllocations: PaymentAllocation[] = [];

    for (let i = 0; i < monthlyStatus.length && remainingAmount > 0; i++) {
        const status = monthlyStatus[i];
        if (status.balance > 0) {
            const allocationAmount = Math.min(remainingAmount, status.balance);
            const monthlyFee = monthlyFees.find((mf) => mf.month === status.month);

            if (monthlyFee) {
                newAllocations.push({
                    id: `pa-${Date.now()}-${i}`,
                    paymentId: newPayment.id,
                    monthlyFeeId: monthlyFee.id,
                    amount: allocationAmount,
                });
                remainingAmount -= allocationAmount;
            }
        }
    }

    // Add to mock data
    mockPayments.push(newPayment);
    mockPaymentAllocations.push(...newAllocations);

    return { payment: newPayment, allocations: newAllocations };
};

// Adjust monthly fee
export const adjustMonthlyFee = async (
    studentFeeId: string,
    fromMonth: string,
    toMonth: string,
    newAmount: number,
    reason: string
): Promise<MonthlyFeeExpectation[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const adjustedFees: MonthlyFeeExpectation[] = [];

    mockMonthlyFees.forEach((mf) => {
        if (mf.studentFeeId === studentFeeId && mf.month >= fromMonth && mf.month <= toMonth) {
            mf.expectedAmount = newAmount;
            mf.adjustmentReason = reason;
            mf.adjustedAt = new Date().toISOString();
            mf.adjustedBy = 'Manager';
            adjustedFees.push(mf);
        }
    });

    return adjustedFees;
};

// Toggle receipt issued
export const toggleReceiptIssued = async (paymentId: string): Promise<Payment | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const payment = mockPayments.find((p) => p.id === paymentId);
    if (payment) {
        payment.receiptIssued = !payment.receiptIssued;
    }
    return payment;
};

// Get class list for filtering
export const getFeeClasses = async (): Promise<{ id: string; name: string }[]> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const classes = [...new Set(mockStudentFees.map((sf) => sf.classId))];
    return classes.map((id) => {
        const sf = mockStudentFees.find((s) => s.classId === id);
        return { id, name: sf?.className || id };
    });
};

// Format month for display
export const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

// ==================== REPORT HELPER FUNCTIONS ====================

export interface OverallFinancialSummary {
    totalExpectedTillToday: number;
    totalPaidTillToday: number;
    totalPendingTillToday: number;
    monthsCovered: number;
}

export interface ClassWiseStudentReport {
    studentId: string;
    studentName: string;
    studentFeeId: string;
    monthlyPayable: number;
    totalPending: number;
    totalPaid: number;
    totalExpected: number;
}

export interface ClassWiseSummary {
    classId: string;
    className: string;
    students: ClassWiseStudentReport[];
    totalExpected: number;
    totalPaid: number;
    totalPending: number;
}

export interface DailyPaymentEntry {
    paymentId: string;
    studentName: string;
    className: string;
    amount: number;
    receiptIssued: boolean;
    remarks?: string;
    date: string;
}

export interface DailyCollectionSummary {
    date: string;
    payments: DailyPaymentEntry[];
    totalStudents: number;
    totalAmount: number;
}

// Get overall financial summary till today
export const getOverallFinancialSummary = async (academicYearId?: string): Promise<OverallFinancialSummary> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const yearId = academicYearId || getCurrentAcademicYear().id;
    const today = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const studentFees = mockStudentFees.filter((sf) => sf.academicYearId === yearId);

    let totalExpectedTillToday = 0;
    let totalPaidTillToday = 0;
    const monthsSet = new Set<string>();

    for (const sf of studentFees) {
        // Get monthly fees up to today
        const monthlyFees = mockMonthlyFees.filter(
            (mf) => mf.studentFeeId === sf.id && mf.month <= today
        );

        monthlyFees.forEach((mf) => {
            totalExpectedTillToday += mf.expectedAmount;
            monthsSet.add(mf.month);
        });

        // Get payments up to today
        const payments = mockPayments.filter(
            (p) => p.studentFeeId === sf.id && p.date.slice(0, 10) <= new Date().toISOString().slice(0, 10)
        );

        payments.forEach((p) => {
            totalPaidTillToday += p.amount;
        });
    }

    return {
        totalExpectedTillToday,
        totalPaidTillToday,
        totalPendingTillToday: totalExpectedTillToday - totalPaidTillToday,
        monthsCovered: monthsSet.size,
    };
};

// Get class-wise report
export const getClassWiseReport = async (classId: string, academicYearId?: string): Promise<ClassWiseSummary> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const yearId = academicYearId || getCurrentAcademicYear().id;
    const today = new Date().toISOString().slice(0, 7);

    const studentFees = mockStudentFees.filter(
        (sf) => sf.classId === classId && sf.academicYearId === yearId
    );

    const students: ClassWiseStudentReport[] = [];
    let classTotalExpected = 0;
    let classTotalPaid = 0;

    for (const sf of studentFees) {
        const monthlyFees = mockMonthlyFees.filter(
            (mf) => mf.studentFeeId === sf.id && mf.month <= today
        );

        const payments = mockPayments.filter((p) => p.studentFeeId === sf.id);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpected = monthlyFees.reduce((sum, mf) => sum + mf.expectedAmount, 0);

        // Get current monthly payable (latest month's expected amount)
        const latestMonthFee = mockMonthlyFees
            .filter((mf) => mf.studentFeeId === sf.id)
            .sort((a, b) => b.month.localeCompare(a.month))[0];

        students.push({
            studentId: sf.studentId,
            studentName: sf.studentName,
            studentFeeId: sf.id,
            monthlyPayable: latestMonthFee?.expectedAmount || 0,
            totalPending: Math.max(0, totalExpected - totalPaid),
            totalPaid,
            totalExpected,
        });

        classTotalExpected += totalExpected;
        classTotalPaid += totalPaid;
    }

    const classInfo = mockStudentFees.find((sf) => sf.classId === classId);

    return {
        classId,
        className: classInfo?.className || classId,
        students: students.sort((a, b) => a.studentName.localeCompare(b.studentName)),
        totalExpected: classTotalExpected,
        totalPaid: classTotalPaid,
        totalPending: Math.max(0, classTotalExpected - classTotalPaid),
    };
};

// Get daily collection report
export const getDailyCollectionReport = async (date: string): Promise<DailyCollectionSummary> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const payments = mockPayments.filter((p) => p.date === date);

    const paymentEntries: DailyPaymentEntry[] = payments.map((p) => {
        const studentFee = mockStudentFees.find((sf) => sf.id === p.studentFeeId);
        return {
            paymentId: p.id,
            studentName: studentFee?.studentName || 'Unknown',
            className: studentFee?.className || 'Unknown',
            amount: p.amount,
            receiptIssued: p.receiptIssued,
            remarks: p.remarks,
            date: p.date,
        };
    });

    return {
        date,
        payments: paymentEntries.sort((a, b) => a.studentName.localeCompare(b.studentName)),
        totalStudents: new Set(payments.map((p) => p.studentFeeId)).size,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    };
};

// Get all payments for a date range (for more flexible reporting)
export const getPaymentsByDateRange = async (startDate: string, endDate: string): Promise<Payment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockPayments.filter((p) => p.date >= startDate && p.date <= endDate);
};