import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  navigationUrl?: string;
  gradient?: string;
  displayOrder: number;
  status: string;
  startDate?: string;
  endDate?: string;
  targetAudience?: string;
  createdAt: string;
}

const GRADIENT_OPTIONS = [
  { value: "from-purple-600 via-violet-600 to-indigo-600", label: "Purple Violet" },
  { value: "from-emerald-600 via-teal-600 to-cyan-600", label: "Emerald Teal" },
  { value: "from-orange-600 via-red-600 to-pink-600", label: "Orange Red" },
  { value: "from-blue-600 via-sky-600 to-cyan-600", label: "Blue Sky" },
  { value: "from-rose-600 via-pink-600 to-fuchsia-600", label: "Rose Pink" },
  { value: "from-amber-600 via-yellow-600 to-lime-600", label: "Amber Yellow" },
];

export default function AdminPromoBanners() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    navigationUrl: "",
    gradient: "from-purple-600 via-violet-600 to-indigo-600",
    status: "active",
    targetAudience: "all",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['/api/promo-banners'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/promo-banners'));
      if (!response.ok) throw new Error('Failed to fetch banners');
      return response.json();
    },
  });

  // Create banner mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(getApiUrl('/api/promo-banners'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-banners'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Banner created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create banner", variant: "destructive" });
    },
  });

  // Update banner mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(getApiUrl(`/api/promo-banners/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-banners'] });
      setIsDialogOpen(false);
      setEditingBanner(null);
      resetForm();
      toast({ title: "Success", description: "Banner updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update banner", variant: "destructive" });
    },
  });

  // Delete banner mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getApiUrl(`/api/promo-banners/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-banners'] });
      toast({ title: "Success", description: "Banner deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete banner", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      imageUrl: "",
      navigationUrl: "",
      gradient: "from-purple-600 via-violet-600 to-indigo-600",
      status: "active",
      targetAudience: "all",
    });
  };

  const handleEdit = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      navigationUrl: banner.navigationUrl || "",
      gradient: banner.gradient || "from-purple-600 via-violet-600 to-indigo-600",
      status: banner.status || "active",
      targetAudience: banner.targetAudience || "all",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      displayOrder: editingBanner?.displayOrder || banners.length,
    };

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleStatus = async (banner: PromoBanner) => {
    updateMutation.mutate({
      id: banner.id,
      data: { status: banner.status === 'active' ? 'inactive' : 'active' }
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promo Banners</h1>
          <p className="text-muted-foreground">Manage promotional banners shown on vendor dashboard</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingBanner(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Grow Your Business"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g., Get more customers with our powerful tools"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                />
                <p className="text-xs text-muted-foreground">Leave empty to use gradient background</p>
              </div>
              
              <div className="space-y-2">
                <Label>Navigation URL</Label>
                <Input
                  value={formData.navigationUrl}
                  onChange={(e) => setFormData({ ...formData, navigationUrl: e.target.value })}
                  placeholder="/vendor/website or https://example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Gradient Background</Label>
                <Select value={formData.gradient} onValueChange={(v) => setFormData({ ...formData, gradient: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-4 rounded bg-gradient-to-r", opt.value)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={formData.targetAudience} onValueChange={(v) => setFormData({ ...formData, targetAudience: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    <SelectItem value="new">New Vendors</SelectItem>
                    <SelectItem value="premium">Premium Vendors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="rounded-xl overflow-hidden">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-cover" />
                  ) : (
                    <div className={cn(
                      "w-full h-32 bg-gradient-to-r flex items-center justify-center",
                      formData.gradient
                    )}>
                      <div className="text-center text-white px-4">
                        <p className="font-bold">{formData.title || 'Banner Title'}</p>
                        <p className="text-sm text-white/80">{formData.subtitle || 'Banner subtitle'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.title || createMutation.isPending || updateMutation.isPending}
              >
                {editingBanner ? 'Update' : 'Create'} Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="h-32 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Banners Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first promotional banner to display on vendor dashboards</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Banner
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner: PromoBanner) => (
            <Card key={banner.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Banner Preview */}
                <div className="relative">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-32 object-cover" />
                  ) : (
                    <div className={cn(
                      "w-full h-32 bg-gradient-to-r flex items-center justify-center",
                      banner.gradient || "from-purple-600 via-violet-600 to-indigo-600"
                    )}>
                      <div className="text-center text-white px-4">
                        <p className="font-bold">{banner.title}</p>
                        {banner.subtitle && <p className="text-sm text-white/80">{banner.subtitle}</p>}
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={banner.status === 'active' ? 'default' : 'secondary'}>
                      {banner.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Banner Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-medium">{banner.title}</h3>
                    {banner.navigationUrl && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <LinkIcon className="w-3 h-3" />
                        {banner.navigationUrl}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(banner)}
                      >
                        {banner.status === 'active' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(banner)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this banner?')) {
                            deleteMutation.mutate(banner.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Order: {banner.displayOrder}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

