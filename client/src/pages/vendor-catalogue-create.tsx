import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { InsertVendorCatalogue } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorCatalogueCreate() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    icon: "🩺",
    description: "",
    price: 0,
    sampleType: "",
    tat: "",
    homeCollectionAvailable: false,
    homeCollectionCharges: 0,
  });
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newTag, setNewTag] = useState("");

  // Create vendor catalogue service mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertVendorCatalogue) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/catalogue`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service created and added to your catalogue!" });
      navigate("/vendor/my-catalogue");
    },
    onError: () => {
      toast({ title: "Failed to create service", variant: "destructive" });
    },
  });

  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion("");
    }
  };

  const handleAddExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion("");
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.description) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (formData.price <= 0) {
      toast({ title: "Price must be greater than 0", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      vendorId: vendorId,
      masterServiceId: null, // Custom service, not from master catalogue
      customServiceRequestId: null,
      name: formData.name,
      category: formData.category,
      icon: formData.icon,
      description: formData.description,
      inclusions,
      exclusions,
      tags,
      sampleType: formData.sampleType || null,
      tat: formData.tat || null,
      price: formData.price,
      homeCollectionAvailable: formData.homeCollectionAvailable,
      homeCollectionCharges: formData.homeCollectionCharges,
      isActive: true,
      discountPercentage: 0,
    });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-16 md:pb-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vendor/my-catalogue")}
          className="md:hidden flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Create Custom Service
          </h1>
          <p className="text-muted-foreground">Add a new service to your catalogue</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Complete Blood Count"
              data-testid="input-service-name"
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., diagnostic, preventive"
              data-testid="input-category"
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon (Emoji)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🩺"
              data-testid="input-icon"
            />
          </div>

          <div>
            <Label htmlFor="price">Price (₹) *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 499"
              data-testid="input-price"
            />
          </div>

          <div>
            <Label htmlFor="sampleType">Sample Type</Label>
            <Input
              id="sampleType"
              value={formData.sampleType}
              onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
              placeholder="e.g., Blood, Urine"
              data-testid="input-sample-type"
            />
          </div>

          <div>
            <Label htmlFor="tat">Turnaround Time (TAT)</Label>
            <Input
              id="tat"
              value={formData.tat}
              onChange={(e) => setFormData({ ...formData, tat: e.target.value })}
              placeholder="e.g., 24 hours"
              data-testid="input-tat"
            />
          </div>

          <div>
            <Label htmlFor="homeCollectionCharges">Home Collection Charges (₹)</Label>
            <Input
              id="homeCollectionCharges"
              type="number"
              value={formData.homeCollectionCharges}
              onChange={(e) => setFormData({ ...formData, homeCollectionCharges: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 100"
              data-testid="input-home-collection-charges"
            />
          </div>

          <div className="flex items-center gap-2 h-full">
            <input
              type="checkbox"
              id="homeCollectionAvailable"
              checked={formData.homeCollectionAvailable}
              onChange={(e) => setFormData({ ...formData, homeCollectionAvailable: e.target.checked })}
              data-testid="checkbox-home-collection"
            />
            <Label htmlFor="homeCollectionAvailable" className="cursor-pointer">
              Home Collection Available
            </Label>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this service includes and its benefits"
              rows={3}
              data-testid="input-description"
            />
          </div>

          {/* Inclusions */}
          <div className="md:col-span-2">
            <Label>Inclusions</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInclusion())}
                placeholder="Add inclusion item (press Enter)"
                data-testid="input-new-inclusion"
              />
              <Button onClick={handleAddInclusion} data-testid="button-add-inclusion">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {inclusions.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {item}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setInclusions(inclusions.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Exclusions */}
          <div className="md:col-span-2">
            <Label>Exclusions</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExclusion())}
                placeholder="Add exclusion item (press Enter)"
                data-testid="input-new-exclusion"
              />
              <Button onClick={handleAddExclusion} data-testid="button-add-exclusion">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {exclusions.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {item}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setExclusions(exclusions.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag (press Enter)"
                data-testid="input-new-tag"
              />
              <Button onClick={handleAddTag} data-testid="button-add-tag">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => navigate("/vendor/my-catalogue")}
            data-testid="button-cancel-form"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            data-testid="button-save-service"
          >
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Creating..." : "Create Service"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
