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
import { cn } from '@/lib/utils';
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
    ArrowLeft,
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
    monthlyFee: number;
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

    // Monthly Fee dialog
    const [monthlyFeeDialogOpen, setMonthlyFeeDialogOpen] = useState(false);
    const [newMonthlyFee, setNewMonthlyFee] = useState('');

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
                    monthlyFee: overview.student.monthly_fee || 0,
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

    // Check if month is current month
    const isCurrentMonth = (monthStr: string) => {
        const current = getCurrentMonth();
        return monthStr === current;
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

    const toTitleCase = (str: string) => {
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const getStatusBadge = (status: 'paid' | 'partial' | 'unpaid') => {
        switch (status) {
            case 'paid':
                return (
                    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                    </Badge>
                );
            case 'partial':
                return (
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Partial
                    </Badge>
                );
            case 'unpaid':
                return (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">
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
                receipt_issued: paymentReceiptIssued,
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
        if (!id || !adjustFromMonth || !adjustToMonth || !adjustAmount) {
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
                // For ongoing, create 12 months from the start date
                const months: string[] = [];
                const [startYear, startMonth] = from.split('-').map(Number);

                let tempYear = startYear;
                let tempMonth = startMonth + 11; // 11 months ahead (total 12 months)

                let endYear, endMonth;
                if (tempMonth > 12) {
                    endYear = tempYear + Math.floor(tempMonth / 12);
                    endMonth = tempMonth % 12;
                    if (endMonth === 0) {
                        endMonth = 12;
                        endYear--;
                    }
                } else {
                    endYear = tempYear;
                    endMonth = tempMonth;
                }

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
                // Set to 12 months from the start date
                let tempYear = startYear;
                let tempMonth = startMonth + 11; // 11 months ahead (total 12 months including start)

                // Handle month overflow
                if (tempMonth > 12) {
                    endYear = tempYear + Math.floor(tempMonth / 12);
                    endMonth = tempMonth % 12;
                    if (endMonth === 0) {
                        endMonth = 12;
                        endYear--;
                    }
                } else {
                    endYear = tempYear;
                    endMonth = tempMonth;
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

    const handleUpdateMonthlyFee = async () => {
        if (!id || !newMonthlyFee || parseFloat(newMonthlyFee) < 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            await feeApi.updateStudentMonthlyFee(parseInt(id), parseFloat(newMonthlyFee));
            toast.success('Monthly fee updated successfully');
            setMonthlyFeeDialogOpen(false);
            setNewMonthlyFee('');
            loadData();
        } catch (error) {
            toast.error('Failed to update monthly fee');
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
                {/* Back Button for Desktop */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/fees')}
                    className="hidden lg:flex items-center gap-1 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Fee Management
                </Button>

                {/* Overview Card */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">{toTitleCase(studentFee.studentName)}</h2>
                                <p className="text-sm text-muted-foreground">Class {studentFee.className}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md">
                                <div>
                                    <p className="text-xs text-muted-foreground">Fixed Monthly Fee</p>
                                    <p className="font-semibold">{formatCurrency(studentFee.monthlyFee)}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-1"
                                    onClick={() => {
                                        setNewMonthlyFee(studentFee.monthlyFee.toString());
                                        setMonthlyFeeDialogOpen(true);
                                    }}
                                >
                                    <Edit className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {overview && (
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Expected</p>
                                    <p className="text-lg font-bold">{formatCurrency(overview.totalExpected)}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${overview.totalPaid > 0
                                    ? 'bg-green-50 dark:bg-green-900/20'
                                    : 'bg-gray-50 dark:bg-gray-900/20'
                                    }`}>
                                    <p className="text-xs text-muted-foreground">Paid</p>
                                    <p className={`text-lg font-bold ${overview.totalPaid > 0
                                        ? 'text-green-700 dark:text-green-400'
                                        : 'text-muted-foreground'
                                        }`}>
                                        {formatCurrency(overview.totalPaid)}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${overview.totalPending > 0
                                    ? 'bg-amber-50 dark:bg-amber-900/20'
                                    : overview.totalPending < 0
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'bg-gray-50 dark:bg-gray-900/20'
                                    }`}>
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                    <p className={`text-lg font-bold ${overview.totalPending > 0
                                        ? 'text-amber-700 dark:text-amber-400'
                                        : overview.totalPending < 0
                                            ? 'text-blue-700 dark:text-blue-400'
                                            : 'text-muted-foreground'
                                        }`}>
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
                            <Button size="sm">
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
                            <Button variant="outline" size="sm">
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
                                    <Label>Reason (Optional)</Label>
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

                    <Dialog open={monthlyFeeDialogOpen} onOpenChange={setMonthlyFeeDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update Monthly Fee</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>Monthly Fee Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        value={newMonthlyFee}
                                        onChange={(e) => setNewMonthlyFee(e.target.value)}
                                        placeholder="Enter monthly fee"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This amount will be used as the default fee for future months.
                                    </p>
                                </div>
                                <Button onClick={handleUpdateMonthlyFee} className="w-full">
                                    Update Fee
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="breakdown" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-transparent border-b rounded-none h-auto p-0">
                        <TabsTrigger
                            value="breakdown"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Monthly Breakdown
                        </TabsTrigger>
                        <TabsTrigger
                            value="payments"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Payments
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="breakdown" className="mt-4">
                        <div className="border rounded-lg overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-5 gap-4 p-3 bg-muted/30 border-b font-medium text-sm">
                                <div>Month</div>
                                <div className="text-right">Expected</div>
                                <div className="text-right">Paid</div>
                                <div className="text-right">Balance</div>
                                <div className="text-right">Status</div>
                            </div>

                            {/* Table Rows */}
                            {monthlyStatus.map((status) => (
                                <div
                                    key={status.month}
                                    className={cn(
                                        "grid grid-cols-5 gap-4 p-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors",
                                        isCurrentMonth(status.month) && "bg-amber-50/30 dark:bg-amber-900/10"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{formatMonth(status.month)}</span>
                                        {isFutureMonth(status.month) && (
                                            <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                                                Future
                                            </Badge>
                                        )}
                                        {isCurrentMonth(status.month) && (
                                            <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">
                                                Current
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-right font-medium">
                                        {formatCurrency(status.expectedAmount)}
                                    </div>
                                    <div className={cn(
                                        "text-right font-medium",
                                        status.paidAmount > 0 ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                                    )}>
                                        {formatCurrency(status.paidAmount)}
                                    </div>
                                    <div className={cn(
                                        "text-right font-medium",
                                        status.balance > 0 ? "text-amber-700 dark:text-amber-400" :
                                            status.balance < 0 ? "text-blue-700 dark:text-blue-400" :
                                                "text-muted-foreground"
                                    )}>
                                        {formatCurrency(status.balance)}
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(status.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="payments" className="mt-4">
                        <div className="border rounded-lg overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 border-b font-medium text-sm">
                                <div>Amount</div>
                                <div>Date</div>
                                <div>Remarks</div>
                                <div className="text-right">Receipt</div>
                            </div>

                            {payments.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground bg-background">
                                    <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No payments recorded</p>
                                </div>
                            ) : (
                                payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0 hover:bg-muted/20 items-center transition-colors bg-background"
                                    >
                                        <div className="font-bold text-green-700 dark:text-green-400">
                                            {formatCurrency(payment.amount)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(payment.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm text-muted-foreground truncate">
                                            {payment.remarks || '-'}
                                        </div>
                                        <div className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleReceipt(payment.id)}
                                                className={cn(
                                                    "h-8 px-2 text-xs",
                                                    payment.receiptIssued
                                                        ? 'text-green-700 hover:text-green-800 hover:bg-green-50'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                {payment.receiptIssued ? (
                                                    <>
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                        Issued
                                                    </>
                                                ) : (
                                                    <>
                                                        <Receipt className="w-3.5 h-3.5 mr-1.5" />
                                                        Issue
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div >
        </AppLayout >
    );
};

export default StudentFeeDetailPage;