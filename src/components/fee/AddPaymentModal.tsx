import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Search,
    User,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Edit2,
    IndianRupee,
    Calendar,
    ChevronDown,
    AlertTriangle,
    Plus,
    X,
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
    username: string; // Admission number
}

interface MonthlyFeeStatus {
    month: string;
    expectedAmount: number;
    paidAmount: number;
    balance: number;
    status: 'paid' | 'partial' | 'unpaid';
}

interface MonthlyFeeExpectation {
    month: string;
    expectedAmount: number;
}

interface AddPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentAdded: () => void;
    preSelectedStudentId?: string;
}

interface AllocationPreview {
    month: string;
    expectedAmount: number;
    currentBalance: number;
    amountToApply: number;
    newBalance: number;
    willClear: boolean;
}

interface SessionPayment {
    studentName: string;
    className: string;
    amount: number;
    timestamp: Date;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
    open,
    onOpenChange,
    onPaymentAdded,
    preSelectedStudentId,
}) => {
    const [students, setStudents] = useState<StudentFee[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null);
    const [studentSearchOpen, setStudentSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [monthlyStatus, setMonthlyStatus] = useState<MonthlyFeeStatus[]>([]);
    const [monthlyFees, setMonthlyFees] = useState<MonthlyFeeExpectation[]>([]);
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');
    const [receiptIssued, setReceiptIssued] = useState(false);

    const [showAdjustment, setShowAdjustment] = useState(false);
    const [adjustments, setAdjustments] = useState<Record<string, string>>({});
    const [totalPendingFromBackend, setTotalPendingFromBackend] = useState(0);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Bulk payment session state
    const [sessionPayments, setSessionPayments] = useState<SessionPayment[]>([]);
    const [showSessionSummary, setShowSessionSummary] = useState(false);

    // Load students on mount
    useEffect(() => {
        if (open) {
            loadStudents();
            resetForm();
            setSessionPayments([]);
            setShowSessionSummary(false);
        }
    }, [open]);

    // Pre-select student if provided
    useEffect(() => {
        if (preSelectedStudentId && students.length > 0) {
            const student = students.find(s => s.id === preSelectedStudentId);
            if (student) {
                setSelectedStudent(student);
            }
        }
    }, [preSelectedStudentId, students]);

    // Load student fee details when selected
    useEffect(() => {
        if (selectedStudent) {
            loadStudentFeeDetails();
        }
    }, [selectedStudent]);

    // Load students based on search
    useEffect(() => {
        if (!open) return;

        const delayDebounceFn = setTimeout(() => {
            searchStudents(searchQuery);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, open]);

    const searchStudents = async (query: string) => {
        try {
            // Only search if query has length or just load recent/default
            const response = await feeApi.getStudents({
                search: query || undefined,
                per_page: 20, // Limit results for performance
                page: 1
            });

            setStudents(response.data.map((s: any) => ({
                id: s.id.toString(),
                studentName: s.name,
                className: s.class_name,
                username: s.username,
            })));
        } catch (error) {
            console.error('Failed to search students', error);
        }
    };

    // Keep the main load function for initial/specific loads if needed
    const loadStudents = async () => {
        await searchStudents('');
    };

    const loadStudentFeeDetails = async () => {
        if (!selectedStudent) return;
        setLoading(true);
        try {
            const overview = await feeApi.getStudentOverview(parseInt(selectedStudent.id));

            // Convert backend response to component format
            const monthlyStatus: MonthlyFeeStatus[] = overview.monthly_status.map((m: any) => ({
                month: `${m.year}-${String(m.month).padStart(2, '0')}`,
                expectedAmount: m.payable,
                paidAmount: m.paid,
                balance: m.balance,
                status: m.status,
            }));

            const monthlyFees: MonthlyFeeExpectation[] = overview.monthly_status.map((m: any) => ({
                month: `${m.year}-${String(m.month).padStart(2, '0')}`,
                expectedAmount: m.payable,
            }));

            setMonthlyStatus(monthlyStatus);
            setMonthlyFees(monthlyFees);

            // Initialize adjustments with current expected amounts
            const adj: Record<string, string> = {};
            monthlyFees.forEach(f => {
                adj[f.month] = f.expectedAmount.toString();
            });
            setAdjustments(adj);

            // Store the backend's total_pending value (accounts for overpaid status)
            setTotalPendingFromBackend(overview.total_pending || 0);
        } catch (error) {
            console.error('Error loading student fee details:', error);
            // Fallback to empty arrays if API fails
            setMonthlyStatus([]);
            setMonthlyFees([]);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedStudent(null);
        setAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setRemarks('');
        setReceiptIssued(false);
        setShowAdjustment(false);
        setAdjustments({});
        setMonthlyStatus([]);
        setMonthlyFees([]);
    };

    // Calculate allocation preview based on current amount and adjustments
    const allocationPreview = useMemo((): AllocationPreview[] => {
        const paymentAmount = parseFloat(amount) || 0;
        if (paymentAmount <= 0 || monthlyStatus.length === 0) return [];

        let remaining = paymentAmount;
        const preview: AllocationPreview[] = [];

        // Apply adjustments to get effective balances
        const effectiveBalances = monthlyStatus.map(status => {
            const adjustedAmount = parseFloat(adjustments[status.month] || status.expectedAmount.toString());
            const paidAmount = status.paidAmount;
            return {
                ...status,
                expectedAmount: adjustedAmount,
                balance: Math.max(0, adjustedAmount - paidAmount),
            };
        });

        for (const status of effectiveBalances) {
            if (status.balance > 0 && remaining > 0) {
                const amountToApply = Math.min(remaining, status.balance);
                const newBalance = status.balance - amountToApply;

                preview.push({
                    month: status.month,
                    expectedAmount: status.expectedAmount,
                    currentBalance: status.balance,
                    amountToApply,
                    newBalance,
                    willClear: newBalance === 0,
                });

                remaining -= amountToApply;
            }
        }

        return preview;
    }, [amount, monthlyStatus, adjustments]);

    // Use backend's total_pending value which correctly accounts for overpaid students
    // Frontend calculation would incorrectly show pending for partial future month payments
    const totalPending = totalPendingFromBackend;

    const paymentAmount = parseFloat(amount) || 0;
    const isOverpayment = paymentAmount > totalPending;
    const remainingAfterPayment = Math.max(0, totalPending - paymentAmount);

    // Client-side filtering removed in favor of server-side search
    const filteredStudents = students;

    const handleAdjustmentChange = (month: string, value: string) => {
        setAdjustments(prev => ({ ...prev, [month]: value }));
    };

    const handleSubmit = async (addAnother: boolean = false) => {
        if (!selectedStudent) {
            toast.error('Please select a student');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        try {
            // Add the payment directly
            await feeApi.addPayment({
                student_id: parseInt(selectedStudent.id),
                amount: parseFloat(amount),
                payment_date: paymentDate,
                remarks: remarks || undefined,
                receipt_issued: receiptIssued,
            });

            // Add to session payments
            setSessionPayments(prev => [...prev, {
                studentName: selectedStudent.studentName,
                className: selectedStudent.className,
                amount: parseFloat(amount),
                timestamp: new Date(),
            }]);

            toast.success(`Payment of ₹${amount} added for ${selectedStudent.studentName}`);
            onPaymentAdded();

            if (addAnother) {
                // Reset form for next payment but keep modal open
                resetForm();
                setShowSessionSummary(true);
            } else {
                onOpenChange(false);
            }
        } catch (error) {
            toast.error('Failed to add payment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (sessionPayments.length > 0) {
            onPaymentAdded();
        }
        onOpenChange(false);
    };

    const sessionTotal = useMemo(() => {
        return sessionPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [sessionPayments]);

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amt);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <IndianRupee className="w-5 h-5" />
                            Add Payment
                        </span>
                        {sessionPayments.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {sessionPayments.length} added • {formatCurrency(sessionTotal)}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6 max-h-[calc(90vh-200px)]">
                    <div className="space-y-4 pb-4">
                        {/* Session Summary */}
                        {showSessionSummary && sessionPayments.length > 0 && (
                            <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                            Session Payments ({sessionPayments.length})
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => setShowSessionSummary(false)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {sessionPayments.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">{p.studentName}</span>
                                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(p.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>Total Collected</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(sessionTotal)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Student Selector */}
                        <div className="space-y-2">
                            <Label>Select Student</Label>
                            <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between h-auto py-2"
                                    >
                                        {selectedStudent ? (
                                            <div className="flex items-center gap-2 text-left">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{selectedStudent.studentName}</p>
                                                    <p className="text-xs text-muted-foreground">{selectedStudent.className} • Ad.No: {selectedStudent.username}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Search student...</span>
                                        )}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search by name, class, or Ad.No..."
                                            value={searchQuery}
                                            onValueChange={(val) => {
                                                setSearchQuery(val);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && filteredStudents.length > 0) {
                                                    // Auto-select the first result if Enter is pressed
                                                    // but no item was actively selected by the command list
                                                    const student = filteredStudents[0];
                                                    setSelectedStudent(student);
                                                    setStudentSearchOpen(false);
                                                    setSearchQuery('');
                                                }
                                            }}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No student found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredStudents.map((student) => (
                                                    <CommandItem
                                                        key={student.id}
                                                        value={`${student.studentName} ${student.className} ${student.username}`}
                                                        onSelect={() => {
                                                            setSelectedStudent(student);
                                                            setStudentSearchOpen(false);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4" />
                                                            <div>
                                                                <p className="font-medium">{student.studentName}</p>
                                                                <p className="text-xs text-muted-foreground">{student.className} • Ad.No: {student.username}</p>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Student Fee Summary */}
                        {selectedStudent && !loading && monthlyStatus.length > 0 && (
                            <Card className="bg-muted/50">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total Pending</span>
                                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(totalPending)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-muted-foreground">Unpaid months</span>
                                        <span className="text-sm">
                                            {monthlyStatus.filter(s => {
                                                // Only count past/current months that are unpaid or partial
                                                const [year, month] = s.month.split('-').map(Number);
                                                const now = new Date();
                                                const currentYear = now.getFullYear();
                                                const currentMonth = now.getMonth() + 1;

                                                // Check if this month is in the past or current
                                                const isPastOrCurrent = year < currentYear ||
                                                    (year === currentYear && month <= currentMonth);

                                                // Only count if past/current AND not fully paid
                                                return isPastOrCurrent && s.status !== 'paid';
                                            }).length} months
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {loading && (
                            <Card className="animate-pulse">
                                <CardContent className="p-4">
                                    <div className="h-12 bg-muted rounded" />
                                </CardContent>
                            </Card>
                        )}

                        {/* Payment Details */}
                        {selectedStudent && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Remarks (Optional)</Label>
                                    <Textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Any notes..."
                                        rows={2}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label>Receipt Issued</Label>
                                    <Switch checked={receiptIssued} onCheckedChange={setReceiptIssued} />
                                </div>

                                <Separator />

                                {/* Allocation Preview */}
                                {allocationPreview.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Allocation Preview</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowAdjustment(!showAdjustment)}
                                                className="h-7 text-xs"
                                            >
                                                <Edit2 className="w-3 h-3 mr-1" />
                                                {showAdjustment ? 'Hide' : 'Adjust Fees'}
                                            </Button>
                                        </div>

                                        <div className="space-y-1.5">
                                            {allocationPreview.map((preview) => (
                                                <div
                                                    key={preview.month}
                                                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {preview.willClear ? (
                                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                                        )}
                                                        <span>{formatMonth(preview.month)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-muted-foreground">
                                                            {formatCurrency(preview.currentBalance)}
                                                        </span>
                                                        <ArrowRight className="w-3 h-3" />
                                                        <span className={preview.willClear ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                                                            {preview.willClear ? 'Cleared' : formatCurrency(preview.newBalance)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {isOverpayment && (
                                            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>Overpayment of {formatCurrency(paymentAmount - totalPending)}</span>
                                            </div>
                                        )}

                                        {!isOverpayment && remainingAfterPayment > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Remaining balance after payment: {formatCurrency(remainingAfterPayment)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Fee Adjustment Section */}
                                {showAdjustment && monthlyStatus.length > 0 && (
                                    <div className="space-y-2 p-3 border rounded-lg bg-background">
                                        <Label className="text-sm">Adjust Monthly Fees</Label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {monthlyStatus
                                                .filter(s => s.status !== 'paid')
                                                .map((status) => (
                                                    <div key={status.month} className="flex items-center gap-2">
                                                        <span className="text-sm w-20">{formatMonth(status.month)}</span>
                                                        <Input
                                                            type="number"
                                                            value={adjustments[status.month] || ''}
                                                            onChange={(e) => handleAdjustmentChange(status.month, e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                        {parseFloat(adjustments[status.month] || '0') !== status.expectedAmount && (
                                                            <Badge variant="outline" className="text-xs text-amber-600">
                                                                was {formatCurrency(status.expectedAmount)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                        {sessionPayments.length > 0 ? 'Done' : 'Cancel'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={!selectedStudent || !amount || submitting}
                        className="flex-1"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add & Next
                    </Button>
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={!selectedStudent || !amount || submitting}
                        className="flex-1"
                    >
                        {submitting ? 'Adding...' : 'Add & Close'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};