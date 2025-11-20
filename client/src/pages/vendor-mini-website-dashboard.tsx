import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MiniWebsite } from "@shared/schema";
import { 
  Globe, 
  Share2, 
  Edit, 
  Eye, 
  EyeOff, 
  Plus, 
  Copy, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ExternalLink,
  FileText
} from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin, SiWhatsapp } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorMiniWebsiteDashboard() {
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  const { data: miniWebsite, isLoading } = useQuery<MiniWebsite>({
    queryKey: [`/api/vendors/${vendorId}/mini-website`],
    enabled: !!vendorId,
  });

  const toggleOfflineMutation = useMutation({
    mutationFn: async () => {
      if (!miniWebsite) throw new Error("No mini-website found");
      const newStatus = miniWebsite.status === "published" ? "draft" : "published";
      // Send complete object but with updated status to avoid validation errors
      return await apiRequest("POST", `/api/vendors/${vendorId}/mini-website`, {
        vendorId: vendorId,
        subdomain: miniWebsite.subdomain,
        status: newStatus,
        businessInfo: miniWebsite.businessInfo || {},
        contactInfo: miniWebsite.contactInfo || {},
        branding: miniWebsite.branding || {},
        selectedCatalog: miniWebsite.selectedCatalog || {},
        team: miniWebsite.team || [],
        faqs: miniWebsite.faqs || [],
        testimonials: miniWebsite.testimonials || [],
        coupons: miniWebsite.coupons || [],
        features: miniWebsite.features || {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/mini-website`] });
      toast({
        title: miniWebsite?.status === "published" ? "Website taken offline" : "Website published",
        description: miniWebsite?.status === "published" 
          ? "Your website is now hidden from public view" 
          : "Your website is now live",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to toggle website status:", error);
      toast({
        title: "Failed to update website status",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!miniWebsite) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Create Your Business Website</h2>
          <p className="text-muted-foreground mb-6">Get online in minutes with our easy-to-use website builder</p>
          <Link href="/vendor/website/create">
            <Button size="lg" data-testid="button-create-website">
              <Plus className="w-4 h-4 mr-2" />
              Create Mini-Website
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const websiteUrl = `${window.location.origin}/site/${miniWebsite.subdomain}`;
  const isPublished = miniWebsite.status === "published";
  
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(websiteUrl)}&text=Check out my business!`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(websiteUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out my business! ${websiteUrl}`)}`,
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 pb-16 md:pb-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Mini-Website</h1>
            <p className="text-muted-foreground">Manage your business online presence</p>
          </div>
        </div>
        <Link href="/vendor/website/create">
          <Button variant="outline" data-testid="button-create-new">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      <Card className="mb-6" data-testid="card-website-preview">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl" data-testid="text-business-name">
                  {miniWebsite.businessInfo?.businessName || "My Business"}
                </CardTitle>
                <Badge variant={isPublished ? "default" : "secondary"} data-testid="badge-status">
                  {isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <a 
                  href={websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  data-testid="link-website-url"
                >
                  {websiteUrl}
                </a>
              </CardDescription>
              {miniWebsite.businessInfo?.tagline && (
                <p className="text-sm text-muted-foreground mt-2">
                  {miniWebsite.businessInfo.tagline}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-edit-menu">
                  <Edit className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link href="/vendor/website/create">
                  <DropdownMenuItem data-testid="menu-edit-all">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit All Sections
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <Link href="/vendor/website/create?step=1">
                  <DropdownMenuItem data-testid="menu-edit-business-info">
                    <FileText className="w-4 h-4 mr-2" />
                    Business Info
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=2">
                  <DropdownMenuItem data-testid="menu-edit-contact">
                    <FileText className="w-4 h-4 mr-2" />
                    Contact Information
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=3">
                  <DropdownMenuItem data-testid="menu-edit-business-hours">
                    <FileText className="w-4 h-4 mr-2" />
                    Business Hours
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=4">
                  <DropdownMenuItem data-testid="menu-edit-team">
                    <FileText className="w-4 h-4 mr-2" />
                    Team & About
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=5">
                  <DropdownMenuItem data-testid="menu-edit-faqs">
                    <FileText className="w-4 h-4 mr-2" />
                    FAQs
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=6">
                  <DropdownMenuItem data-testid="menu-edit-testimonials">
                    <FileText className="w-4 h-4 mr-2" />
                    Testimonials
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=7">
                  <DropdownMenuItem data-testid="menu-edit-coupons">
                    <FileText className="w-4 h-4 mr-2" />
                    Coupons & Offers
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=8">
                  <DropdownMenuItem data-testid="menu-edit-catalog">
                    <FileText className="w-4 h-4 mr-2" />
                    Catalog Selection
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=9">
                  <DropdownMenuItem data-testid="menu-edit-ecommerce">
                    <FileText className="w-4 h-4 mr-2" />
                    E-commerce Settings
                  </DropdownMenuItem>
                </Link>
                <Link href="/vendor/website/create?step=10">
                  <DropdownMenuItem data-testid="menu-edit-review">
                    <FileText className="w-4 h-4 mr-2" />
                    Review & Publish
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Website Preview Image */}
          <div className="rounded-lg border overflow-hidden bg-muted aspect-video flex items-center justify-center relative">
            {miniWebsite.branding?.heroMedia && Array.isArray(miniWebsite.branding.heroMedia) && miniWebsite.branding.heroMedia.length > 0 ? (
              <img 
                src={miniWebsite.branding.heroMedia[0]} 
                alt="Website preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Globe className="w-24 h-24 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No preview image available</p>
                <p className="text-xs text-muted-foreground mt-2">Add hero images in the Branding section</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{miniWebsite.selectedCatalog?.services?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Services</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{miniWebsite.testimonials?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Testimonials</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{miniWebsite.coupons?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Offers</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{miniWebsite.team?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 w-full">
            <Button 
              variant="default" 
              onClick={() => setShareDialogOpen(true)}
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Website
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open(websiteUrl, "_blank")}
              data-testid="button-view-live"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </Button>

            <Button 
              variant="outline"
              onClick={() => copyToClipboard(websiteUrl)}
              data-testid="button-copy-link"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>

            <Button 
              variant={isPublished ? "destructive" : "default"}
              onClick={() => {
                if (!miniWebsite) {
                  toast({
                    title: "Error",
                    description: "Website data not available. Please refresh the page.",
                    variant: "destructive",
                  });
                  return;
                }
                toggleOfflineMutation.mutate();
              }}
              disabled={toggleOfflineMutation.isPending || !miniWebsite}
              data-testid="button-toggle-online"
            >
              {isPublished ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Take Offline
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Publish Live
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Website</DialogTitle>
            <DialogDescription>
              Share your business website across social media platforms and business directories
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Copy Link */}
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={websiteUrl} 
                readOnly 
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                data-testid="input-share-url"
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => copyToClipboard(websiteUrl)}
                data-testid="button-copy-share-link"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Social Media Platforms */}
            <div>
              <p className="text-sm font-medium mb-2">Share on Social Media</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open(shareLinks.facebook, "_blank")}
                  data-testid="button-share-facebook"
                >
                  <SiFacebook className="w-4 h-4 mr-2 text-[#1877F2]" />
                  Facebook
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open(shareLinks.twitter, "_blank")}
                  data-testid="button-share-twitter"
                >
                  <FaXTwitter className="w-4 h-4 mr-2" />
                  Twitter/X
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open(shareLinks.linkedin, "_blank")}
                  data-testid="button-share-linkedin"
                >
                  <SiLinkedin className="w-4 h-4 mr-2 text-[#0A66C2]" />
                  LinkedIn
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open(shareLinks.whatsapp, "_blank")}
                  data-testid="button-share-whatsapp"
                >
                  <SiWhatsapp className="w-4 h-4 mr-2 text-[#25D366]" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Encouraging Message */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">📣 Maximize Your Reach!</p>
              <p className="text-xs text-muted-foreground">
                Paste this link in your:
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside mt-2 space-y-1">
                <li>Instagram bio</li>
                <li>Facebook business page</li>
                <li>Google My Business profile</li>
                <li>LinkedIn profile</li>
                <li>Business directories (JustDial, IndiaMART, etc.)</li>
                <li>WhatsApp Business status</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
