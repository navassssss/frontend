import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Users,
    Building2,
    Calendar,
    Receipt,
    FileText,
    AlertCircle,
    CheckCircle,
    Download,
    FileSpreadsheet,
    Clock,
    ArrowLeft,
    Trash2,
} from 'lucide-react';
import * as feeApi from '@/lib/feeApi';
import { cn } from '@/lib/utils';

interface OverallFinancialSummary {
    total_expected: number;
    total_paid: number;
    total_pending: number;
    collection_percentage: number;
}

interface ClassWiseSummary {
    class_id: number;
    class_name: string;
    className: string;
    students: any[];
    total_expected: number;
    total_paid: number;
    total_pending: number;
    totalExpected: number;
    totalPaid: number;
    totalPending: number;
}

interface DailyCollectionSummary {
    date?: string;
    start_date?: string;
    end_date?: string;
    is_range?: boolean;
    total_students: number;
    total_entries?: number;
    total_amount: number;
    totalStudents: number;
    totalEntries?: number;
    totalAmount: number;
    payments: {
        paymentId: number;
        studentName: string;
        className: string;
        amount: number;
        date?: string;
        receiptIssued: boolean;
        remarks: string | null;
        enteredBy: string;
        time: string;
        allocations: string;
    }[];
}

// ==================== Export Utilities ====================
const formatCurrencyPlain = (amount: number) => {
    // Plain number formatting without currency symbol for PDF
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
    }).format(amount);
};

const exportClassWiseToPDF = (report: ClassWiseSummary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Section - Black and White
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, 25);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DARUL HASANATH ISLAMIC COLLEGE', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('DONATION COLLECTION REPORT', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Class: ${report.className}`, pageWidth / 2, 31, { align: 'center' });

    // Date and info
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })}`, 14, 42);
    doc.text(`Total Students: ${report.students.length}`, pageWidth - 14, 42, { align: 'right' });

    // Student Details Section (Main Content)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Details', 14, 50);

    autoTable(doc, {
        startY: 54,
        head: [['Sl.', 'Student Name', 'Monthly Fee', 'Pending', 'Status']],
        body: report.students.map((s, index) => [
            (index + 1).toString(),
            s.studentName,
            formatCurrencyPlain(s.monthlyPayable),
            formatCurrencyPlain(s.totalPending),
            s.totalPending > 0 ? 'Due' : 'Cleared',
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
            fontStyle: 'bold',
            halign: 'center',
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 80 },
            2: { halign: 'right', cellWidth: 30 },
            3: { halign: 'right', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 25 },
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
    });

    // Financial Summary at Bottom of Last Page
    const finalY = (doc as any).lastAutoTable.finalY;
    const pageHeight = doc.internal.pageSize.getHeight();
    const summaryHeight = 35;

    // Check if we need a new page for summary
    if (finalY + summaryHeight > pageHeight - 30) {
        doc.addPage();
    }

    const summaryY = (doc.internal as any).getNumberOfPages() > 1
        ? pageHeight - 45
        : Math.max(finalY + 15, pageHeight - 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 14, summaryY);

    autoTable(doc, {
        startY: summaryY + 4,
        head: [['Total Expected', 'Total Collected', 'Total Pending', 'Collection %']],
        body: [[
            formatCurrencyPlain(report.totalExpected),
            formatCurrencyPlain(report.totalPaid),
            formatCurrencyPlain(report.totalPending),
            `${((report.totalPaid / report.totalExpected) * 100).toFixed(1)}%`,
        ]],
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
        },
        bodyStyles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 9,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
        },
    });

    // Footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`${report.className}_Donation_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
};

const exportClassWiseToExcel = (report: ClassWiseSummary) => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ['Class', report.className],
        ['Generated', new Date().toLocaleDateString('en-IN')],
        [''],
        ['Total Expected', report.totalExpected],
        ['Total Collected', report.totalPaid],
        ['Total Pending', report.totalPending],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Students Sheet
    const studentsData = [
        ['Student Name', 'Monthly Donation', 'Total Expected', 'Total Paid', 'Pending', 'Status'],
        ...report.students.map((s) => [
            s.studentName,
            s.monthlyPayable,
            s.totalExpected,
            s.totalPaid,
            s.totalPending,
            s.totalPending > 0 ? 'Due' : 'Cleared',
        ]),
    ];
    const studentsWs = XLSX.utils.aoa_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(wb, studentsWs, 'Students');

    XLSX.writeFile(wb, `${report.className}_Donation_Report.xlsx`);
    toast.success('Excel downloaded successfully');
};

const exportDailyToPDF = (report: DailyCollectionSummary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const isRange = report.is_range || (report.start_date && report.end_date && report.start_date !== report.end_date);
    const titleText = isRange ? 'Collection Report' : 'Daily Collection Report';
    
    let displayDate = '';
    const dateToFormat = report.date || report.start_date;
    if (isRange && report.start_date && report.end_date) {
        displayDate = `${report.start_date} to ${report.end_date}`;
    } else if (dateToFormat) {
        try {
            displayDate = new Date(dateToFormat).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            displayDate = dateToFormat;
        }
    }

    // Title
    doc.setFontSize(18);
    doc.text(titleText, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(displayDate, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(12);
    doc.text('Summary', 14, 42);

    autoTable(doc, {
        startY: 47,
        head: [['Total Students', 'Total Amount Collected']],
        body: [[
            report.totalStudents.toString(),
            formatCurrencyPlain(report.totalAmount),
        ]],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
    });

    // Payment Details
    if (report.payments.length > 0) {
        doc.setFontSize(12);
        doc.text('Payment Details', 14, (doc as any).lastAutoTable.finalY + 15);

        const headRow = isRange 
            ? ['Date', 'Time', 'Student Name', 'Class', 'Allocations', 'Amount', 'Receipt', 'Remarks']
            : ['Time', 'Student Name', 'Class', 'Allocations', 'Amount', 'Receipt', 'Remarks'];

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [headRow],
            body: report.payments.map((p) => {
                const row = [
                    p.time,
                    p.studentName,
                    p.className,
                    p.allocations,
                    formatCurrencyPlain(p.amount),
                    p.receiptIssued ? 'Yes' : 'No',
                    p.remarks || '-',
                ];
                if (isRange) {
                    row.unshift(p.date || '-');
                }
                return row;
            }),
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] },
            columnStyles: isRange ? {
                0: { cellWidth: 22 }, // Date
                1: { cellWidth: 18 }, // Time
                2: { cellWidth: 35 }, // Name
                3: { cellWidth: 15 }, // Class
                4: { cellWidth: 45 }, // Allocations
                5: { halign: 'right', cellWidth: 20 }, // Amount
                6: { halign: 'center', cellWidth: 15 }, // Receipt
                7: { cellWidth: 'auto' }, // Remarks
            } : {
                0: { cellWidth: 20 }, // Time
                1: { cellWidth: 40 }, // Name
                2: { cellWidth: 15 }, // Class
                3: { cellWidth: 50 }, // Allocations
                4: { halign: 'right', cellWidth: 20 }, // Amount
                5: { halign: 'center', cellWidth: 15 }, // Receipt
                6: { cellWidth: 'auto' }, // Remarks
            },
        });
    }

    const filenameDate = isRange ? `${report.start_date}_to_${report.end_date}` : (report.date || 'report');
    doc.save(`Collection_Report_${filenameDate}.pdf`);
    toast.success('PDF downloaded successfully');
};

const exportDailyToExcel = (report: DailyCollectionSummary) => {
    const wb = XLSX.utils.book_new();

    const isRange = report.is_range || (report.start_date && report.end_date && report.start_date !== report.end_date);
    const titleText = isRange ? 'Collection Report' : 'Daily Collection Report';
    
    let displayDate = '';
    const dateToFormat = report.date || report.start_date;
    if (isRange && report.start_date && report.end_date) {
        displayDate = `${report.start_date} to ${report.end_date}`;
    } else if (dateToFormat) {
        try {
            displayDate = new Date(dateToFormat).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            displayDate = dateToFormat;
        }
    }

    // Summary Sheet
    const summaryData = [
        [titleText],
        ['Period', displayDate],
        [''],
        ['Total Students Paid', report.totalStudents],
        ['Total Amount Collected', report.totalAmount],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Payments Sheet
    if (report.payments.length > 0) {
        const headRow = isRange 
            ? ['Date', 'Time', 'Student Name', 'Class', 'Allocations', 'Amount', 'Receipt Issued', 'Remarks']
            : ['Time', 'Student Name', 'Class', 'Allocations', 'Amount', 'Receipt Issued', 'Remarks'];

        const paymentsData = [
            headRow,
            ...report.payments.map((p) => {
                const row = [
                    p.time,
                    p.studentName,
                    p.className,
                    p.allocations,
                    p.amount,
                    p.receiptIssued ? 'Yes' : 'No',
                    p.remarks || '',
                ];
                if (isRange) {
                    row.unshift(p.date || '');
                }
                return row;
            }),
        ];
        const paymentsWs = XLSX.utils.aoa_to_sheet(paymentsData);
        XLSX.utils.book_append_sheet(wb, paymentsWs, 'Payments');
    }

    const filenameDate = isRange ? `${report.start_date}_to_${report.end_date}` : (report.date || 'report');
    XLSX.writeFile(wb, `Collection_Report_${filenameDate}.xlsx`);
    toast.success('Excel downloaded successfully');
};

// ==================== Main Component ====================
const FeeReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('summary');

    return (
        <AppLayout title="Donation Reports" showBack onBack={() => navigate('/fees')}>
            <div className="space-y-4">
                {/* Desktop-only back button — mobile uses Header back button */}
                <div className="hidden lg:flex items-center gap-2 mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/fees')}
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Donations
                    </Button>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="class">Class-wise</TabsTrigger>
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-4">
                        <OverallSummaryReport />
                    </TabsContent>

                    <TabsContent value="monthly" className="mt-4">
                        <MonthlyReportSection />
                    </TabsContent>

                    <TabsContent value="class" className="mt-4">
                        <ClassWiseReportSection />
                    </TabsContent>

                    <TabsContent value="daily" className="mt-4">
                        <DailyCollectionReportSection />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

// ==================== Overall Summary Report ====================
interface OverallSummaryReportProps {
    academicYearId: string;
}

const OverallSummaryReport: React.FC = () => {
    const [summary, setSummary] = useState<OverallFinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth() + 1 + '');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear() + '');

    useEffect(() => {
        loadSummary();
    }, [selectedMonth, selectedYear]);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const data = await feeApi.getOverallSummary({
                month: parseInt(selectedMonth),
                year: parseInt(selectedYear)
            });
            setSummary(data);
        } catch (error) {
            console.error('Error loading summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const collectionPercentage = useMemo(() => {
        if (!summary || summary.total_expected === 0) return 0;
        return Math.round(summary.collection_percentage);
    }, [summary]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <Card><CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent></Card>
            </div>
        );
    }

    if (!summary) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Failed to load summary</p>
                </CardContent>
            </Card>
        );
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 mb-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px] bg-white">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Financial Summary (Including {months.find(m => m.value === selectedMonth)?.label} {selectedYear})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-[11px] text-muted-foreground">Collection Rate</p>
                        <p className="text-4xl font-bold text-primary">{collectionPercentage}%</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                            <div className="flex items-center gap-2">
                                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">Total Expected</span>
                            </div>
                            <span className="text-lg font-bold">{formatCurrency(summary.total_expected)}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm">Total Collected</span>
                            </div>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(summary.total_paid)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <span className="text-sm">Total Pending</span>
                            </div>
                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(summary.total_pending)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
                Data updated in real-time • Excludes future months
            </p>
        </div>
    );
};

// ==================== Class-wise Report ====================

const ClassWiseReportSection: React.FC = () => {
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth() + 1 + '');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear() + '');
    const [report, setReport] = useState<ClassWiseSummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadReport();
        }
    }, [selectedClass, selectedMonth, selectedYear]);

    const loadClasses = async () => {
        const classList = await feeApi.getClasses();
        setClasses(classList.map((c: any) => ({ id: c.id.toString(), name: c.name })));
    };

    const loadReport = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const data = await feeApi.getClassReport(parseInt(selectedClass), {
                month: parseInt(selectedMonth),
                year: parseInt(selectedYear)
            });
            // Map backend response to component format
            const mappedData: ClassWiseSummary = {
                ...data,
                className: data.class_name,
                totalExpected: data.total_expected,
                totalPaid: data.total_paid,
                totalPending: data.total_pending,
                students: data.students.map((s: any) => ({
                    studentFeeId: s.student_id,
                    studentName: s.student_name,
                    monthlyPayable: s.monthly_payable,
                    totalExpected: s.total_expected,
                    totalPaid: s.total_paid,
                    totalPending: s.total_pending,
                })),
            };
            setReport(mappedData);
        } catch (error) {
            console.error('Error loading class report:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Select Class</span>
                            </div>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a class to view report" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium">Limit Month</span>
                            </div>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium">Limit Year</span>
                            </div>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading && (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>
                    ))}
                </div>
            )}

            {!loading && report && (
                <>
                    {/* Export Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => exportClassWiseToPDF(report)}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => exportClassWiseToExcel(report)}
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Excel
                        </Button>
                    </div>

                    {/* Class Summary */}
                    <Card className="bg-gradient-to-br from-secondary/50 to-secondary/20">
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-3">{report.className} Summary (Including {months.find(m => m.value === selectedMonth)?.label} {selectedYear})</h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-background/80 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Expected</p>
                                    <p className="font-bold text-sm">{formatCurrency(report.totalExpected)}</p>
                                </div>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Collected</p>
                                    <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(report.totalPaid)}
                                    </p>
                                </div>
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                    <p className="font-bold text-sm text-red-600 dark:text-red-400">
                                        {formatCurrency(report.totalPending)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student List */}
                    <div className="space-y-2">
                        <p className="text-[11px] text-muted-foreground px-1">
                            {report.students.length} students
                        </p>
                        {report.students.map((student) => (
                            <Card key={student.studentFeeId}>
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{student.studentName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Monthly: {formatCurrency(student.monthlyPayable)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {student.totalPending > 0 ? (
                                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    {formatCurrency(student.totalPending)} due
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    Cleared
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {!loading && !selectedClass && (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select a class to view the report</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// ==================== Daily & Range Collection Report ====================
const DailyCollectionReportSection: React.FC = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [report, setReport] = useState<DailyCollectionSummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReport();
    }, [startDate, endDate]);

    const setPresetRange = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
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
        }
    };

    const loadReport = async () => {
        if (!startDate) {
            setReport(null);
            return;
        }
        
        setLoading(true);
        try {
            const data = await feeApi.getDailyReport({ startDate, endDate: endDate || startDate });
            const mappedData: DailyCollectionSummary = {
                ...data,
                totalStudents: data?.total_students || 0,
                totalEntries: data?.total_entries ?? (data?.payments?.length || 0),
                totalAmount: data?.total_amount || 0,
                payments: data?.payments || [],
            };
            setReport(mappedData);
        } catch (error) {
            console.error('Error loading collection report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleReceipt = async (paymentId: number) => {
        try {
            await feeApi.toggleReceipt(paymentId);
            toast.success('Receipt status updated');
            
            if (report) {
                setReport({
                    ...report,
                    payments: report.payments.map(p => 
                        p.paymentId === paymentId 
                            ? { ...p, receiptIssued: !p.receiptIssued }
                            : p
                    )
                });
            }
        } catch (error) {
            toast.error('Failed to update receipt status');
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
            return;
        }
        
        try {
            await feeApi.deletePayment(paymentId);
            toast.success('Payment deleted successfully');
            
            if (report) {
                const deletedPayment = report.payments.find(p => p.paymentId === paymentId);
                setReport({
                    ...report,
                    totalAmount: report.totalAmount - (deletedPayment ? deletedPayment.amount : 0),
                    payments: report.payments.filter(p => p.paymentId !== paymentId)
                });
            }
        } catch (error) {
            toast.error('Failed to delete payment');
        }
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

    const formatDisplayDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const calculateTotal = () => {
        return report?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
    };

    return (
        <div className="space-y-4">
            {/* Header Controls with Date Range and Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20 p-3 rounded-lg border">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mr-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Period:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={todayStr}
                            className="h-8 text-xs w-[130px] bg-background"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            max={todayStr}
                            className="h-8 text-xs w-[130px] bg-background"
                        />
                    </div>
                    
                    {/* Presets */}
                    <div className="flex items-center gap-1 ml-1 sm:ml-2">
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
                            onClick={() => setPresetRange('yesterday')}
                            className="h-7 text-[11px] px-2.5 hidden sm:inline-flex"
                        >
                            Yesterday
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPresetRange('week')}
                            className="h-7 text-[11px] px-2.5"
                        >
                            Last 7 Days
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

                {!loading && report && report.payments.length > 0 && (
                    <div className="flex gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportDailyToPDF(report)}
                            className="h-8 text-xs"
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportDailyToExcel(report)}
                            className="h-8 text-xs"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                            Excel
                        </Button>
                    </div>
                )}
            </div>

            {loading && (
                <div className="space-y-3 animate-pulse">
                    {[1, 2].map((i) => (
                        <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>
                    ))}
                </div>
            )}

            {!loading && report && (
                <>
                    {/* Subtle Stats Card */}
                    <Card className="bg-muted/30">
                        <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-[11px] text-muted-foreground">Students:</span>
                                        <span className="font-semibold">{report.totalStudents}</span>
                                    </div>
                                    <div className="hidden sm:block h-4 w-px bg-border" />
                                    <div className="flex items-center gap-1.5">
                                        <Receipt className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-[11px] text-muted-foreground">Entries:</span>
                                        <span className="font-semibold">{report.payments.length}</span>
                                    </div>
                                    <div className="hidden sm:block h-4 w-px bg-border" />
                                    <div className="flex items-center gap-1.5">
                                        <IndianRupee className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-[11px] text-muted-foreground">Collected:</span>
                                        <span className="font-semibold text-green-700 dark:text-green-400">
                                            {formatCurrency(report.totalAmount)}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {startDate === endDate ? formatDisplayDate(startDate) : `${formatDisplayDate(startDate)} — ${formatDisplayDate(endDate)}`}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Entries */}
                    {report.payments.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No payments recorded on this date</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Desktop Table View - Hidden on Mobile */}
                            <div className="hidden md:block border rounded-lg overflow-x-auto">
                                {/* Table Header */}
                                <div className="grid grid-cols-[80px_1fr_80px_2fr_100px_120px] gap-4 p-3 bg-muted/30 border-b font-medium text-sm">
                                    <div>Time</div>
                                    <div>Student</div>
                                    <div>Class</div>
                                    <div>Allocations</div>
                                    <div className="text-right">Amount</div>
                                    <div className="text-center">Actions</div>
                                </div>

                                {/* Table Body */}
                                {report.payments.map((payment) => (
                                    <div 
                                        key={payment.paymentId}
                                        className="grid grid-cols-[80px_1fr_80px_2fr_100px_120px] gap-4 p-3 border-b last:border-b-0 hover:bg-muted/20 items-center transition-colors bg-background"
                                    >
                                        <div className="flex flex-col text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                {payment.time}
                                            </div>
                                            {startDate !== endDate && payment.date && (
                                                <span className="text-[10px] text-muted-foreground mt-0.5">{formatDisplayDate(payment.date)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm truncate text-foreground" title={payment.studentName}>
                                                {toTitleCase(payment.studentName)}
                                            </p>
                                            {payment.remarks && (
                                                <p className="text-xs text-muted-foreground truncate" title={payment.remarks}>
                                                    {payment.remarks}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {payment.className}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {payment.allocations ? (
                                                payment.allocations.split(', ').map((alloc, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs font-normal">
                                                        {alloc}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </div>
                                        <div className="text-right font-bold text-green-700 dark:text-green-400">
                                            {formatCurrency(payment.amount)}
                                        </div>
                                        <div className="flex justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeletePayment(payment.paymentId)}
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                title="Delete Payment"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleToggleReceipt(payment.paymentId)}
                                                className={cn(
                                                    "h-8 w-8",
                                                    payment.receiptIssued 
                                                        ? 'text-green-700 hover:text-green-800 hover:bg-green-50' 
                                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                )}
                                                title={payment.receiptIssued ? "Receipt Issued" : "Issue Receipt"}
                                            >
                                                {payment.receiptIssued ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Receipt className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Total Row */}
                                <div className="grid grid-cols-[80px_1fr_80px_2fr_100px_120px] gap-4 p-3 border-t-2 bg-muted/20 font-semibold">
                                    <div className="col-span-4 text-right">Total:</div>
                                    <div className="text-right text-green-700 dark:text-green-400">
                                        {formatCurrency(calculateTotal())}
                                    </div>
                                    <div></div>
                                </div>
                            </div>

                            {/* Mobile Card View - Visible Only on Mobile */}
                            <div className="md:hidden space-y-3">
                                {report.payments.map((payment) => (
                                    <Card key={payment.paymentId} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            {/* Header with Amount and Time */}
                                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border-b">
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{payment.time}</span>
                                                    {startDate !== endDate && payment.date && (
                                                        <span className="text-[10px] text-muted-foreground ml-1">({formatDisplayDate(payment.date)})</span>
                                                    )}
                                                </div>
                                                <div className="text-lg font-bold text-green-700 dark:text-green-400">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                            </div>

                                            {/* Student Info */}
                                            <div className="p-3 space-y-2">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Student</p>
                                                    <p className="font-medium text-foreground">{toTitleCase(payment.studentName)}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Class</p>
                                                        <p className="text-sm">{payment.className}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Actions</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeletePayment(payment.paymentId)}
                                                                className="h-8 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                                Delete
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleToggleReceipt(payment.paymentId)}
                                                                className={cn(
                                                                    "h-8 px-2 text-xs flex-1",
                                                                    payment.receiptIssued 
                                                                        ? 'text-green-700 border-green-200 hover:bg-green-50' 
                                                                        : 'text-gray-600 hover:bg-gray-50'
                                                                )}
                                                            >
                                                                {payment.receiptIssued ? (
                                                                    <>
                                                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                                        Issued
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Receipt className="w-3.5 h-3.5 mr-1" />
                                                                        Issue
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {payment.allocations && (
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Allocations</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {payment.allocations.split(', ').map((alloc, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs font-normal">
                                                                    {alloc}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {payment.remarks && (
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Remarks</p>
                                                        <p className="text-sm mt-0.5">{payment.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Mobile Total */}
                                <Card className="bg-muted/30">
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">Total Collected:</span>
                                            <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                                {formatCurrency(calculateTotal())}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </>
            )
            }
        </div >
    );
};

// ==================== Monthly Summary Report ====================
interface MonthlyStudentReport {
    year: number;
    month: number;
    total_expected: number;
    total_paid: number;
    total_pending: number;
    students: {
        student_id: number;
        roll_number: string;
        student_name: string;
        class_name: string;
        expected: number;
        paid: number;
        balance: number;
        status: 'paid' | 'partial' | 'unpaid' | 'overpaid' | 'exempt';
    }[];
}

const MonthlyReportSection: React.FC = () => {
    const [report, setReport] = useState<MonthlyStudentReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth() + 1 + '');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear() + '');

    useEffect(() => {
        loadReport();
    }, [selectedMonth, selectedYear]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await feeApi.getMonthlyReport({
                month: parseInt(selectedMonth),
                year: parseInt(selectedYear)
            });
            setReport(data);
        } catch (error) {
            console.error('Error loading monthly report:', error);
            toast.error('Failed to load monthly report');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    if (loading && !report) {
        return (
            <div className="space-y-4 animate-pulse">
                <Card><CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Monthly Allocation Report</h3>
                <div className="flex gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px] bg-white">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px] bg-white">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {report && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Expected (This Month)</p>
                                        <p className="text-2xl font-bold">{formatCurrency(report.total_expected)}</p>
                                    </div>
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Collected (For This Month)</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(report.total_paid)}</p>
                                    </div>
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Pending (This Month)</p>
                                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(report.total_pending)}</p>
                                    </div>
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <TrendingDown className="w-5 h-5 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Student Allocations for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto border rounded-lg">
                                <div className="grid grid-cols-[80px_1fr_120px_100px_100px_100px_100px] gap-4 p-3 bg-muted/30 border-b font-medium text-sm min-w-[700px]">
                                    <div>Roll No</div>
                                    <div>Student</div>
                                    <div>Class</div>
                                    <div className="text-right">Expected</div>
                                    <div className="text-right">Allocated</div>
                                    <div className="text-right">Balance</div>
                                    <div className="text-center">Status</div>
                                </div>
                                <div className="divide-y min-w-[700px]">
                                    {report.students.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">No students found with allocations or expectations for this month.</div>
                                    ) : (
                                        report.students.map((s, idx) => (
                                            <div key={idx} className="grid grid-cols-[80px_1fr_120px_100px_100px_100px_100px] gap-4 p-3 items-center hover:bg-muted/10 transition-colors text-sm bg-background">
                                                <div className="text-muted-foreground">{s.roll_number}</div>
                                                <div className="font-medium">{s.student_name}</div>
                                                <div className="text-muted-foreground">{s.class_name}</div>
                                                <div className="text-right">{formatCurrency(s.expected)}</div>
                                                <div className="text-right font-medium text-green-600">{formatCurrency(s.paid)}</div>
                                                <div className="text-right text-orange-600">{s.balance > 0 ? formatCurrency(s.balance) : '-'}</div>
                                                <div className="text-center">
                                                    {s.status === 'paid' || s.status === 'overpaid' ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Paid</Badge>
                                                    ) : s.status === 'partial' ? (
                                                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Partial</Badge>
                                                    ) : s.status === 'exempt' ? (
                                                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200">N/A</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Unpaid</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default FeeReportsPage;
