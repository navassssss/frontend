import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight, Phone, Mail, ClipboardList, CheckSquare, BookOpen, FileText, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '../lib/api'; // or "@/lib/api" if alias setup


interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  initials: string;
  dutiesCount: number;
  tasksCount: number;
  can_review_achievements: boolean;
}

const initialTeachers: Teacher[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@school.edu',
    phone: '+1 234 567 890',
    role: 'Senior Teacher',
    department: 'Science',
    initials: 'JS',
    dutiesCount: 3,
    tasksCount: 5,
    can_review_achievements: false
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@school.edu',
    phone: '+1 234 567 891',
    role: 'Teacher',
    department: 'Mathematics',
    initials: 'JD',
    dutiesCount: 2,
    tasksCount: 3,
    can_review_achievements: false
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@school.edu',
    role: 'Teacher',
    department: 'English',
    initials: 'MJ',
    dutiesCount: 4,
    tasksCount: 2,
    can_review_achievements: false
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah.williams@school.edu',
    phone: '+1 234 567 893',
    role: 'Head of Department',
    department: 'Arts',
    initials: 'SW',
    dutiesCount: 5,
    tasksCount: 7,
    can_review_achievements: true
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@school.edu',
    role: 'Teacher',
    department: 'Physical Education',
    initials: 'DB',
    dutiesCount: 2,
    tasksCount: 4,
    can_review_achievements: false
  },
  {
    id: '6',
    name: 'Emily Davis',
    email: 'emily.davis@school.edu',
    phone: '+1 234 567 895',
    role: 'Teacher',
    department: 'History',
    initials: 'ED',
    dutiesCount: 1,
    tasksCount: 2,
    can_review_achievements: false
  },
];

export default function TeachersPage() {
  const navigate = useNavigate();
  // const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    api.get('/teachers')
      .then(res => {
        const teachersWithInitials = res.data.map((teacher: any) => ({
          ...teacher,
          initials: teacher.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2), // Limit to first 2 letters
          dutiesCount: teacher.duties_count ?? 0,
          tasksCount: teacher.tasks_count ?? 0,
          can_review_achievements: teacher.can_review_achievements
        }));

        setTeachers(teachersWithInitials);
      })
      .catch(() => toast.error('Failed to load teachers'));
  }, []);


  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    role: 'teacher',
    phone: '',
    department: ''
  });


  const filteredTeachers = teachers.filter(
    teacher =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const handleAddTeacher = () => {
  //   if (!newTeacher.name || !newTeacher.email || !newTeacher.role) {
  //     toast.error('Please fill in all required fields');
  //     return;
  //   }

  //   const initials = newTeacher.name
  //     .split(' ')
  //     .map(n => n[0])
  //     .join('')
  //     .toUpperCase()
  //     .slice(0, 2);

  //   const teacher: Teacher = {
  //     id: String(Date.now()),
  //     name: newTeacher.name,
  //     email: newTeacher.email,
  //     phone: newTeacher.phone || undefined,
  //     role: newTeacher.role,
  //     department: 'General',
  //     initials,
  //     dutiesCount: 0,
  //     tasksCount: 0,
  //   };

  //   setTeachers([...teachers, teacher]);
  //   setNewTeacher({ name: '', email: '', role: '', phone: '' });
  //   setShowAddForm(false);
  //   toast.success('Teacher added successfully');
  // };

  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    api.post('/teachers', newTeacher)
      .then(res => {
        const teacherWithInitials = {
          ...res.data,
          initials: res.data.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          dutiesCount: 0,
          tasksCount: 0,
        };
        setTeachers([...teachers, teacherWithInitials]);
        setShowAddForm(false);
        toast.success('Teacher added successfully');
        setNewTeacher({ name: '', email: '', role: 'teacher', phone: '', department: '' });
      })
      .catch(err => {
        console.error('Error adding teacher:', err);
        const errorMsg = err.response?.data?.message || 'Error adding teacher';
        toast.error(errorMsg);
      });
  };


  return (
    <AppLayout title="Teachers">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-foreground">Teachers</h2>
            <p className="text-sm text-muted-foreground">{teachers.length} teachers</p>
          </div>
          <Button variant="default" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {/* Quick Actions Bar */}
        <Card className="animate-slide-up">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => navigate('/duties')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-blue-600">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center text-foreground">
                  Duties
                </span>
              </button>

              <button
                onClick={() => navigate('/tasks')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-green-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center text-foreground">
                  Tasks
                </span>
              </button>

              <button
                onClick={() => navigate('/subjects')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-purple-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center text-foreground">
                  Subjects
                </span>
              </button>

              <button
                onClick={() => navigate('/cce/works')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-orange-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center text-foreground">
                  CCE Works
                </span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-teal-600">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center text-foreground">
                  Reports
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Teachers List */}
        <div className="space-y-3">
          {filteredTeachers.map((teacher, index) => (
            <Card
              key={teacher.id}
              variant="interactive"
              onClick={() => navigate(`/teachers/${teacher.id}`)}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-primary-foreground">
                      {teacher.initials}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name and Role */}
                    <div className="mb-2">
                      <h3 className="font-bold text-base text-foreground mb-0.5">{teacher.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{teacher.role}</p>
                    </div>

                    {/* Department and Stats */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {teacher.department}
                      </Badge>
                      {teacher.can_review_achievements && (
                        <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/5">
                          ✓ Reviewer
                        </Badge>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">{teacher.dutiesCount}</span> duties
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">{teacher.tasksCount}</span> tasks
                      </span>
                    </div>
                  </div>

                  {/* Chevron Icon */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeachers.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No teachers found</p>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Add Teacher</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowAddForm(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter teacher name"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Department <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Science, Arabic..."
                    value={newTeacher.department}
                    onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  />
                </div>

                {/* Role */}
                {/* <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Role <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={newTeacher.role}
                    onChange={(e) => setNewTeacher({ ...newTeacher, role: e.target.value })}
                    className="w-full p-3 rounded-md bg-background border text-foreground"
                  >
                    <option value="">Select role</option>
                    <option value="teacher">Teacher</option>
                    <option value="manager">Manager</option>
                    <option value="principal">Principal</option>
                  </select>
                </div> */}

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Phone (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  />
                </div>

                {/* Submit */}
                <Button variant="touch" className="w-full" onClick={handleAddTeacher}>
                  Add Teacher
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
