import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
    Search,
    Printer,
    History,
    Calendar,
    ArrowLeft,
    Clock,
    CheckCircle2,
    X,
    Filter,
    ChevronLeft,
    ChevronRight,
    Trash2,
} from 'lucide-react';
import * as feeApi from '@/lib/feeApi';
import { cn } from '@/lib/utils';

export const ReceiptsManagerPage: React.FC = () => {
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = useState<'select' | 'history'>('select');

    // Select tab state
    const [payments, setPayments] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'issued' | 'all'>('pending');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingPayments, setLoadingPayments] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPayments, setTotalPayments] = useState(0);
    const paymentsPerPage = 20;

    // History tab state
    const [batches, setBatches] = useState<feeApi.ReceiptBatch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    useEffect(() => {
        loadClasses();
    }, []);

    // Reset pagination to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, classFilter, searchQuery]);

    useEffect(() => {
        if (activeTab === 'select') {
            loadPayments();
        } else {
            loadBatches();
        }
    }, [activeTab, statusFilter, classFilter, searchQuery, currentPage]);

    const loadClasses = async () => {
        try {
            const classList = await feeApi.getClasses();
            setClasses(classList.map((c: any) => ({ id: c.id.toString(), name: c.name })));
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const loadPayments = async () => {
        setLoadingPayments(true);
        try {
            const params: any = {
                page: currentPage,
                per_page: paymentsPerPage,
            };
            if (statusFilter === 'pending') {
                params.receipt_issued = false;
            } else if (statusFilter === 'issued') {
                params.receipt_issued = true;
            }

            if (classFilter !== 'all') {
                params.className = classFilter;
            }

            if (searchQuery) {
                params.search = searchQuery;
            }

            const data = await feeApi.getPayments(params);
            setPayments(data.payments || []);
            setTotalPages(data.last_page || 1);
            setTotalPayments(data.total || 0);
            setSelectedIds([]); // Reset selection when filters or pages change
        } catch (error) {
            console.error('Failed to load payments', error);
            toast.error('Failed to load payments list');
        } finally {
            setLoadingPayments(false);
        }
    };

    const loadBatches = async () => {
        setLoadingBatches(true);
        try {
            const data = await feeApi.getReceiptBatches();
            setBatches(data || []);
        } catch (error) {
            console.error('Failed to load receipt batches', error);
            toast.error('Failed to load print batches');
        } finally {
            setLoadingBatches(false);
        }
    };

    const handleDeleteBatch = async (batchId: number) => {
        if (!confirm("Are you sure you want to delete this print batch? Associated payments will become 'Pending Print' again. This does NOT delete the actual payment records.")) {
            return;
        }

        try {
            await feeApi.deleteReceiptBatch(batchId);
            toast.success("Print batch deleted successfully");
            loadBatches();
        } catch (error) {
            console.error("Failed to delete print batch", error);
            toast.error("Failed to delete print batch");
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(payments.map(p => p.paymentId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectPayment = (paymentId: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, paymentId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== paymentId));
        }
    };

    const handleGenerateBatch = async () => {
        if (selectedIds.length === 0) return;

        try {
            const res = await feeApi.createReceiptBatch({
                payment_ids: selectedIds,
            });

            toast.success(`Batch generated with ${selectedIds.length} receipts`);
            
            // Navigate to print view in a new window/tab
            window.open(`/fees/receipts/print/${res.batch_id}`, '_blank');
            
            // Reload local payments list
            loadPayments();
        } catch (error) {
            console.error('Failed to generate batch', error);
            toast.error('Failed to create receipt print batch');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDisplayDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout title="Receipt Printing & History" showBack>
            <div className="space-y-4">
                {/* Back Button for Desktop */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/fees')}
                    className="hidden lg:flex items-center gap-1 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Monthly Donations
                </Button>

                {/* Clean tabs header */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('select')}
                        className={cn(
                            "px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-2",
                            activeTab === 'select'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Printer className="w-4 h-4" />
                        Select Payments
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-2",
                            activeTab === 'history'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <History className="w-4 h-4" />
                        Print History / Batches
                    </button>
                </div>

                {/* Tab content 1: Select Payments */}
                {activeTab === 'select' && (
                    <div className="space-y-4 pb-20">
                        {/* Filters */}
                        <div className="flex gap-2 items-center flex-wrap">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by student name or adm. no..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                                <SelectTrigger className="w-[130px] h-9">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending Print</SelectItem>
                                    <SelectItem value="issued">Printed</SelectItem>
                                    <SelectItem value="all">All Payments</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={classFilter} onValueChange={setClassFilter}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.name}>
                                            Class {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payments List */}
                        {loadingPayments ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
                                ))}
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                                <Printer className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground font-medium">No payments match your criteria</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Card className="overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse text-left">
                                            <thead>
                                                <tr className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    <th className="p-3 w-12 text-center">
                                                        <Checkbox
                                                            checked={selectedIds.length === payments.length && payments.length > 0}
                                                            onCheckedChange={handleSelectAll}
                                                        />
                                                    </th>
                                                    <th className="p-3">Receipt No.</th>
                                                    <th className="p-3">Student Name</th>
                                                    <th className="p-3">Class</th>
                                                    <th className="p-3">Date</th>
                                                    <th className="p-3">Allocations</th>
                                                    <th className="p-3">Amount</th>
                                                    <th className="p-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {payments.map((p) => (
                                                    <tr key={p.paymentId} className="hover:bg-muted/10 transition-colors">
                                                        <td className="p-3 text-center">
                                                            <Checkbox
                                                                checked={selectedIds.includes(p.paymentId)}
                                                                onCheckedChange={(checked) => handleSelectPayment(p.paymentId, !!checked)}
                                                            />
                                                        </td>
                                                        <td className="p-3 font-semibold text-muted-foreground">
                                                            REC-{p.paymentId.toString().padStart(6, '0')}
                                                        </td>
                                                        <td className="p-3">
                                                            <div>
                                                                <span className="font-medium text-foreground">{p.studentName}</span>
                                                                <span className="text-xs text-muted-foreground block">Adm: {p.admission_no || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-muted-foreground">Class {p.className}</td>
                                                        <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDisplayDate(p.date)}</td>
                                                        <td className="p-3 text-xs max-w-[200px] truncate" title={p.allocations}>
                                                            {p.allocations || '-'}
                                                        </td>
                                                        <td className="p-3 font-bold text-foreground">{formatCurrency(p.amount)}</td>
                                                        <td className="p-3">
                                                            {p.receiptIssued ? (
                                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Printed
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                                                    <Clock className="w-3 h-3" /> Pending
                                                                </Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-2 py-4 bg-transparent border-t">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            Showing page {currentPage} of {totalPages} ({totalPayments} total payments)
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="text-xs font-semibold px-2 min-w-[2rem] text-center">
                                                {currentPage}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Floating Selection Banner */}
                        {selectedIds.length > 0 && (
                            <div className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground py-3 px-4 rounded-xl shadow-lg border border-primary/20 flex items-center justify-between z-50 animate-in slide-in-from-bottom duration-200">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{selectedIds.length} payments selected</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setSelectedIds([])}
                                        className="h-8 text-xs font-semibold"
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleGenerateBatch}
                                        className="h-8 text-xs font-semibold bg-white text-primary hover:bg-slate-100 gap-1.5"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        Generate Batch &amp; Print
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab content 2: Print History */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {loadingBatches ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
                                ))}
                            </div>
                        ) : batches.length === 0 ? (
                            <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                                <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground font-medium">No print batches recorded yet</p>
                            </div>
                        ) : (
                            <Card className="overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse text-left">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                <th className="p-3">Batch ID</th>
                                                <th className="p-3">Generated At</th>
                                                <th className="p-3">Generated By</th>
                                                <th className="p-3">Total Receipts</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {batches.map((batch) => (
                                                <tr key={batch.id} className="hover:bg-muted/10 transition-colors">
                                                    <td className="p-3 font-semibold text-muted-foreground">
                                                        #BATCH-{batch.id.toString().padStart(4, '0')}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap">{formatDisplayDateTime(batch.generated_at)}</td>
                                                    <td className="p-3 text-muted-foreground">{batch.generated_by_user?.name || 'System'}</td>
                                                    <td className="p-3">
                                                        <Badge variant="secondary" className="font-semibold">
                                                            {batch.payments_count} Receipts
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => window.open(`/fees/receipts/print/${batch.id}`, '_blank')}
                                                            className="h-8 gap-1"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            Reprint Batch
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() => handleDeleteBatch(batch.id)}
                                                            className="h-8 w-8 border-destructive text-destructive hover:bg-destructive/10"
                                                            title="Delete Batch"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};
