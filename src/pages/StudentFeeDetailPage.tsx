import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Plus,
    IndianRupee,
    Calendar,
    Receipt,
    Edit,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
} from 'lucide-react';
import * as feeApi from '@/lib/feeApi';

// Helper function for month formatting
const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

interface StudentFee {
    id: string;
    studentName: string;
    className: string;
}

interface MonthlyFeeStatus {
    month: string;
    expectedAmount: number;
    paidAmount: number;
    balance: number;
    status: 'paid' | 'partial' | 'unpaid';
}

interface Payment {
    id: string;
    amount: number;
    date: string;
    receiptIssued: boolean;
    remarks?: string;
}

const StudentFeeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [studentFee, setStudentFee] = useState<StudentFee | null>(null);
    const [monthlyFees, setMonthlyFees] = useState<any[]>([]);
    const [monthlyStatus, setMonthlyStatus] = useState<MonthlyFeeStatus[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<{
        totalExpected: number;
        totalPaid: number;
        totalPending: number;
    } | null>(null);

    // Payment dialog
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [paymentReceiptIssued, setPaymentReceiptIssued] = useState(false);

    // Adjustment dialog
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [adjustFromMonth, setAdjustFromMonth] = useState('');
    const [adjustToMonth, setAdjustToMonth] = useState('');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [overview, paymentHistory] = await Promise.all([
                feeApi.getStudentOverview(parseInt(id)),
                feeApi.getPaymentHistory(parseInt(id)),
            ]);

            // Get student info from overview response
            if (overview.student) {
                setStudentFee({
                    id: overview.student.id.toString(),
                    studentName: overview.student.name,
                    className: overview.student.class_name,
                });
            }

            // Map monthly status
            const monthlyStatusMapped: MonthlyFeeStatus[] = overview.monthly_status.map((m: any) => ({
                month: `${m.year}-${String(m.month).padStart(2, '0')}`,
                expectedAmount: m.payable,
                paidAmount: m.paid,
                balance: m.balance,
                status: m.status,
            }));

            setMonthlyStatus(monthlyStatusMapped);
            setMonthlyFees(monthlyStatusMapped.map(m => ({
                id: m.month,
                month: m.month,
                expectedAmount: m.expectedAmount,
            })));

            // Map payments
            const paymentsMapped: Payment[] = paymentHistory.map((p: any) => ({
                id: p.id.toString(),
                amount: p.amount,
                date: p.date,
                receiptIssued: p.receipt_issued,
                remarks: p.remarks,
            }));

            setPayments(paymentsMapped);
            setOverview({
                totalExpected: overview.total_expected,
                totalPaid: overview.total_paid,
                totalPending: overview.total_pending,
            });
        } catch (error) {
            console.error('Error loading student fee data:', error);
            toast.error('Failed to load fee details');
        } finally {
            setLoading(false);
        }
    };

    // Get months that can be adjusted (all months including past unpaid, current, and future)
    const getAdjustableMonths = () => {
        // Get ALL existing months (including past unpaid ones)
        const existingMonths = monthlyStatus; // No filter - show all months

        // Generate future months up to end of academic year (March)
        const futureMonths: MonthlyFeeStatus[] = [];
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthNum = now.getMonth() + 1; // 1-12

        // Calculate end of academic year
        const endYear = currentMonthNum > 3 ? currentYear + 1 : currentYear;
        const endMonth = 3; // March

        // Generate months from current month to end of academic year
        let year = currentYear;
        let month = currentMonthNum;

        while (year < endYear || (year === endYear && month <= endMonth)) {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;

            // Only add if not already in existingMonths
            if (!existingMonths.find(m => m.month === monthStr)) {
                futureMonths.push({
                    month: monthStr,
                    expectedAmount: 0,
                    paidAmount: 0,
                    balance: 0,
                    status: 'unpaid' as const,
                });
            }

            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
        }

        // Combine and sort
        return [...existingMonths, ...futureMonths].sort((a, b) => a.month.localeCompare(b.month));
    };

    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    // Check if a month is in the future
    const isFutureMonth = (monthStr: string) => {
        const current = getCurrentMonth();
        return monthStr > current;
    };

    // Get next month in YYYY-MM format
    const getNextMonth = () => {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    };

    // Set default values when adjust dialog opens
    const handleOpenAdjustDialog = () => {
        const adjustableMonths = getAdjustableMonths();
        if (adjustableMonths.length > 0) {
            const nextMonth = getNextMonth();

            // Find next month in adjustable months, or use first adjustable month
            const defaultFrom = adjustableMonths.find(m => m.month >= nextMonth)?.month || adjustableMonths[0].month;

            setAdjustFromMonth(defaultFrom);
            setAdjustToMonth('ongoing'); // Default to ongoing
        }
        setAdjustDialogOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: 'paid' | 'partial' | 'unpaid') => {
        switch (status) {
            case 'paid':
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                    </Badge>
                );
            case 'partial':
                return (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Partial
                    </Badge>
                );
            case 'unpaid':
                return (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unpaid
                    </Badge>
                );
        }
    };

    const handleAddPayment = async () => {
        if (!id || !paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            await feeApi.addPayment({
                student_id: parseInt(id),
                amount: parseFloat(paymentAmount),
                payment_date: paymentDate,
                remarks: paymentRemarks || undefined,
            });
            toast.success('Payment added successfully');
            setPaymentDialogOpen(false);
            setPaymentAmount('');
            setPaymentRemarks('');
            setPaymentReceiptIssued(false);
            loadData();
        } catch (error) {
            toast.error('Failed to add payment');
        }
    };

    const handleAdjustFee = async () => {
        if (!id || !adjustFromMonth || !adjustToMonth || !adjustAmount || !adjustReason) {
            toast.error('Please fill all fields');
            return;
        }

        if (adjustToMonth !== 'ongoing' && adjustFromMonth > adjustToMonth) {
            toast.error('From month cannot be after To month');
            return;
        }

        // Check if any selected months are fully paid or partially paid
        const getMonthsInRange = (from: string, to: string) => {
            if (to === 'ongoing') {
                // For ongoing, check from current month to end of academic year
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth() + 1;
                const endYear = currentMonth > 3 ? currentYear + 1 : currentYear;
                const endMonth = 3;

                const months: string[] = [];
                const [startYear, startMonth] = from.split('-').map(Number);
                for (let y = startYear; y <= endYear; y++) {
                    const mStart = (y === startYear) ? startMonth : 1;
                    const mEnd = (y === endYear) ? endMonth : 12;
                    for (let m = mStart; m <= mEnd; m++) {
                        months.push(`${y}-${String(m).padStart(2, '0')}`);
                    }
                }
                return months;
            } else {
                const months: string[] = [];
                const [startYear, startMonth] = from.split('-').map(Number);
                const [endYear, endMonth] = to.split('-').map(Number);
                for (let y = startYear; y <= endYear; y++) {
                    const mStart = (y === startYear) ? startMonth : 1;
                    const mEnd = (y === endYear) ? endMonth : 12;
                    for (let m = mStart; m <= mEnd; m++) {
                        months.push(`${y}-${String(m).padStart(2, '0')}`);
                    }
                }
                return months;
            }
        };

        const selectedMonths = getMonthsInRange(adjustFromMonth, adjustToMonth);
        const paidMonths = selectedMonths.filter(month => {
            const status = monthlyStatus.find(m => m.month === month);
            return status && status.paidAmount > 0;
        });

        if (paidMonths.length > 0) {
            const paidCount = paidMonths.filter(month => {
                const status = monthlyStatus.find(m => m.month === month);
                return status && status.paidAmount >= status.expectedAmount;
            }).length;
            const partialCount = paidMonths.length - paidCount;

            let message = `Warning: You are adjusting months that have payments:\n`;
            if (paidCount > 0) message += `- ${paidCount} fully paid month(s)\n`;
            if (partialCount > 0) message += `- ${partialCount} partially paid month(s)\n`;
            message += `\nReducing the fee may create overpayment. Continue?`;

            if (!window.confirm(message)) {
                return;
            }
        }

        try {
            // Parse month strings (format: "2025-01")
            const [startYear, startMonth] = adjustFromMonth.split('-').map(Number);

            let endYear, endMonth;
            if (adjustToMonth === 'ongoing') {
                // Set to end of current academic year (March of next year)
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth() + 1; // 1-12

                // If we're past March, set to next year's March, otherwise this year's March
                if (currentMonth > 3) {
                    endYear = currentYear + 1;
                    endMonth = 3;
                } else {
                    endYear = currentYear;
                    endMonth = 3;
                }
            } else {
                [endYear, endMonth] = adjustToMonth.split('-').map(Number);
            }

            await feeApi.adjustStudentFee({
                student_id: parseInt(id),
                start_year: startYear,
                start_month: startMonth,
                end_year: endYear,
                end_month: endMonth,
                amount: parseFloat(adjustAmount),
                reason: adjustReason,
            });
            toast.success(adjustToMonth === 'ongoing' ? 'Fee set for ongoing months' : 'Fee adjusted successfully');
            setAdjustDialogOpen(false);
            setAdjustFromMonth('');
            setAdjustToMonth('');
            setAdjustAmount('');
            setAdjustReason('');
            loadData();
        } catch (error) {
            toast.error('Failed to adjust fee');
        }
    };

    const handleToggleReceipt = async (paymentId: string) => {
        try {
            await feeApi.toggleReceipt(parseInt(paymentId));
            toast.success('Receipt status updated');
            loadData();
        } catch (error) {
            toast.error('Failed to update receipt status');
        }
    };

    if (loading) {
        return (
            <AppLayout title="Student Fee" showBack>
                <div className="space-y-4 animate-pulse">
                    <Card>
                        <CardContent className="p-4">
                            <div className="h-20 bg-muted rounded" />
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    if (!studentFee) {
        return (
            <AppLayout title="Student Fee" showBack>
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>Student not found</p>
                    </CardContent>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Student Fee Details" showBack>
            <div className="space-y-4">
                {/* Overview Card */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">{studentFee.studentName}</h2>
                                <p className="text-sm text-muted-foreground">{studentFee.className}</p>
                            </div>
                        </div>

                        {overview && (
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Expected</p>
                                    <p className="text-lg font-bold">{formatCurrency(overview.totalExpected)}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Paid</p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(overview.totalPaid)}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(overview.totalPending)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Payment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div>
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Remarks (Optional)</Label>
                                    <Textarea
                                        value={paymentRemarks}
                                        onChange={(e) => setPaymentRemarks(e.target.value)}
                                        placeholder="Any notes about this payment"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Receipt Issued</Label>
                                    <Switch
                                        checked={paymentReceiptIssued}
                                        onCheckedChange={setPaymentReceiptIssued}
                                    />
                                </div>
                                <Button onClick={handleAddPayment} className="w-full">
                                    Add Payment
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={adjustDialogOpen} onOpenChange={(open) => {
                        if (open) {
                            handleOpenAdjustDialog();
                        } else {
                            setAdjustDialogOpen(false);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                                <Edit className="w-4 h-4 mr-2" />
                                Adjust Fee
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adjust Monthly Fee</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>From Month</Label>
                                        <Select value={adjustFromMonth} onValueChange={setAdjustFromMonth}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getAdjustableMonths().map((mf) => {
                                                    let statusLabel = 'Unpaid';
                                                    if (mf.status === 'paid') statusLabel = 'Paid';
                                                    else if (mf.status === 'partial') statusLabel = 'Partial';

                                                    return (
                                                        <SelectItem key={mf.month} value={mf.month}>
                                                            {formatMonth(mf.month)} ({statusLabel})
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>To Month</Label>
                                        <Select value={adjustToMonth} onValueChange={setAdjustToMonth}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ongoing">
                                                    Ongoing (All Future Months)
                                                </SelectItem>
                                                {getAdjustableMonths().map((mf) => {
                                                    let statusLabel = 'Unpaid';
                                                    if (mf.status === 'paid') statusLabel = 'Paid';
                                                    else if (mf.status === 'partial') statusLabel = 'Partial';

                                                    return (
                                                        <SelectItem key={mf.month} value={mf.month}>
                                                            {formatMonth(mf.month)} ({statusLabel})
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label>New Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        value={adjustAmount}
                                        onChange={(e) => setAdjustAmount(e.target.value)}
                                        placeholder="Enter new monthly amount"
                                    />
                                </div>
                                <div>
                                    <Label>Reason</Label>
                                    <Textarea
                                        value={adjustReason}
                                        onChange={(e) => setAdjustReason(e.target.value)}
                                        placeholder="Reason for adjustment"
                                    />
                                </div>
                                <Button onClick={handleAdjustFee} className="w-full">
                                    Apply Adjustment
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="breakdown" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="breakdown">Monthly Breakdown</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="breakdown" className="mt-4 space-y-2">
                        {monthlyStatus.map((status) => {
                            const fee = monthlyFees.find((mf) => mf.month === status.month);
                            return (
                                <Card key={status.month}>
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{formatMonth(status.month)}</p>
                                                    {isFutureMonth(status.month) && (
                                                        <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                            Future
                                                        </span>
                                                    )}
                                                </div>
                                                {fee?.adjustmentReason && (
                                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                                        Adjusted: {fee.adjustmentReason}
                                                    </p>
                                                )}
                                            </div>
                                            {getStatusBadge(status.status)}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                            <div>
                                                <p className="text-muted-foreground text-xs">Expected</p>
                                                <p className="font-medium">{formatCurrency(status.expectedAmount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs">Paid</p>
                                                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(status.paidAmount)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs">Balance</p>
                                                <p className={`font-medium ${status.balance > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                                    {formatCurrency(status.balance)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="payments" className="mt-4 space-y-2">
                        {payments.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No payments recorded</p>
                                </CardContent>
                            </Card>
                        ) : (
                            payments.map((payment) => (
                                <Card key={payment.id}>
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(payment.amount)}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(payment.date).toLocaleDateString('en-IN')}
                                                </p>
                                                {payment.remarks && (
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {payment.remarks}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleReceipt(payment.id)}
                                                className={payment.receiptIssued ? 'text-emerald-600' : 'text-muted-foreground'}
                                            >
                                                <Receipt className="w-4 h-4 mr-1" />
                                                {payment.receiptIssued ? 'Receipt Issued' : 'No Receipt'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default StudentFeeDetailPage;