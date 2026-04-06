import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Upload, Save, ArrowLeft, Trash2, Plus, ArrowDownAZ } from 'lucide-react';

// Types
interface ClassRoom {
    id: number;
    name: string;
    level: string;
}

interface StudentRow {
    id: string; // temp id for UI
    name: string;
    roll_number: string;
    class_id: string; // Will store the ID of the class
}

export default function AddStudentsPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [originalStudents, setOriginalStudents] = useState<StudentRow[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [allowNavigate, setAllowNavigate] = useState(false);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    
    useEffect(() => {
        // Fetch classes and existing students
        const fetchData = async () => {
            try {
                // Fetch classes
                const classRes = await api.get('/classes');
                setClasses(classRes.data);

                // Fetch existing students (large limit to get all for bulk editing)
                const studentRes = await api.get('/students?per_page=2000');
                const existingData = studentRes.data.data || studentRes.data;
                
                const loadedStudents: StudentRow[] = existingData.map((s: any) => ({
                    id: `existing_${s.id}`,
                    name: s.user?.name || s.name || '',
                    roll_number: s.roll_number || '',
                    class_id: String(s.class_room?.id || s.class_id || '')
                }));

                // Apply initial sorting (Ascending)
                loadedStudents.sort((a, b) => {
                    const classA_obj = classRes.data.find((c: any) => String(c.id) === a.class_id);
                    const classB_obj = classRes.data.find((c: any) => String(c.id) === b.class_id);
                    const classNameA = classA_obj?.name || String(classA_obj?.level || "Z");
                    const classNameB = classB_obj?.name || String(classB_obj?.level || "Z");
                    if (classNameA !== classNameB) {
                        return classNameA.localeCompare(classNameB, undefined, { numeric: true });
                    }
                    return String(a.roll_number || "").localeCompare(String(b.roll_number || ""), undefined, { numeric: true });
                });

                setStudents(loadedStudents);
                // Keep a deep copy for checking changes
                setOriginalStudents(JSON.parse(JSON.stringify(loadedStudents)));
            } catch (err) {
                toast.error("Failed to load initial data");
            }
        };
        fetchData();
    }, []);

    // Warn before navigating away if there are unsaved changes
    const hasChanges = JSON.stringify(students) !== JSON.stringify(originalStudents) || originalStudents.length > students.length;

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges && !allowNavigate) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    // Warn on react-router internal navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasChanges && !allowNavigate && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            const leave = window.confirm("You have unsaved changes. Are you sure you want to leave this page?");
            if (leave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    const hasFieldChanged = (id: string, field: keyof StudentRow) => {
        const current = students.find(s => s.id === id);
        const original = originalStudents.find(s => s.id === id);
        if (!original && current) return true; // new row
        if (!current || !original) return false;
        return current[field] !== original[field];
    };

    // Find duplicates locally
    const duplicateRollNumbers = new Set(
        Object.entries(
            students.reduce((acc, obj) => {
                const val = obj.roll_number?.trim();
                if (val) acc[val] = (acc[val] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).filter(([_, count]) => count > 1).map(([val, _]) => val)
    );

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json<any>(ws);

                // Map data to our structure
                // Expecting columns like "Name", "Admission No" or "Roll Number", "Class"
                const mappedStudents: StudentRow[] = data.map((row: any, index: number) => {
                    const name = row['Name'] || row['name'] || row['Student Name'] || '';
                    const roll_number = String(row['Admission No'] || row['Ad No'] || row['Roll Number'] || row['roll_number'] || row['Admission Number'] || '');
                    
                    // Try to match the class name/level to an existing class ID
                    const rawClass = String(row['Class'] || row['class'] || '');
                    let classId = '';
                    if (rawClass) {
                        const matchedClass = classes.find(c => 
                            c.name.toLowerCase() === rawClass.toLowerCase() || 
                            String(c.level) === rawClass ||
                            c.name.toLowerCase().includes(rawClass.toLowerCase())
                        );
                        if (matchedClass) {
                            classId = String(matchedClass.id);
                        }
                    }

                    return {
                        id: `imported_${Date.now()}_${index}`,
                        name,
                        roll_number,
                        class_id: classId
                    };
                }).filter(s => s.name || s.roll_number); // Filter out completely empty rows

                setStudents(prev => [...prev, ...mappedStudents]);
                toast.success(`Imported ${mappedStudents.length} students`);
            } catch (err) {
                toast.error("Failed to parse Excel file");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const wsData = [
            ['Name', 'Admission No', 'Class'],
            ['John Doe', '1001', classes[0]?.name || 'Class 10'],
            ['Jane Smith', '1002', classes[1]?.name || 'Class 9']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Make columns visually wider
        ws['!cols'] = [
            { wch: 30 }, // Name
            { wch: 20 }, // Admission No
            { wch: 20 }  // Class
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "Student_Import_Template.xlsx");
    };

    const handleFieldChange = (id: string, field: keyof StudentRow, value: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeRow = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const addEmptyRow = () => {
        const newId = `new_${Date.now()}`;
        setStudents(prev => [
            ...prev,
            { id: newId, name: '', roll_number: '', class_id: '' }
        ]);

        setTimeout(() => {
            const input = document.getElementById(`name-input-${newId}`);
            if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleSort = () => {
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);

        setStudents(prev => {
            const sorted = [...prev].sort((a, b) => {
                const classA_obj = classes.find(c => String(c.id) === a.class_id);
                const classB_obj = classes.find(c => String(c.id) === b.class_id);

                const classNameA = classA_obj?.name || String(classA_obj?.level || "Z");
                const classNameB = classB_obj?.name || String(classB_obj?.level || "Z");
                
                // Primary Sort: Class
                if (classNameA !== classNameB) {
                    const result = classNameA.localeCompare(classNameB, undefined, { numeric: true });
                    return newDirection === 'asc' ? result : -result;
                }
                
                // Secondary Sort: Roll Number / Admission No
                const result = String(a.roll_number || "").localeCompare(String(b.roll_number || ""), undefined, { numeric: true });
                return newDirection === 'asc' ? result : -result;
            });
            return sorted;
        });
        toast.info(`Sorted Class & Admission No. (${newDirection === 'asc' ? 'Ascending' : 'Descending'})`);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(students.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const confirmData = window.confirm(`Are you sure you want to delete ${selectedIds.length} students?`);
        if (!confirmData) return;

        setIsSaving(true);
        try {
            // Find existing students to delete from DB
            const existingIdsToDelete = selectedIds
                .filter(id => id.startsWith('existing_'))
                .map(id => Number(id.replace('existing_', '')));

            if (existingIdsToDelete.length > 0) {
                await api.post('/students/bulk-delete', { student_ids: existingIdsToDelete });
            }

            // Remove from local state
            setStudents(prev => prev.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]); // Clear selection
            toast.success(`Successfully deleted ${selectedIds.length} students`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete students");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (students.length === 0) {
            toast.error("No students to save");
            return;
        }

        const invalidStudents = students.filter(s => !s.name || !s.class_id);
        if (invalidStudents.length > 0) {
            toast.error("Please ensure all students have a Name and a valid Class assigned.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = students.map(s => ({
                id: s.id.startsWith('existing_') ? Number(s.id.replace('existing_', '')) : null,
                name: s.name,
                roll_number: s.roll_number,
                class_id: Number(s.class_id)
            }));

            await api.post('/students/bulk', { students: payload });
            toast.success("Students saved successfully");
            setAllowNavigate(true);
            setTimeout(() => navigate('/students'), 0);
            // Alternatively, we could reload data here if we don't navigate away
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save students");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout title="Add New Students">
            <div className="p-4 space-y-4 max-w-6xl mx-auto pb-24">
                
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (hasChanges) {
                            if (window.confirm("You have unsaved changes. Are you sure you want to leave this page?")) {
                                navigate('/students');
                            }
                        } else {
                            navigate('/students');
                        }
                    }} className="shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Add Students</h1>
                        <p className="text-sm text-muted-foreground">Import from Excel or add manually</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                           <SelectTrigger className="w-32 bg-white"><SelectValue placeholder="Per Page" /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="25">25 per page</SelectItem>
                               <SelectItem value="50">50 per page</SelectItem>
                               <SelectItem value="100">100 per page</SelectItem>
                               <SelectItem value="500">500 per page</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={downloadTemplate} variant="ghost" className="gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 shadow-sm border border-transparent hover:border-primary/20">
                            Download Template
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2 text-primary border-primary hover:bg-primary/10">
                            <Upload className="w-4 h-4" /> Import Excel
                        </Button>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                         <Button onClick={handleSort} variant="secondary" className="gap-2 group">
                             <ArrowDownAZ className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} /> 
                             {sortDirection === 'asc' ? 'Sort (Ascending)' : 'Sort (Descending)'}
                        </Button>
                        <Button onClick={addEmptyRow} variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> Add Row
                        </Button>
                   </div>
                   
                   <div className="flex gap-2">
                       {selectedIds.length > 0 && (
                           <Button onClick={handleBulkDelete} variant="destructive" className="gap-2 shadow-md hover:shadow-lg transition-all animate-fade-in">
                               <Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})
                           </Button>
                       )}
                       <Button onClick={handleSave} disabled={isSaving || !hasChanges || duplicateRollNumbers.size > 0} className={`gap-2 shadow-md transition-all ${!hasChanges ? 'opacity-50' : 'hover:shadow-lg'}`}>
                           <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Changes"}
                       </Button>
                   </div>
                </div>

                <Card className="border-0 shadow-lg border-t-4 border-t-primary overflow-hidden">
                    <CardHeader className="py-4 bg-muted/20 border-b">
                        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                            <span>Student Data</span>
                            <span className="text-sm font-normal text-muted-foreground bg-secondary px-3 py-1 rounded-full">{students.length} Total</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer"
                                            checked={students.length > 0 && selectedIds.length === students.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground w-16">#</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-48">Ad. No (Roll No)</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-64">Class</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground opacity-60">
                                                <Upload className="w-12 h-12 mb-2" />
                                                <p className="text-lg">No students found</p>
                                                <p className="text-sm max-w-md mx-auto">
                                                    Click "Import Excel" to upload a list. Your excel sheet should ideally have columns: <b>Name, Admission No, Class</b>
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((student, idx) => (
                                        <tr key={student.id} className={`border-b last:border-0 hover:bg-muted/10 transition-colors group ${selectedIds.includes(student.id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer"
                                                    checked={selectedIds.includes(student.id)}
                                                    onChange={(e) => handleSelectRow(student.id, e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-center text-muted-foreground">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="relative">
                                                    <Input 
                                                        id={`name-input-${student.id}`}
                                                        value={student.name} 
                                                        onChange={(e) => handleFieldChange(student.id, 'name', e.target.value)}
                                                        placeholder="Student Name"
                                                        className={`bg-transparent h-9 px-3 placeholder:text-muted/40 font-medium ${hasFieldChanged(student.id, 'name') ? 'border-amber-400 focus-visible:ring-amber-400 bg-amber-50 dark:bg-amber-900/10' : 'border-transparent hover:border-input focus:border-input'}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="relative">
                                                    <Input 
                                                        value={student.roll_number} 
                                                        onChange={(e) => handleFieldChange(student.id, 'roll_number', e.target.value)}
                                                        placeholder="Admission No"
                                                        className={`bg-transparent h-9 px-3 placeholder:text-muted/40 ${duplicateRollNumbers.has(student.roll_number?.trim()) ? 'border-destructive focus-visible:ring-destructive bg-destructive/10' : hasFieldChanged(student.id, 'roll_number') ? 'border-amber-400 focus-visible:ring-amber-400 bg-amber-50 dark:bg-amber-900/10' : 'border-transparent hover:border-input focus:border-input'}`}
                                                    />
                                                    {duplicateRollNumbers.has(student.roll_number?.trim()) && student.roll_number.trim() !== '' && (
                                                        <span className="absolute -bottom-4 left-0 text-[10px] text-destructive">Duplicate Ad No</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`rounded-md ${hasFieldChanged(student.id, 'class_id') ? 'ring-1 ring-amber-400 bg-amber-50 dark:bg-amber-900/10' : !student.class_id ? "ring-1 ring-destructive" : ""}`}>
                                                    <Select
                                                         value={student.class_id}
                                                         onValueChange={(val) => handleFieldChange(student.id, 'class_id', val)} 
                                                    >
                                                        <SelectTrigger className="h-9 border-transparent hover:border-input bg-transparent w-full">
                                                            <SelectValue placeholder="Select Class" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {classes.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>
                                                                    {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {!student.class_id && <p className="text-[10px] text-destructive mt-1 px-1">Required</p>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                                                    onClick={() => removeRow(student.id)}
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {students.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                        <div>
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, students.length)} of {students.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="px-2">Page {currentPage} of {Math.ceil(students.length / itemsPerPage)}</span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(students.length / itemsPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(students.length / itemsPerPage)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
