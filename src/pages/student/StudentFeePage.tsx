import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/student/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    IndianRupee,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    Receipt,
    TrendingUp,
} from 'lucide-react';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import * as feeApi from '@/lib/feeApi';
import { toast } from 'sonner';

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

const StudentFeePage: React.FC = () => {
    const { student } = useStudentAuth();
    const [monthlyStatus, setMonthlyStatus] = useState<MonthlyFeeStatus[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<{
        totalExpected: number;
        totalPaid: number;
        totalPending: number;
    }>({
        totalExpected: 0,
        totalPaid: 0,
        totalPending: 0,
    });

    useEffect(() => {
        if (student) {
            loadData();
        }
    }, [student]);

    const loadData = async () => {
        if (!student?.id) return;

        setLoading(true);
        try {
            // Fetch student fee overview and payment history
            const [overviewData, paymentHistory] = await Promise.all([
                feeApi.getStudentOverview(parseInt(student.id)),
                feeApi.getPaymentHistory(parseInt(student.id)),
            ]);

            // Map monthly status
            const monthlyStatusMapped: MonthlyFeeStatus[] = overviewData.monthly_status.map((m: any) => ({
                month: `${m.year}-${String(m.month).padStart(2, '0')}`,
                expectedAmount: m.payable,
                paidAmount: m.paid,
                balance: m.balance,
                status: m.status,
            }));

            setMonthlyStatus(monthlyStatusMapped);

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
                totalExpected: overviewData.total_expected,
                totalPaid: overviewData.total_paid,
                totalPending: overviewData.total_pending,
            });
        } catch (error) {
            console.error('Error loading fee data:', error);
            toast.error('Failed to load fee details');
        } finally {
            setLoading(false);
        }
    };

    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
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
                        Due
                    </Badge>
                );
        }
    };

    if (loading) {
        return (
            <StudentLayout title="Fee Status">
                <div className="space-y-4 animate-pulse">
                    <Card>
                        <CardContent className="p-4">
                            <div className="h-32 bg-muted rounded" />
                        </CardContent>
                    </Card>
                </div>
            </StudentLayout>
        );
    }

    if (!student) {
        return (
            <StudentLayout title="Fee Status">
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No fee records found</p>
                    </CardContent>
                </Card>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="Fee Status">
            <div className="space-y-4">
                {/* Overview Card */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold">Fee Overview</h2>
                        </div>

                        {overview && (
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-background/80 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Total Due</p>
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

                {/* Tabs */}
                <Tabs defaultValue="breakdown" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="breakdown">Monthly</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="breakdown" className="mt-4 space-y-2">
                        {monthlyStatus.map((status) => (
                            <Card key={status.month}>
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{formatMonth(status.month)}</p>
                                        {getStatusBadge(status.status)}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Amount</p>
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
                        ))}
                    </TabsContent>

                    <TabsContent value="payments" className="mt-4 space-y-2">
                        {payments.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No payments recorded yet</p>
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
                                            </div>
                                            {payment.receiptIssued && (
                                                <Badge variant="outline" className="text-emerald-600">
                                                    <Receipt className="w-3 h-3 mr-1" />
                                                    Receipt
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </StudentLayout>
    );
};

export default StudentFeePage;