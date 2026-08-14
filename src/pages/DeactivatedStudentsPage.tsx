import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Search,
    UserX,
    UserCheck,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Eye,
} from 'lucide-react';
import * as feeApi from '@/lib/feeApi';
import { cn } from '@/lib/utils';

export const DeactivatedStudentsPage: React.FC = () => {
    const navigate = useNavigate();

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const studentsPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        loadDeactivatedStudents();
    }, [searchQuery, currentPage]);

    const loadDeactivatedStudents = async () => {
        setLoading(true);
        try {
            const response = await feeApi.getStudents({
                page: currentPage,
                per_page: studentsPerPage,
                search: searchQuery || undefined,
                isActive: false, // Only deactivated students
            });
            setStudents(response.data || []);
            setTotalPages(response.last_page || 1);
            setTotalStudents(response.total || 0);
        } catch (error) {
            console.error('Failed to load deactivated students', error);
            toast.error('Failed to load deactivated students list');
        } finally {
            setLoading(false);
        }
    };

    const handleActivateStudent = async (studentId: number) => {
        if (!confirm('Are you sure you want to reactivate this student? They will appear back in the active donations list and reports.')) {
            return;
        }

        try {
            await feeApi.toggleStudentActive(studentId, true);
            toast.success('Student reactivated successfully');
            loadDeactivatedStudents();
        } catch (error) {
            console.error('Failed to activate student', error);
            toast.error('Failed to reactivate student');
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
        if (!str) return '';
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    return (
        <AppLayout title="Deactivated Students" showBack>
            <div className="space-y-4">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/fees')}
                    className="hidden lg:flex items-center gap-1 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Monthly Donations
                </Button>

                {/* Filters */}
                <div className="flex gap-2 items-center flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student name or admission number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                {/* Students List */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                        <UserX className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground font-medium">No deactivated students found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Card className="overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse text-left">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <th className="p-3">Admission No.</th>
                                            <th className="p-3">Student Name</th>
                                            <th className="p-3">Class</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {students.map((student) => (
                                            <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="p-3 font-semibold text-muted-foreground">
                                                    {student.username || student.id}
                                                </td>
                                                <td className="p-3 font-medium text-foreground">
                                                    {toTitleCase(student.name)}
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    Class {student.class_name}
                                                </td>
                                                <td className="p-3 text-right flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => navigate(`/fees/${student.id}`)}
                                                        className="h-8 gap-1.5"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View Overview
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleActivateStudent(student.id)}
                                                        className="h-8 gap-1.5 border-green-600 text-green-600 hover:bg-green-50"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        Reactivate
                                                    </Button>
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
                                    Showing page {currentPage} of {totalPages} ({totalStudents} total students)
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
            </div>
        </AppLayout>
    );
};
