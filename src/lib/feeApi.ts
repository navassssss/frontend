// Fee Management API Integration
import api from './api';

export interface MonthlyFeeStatus {
    year: number;
    month: number;
    month_name: string;
    payable: number;
    paid: number;
    balance: number;
    status: 'paid' | 'partial' | 'unpaid';
}

export interface StudentFee {
    id: number;
    name: string;
    class_id: number;
    class_name: string;
    total_pending: number;
    last_payment_date: string | null;
}

export interface PaymentAllocation {
    month: number;
    year: number;
    allocated: number;
    cleared: boolean;
    auto_created: boolean;
}

export interface Payment {
    id: number;
    amount: number;
    date: string;
    receipt_issued: boolean;
    remarks: string | null;
    entered_by: string;
    allocations: Array<{
        month: number;
        year: number;
        amount: number;
    }>;
}

// Get list of students with fee status
export const getStudents = async (params?: {
    classId?: number;
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
}): Promise<{
    data: StudentFee[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    status_counts?: {
        paid: number;
        partial: number;
        due: number;
        overpaid: number;
    };
}> => {
    const queryParams: any = {};
    if (params?.classId) queryParams.class_id = params.classId;
    if (params?.page) queryParams.page = params.page;
    if (params?.per_page) queryParams.per_page = params.per_page;
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;

    const response = await api.get('/fees/students', { params: queryParams });
    return response.data;
};

// Get status counts (separate endpoint for performance)
export const getStatusCounts = async (params?: {
    classId?: number;
    search?: string;
}): Promise<{
    paid: number;
    partial: number;
    due: number;
    overpaid: number;
}> => {
    const queryParams: any = {};
    if (params?.classId) queryParams.class_id = params.classId;
    if (params?.search) queryParams.search = params.search;

    const response = await api.get('/fees/status-counts', { params: queryParams });
    return response.data;
};

// Get student fee overview
export const getStudentOverview = async (studentId: number) => {
    const response = await api.get(`/fees/students/${studentId}`);
    return response.data;
};

// Get payment history
export const getPaymentHistory = async (studentId: number): Promise<Payment[]> => {
    const response = await api.get(`/fees/students/${studentId}/payments`);
    return response.data;
};

// Add payment
export const addPayment = async (data: {
    student_id: number;
    amount: number;
    payment_date: string;
    remarks?: string;
    receipt_issued?: boolean;
}) => {
    const response = await api.post('/fees/payments', data);
    return response.data;
};

// Toggle receipt
export const toggleReceipt = async (paymentId: number) => {
    const response = await api.post(`/fees/payments/${paymentId}/receipt`);
    return response.data;
};

// Set class fee for year
export const setClassFee = async (data: {
    class_id: number;
    year: number;
    monthly_amount: number;
    reason?: string;
}) => {
    const response = await api.post('/fees/plans/class', data);
    return response.data;
};

// Set student fee range
export const setStudentFeeRange = async (data: {
    student_id: number;
    start_year: number;
    start_month: number;
    end_year: number;
    end_month: number;
    amount: number;
    reason?: string;
}) => {
    const response = await api.post('/fees/plans/student', data);
    return response.data;
};

// Adjust student fee (alias for setStudentFeeRange for clarity)
export const adjustStudentFee = setStudentFeeRange;

// Update student monthly fee
export const updateStudentMonthlyFee = async (studentId: number, monthly_fee: number) => {
    const response = await api.post(`/fees/students/${studentId}/monthly-fee`, { monthly_fee });
    return response.data;
};

// Get overall summary
export const getOverallSummary = async () => {
    const response = await api.get('/fees/reports/summary');
    return response.data;
};

// Get class-wise report
export const getClassReport = async (classId: number) => {
    const response = await api.get(`/fees/reports/class/${classId}`);
    return response.data;
};

// Get daily collection report
export const getDailyReport = async (date: string) => {
    const response = await api.get(`/fees/reports/daily/${date}`);
    return response.data;
};

// Get available classes
export const getClasses = async () => {
    const response = await api.get('/fees/classes');
    return response.data;
};
