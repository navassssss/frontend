import re

with open('src/pages/TakeAttendancePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Dialog imports
content = content.replace("import { Card, CardContent } from '@/components/ui/card';", "import { Card, CardContent } from '@/components/ui/card';\nimport {\n    Dialog,\n    DialogContent,\n    DialogHeader,\n    DialogTitle,\n    DialogDescription,\n    DialogFooter,\n} from '@/components/ui/dialog';")

# 2. Add getCurrentSession
content = content.replace("export default function TakeAttendancePage() {", "const getCurrentSession = (): 'morning' | 'afternoon' => {\n    const currentHour = new Date().getHours();\n    return (currentHour >= 6 && currentHour < 13) ? 'morning' : 'afternoon';\n};\n\nexport default function TakeAttendancePage() {")

# 3. Change selectedSession init
content = content.replace("const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon'>('morning');", "const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon'>(getCurrentSession());")

# 4. Add modal state
content = content.replace("const [duplicateError, setDuplicateError] = useState(false);", "const [duplicateError, setDuplicateError] = useState(false);\n    const [showConfirmModal, setShowConfirmModal] = useState(false);")

# 5. Remove updateReason
content = re.sub(r'\n    const updateReason = .*?};\n', '', content, flags=re.DOTALL)

# 6. Change handleSubmit to open modal
submit_logic = """    const handleSubmit = async () => {
        if (!selectedClass || !selectedClassInfo) {
            toast.error('Please select a class');
            return;
        }

        if (duplicateError && !editId) {
            toast.error('Attendance already taken for this session');
            return;
        }

        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (editId) {
                await api.put(`/attendance/${editId}`, {
                    absent_students: absentStudents
                });
                toast.success('Attendance updated successfully');
            } else {
                await api.post('/attendance', {
                    class_id: selectedClass,
                    date: selectedDate,
                    session: selectedSession,
                    absent_students: absentStudents
                });
                toast.success('Attendance submitted successfully');
            }
            setShowConfirmModal(false);
            navigate('/attendance');
        } catch (error) {
            toast.error(editId ? 'Failed to update attendance' : 'Failed to submit attendance');
        } finally {
            setIsSubmitting(false);
        }
    };"""

content = re.sub(r'    const handleSubmit = async \(\) => \{.*?\n    \};\n', submit_logic + '\n', content, flags=re.DOTALL)

# 7. Remove Reason column header
content = content.replace('<div className="w-1/3 min-w-[120px] hidden sm:block">Reason (if absent)</div>', '')

# 8. Remove inline reason input completely (the whole div containing it)
# We need to replace exactly the block.
search_str = """                                                        
                                                        {/* Inline Reason Input (Mobile shows below, Desktop shows inline) */}
                                                        {isAbsent && (
                                                            <div className="w-full sm:w-1/3 sm:min-w-[120px] mt-2 sm:mt-0 pl-10 sm:pl-0">
                                                                <Input
                                                                    placeholder="Reason (optional)..."
                                                                    value={absentStudents.find(s => s.id === student.id)?.reason || ''}
                                                                    onChange={(e) => updateReason(student.id, e.target.value)}
                                                                    className="h-7 text-xs bg-background border-destructive/20 focus-visible:ring-destructive/30"
                                                                />
                                                            </div>
                                                        )}"""
content = content.replace(search_str, "")

# 9. Add Dialog markup before AppLayout closes
dialog_markup = """
            {/* Confirmation Modal */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="sm:max-w-md w-[90vw] max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Attendance</DialogTitle>
                        <DialogDescription>
                            Review the list of absent students before submitting.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-sm">Class {selectedClassInfo?.name}</span>
                            <div className="flex gap-2">
                                <Badge variant="success">{presentCount} Present</Badge>
                                <Badge variant="destructive">{absentStudents.length} Absent</Badge>
                            </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-md border max-h-[40vh] overflow-y-auto">
                            {absentStudents.length === 0 ? (
                                <div className="p-6 text-center text-sm font-medium text-muted-foreground flex flex-col items-center justify-center">
                                    <Check className="w-8 h-8 text-emerald-500 mb-2" />
                                    All students are marked present.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {students.filter(s => absentStudents.some(abs => abs.id === s.id)).map(student => (
                                        <div key={student.id} className="p-3 flex justify-between items-center bg-destructive/5 hover:bg-destructive/10 transition-colors">
                                            <span className="font-medium text-sm text-destructive">{student.name}</span>
                                            <span className="text-[10px] text-muted-foreground border bg-background/50 px-2 py-0.5 rounded shadow-sm">Roll: {student.roll_number || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex-row justify-end gap-2 sm:gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="button" variant="touch" onClick={confirmSubmit} disabled={isSubmitting} className="w-full sm:w-auto bg-primary text-primary-foreground">
                            {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>"""

content = content.replace('        </AppLayout>', dialog_markup + '\n        </AppLayout>')

with open('src/pages/TakeAttendancePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated TakeAttendancePage.tsx")
