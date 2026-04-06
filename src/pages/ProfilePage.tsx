import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Mail, Phone, Building2, Eye, EyeOff, Save, Lock, CheckCircle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout, setUser } = useAuth();

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || '',
        bio: user?.bio || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/profile', form);
            if (setUser) setUser(res.data.user);
            toast.success('Profile updated successfully!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    const roleLabel = user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : 'Staff';

    return (
        <AppLayout title="Profile">
            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-12">

                {/* Page Title */}
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-black text-slate-800">Profile Information</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your institutional identity and public-facing academic profile.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT — Profile Card */}
                    <div className="lg:col-span-2 space-y-5 animate-slide-up">

                        {/* Avatar + Name + Role */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-20 h-20 rounded-2xl bg-[#008f6c] text-white flex items-center justify-center text-2xl font-black shadow-md">
                                        {initials}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-black text-slate-800">{user?.name || 'User'}</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">{user?.department ? `${user.department} Department` : 'Staff Member'}</p>
                                    <span className="inline-block mt-2 text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-widest">
                                        {roleLabel}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008f6c] hover:bg-[#007a5c] text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60 shrink-0"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                                            placeholder="you@institution.edu"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                                            placeholder="+91 00000 00000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            value={form.department}
                                            onChange={e => setForm({ ...form, department: e.target.value })}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                                            placeholder="e.g. Sciences"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Biography</label>
                                <textarea
                                    value={form.bio}
                                    onChange={e => setForm({ ...form, bio: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all resize-none"
                                    placeholder="Brief description of your academic background..."
                                />
                            </div>

                            {/* Mobile save button */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="sm:hidden mt-4 w-full py-3 rounded-xl bg-[#008f6c] hover:bg-[#007a5c] text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {/* Security Settings card */}
                        <SecurityCard />
                    </div>

                    {/* RIGHT — Quotes + Sign Out */}
                    <div className="space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>

                        {/* Quotes Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Words to lead by</p>
                            {[
                                { quote: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
                                { quote: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
                                { quote: "A teacher affects eternity; they can never tell where their influence stops.", author: "Henry Adams" },
                            ].map((q, i) => (
                                <div key={i} className="border-l-2 border-[#008f6c]/30 pl-4">
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{q.quote}"</p>
                                    <p className="text-[11px] font-black text-[#008f6c] mt-1.5 uppercase tracking-widest">— {q.author}</p>
                                </div>
                            ))}
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>

                        {/* <p className="text-center text-[11px] text-slate-300 font-medium">EduGov Portal · v1.0.0</p> */}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// Inline Security card (Change Password)
function SecurityCard() {
    const [form, setForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [saving, setSaving] = useState(false);

    const handleChange = async () => {
        if (!form.current_password || !form.new_password || !form.new_password_confirmation) {
            toast.error('Please fill all fields');
            return;
        }
        if (form.new_password !== form.new_password_confirmation) {
            toast.error('New passwords do not match');
            return;
        }
        setSaving(true);
        try {
            await api.post('/change-password', form);
            toast.success('Password changed successfully!');
            setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-[#008f6c]/10 text-[#008f6c] flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800">Change Password</h3>
            </div>

            <div className="space-y-3">
                {/* Current */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Password</label>
                    <div className="relative">
                        <input
                            type={show.current ? 'text' : 'password'}
                            value={form.current_password}
                            onChange={e => setForm({ ...form, current_password: e.target.value })}
                            placeholder="Enter existing password"
                            className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                        />
                        <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* New */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                        <div className="relative">
                            <input
                                type={show.new ? 'text' : 'password'}
                                value={form.new_password}
                                onChange={e => setForm({ ...form, new_password: e.target.value })}
                                placeholder="Create new password"
                                className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                            />
                            <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={show.confirm ? 'text' : 'password'}
                                value={form.new_password_confirmation}
                                onChange={e => setForm({ ...form, new_password_confirmation: e.target.value })}
                                placeholder="Repeat new password"
                                className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                            />
                            <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Requirements */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password Requirements</p>
                    {[
                        { label: 'Minimum 8 characters', met: form.new_password.length >= 8 },
                        { label: 'At least one uppercase letter', met: /[A-Z]/.test(form.new_password) },
                        { label: 'Includes a special character (!, @, #, etc.)', met: /[!@#$%^&*]/.test(form.new_password) },
                    ].map(r => (
                        <div key={r.label} className="flex items-center gap-2 mt-1">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${r.met ? 'bg-[#008f6c]' : 'bg-slate-200'}`}>
                                {r.met && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-[11px] font-medium ${r.met ? 'text-[#008f6c]' : 'text-slate-400'}`}>{r.label}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleChange}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-[#008f6c] hover:bg-[#007a5c] text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60 mt-1"
                >
                    {saving ? 'Updating...' : 'Update Security Credentials'}
                </button>
            </div>
        </div>
    );
}
