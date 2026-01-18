import React, { useState, useEffect, useMemo } from 'react';
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
    date: string;
    total_students: number;
    total_amount: number;
    totalStudents: number;
    totalAmount: number;
    payments: {
        paymentId: number;
        studentName: string;
        className: string;
        amount: number;
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

    const summaryY = doc.internal.getNumberOfPages() > 1
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

    const displayDate = new Date(report.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Title
    doc.setFontSize(18);
    doc.text('Daily Collection Report', pageWidth / 2, 20, { align: 'center' });

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

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Time', 'Student Name', 'Class', 'Allocations', 'Amount', 'Receipt', 'Remarks']],
            body: report.payments.map((p) => [
                p.time,
                p.studentName,
                p.className,
                p.allocations,
                formatCurrencyPlain(p.amount),
                p.receiptIssued ? 'Yes' : 'No',
                p.remarks || '-',
            ]),
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] },
            columnStyles: {
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

    doc.save(`Daily_Collection_${report.date}.pdf`);
    toast.success('PDF downloaded successfully');
};

const exportDailyToExcel = (report: DailyCollectionSummary) => {
    const wb = XLSX.utils.book_new();

    const displayDate = new Date(report.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Summary Sheet
    const summaryData = [
        ['Daily Collection Report'],
        ['Date', displayDate],
        [''],
        ['Total Students Paid', report.totalStudents],
        ['Total Amount Collected', report.totalAmount],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Payments Sheet
    if (report.payments.length > 0) {
        const paymentsData = [
            ['Time', 'Student Name', 'Class', 'Allocations', 'Amount', 'Receipt Issued', 'Remarks'],
            ...report.payments.map((p) => [
                p.time,
                p.studentName,
                p.className,
                p.allocations,
                p.amount,
                p.receiptIssued ? 'Yes' : 'No',
                p.remarks || '',
            ]),
        ];
        const paymentsWs = XLSX.utils.aoa_to_sheet(paymentsData);
        XLSX.utils.book_append_sheet(wb, paymentsWs, 'Payments');
    }

    XLSX.writeFile(wb, `Daily_Collection_${report.date}.xlsx`);
    toast.success('Excel downloaded successfully');
};

// ==================== Main Component ====================
const FeeReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('summary');

    return (
        <AppLayout title="Donation Reports" showBack>
            <div className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="class">Class-wise</TabsTrigger>
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-4">
                        <OverallSummaryReport />
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

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const data = await feeApi.getOverallSummary();
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

    return (
        <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Financial Summary (Till Today)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Collection Rate</p>
                        <p className="text-4xl font-bold text-primary">{collectionPercentage}%</p>
                        <p className="text-xs text-muted-foreground">Till today</p>
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
interface ClassWiseReportSectionProps {
    academicYearId: string;
}

const ClassWiseReportSection: React.FC<ClassWiseReportSectionProps> = ({ academicYearId }) => {
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [report, setReport] = useState<ClassWiseSummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadReport();
        }
    }, [selectedClass]);

    const loadClasses = async () => {
        const classList = await feeApi.getClasses();
        setClasses(classList.map((c: any) => ({ id: c.id.toString(), name: c.name })));
    };

    const loadReport = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const data = await feeApi.getClassReport(parseInt(selectedClass));
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

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
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
                            <h3 className="font-semibold mb-3">{report.className} Summary</h3>
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
                        <p className="text-sm text-muted-foreground px-1">
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

// ==================== Daily Collection Report ====================
const DailyCollectionReportSection: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState<DailyCollectionSummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReport();
    }, [selectedDate]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await feeApi.getDailyReport(selectedDate);
            // Map backend response to component format
            const mappedData: DailyCollectionSummary = {
                ...data,
                totalStudents: data.total_students,
                totalAmount: data.total_amount,
            };
            setReport(mappedData);
        } catch (error) {
            console.error('Error loading daily report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleReceipt = async (paymentId: number) => {
        try {
            await feeApi.toggleReceipt(paymentId);
            toast.success('Receipt status updated');
            
            // Update the local state instead of reloading entire report
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

    const truncateAllocations = (allocations: string, maxLength: number = 3) => {
        if (!allocations) return '-';
        const parts = allocations.split(', ');
        if (parts.length <= maxLength) return allocations;
        return parts.slice(0, maxLength).join(', ') + '...';
    };

    const calculateTotal = () => {
        return report?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
    };

    return (
        <div className="space-y-4">
            {/* Compact Header with Date and Export */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-auto"
                    />
                </div>
                {!loading && report && report.payments.length > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportDailyToPDF(report)}
                            className="flex-1 sm:flex-none"
                        >
                            <Download className="w-4 h-4 mr-1.5" />
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportDailyToExcel(report)}
                            className="flex-1 sm:flex-none"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
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
                                        <span className="text-sm text-muted-foreground">Students:</span>
                                        <span className="font-semibold">{report.totalStudents}</span>
                                    </div>
                                    <div className="hidden sm:block h-4 w-px bg-border" />
                                    <div className="flex items-center gap-1.5">
                                        <IndianRupee className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Collected:</span>
                                        <span className="font-semibold text-green-700 dark:text-green-400">
                                            {formatCurrency(report.totalAmount)}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {formatDisplayDate(selectedDate)}
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
                                <div className="grid grid-cols-[80px_1fr_80px_2fr_100px_80px] gap-4 p-3 bg-muted/30 border-b font-medium text-sm">
                                    <div>Time</div>
                                    <div>Student</div>
                                    <div>Class</div>
                                    <div>Allocations</div>
                                    <div className="text-right">Amount</div>
                                    <div className="text-center">Receipt</div>
                                </div>

                                {/* Table Body */}
                                {report.payments.map((payment) => (
                                    <div 
                                        key={payment.paymentId}
                                        className="grid grid-cols-[80px_1fr_80px_2fr_100px_80px] gap-4 p-3 border-b last:border-b-0 hover:bg-muted/20 items-center transition-colors bg-background"
                                    >
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            {payment.time}
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
                                        <div className="text-sm text-muted-foreground">
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
                                        <div className="flex justify-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleReceipt(payment.paymentId)}
                                                className={cn(
                                                    "h-8 px-2",
                                                    payment.receiptIssued 
                                                        ? 'text-green-700 hover:text-green-800 hover:bg-green-50' 
                                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                )}
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
                                <div className="grid grid-cols-[80px_1fr_80px_2fr_100px_80px] gap-4 p-3 border-t-2 bg-muted/20 font-semibold">
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
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{payment.time}</span>
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
                                                        <p className="text-xs text-muted-foreground">Receipt</p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleToggleReceipt(payment.paymentId)}
                                                            className={cn(
                                                                "mt-1 h-8 text-xs",
                                                                payment.receiptIssued 
                                                                    ? 'text-green-700 border-green-200 hover:bg-green-50' 
                                                                    : 'text-gray-600 hover:bg-gray-50'
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

export default FeeReportsPage;