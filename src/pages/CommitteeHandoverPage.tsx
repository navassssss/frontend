import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    Building2,
    IndianRupee,
    Plus,
    Calendar,
    Search,
    Download,
    FileSpreadsheet,
    Trash2,
    CheckCircle2,
    Receipt,
    ArrowUpRight,
    Wallet,
    Landmark,
    CreditCard,
    ArrowLeft,
    Clock,
    X,
} from 'lucide-react';
import * as feeApi from '@/lib/feeApi';
import { CommitteeHandoverItem, HandoverSummary } from '@/lib/feeApi';
import { cn } from '@/lib/utils';

export const CommitteeHandoverPage: React.FC = () => {
    const navigate = useNavigate();
    const todayStr = new Date().toISOString().split('T')[0];

    // State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentModeFilter, setPaymentModeFilter] = useState('all');

    const [handovers, setHandovers] = useState<CommitteeHandoverItem[]>([]);
    const [summary, setSummary] = useState<HandoverSummary | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        handover_date: todayStr,
        amount: '',
        recipient_name: 'Manager',
        payment_mode: 'cash' as 'cash' | 'bank_transfer' | 'cheque' | 'upi',
        reference_number: '',
        remarks: '',
    });

    useEffect(() => {
        loadData();
    }, [startDate, endDate, paymentModeFilter, searchQuery]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([
                feeApi.getHandovers({
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    paymentMode: paymentModeFilter !== 'all' ? paymentModeFilter : undefined,
                    search: searchQuery || undefined,
                }),
                feeApi.getHandoverSummary(),
            ]);

            setHandovers(listRes.data || []);
            setSummary(summaryRes.summary || null);
        } catch (error) {
            console.error('Error loading handover data:', error);
            toast.error('Failed to load handover records');
        } finally {
            setLoading(false);
        }
    };

    const setPresetRange = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (preset === 'today') {
            setStartDate(today);
            setEndDate(today);
        } else if (preset === 'yesterday') {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = y.toISOString().split('T')[0];
            setStartDate(yStr);
            setEndDate(yStr);
        } else if (preset === 'week') {
            const w = new Date(now);
            w.setDate(w.getDate() - 7);
            setStartDate(w.toISOString().split('T')[0]);
            setEndDate(today);
        } else if (preset === 'month') {
            const m = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(m.toISOString().split('T')[0]);
            setEndDate(today);
        } else if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleCreateHandover = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(formData.amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!formData.recipient_name.trim()) {
            toast.error('Please specify the recipient name');
            return;
        }

        setSubmitting(true);
        try {
            await feeApi.createHandover({
                handover_date: formData.handover_date,
                amount: numericAmount,
                recipient_name: formData.recipient_name.trim(),
                payment_mode: formData.payment_mode,
                reference_number: formData.reference_number.trim() || undefined,
                remarks: formData.remarks.trim() || undefined,
            });

            toast.success('Committee handover recorded successfully!');
            setIsAddModalOpen(false);
            setFormData({
                handover_date: todayStr,
                amount: '',
                recipient_name: 'Manager',
                payment_mode: 'cash',
                reference_number: '',
                remarks: '',
            });
            loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to record handover');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this handover entry? This will adjust the balance.')) {
            return;
        }

        try {
            await feeApi.deleteHandover(id);
            toast.success('Handover entry deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete handover entry');
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

    // Export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18);
        doc.text('Committee Cash Handover Report', pageWidth / 2, 20, { align: 'center' });

        const datePeriod = startDate && endDate
            ? `Period: ${startDate} to ${endDate}`
            : 'Period: All Time';
        doc.setFontSize(11);
        doc.text(datePeriod, pageWidth / 2, 28, { align: 'center' });

        // Summary
        if (summary) {
            autoTable(doc, {
                startY: 36,
                head: [['Total Cash Collected', 'Total Handed to Committee', 'Cash Balance in Hand']],
                body: [[
                    formatCurrency(summary.total_collected),
                    formatCurrency(summary.total_handed_over),
                    formatCurrency(summary.balance_in_hand),
                ]],
                theme: 'grid',
                headStyles: { fillColor: [15, 118, 110] },
            });
        }

        // Table
        if (handovers.length > 0) {
            autoTable(doc, {
                startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 55,
                head: [['Date', 'Recipient', 'Mode', 'Ref No.', 'Amount', 'Remarks']],
                body: handovers.map((item) => [
                    item.handover_date,
                    item.recipient_name,
                    item.payment_mode.replace('_', ' ').toUpperCase(),
                    item.reference_number || '-',
                    formatCurrency(item.amount),
                    item.remarks || '-',
                ]),
                theme: 'striped',
                headStyles: { fillColor: [15, 118, 110] },
            });
        }

        doc.save(`Committee_Handovers_${startDate || 'all'}_to_${endDate || 'all'}.pdf`);
        toast.success('PDF downloaded successfully');
    };

    // Export Excel
    const exportExcel = () => {
        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['Committee Cash Handover Report'],
            ['Period', startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'],
            [''],
            ['Total Cash Collected', summary?.total_collected || 0],
            ['Total Handed to Committee', summary?.total_handed_over || 0],
            ['Manager Balance in Hand', summary?.balance_in_hand || 0],
        ];
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        // Handovers Sheet
        const handoverData = [
            ['Date', 'Recipient Name', 'Payment Mode', 'Reference No', 'Amount', 'Remarks', 'Recorded By'],
            ...handovers.map((h) => [
                h.handover_date,
                h.recipient_name,
                h.payment_mode,
                h.reference_number || '',
                h.amount,
                h.remarks || '',
                h.handed_over_by_user?.name || '',
            ]),
        ];
        const handoverWs = XLSX.utils.aoa_to_sheet(handoverData);
        XLSX.utils.book_append_sheet(wb, handoverWs, 'Handovers');

        XLSX.writeFile(wb, `Committee_Handovers_${startDate || 'all'}.xlsx`);
        toast.success('Excel downloaded successfully');
    };

    return (
        <AppLayout title="Committee Handover Manager" showBack onBack={() => navigate('/fees')}>
            <div className="space-y-5 pb-12">
                {/* Header Controls & Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Committee Handover Ledger</h2>
                        <p className="text-xs text-muted-foreground">
                            Track cash collected vs funds handed over to management committee
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Record Handover
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/fees/reports')}
                            className="shadow-sm text-xs"
                        >
                            Reports
                        </Button>
                    </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Total Collected */}
                    <Card className="bg-card shadow-sm border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Total Cash Collected</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {formatCurrency(summary?.total_collected || 0)}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Wallet className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Total Handed Over */}
                    <Card className="bg-card shadow-sm border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Handed Over to Committee</p>
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                        {formatCurrency(summary?.total_handed_over || 0)}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                                    <Landmark className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Manager Balance in Hand */}
                    <Card className="bg-card shadow-sm border border-emerald-200 dark:border-emerald-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Cash Balance in Hand</p>
                                    <p className={cn(
                                        "text-2xl font-bold",
                                        (summary?.balance_in_hand || 0) >= 0
                                            ? "text-emerald-700 dark:text-emerald-400"
                                            : "text-red-600 dark:text-red-400"
                                    )}>
                                        {formatCurrency(summary?.balance_in_hand || 0)}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Export Controls */}
                <div className="bg-card border rounded-lg p-3 space-y-3 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        {/* Date Inputs */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>Period:</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-8 text-xs w-[130px]"
                                />
                                <span className="text-xs text-muted-foreground">to</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-8 text-xs w-[130px]"
                                />
                            </div>

                            {/* Presets */}
                            <div className="flex items-center gap-1 ml-1">
                                <Button
                                    variant={!startDate && !endDate ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPresetRange('all')}
                                    className="h-7 text-[11px] px-2.5"
                                >
                                    All Time
                                </Button>
                                <Button
                                    variant={startDate === todayStr && endDate === todayStr ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPresetRange('today')}
                                    className="h-7 text-[11px] px-2.5"
                                >
                                    Today
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPresetRange('month')}
                                    className="h-7 text-[11px] px-2.5"
                                >
                                    This Month
                                </Button>
                            </div>
                        </div>

                        {/* Search and Exports */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="relative min-w-[160px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 h-8 text-xs"
                                />
                            </div>

                            <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
                                <SelectTrigger className="h-8 w-[120px] text-xs">
                                    <SelectValue placeholder="All Modes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Modes</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                </SelectContent>
                            </Select>

                            {handovers.length > 0 && (
                                <div className="flex gap-1.5">
                                    <Button variant="outline" size="sm" onClick={exportPDF} className="h-8 text-xs px-2.5">
                                        <Download className="w-3.5 h-3.5 mr-1" />
                                        PDF
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={exportExcel} className="h-8 text-xs px-2.5">
                                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                                        Excel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Handover Entries Table */}
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>
                        ))}
                    </div>
                ) : handovers.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground space-y-2">
                            <Building2 className="w-12 h-12 mx-auto opacity-40 text-muted-foreground" />
                            <p className="font-medium text-base">No handover records found</p>
                            <p className="text-xs text-muted-foreground">Click "Record Handover" above to log funds given to the committee.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Handed Over To</th>
                                        <th className="px-4 py-3">Mode</th>
                                        <th className="px-4 py-3">Ref / Receipt #</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3">Remarks</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {handovers.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                                                {formatDisplayDate(item.handover_date)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {item.recipient_name}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge variant="outline" className="text-[11px] font-normal capitalize">
                                                    {item.payment_mode.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                                                {item.reference_number || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                {formatCurrency(item.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={item.remarks || ''}>
                                                {item.remarks || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Record Handover */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-emerald-600" />
                                Record Committee Handover
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsAddModalOpen(false)}
                                className="h-8 w-8"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateHandover} className="space-y-4 text-sm">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Handover Date *</label>
                                <Input
                                    type="date"
                                    value={formData.handover_date}
                                    onChange={(e) => setFormData({ ...formData, handover_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Amount (₹) *</label>
                                <Input
                                    type="number"
                                    step="1"
                                    placeholder="e.g. 50000"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Handed Over To (Recipient) *</label>
                                <Input
                                    placeholder="e.g. Manager"
                                    value={formData.recipient_name}
                                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Payment Mode *</label>
                                    <Select
                                        value={formData.payment_mode}
                                        onValueChange={(val: any) => setFormData({ ...formData, payment_mode: val })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                            <SelectItem value="upi">UPI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Ref / Receipt #</label>
                                    <Input
                                        placeholder="Optional"
                                        value={formData.reference_number}
                                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Remarks / Notes</label>
                                <Input
                                    placeholder="e.g. Monthly batch deposit given to committee"
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {submitting ? 'Saving...' : 'Save Handover Entry'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};
