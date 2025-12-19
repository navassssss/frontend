import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight, Phone, Mail } from 'lucide-react';
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
    if (!newTeacher.name || !newTeacher.email || !newTeacher.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    api.post('/teachers', newTeacher)
      .then(res => {
        setTeachers([...teachers, res.data]);
        setShowAddForm(false);
        toast.success('Teacher added successfully');
        setNewTeacher({ name: '', email: '', role: 'teacher', phone: '', department: '' });
      })
      .catch(err => toast.error('Error adding teacher'));
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
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-foreground">
                      {teacher.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{teacher.name}</h3>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">{teacher.role}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary">{teacher.department}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {teacher.dutiesCount} duties • {teacher.tasksCount} tasks
                      </span>
                      {teacher.can_review_achievements && (
                        <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/5">
                          Reviewer
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={teacher.can_review_achievements ? "default" : "outline"}
                    size="sm"
                    className={`ml-2 ${teacher.can_review_achievements ? 'bg-success hover:bg-success/90' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      api.post(`/teachers/${teacher.id}/toggle-review-permission`)
                        .then(res => {
                          setTeachers(prev => prev.map(t =>
                            t.id === teacher.id
                              ? { ...t, can_review_achievements: res.data.can_review_achievements }
                              : t
                          ));
                          toast.success(`Permission ${res.data.can_review_achievements ? 'granted' : 'revoked'}`);
                        })
                        .catch(() => toast.error('Failed to update permission'));
                    }}
                  >
                    {teacher.can_review_achievements ? 'Revoke Review' : 'Grant Review'}
                  </Button>
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
