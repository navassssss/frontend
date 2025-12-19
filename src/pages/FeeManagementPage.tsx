import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, IndianRupee, Calendar, AlertCircle, CheckCircle, Clock, Plus, BarChart3, ChevronRight } from 'lucide-react';
import { AddPaymentModal } from '@/components/fee/AddPaymentModal';
import * as feeApi from '@/lib/feeApi';

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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const studentsPerPage = 20;

    // Overall status counts
    const [statusCounts, setStatusCounts] = useState({ paid: 0, partial: 0, due: 0, overpaid: 0 });

    // Reset to page 1 when search, class filter, or status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, classFilter, statusFilter]);

    // Load data when page, search, or filter changes
    useEffect(() => {
        loadData(currentPage);
    }, [currentPage, searchQuery, classFilter, statusFilter]);

    useEffect(() => {
        filterStudents();
    }, [students]);

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

            const classList = await feeApi.getClasses();

            // Map API response to component structure
            const studentsWithOverview = response.data.map((student: any) => {
                let overallStatus: 'paid' | 'partial' | 'due' | 'overpaid' = 'paid';
                if (student.total_pending > 0) {
                    overallStatus = 'due';
                } else if (student.total_pending < 0) {
                    overallStatus = 'overpaid';
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
            setFilteredStudents(studentsWithOverview);
            setClasses(classList.map((c: any) => ({ id: c.id.toString(), name: c.name })));

            // Don't override currentPage from server - let React state control it
            setTotalPages(response.last_page);
            setTotalStudents(response.total);
            setStatusCounts(response.status_counts || { paid: 0, partial: 0, due: 0, overpaid: 0 });
        } catch (error) {
            console.error('Error loading fee data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        // Filtering is now done server-side, so just keep students as is
        setFilteredStudents(students);
    };

    const getStatusBadge = (status: 'paid' | 'partial' | 'due' | 'overpaid') => {
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
            case 'due':
                return (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Due
                    </Badge>
                );
            case 'overpaid':
                return (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Overpaid
                    </Badge>
                );
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
        <AppLayout title="Fee Management">
            <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => setPaymentModalOpen(true)}
                        className="flex-1 h-12 text-base"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Payment
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/fees/reports')}
                        className="h-12"
                    >
                        <BarChart3 className="w-5 h-5" />
                    </Button>
                </div>

                {/* Header Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs opacity-80">Paid</p>
                            <p className="text-xl font-bold">
                                {statusCounts.paid}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs opacity-80">Partial</p>
                            <p className="text-xl font-bold">
                                {statusCounts.partial}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs opacity-80">Due</p>
                            <p className="text-xl font-bold">
                                {statusCounts.due}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs opacity-80">Overpaid</p>
                            <p className="text-xl font-bold">
                                {statusCounts.overpaid}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="p-3 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={classFilter} onValueChange={setClassFilter}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="flex-1">
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
                        </div>
                    </CardContent>
                </Card>

                {/* Student Count Info */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-muted-foreground">
                        Fee Management
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * studentsPerPage) + 1}-{Math.min(currentPage * studentsPerPage, totalStudents)} of {totalStudents} students
                    </p>
                </div>

                {/* Student List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-4">
                                    <div className="h-16 bg-muted rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No students found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-3">
                            {filteredStudents.map((student) => (
                                <Card
                                    key={student.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => navigate(`/fees/${student.id}`)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate">
                                                    {student.studentName}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">Ad.No: {student.studentId}</p>
                                                <p className="text-sm text-muted-foreground">{student.className}</p>
                                                {student.lastPaymentDate && (
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Last paid: {new Date(student.lastPaymentDate).toLocaleDateString('en-IN')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                {getStatusBadge(student.overallStatus)}
                                                {student.totalPending > 0 && (
                                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                                        {formatCurrency(student.totalPending)}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 px-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* Add Payment Modal */}
                <AddPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    onPaymentAdded={loadData}
                />
            </div>
        </AppLayout>
    );
};

export default FeeManagementPage;