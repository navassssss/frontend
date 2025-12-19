import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    GraduationCap,
    Hash,
    Calendar,
    ArrowLeft,
    Star,
    Trophy,
    Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import StudentLayout from '@/components/student/StudentLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

interface StudentProfile {
    id: number;
    name: string;
    username: string;
    class: string;
    department: string;
    rollNumber: string;
    joinedAt: string;
    photo?: string;
    totalPoints: number;
    stars: number;
    achievements: any[]; // Or specific type
}

export default function PublicStudentProfilePage() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/students/${username}`);
                const data = response.data;

                // Map backend response to UI interface if needed
                // Assuming backend returns { student: { ... } } or flat
                setProfile({
                    id: data.student.id,
                    name: data.user.name,
                    username: data.student.username,
                    class: data.student.class?.name || 'Unknown',
                    department: data.student.class?.department || 'General',
                    rollNumber: data.student.roll_number,
                    joinedAt: data.student.joined_at,
                    photo: data.student.photo,
                    totalPoints: data.student.total_points,
                    stars: data.student.stars,
                    achievements: data.achievements || []
                });
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setError('Student not found');
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfile();
        }
    }, [username]);

    if (loading) {
        return <div className="flex justify-center py-10">Loading profile...</div>;
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-muted-foreground">{error || 'Profile not found'}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Header Back Button */}
            <div className="p-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
            </div>

            <div className="container max-w-md mx-auto space-y-6 px-4">
                {/* Profile Header */}
                <Card variant="elevated" className="overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
                        <Avatar className="w-24 h-24 mx-auto border-4 border-background mb-4">
                            <AvatarImage src={profile.photo} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                                {profile.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                        <p className="text-muted-foreground">@{profile.username}</p>

                        <div className="flex items-center justify-center gap-2 mt-3">
                            <Badge variant="secondary">{profile.department}</Badge>
                            <Badge variant="outline">{profile.class}</Badge>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-6">
                            <div className="text-center">
                                <div className="flex items-center gap-1 justify-center text-accent">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span className="text-xl font-bold">{profile.stars}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Stars</p>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div className="text-center">
                                <div className="flex items-center gap-1 justify-center text-primary">
                                    <Trophy className="w-5 h-5" />
                                    <span className="text-xl font-bold">{profile.totalPoints}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Total Points</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Details */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">STUDENT INFORMATION</h3>

                    <Card variant="flat">
                        <CardContent className="p-0 divide-y divide-border">
                            <ProfileItem icon={<Hash className="w-5 h-5" />} label="Roll Number" value={profile.rollNumber} />
                            <ProfileItem
                                icon={<Calendar className="w-5 h-5" />}
                                label="Joined"
                                value={format(new Date(profile.joinedAt), 'MMMM yyyy')}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Public Achievements (Approved only) */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">RECENT ACHIEVEMENTS</h3>
                    {profile.achievements.length > 0 ? (
                        profile.achievements.map((achievement: any) => (
                            <Card key={achievement.id} className="mb-2">
                                <CardContent className="p-4 flex gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                                        <Award className="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{achievement.title}</p>
                                        <p className="text-xs text-muted-foreground">{achievement.category?.name || 'Achievement'}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant="secondary">+{achievement.points}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground px-1">No public achievements yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                {icon}
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}
