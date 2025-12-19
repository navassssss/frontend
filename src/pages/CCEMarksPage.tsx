import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calculator,
    Lock,
    Unlock,
    Award,
    Users,
    ChevronRight,
    Settings
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    mockSubjects,
    getStudentSubjectMarks,
    setSubjectFinalMarks,
    toggleSubjectLock,
    StudentSubjectMarks
} from '@/data/academicMockData';

export default function CCEMarksPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

    const [subjects, setSubjects] = useState(mockSubjects);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [studentMarks, setStudentMarks] = useState<StudentSubjectMarks[]>([]);
    const [newFinalMarks, setNewFinalMarks] = useState('');
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    const selectedSubjectInfo = subjects.find(s => s.id === selectedSubject);

    useEffect(() => {
        if (selectedSubject) {
            loadMarks();
        }
    }, [selectedSubject]);

    const loadMarks = async () => {
        if (!selectedSubject) return;
        const data = await getStudentSubjectMarks(selectedSubject);
        setStudentMarks(data);
    };

    const handleSetFinalMarks = async () => {
        if (!selectedSubject || !newFinalMarks) return;

        try {
            await setSubjectFinalMarks(selectedSubject, parseInt(newFinalMarks));
            toast.success('Final marks updated');
            setSettingsDialogOpen(false);
            setNewFinalMarks('');
            // Refresh subjects
            setSubjects([...mockSubjects]);
            loadMarks();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleToggleLock = async () => {
        if (!selectedSubject) return;

        try {
            await toggleSubjectLock(selectedSubject);
            toast.success(selectedSubjectInfo?.isLocked ? 'Subject unlocked' : 'Subject locked');
            setSubjects([...mockSubjects]);
        } catch (error) {
            toast.error('Failed to toggle lock');
        }
    };

    return (
        <AppLayout title="CCE Marks" showBack>
            <div className="p-4 space-y-6">
                {/* Subject Selection */}
                <div className="space-y-2">
                    <Label>Select Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                    <div className="flex items-center gap-2">
                                        {subject.isLocked && <Lock className="w-3 h-3" />}
                                        {subject.name} - {subject.className}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Subject Info & Settings */}
                {selectedSubjectInfo && (
                    <Card variant="elevated">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-foreground">{selectedSubjectInfo.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedSubjectInfo.className}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={selectedSubjectInfo.isLocked ? 'warning' : 'success'}>
                                        {selectedSubjectInfo.isLocked ? (
                                            <><Lock className="w-3 h-3 mr-1" /> Locked</>
                                        ) : (
                                            <><Unlock className="w-3 h-3 mr-1" /> Open</>
                                        )}
                                    </Badge>
                                    <Badge variant="outline">
                                        Max: {selectedSubjectInfo.finalMaxMarks}
                                    </Badge>
                                </div>
                            </div>

                            {isPrincipal && (
                                <div className="flex gap-2 mt-4">
                                    <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Settings className="w-4 h-4 mr-1" />
                                                Set Final Marks
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Set Final Maximum Marks</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 mt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Current: {selectedSubjectInfo.finalMaxMarks} marks
                                                </p>
                                                <div className="space-y-2">
                                                    <Label>New Final Max Marks</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        value={newFinalMarks}
                                                        onChange={(e) => setNewFinalMarks(e.target.value)}
                                                        placeholder="e.g., 30"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Student marks will be normalized to this value automatically
                                                </p>
                                                <Button onClick={handleSetFinalMarks} className="w-full">
                                                    Update Final Marks
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button
                                        variant={selectedSubjectInfo.isLocked ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={handleToggleLock}
                                    >
                                        {selectedSubjectInfo.isLocked ? (
                                            <><Unlock className="w-4 h-4 mr-1" /> Unlock</>
                                        ) : (
                                            <><Lock className="w-4 h-4 mr-1" /> Lock</>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Marks Table */}
                {selectedSubject && studentMarks.length > 0 && (
                    <Card variant="elevated">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">Roll</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead className="text-center">Raw</TableHead>
                                            <TableHead className="text-center">Normalized</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentMarks.map((sm) => (
                                            <TableRow key={sm.studentId}>
                                                <TableCell className="font-medium">{sm.rollNumber}</TableCell>
                                                <TableCell>{sm.studentName}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">
                                                        {sm.totalObtained}/{sm.totalPossible}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="success">
                                                        {sm.normalizedMarks}/{selectedSubjectInfo?.finalMaxMarks}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Normalization Explanation */}
                {selectedSubject && (
                    <Card className="bg-info/5 border-info/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Calculator className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground">Mark Normalization</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Normalized marks are calculated as: (Obtained ÷ Total Possible) × {selectedSubjectInfo?.finalMaxMarks}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Original raw marks are preserved for audit purposes.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {selectedSubject && studentMarks.length === 0 && (
                    <Card variant="elevated">
                        <CardContent className="p-6 text-center">
                            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No student marks available yet</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}