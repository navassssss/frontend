import React, { useState } from 'react';
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

export default function AttendanceReportsPage() {
    const defaultSession = new Date().getHours() >= 13 ? 'AN' : 'FN';
    const [session, setSession] = useState<'FN' | 'AN'>(defaultSession);

    // Mock summary data (would be replaced by actual API data)
    const summary = {
        totalStudents: 450,
        fnAttendance: 430,
        anAttendance: 425,
        activeOutpasses: 12,
        medicalCases: 5,
        unexplainedAbsent: 14
    };

    // Mock official absences (Outpass/Medical)
    const officialAbsences = [
        { id: 1, class: '10A', student: 'Ahmed Khan', reason: 'Medical', time: '10:30 AM' },
        { id: 2, class: '10B', student: 'Rashid Ali', reason: 'Outpass', time: '11:15 AM' },
        { id: 3, class: '9A', student: 'Sarah Mohammed', reason: 'Medical', time: '09:00 AM' }
    ];

    // Mock class operational attendance
    const classAttendance = [
        {
            classId: '10A',
            className: '10A',
            absentCount: 4,
            students: [
                { id: 1, name: 'Ahmed Khan', marker: 'M' },
                { id: 2, name: 'Zaid Bin Tariq', marker: 'A' },
                { id: 3, name: 'Omar', marker: 'A' },
                { id: 4, name: 'Yusuf', marker: 'O' },
            ]
        },
        {
            classId: '10B',
            className: '10B',
            absentCount: 2,
            students: [
                { id: 5, name: 'Rashid Ali', marker: 'O' },
                { id: 6, name: 'Hassan', marker: 'A' }
            ]
        }
    ];

    return (
        <AppLayout title="Attendance Reports" showBack>
            <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto font-sans">
                {/* Header & Global Session Switcher */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Operational Attendance</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Principal Control Panel</p>
                    </div>
                    <Tabs value={session} onValueChange={(v) => setSession(v as 'FN' | 'AN')} className="w-fit">
                        <TabsList className="grid w-[140px] grid-cols-2">
                            <TabsTrigger value="FN" className="text-xs font-semibold">FN Session</TabsTrigger>
                            <TabsTrigger value="AN" className="text-xs font-semibold">AN Session</TabsTrigger>
                        </TabsList>
                    </Tabs>
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
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 tracking-tight">
                                <Users className="w-4 h-4 text-primary" />
                                Class Attendance
                            </h2>
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/20 bg-destructive/5 font-medium">
                                Action Layer
                            </Badge>
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
