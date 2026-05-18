import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface SummaryData {
    totalStudents: number;
    fnAttendance: number;
    anAttendance: number;
    activeOutpasses: number;
    medicalCases: number;
    unexplainedAbsent: number;
}

interface OfficialAbsence {
    id: number;
    class: string;
    student: string;
    reason: string;
    time: string;
}

interface ClassAttendance {
    classId: number;
    className: string;
    absentCount: number;
    students: {
        id: number;
        name: string;
        marker: string;
    }[];
}

export default function AttendanceReportsPage() {
    const defaultSession = new Date().getHours() >= 13 ? 'AN' : 'FN';
    const [session, setSession] = useState<'FN' | 'AN'>(defaultSession);
    const [loading, setLoading] = useState(true);

    const [summary, setSummary] = useState<SummaryData>({
        totalStudents: 0,
        fnAttendance: 0,
        anAttendance: 0,
        activeOutpasses: 0,
        medicalCases: 0,
        unexplainedAbsent: 0
    });

    const [officialAbsences, setOfficialAbsences] = useState<OfficialAbsence[]>([]);
    const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/attendance/reports/operational?session=${session}`);
                setSummary(response.data.summary);
                setOfficialAbsences(response.data.officialAbsences);
                setClassAttendance(response.data.classAttendance);
            } catch (error) {
                console.error("Failed to fetch operational report", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [session]);

    return (
        <AppLayout title="Attendance Reports" showBack>
            <div className="p-4 lg:p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Operational Attendance</h1>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Principal Control Panel</p>
                    </div>
                </div>

                {/* Section 1: Summary Strip (Compact operational stat blocks) */}
                <div className="bg-card border rounded-md shadow-sm p-4 md:px-6">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 items-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Students</span>
                            <span className="text-xl font-bold">{summary.totalStudents}</span>
                        </div>
                        <div className="flex flex-col border-l pl-4 md:pl-6">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">FN Attendance</span>
                            <span className="text-xl font-bold text-primary">{summary.fnAttendance}</span>
                        </div>
                        <div className="flex flex-col border-l pl-4 md:pl-6">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">AN Attendance</span>
                            <span className="text-xl font-bold text-primary">{summary.anAttendance}</span>
                        </div>
                        <div className="flex flex-col border-l pl-4 md:pl-6">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Active Outpass</span>
                            <span className="text-xl font-bold text-amber-600">{summary.activeOutpasses}</span>
                        </div>
                        <div className="flex flex-col border-l pl-4 md:pl-6">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Medical</span>
                            <span className="text-xl font-bold text-blue-600">{summary.medicalCases}</span>
                        </div>
                        <div className="flex flex-col border-l pl-4 md:pl-6">
                            <span className="text-[10px] uppercase tracking-wider text-destructive font-bold mb-1">Unexplained</span>
                            <span className="text-xl font-bold text-destructive">{summary.unexplainedAbsent}</span>
                        </div>
                    </div>
                </div>

                {/* 6/6 Split Layout for Sections 2 & 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    {/* Section 2: Official Attendance */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 tracking-tight">
                                <FileText className="w-4 h-4 text-primary" />
                                Official Attendance
                            </h2>
                            <Badge variant="secondary" className="text-[10px] font-medium bg-muted/60 text-muted-foreground border-transparent">
                                Approved Absences Only
                            </Badge>
                        </div>
                        
                        <div className="bg-card border rounded-md shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold">Class</th>
                                            <th className="px-4 py-2.5 font-semibold">Student</th>
                                            <th className="px-4 py-2.5 font-semibold">Reason</th>
                                            <th className="px-4 py-2.5 font-semibold">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60 text-[13px]">
                                        {officialAbsences.map(abs => (
                                            <tr key={abs.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-2.5 font-medium text-foreground">{abs.class}</td>
                                                <td className="px-4 py-2.5 text-foreground">{abs.student}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-[11px] font-medium text-muted-foreground">
                                                        {abs.reason}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{abs.time}</td>
                                            </tr>
                                        ))}
                                        {officialAbsences.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                                                    No official absences for this session.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Class Attendance */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 tracking-tight">
                                    <Users className="w-4 h-4 text-primary" />
                                    Class Attendance
                                </h2>
                                <Badge variant="outline" className="text-[10px] text-destructive border-destructive/20 bg-destructive/5 font-medium hidden sm:inline-flex">
                                    Action Layer
                                </Badge>
                            </div>
                            
                            <Tabs value={session} onValueChange={(v) => setSession(v as 'FN' | 'AN')} className="w-fit">
                                <TabsList className="grid w-[90px] grid-cols-2 h-7 p-0.5">
                                    <TabsTrigger value="FN" className="text-[11px] font-bold h-full">FN</TabsTrigger>
                                    <TabsTrigger value="AN" className="text-[11px] font-bold h-full">AN</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        
                        <div className="bg-card border rounded-md shadow-sm">
                            <Accordion type="multiple" className="w-full">
                                {classAttendance.map((cls) => (
                                    <AccordionItem value={cls.classId} key={cls.classId} className="border-b border-border/60 last:border-0">
                                        <AccordionTrigger className="px-5 py-3 hover:bg-muted/20 hover:no-underline [&[data-state=open]]:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                                <span className="text-[13px] font-semibold text-foreground w-12">{cls.className}</span>
                                                <span className="text-[11px] text-muted-foreground font-medium">—</span>
                                                <span className="text-[12px] text-destructive font-semibold">
                                                    {cls.absentCount} absent
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-5 pb-3 pt-1">
                                            <div className="space-y-1.5 pt-1">
                                                {cls.students.map(student => (
                                                    <div key={student.id} className="flex items-center justify-between text-[13px] py-1">
                                                        <span className="font-medium text-foreground">{student.name}</span>
                                                        {/* Subtle Indicator Marker */}
                                                        <span className={`w-[22px] h-[22px] flex items-center justify-center rounded-sm text-[10px] font-bold shrink-0 ${
                                                            student.marker === 'M' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                                                            student.marker === 'O' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                                                            'bg-red-50 text-red-700 border border-red-200/50'
                                                        }`}>
                                                            {student.marker}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                                {classAttendance.length === 0 && (
                                    <div className="p-5 text-center text-[12px] text-muted-foreground">
                                        All classes fully present.
                                    </div>
                                )}
                            </Accordion>
                        </div>
                        
                        {/* Compact Marker Legend */}
                        <div className="flex items-center gap-4 mt-3 px-1 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200/50 flex items-center justify-center text-[8px] font-bold">M</span>
                                Medical
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center justify-center text-[8px] font-bold">O</span>
                                Outpass
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-sm bg-red-50 text-red-700 border border-red-200/50 flex items-center justify-center text-[8px] font-bold">A</span>
                                Unexplained
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
