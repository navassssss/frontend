import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    IndianRupee,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    BarChart3,
    ChevronRight,
    ArrowUpDown,
    Filter,
    School
} from 'lucide-react';
import { AddPaymentModal } from '@/components/fee/AddPaymentModal';
import * as feeApi from '@/lib/feeApi';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface StudentFeeWithOverview {
    id: string;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    academicYearId: string;
    totalPending: number;
    lastPaymentDate: string | null;
    currentMonthStatus: any | null;
    overallStatus: 'paid' | 'partial' | 'due' | 'overpaid';
}

// Helper for Title Case
const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

const FeeManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState<StudentFeeWithOverview[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<StudentFeeWithOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [sortOption, setSortOption] = useState<'name' | 'amount_high' | 'amount_low' | 'class'>('name');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const studentsPerPage = 20;

    // Overall status counts
    const [statusCounts, setStatusCounts] = useState({ paid: 0, partial: 0, due: 0, overpaid: 0 });

    const isFirstRun = React.useRef(true);

    // Consolidated data loading effect
    useEffect(() => {
        // Skip first run for search to avoid double fetch on mount
        if (isFirstRun.current) {
            isFirstRun.current = false;
            loadClasses();
            loadData(1);
            loadStatusCounts();
            return;
        }

        // Debounce search, immediate for filters/pagination
        const timer = setTimeout(() => {
            loadData(currentPage);
        }, searchQuery !== '' ? 500 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, classFilter, statusFilter, currentPage]);

    // Reload status counts only when class filter changes (not search/pagination)
    useEffect(() => {
        if (!isFirstRun.current) {
            loadStatusCounts();
        }
    }, [classFilter]);

    // Local sorting (no network request)
    useEffect(() => {
        filterAndSortStudents();
    }, [students, sortOption]);

    const loadClasses = async () => {
        try {
            const classList = await feeApi.getClasses();
            setClasses(classList.map((c: any) => ({ id: c.id.toString(), name: c.name })));
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const loadStatusCounts = async () => {
        try {
            const counts = await feeApi.getStatusCounts({
                classId: classFilter !== 'all' ? parseInt(classFilter) : undefined,
                // NOTE: Search is intentionally NOT included - status counts should show ALL students
            });
            setStatusCounts(counts);
        } catch (error) {
            console.error('Failed to load status counts', error);
        }
    };

    const loadData = async (page: number = 1) => {
        setLoading(true);
        try {
            const classIdFilter = classFilter !== 'all' ? parseInt(classFilter) : undefined;

            const response = await feeApi.getStudents({
                classId: classIdFilter,
                page: page,
                per_page: studentsPerPage,
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            });

            // Map API response to component structure
            const studentsWithOverview = response.data.map((student: any) => {
                let overallStatus: 'paid' | 'partial' | 'due' | 'overpaid' = 'paid';
                if (student.total_pending > 0) {
                    overallStatus = 'due';
                } else if (student.total_pending < 0) {
                    overallStatus = 'overpaid';
                } else if (student.total_paid > 0 && student.total_pending === 0) { // Assuming logic needed for 'partial' but sticking to simple rule for now
                    overallStatus = 'paid';
                }

                return {
                    id: student.id.toString(),
                    studentId: student.username || student.id.toString(),
                    studentName: student.name,
                    classId: student.class_id.toString(),
                    className: student.class_name,
                    academicYearId: '2024-25',
                    totalPending: student.total_pending,
                    lastPaymentDate: student.last_payment_date,
                    currentMonthStatus: null,
                    overallStatus,
                };
            });

            setStudents(studentsWithOverview);
            // Note: filteredStudents is updated via useEffect [students, sortOption]

            // Don't override currentPage from server - let React state control it
            setTotalPages(response.last_page);
            setTotalStudents(response.total);
        } catch (error) {
            console.error('Error loading fee data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortStudents = () => {
        let result = [...students];

        // Sorting (Client-side for current page results)
        result.sort((a, b) => {
            switch (sortOption) {
                case 'name': return a.studentName.localeCompare(b.studentName);
                case 'amount_high': return b.totalPending - a.totalPending; // Correct: High pending first
                case 'amount_low': return a.totalPending - b.totalPending;
                case 'class':
                    // Handle numeric class comparison if possible, else string
                    const classA = parseInt(a.className) || 0;
                    const classB = parseInt(b.className) || 0;
                    return classA - classB;
                default: return 0;
            }
        });

        setFilteredStudents(result);
    };

    const getStatusBadge = (status: 'paid' | 'partial' | 'due' | 'overpaid') => {
        const styles = {
            paid: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
            partial: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
            due: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
            overpaid: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
        };

        const icons = {
            paid: <CheckCircle2 className="w-3 h-3 mr-1" />,
            partial: <Clock className="w-3 h-3 mr-1" />,
            due: <AlertCircle className="w-3 h-3 mr-1" />,
            overpaid: <CheckCircle2 className="w-3 h-3 mr-1" />
        };

        const labels = {
            paid: "Paid",
            partial: "Partial",
            due: "Due",
            overpaid: "Credit"
        };

        return (
            <Badge variant="outline" className={cn("font-medium", styles[status])}>
                {icons[status]}
                {labels[status]}
            </Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    return (
        <AppLayout title="Fee Management" showBack={true}>
            <div className="space-y-4 p-4 pb-20 max-w-5xl mx-auto">
                {/* Header Stats - Clean Minimal Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Paid', count: statusCounts.paid, bgColor: 'bg-green-50', borderColor: 'border-l-green-600', textColor: 'text-green-700', icon: '✓' },
                        { label: 'Partial', count: statusCounts.partial, bgColor: 'bg-gray-50', borderColor: 'border-l-gray-400', textColor: 'text-gray-700', icon: '◐' },
                        { label: 'Pending', count: statusCounts.due, bgColor: 'bg-amber-50', borderColor: 'border-l-amber-500', textColor: 'text-amber-700', icon: '⏱' },
                        { label: 'Overpaid', count: statusCounts.overpaid, bgColor: 'bg-blue-50', borderColor: 'border-l-blue-500', textColor: 'text-blue-700', icon: '+' },
                    ].map((stat) => (
                        <Card key={stat.label} className={cn("border border-gray-200 shadow-sm border-l-4", stat.bgColor, stat.borderColor)}>
                            <CardContent className="p-4">
                                <div className="flex items-baseline justify-between mb-1">
                                    <p className={cn("text-xs font-medium uppercase tracking-wide", stat.textColor)}>{stat.label}</p>
                                    <span className={cn("text-lg", stat.textColor)}>{stat.icon}</span>
                                </div>
                                <p className={cn("text-3xl font-bold mb-1", stat.textColor)}>{stat.count}</p>
                                <p className="text-xs text-muted-foreground">
                                    {stat.count} {stat.count === 1 ? 'student' : 'students'}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Actions & Filters - Clean Inline Layout */}
                <div className="space-y-3">
                    {/* Action Buttons */}
                    <div className="flex gap-2 items-center flex-wrap">
                        <Button
                            onClick={() => setPaymentModalOpen(true)}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Record New Payment
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/fees/reports')}
                            className="shadow-sm"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Reports
                        </Button>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex gap-2 items-center flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or admission no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[120px] h-9">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="due">Due</SelectItem>
                                <SelectItem value="overpaid">Overpaid</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="class">Class</SelectItem>
                                <SelectItem value="pending">Pending Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* List Header */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-medium text-muted-foreground">
                        Students List <span className="text-xs font-normal">({totalStudents} total)</span>
                    </p>
                    {statusFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">
                            Filters Active
                        </Badge>
                    )}
                </div>

                {/* Student List */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                        <IndianRupee className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground font-medium">No students match your criteria</p>
                        <Button variant="link" onClick={() => { setSearchQuery(''); setClassFilter('all'); setStatusFilter('all'); }} className="mt-2">
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredStudents.map((student) => (
                            <Card
                                key={student.id}
                                className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all border-l-2 shadow-sm"
                                style={{
                                    borderLeftColor:
                                        student.overallStatus === 'paid' ? '#16a34a' :
                                            student.overallStatus === 'due' ? '#f59e0b' :
                                                student.overallStatus === 'overpaid' ? '#3b82f6' : '#9ca3af'
                                }}
                                onClick={() => navigate(`/fees/${student.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors mb-1.5">
                                                {toTitleCase(student.studentName)}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Adm.No:</span> {student.studentId}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Class:</span> {student.className}
                                                </span>
                                                {student.lastPaymentDate && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(student.lastPaymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right flex flex-col items-end min-w-[100px]">
                                            {student.totalPending > 0 ? (
                                                <>
                                                    {getStatusBadge(student.overallStatus)}
                                                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400 leading-none mt-1">
                                                        {formatCurrency(student.totalPending)}
                                                    </p>
                                                </>
                                            ) : student.totalPending < 0 ? (
                                                <>
                                                    {getStatusBadge(student.overallStatus)}
                                                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400 leading-none mt-1">
                                                        {formatCurrency(student.totalPending)}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    {getStatusBadge(student.overallStatus)}
                                                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                                        ✓ All clear
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
                }

                {/* Pagination Controls */}
                {
                    totalPages > 1 && (
                        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-lg flex items-center justify-between pb-20 sm:pb-6 z-10 lg:pl-64 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex-shrink-0 px-3"
                            >
                                <span className="hidden sm:inline">Previous</span>
                                <span className="sm:hidden">Prev</span>
                            </Button>
                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex-shrink-0 px-3"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <span className="sm:hidden">Next</span>
                            </Button>
                        </div>
                    )
                }

                {/* Add Payment Modal */}
                <AddPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    onPaymentAdded={() => loadData(currentPage)}
                />
            </div >
        </AppLayout >
    );
};

export default FeeManagementPage;