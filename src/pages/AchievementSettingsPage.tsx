import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, ArrowLeft, Star, Settings2, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Category {
    id: number;
    name: string;
    description: string | null;
    points: number;
    is_active: boolean;
}

export default function AchievementSettingsPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [thresholds, setThresholds] = useState<Record<string, number>>({ "1": 20, "2": 50, "3": 100 });
    const [isLoading, setIsLoading] = useState(true);

    const [isEditingThresholds, setIsEditingThresholds] = useState(false);
    const [tempThresholds, setTempThresholds] = useState<Record<string, string>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Category form state
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ name: '', description: '', points: '', is_active: true });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/achievement-settings');
            setCategories(response.data.categories || []);
            const thresholdsData = response.data.star_thresholds || {};
            // Make sure keys exist for at least 1-3 stars
            const defaultThresh = { "1": 20, "2": 50, "3": 100 };
            setThresholds(Object.keys(thresholdsData).length > 0 ? thresholdsData : defaultThresh);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load achievement settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveThresholds = async () => {
        setIsSubmitting(true);
        try {
            // Convert temp string thresholds to number
            const formattedThresholds: Record<string, number> = {};
            Object.keys(tempThresholds).forEach(key => {
                const val = parseInt(tempThresholds[key]);
                if (!isNaN(val) && val > 0) {
                    formattedThresholds[key] = val;
                }
            });

            await api.post('/achievement-settings/thresholds', { thresholds: formattedThresholds });
            setThresholds(formattedThresholds);
            setIsEditingThresholds(false);
            toast.success("Star thresholds updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update thresholds");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditThresholdsClick = () => {
        const temp: Record<string, string> = {};
        Object.keys(thresholds).forEach(k => {
            temp[k] = thresholds[k].toString();
        });
        // Ensure at least 1 to 5 stars show up for editing
        [1, 2, 3, 4, 5].forEach(star => {
            if (!temp[star.toString()]) {
                temp[star.toString()] = "";
            }
        });
        setTempThresholds(temp);
        setIsEditingThresholds(true);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name || !catForm.points) {
            toast.error('Name and points are required');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: catForm.name,
                description: catForm.description,
                points: parseInt(catForm.points),
                is_active: catForm.is_active
            };

            if (editingCategory) {
                await api.put(`/achievement-settings/categories/${editingCategory.id}`, payload);
                toast.success('Category updated');
            } else {
                await api.post('/achievement-settings/categories', payload);
                toast.success('Category created');
            }
            
            setEditingCategory(null);
            setCatForm({ name: '', description: '', points: '', is_active: true });
            fetchSettings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await api.delete(`/achievement-settings/categories/${id}`);
            toast.success("Category removed");
            fetchSettings();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete category");
        }
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCatForm({
            name: cat.name,
            description: cat.description || '',
            points: cat.points.toString(),
            is_active: cat.is_active
        });
    };

    return (
        <AppLayout title="Achievement Settings">
            <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/student-achievements')}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Settings2 className="w-6 h-6 text-primary" />
                            Achievement Settings
                        </h2>
                        <p className="text-sm text-muted-foreground">Manage categories and star rules</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Star Thresholds Settings */}
                        <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    Star Point Thresholds
                                </CardTitle>
                                <CardDescription>Define how many points a student needs to reach each star level</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isEditingThresholds ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <div key={star} className="flex flex-col gap-1.5">
                                                    <label className="text-sm font-medium flex items-center gap-1">
                                                        {star} Star{star > 1 && 's'}
                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                    </label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Points..."
                                                        min={1}
                                                        value={tempThresholds[star.toString()] || ''}
                                                        onChange={(e) => setTempThresholds(prev => ({...prev, [star.toString()]: e.target.value}))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button variant="outline" onClick={() => setIsEditingThresholds(false)}>Cancel</Button>
                                            <Button disabled={isSubmitting} onClick={handleSaveThresholds}>
                                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Save Thresholds
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-4">
                                            {Object.keys(thresholds).sort((a,b) => parseInt(a) - parseInt(b)).map(star => (
                                                <div key={star} className="bg-background rounded-lg border p-3 min-w-[120px] text-center shadow-sm">
                                                    <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold mb-1">
                                                        {star} <Star className="w-4 h-4 fill-yellow-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold">{thresholds[star]} <span className="text-xs text-muted-foreground font-normal">pts</span></div>
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleEditThresholdsClick}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Rules
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Category Form */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">{editingCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
                                <CardDescription>Create a type of achievement along with its reward points.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category Name</label>
                                    <Input 
                                        placeholder="e.g. Science Fair Winner" 
                                        value={catForm.name}
                                        onChange={e => setCatForm({...catForm, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Reward Points</label>
                                    <Input 
                                        type="number" 
                                        placeholder="e.g. 10" 
                                        min={1}
                                        value={catForm.points}
                                        onChange={e => setCatForm({...catForm, points: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description (Optional)</label>
                                    <Textarea 
                                        placeholder="Rules or criteria..." 
                                        className="resize-none"
                                        value={catForm.description}
                                        onChange={e => setCatForm({...catForm, description: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <label className="text-sm font-medium cursor-pointer" htmlFor="is-active">Active</label>
                                    <Switch 
                                        id="is-active"
                                        checked={catForm.is_active}
                                        onCheckedChange={v => setCatForm({...catForm, is_active: v})}
                                    />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    {editingCategory && (
                                        <Button 
                                            variant="outline" 
                                            className="flex-1"
                                            onClick={() => {
                                                setEditingCategory(null);
                                                setCatForm({ name: '', description: '', points: '', is_active: true });
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                    <Button 
                                        className="flex-1 w-full" 
                                        disabled={isSubmitting} 
                                        onClick={handleSaveCategory}
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingCategory ? 'Update' : 'Add Category'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Existing Categories */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">Categories</CardTitle>
                                <CardDescription>Currently available achievement types</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {categories.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                                        No categories added yet.
                                    </div>
                                ) : (
                                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                        {categories.map(cat => (
                                            <div key={cat.id} className={`p-3 rounded-lg border ${!cat.is_active ? 'bg-muted/50 opacity-60' : 'bg-card'} flex justify-between items-start gap-2 shadow-sm transition-all hover:border-primary/30`}>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-sm">{cat.name}</h4>
                                                        {!cat.is_active && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-wider text-muted-foreground">Inactive</span>}
                                                    </div>
                                                    {cat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>}
                                                    <div className="mt-2 text-xs font-bold text-primary bg-primary/10 inline-block px-2 py-0.5 rounded">
                                                        +{cat.points} Points
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditCategory(cat)}>
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCategory(cat.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
