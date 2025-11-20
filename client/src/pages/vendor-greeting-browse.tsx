import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, TrendingUp, Calendar, Tag, Download, Share2, Sparkles, Filter, ChevronDown } from "lucide-react";
import type { GreetingTemplate } from "@shared/schema";
import { useLocation, useParams } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// Filter options (same as admin page)
const occasionOptions = [
  { value: "diwali", label: "Diwali" },
  { value: "christmas", label: "Christmas" },
  { value: "eid", label: "Eid" },
  { value: "holi", label: "Holi" },
  { value: "new_year", label: "New Year" },
  { value: "independence_day", label: "Independence Day" },
  { value: "republic_day", label: "Republic Day" },
  { value: "raksha_bandhan", label: "Raksha Bandhan" },
  { value: "navratri", label: "Navratri" },
  { value: "pongal", label: "Pongal" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "grand_opening", label: "Grand Opening" },
  { value: "festival", label: "Festival (Generic)" },
];

const offerTypeOptions = [
  { value: "flat_discount", label: "Flat Discount" },
  { value: "bogo", label: "Buy One Get One" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "new_product_launch", label: "New Product Launch" },
  { value: "membership_offer", label: "Membership Offer" },
  { value: "referral_campaign", label: "Referral Campaign" },
  { value: "seasonal_clearance", label: "Seasonal Clearance" },
  { value: "free_trial", label: "Free Trial" },
];

const industryOptions = [
  { value: "fitness", label: "Fitness & Gym" },
  { value: "yoga", label: "Yoga & Wellness" },
  { value: "salon", label: "Salon & Spa" },
  { value: "clinic", label: "Clinic & Lab" },
  { value: "library", label: "Library & Coaching" },
  { value: "restaurant", label: "Restaurant & Cafe" },
  { value: "retail", label: "Retail Shop" },
  { value: "electronics", label: "Electronics" },
  { value: "real_estate", label: "Real Estate" },
  { value: "pet_care", label: "Pet Care" },
  { value: "automotive", label: "Automotive" },
  { value: "grocery", label: "Grocery" },
];

export default function VendorGreetingBrowse() {
  const params = useParams<{ vendorId: string }>();
  const { vendorId: hookVendorId } = useAuth();
  
  // Get vendor ID from params or localStorage
  const vendorId = params.vendorId || hookVendorId;
  
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedOfferTypes, setSelectedOfferTypes] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Build query params for API call
  const queryParams = new URLSearchParams();
  queryParams.set("status", "published");
  if (selectedOccasions.length > 0) {
    queryParams.set("occasions", selectedOccasions.join(','));
  }
  if (selectedOfferTypes.length > 0) {
    queryParams.set("offerTypes", selectedOfferTypes.join(','));
  }
  if (selectedIndustries.length > 0) {
    queryParams.set("industries", selectedIndustries.join(','));
  }
  if (activeTab === "trending") {
    queryParams.set("isTrending", "true");
  }

  const { data: templates = [], isLoading } = useQuery<GreetingTemplate[]>({
    queryKey: ["/api/greeting-templates", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/greeting-templates?${queryParams.toString()}`));
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleArraySelection = (
    array: string[],
    setArray: (arr: string[]) => void,
    value: string
  ) => {
    if (array.includes(value)) {
      setArray(array.filter((v) => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedOccasions([]);
    setSelectedOfferTypes([]);
    setSelectedIndustries([]);
    setSearchQuery("");
  };

  const handleTemplateClick = (templateId: string) => {
    setLocation(`/vendors/${vendorId}/greeting/customize/${templateId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Greeting & Marketing </h1>
      </div>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>
      {/* Tabs for trending/all */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all" data-testid="tab-all">
            <Calendar className="w-4 h-4 mr-2" />
            All Templates
          </TabsTrigger>
          <TabsTrigger value="trending" data-testid="tab-trending">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {/* Filters Section - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {/* Occasions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 flex-shrink-0 snap-start" data-testid="dropdown-occasions">
                  <Calendar className="w-4 h-4" />
                  Occasions
                  {selectedOccasions.length > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-full px-2">
                      {selectedOccasions.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel>Select Occasions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {occasionOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedOccasions.includes(option.value)}
                    onCheckedChange={() => toggleArraySelection(selectedOccasions, setSelectedOccasions, option.value)}
                    data-testid={`checkbox-occasion-${option.value}`}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Offer Types Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 flex-shrink-0 snap-start" data-testid="dropdown-offer-types">
                  <Tag className="w-4 h-4" />
                  Offer Types
                  {selectedOfferTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-full px-2">
                      {selectedOfferTypes.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel>Select Offer Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {offerTypeOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedOfferTypes.includes(option.value)}
                    onCheckedChange={() => toggleArraySelection(selectedOfferTypes, setSelectedOfferTypes, option.value)}
                    data-testid={`checkbox-offer-${option.value}`}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Industries Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 flex-shrink-0 snap-start" data-testid="dropdown-industries">
                  <Sparkles className="w-4 h-4" />
                  Industries
                  {selectedIndustries.length > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-full px-2">
                      {selectedIndustries.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel>Select Industries</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {industryOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedIndustries.includes(option.value)}
                    onCheckedChange={() => toggleArraySelection(selectedIndustries, setSelectedIndustries, option.value)}
                    data-testid={`checkbox-industry-${option.value}`}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Button */}
            {(selectedOccasions.length > 0 || selectedOfferTypes.length > 0 || selectedIndustries.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="flex-shrink-0 snap-start"
                data-testid="button-clear-filters"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No templates found</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleTemplateClick(template.id)}
                  data-testid={`card-template-${template.id}`}
                >
                  <CardHeader className="space-y-2 p-0">
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                      <img
                        src={template.thumbnailUrl || template.imageUrl}
                        alt={template.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {template.isTrending && (
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description || "Customize this template for your business"}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.occasions.slice(0, 2).map((occasion) => (
                        <Badge key={occasion} variant="outline" className="text-xs">
                          {occasion}
                        </Badge>
                      ))}
                      {template.occasions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.occasions.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {template.hasEditableText && <span>✏️ Editable Text</span>}
                      {template.supportsLogo && <span>📋 Logo Support</span>}
                      {template.supportsProducts && <span>🏷️ Products</span>}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {template.downloadCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      {template.shareCount}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6 mt-6">
          {/* Show only trending templates */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading trending templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No trending templates found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleTemplateClick(template.id)}
                  data-testid={`card-template-${template.id}`}
                >
                  <CardHeader className="space-y-2 p-0">
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                      <img
                        src={template.thumbnailUrl || template.imageUrl}
                        alt={template.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description || "Customize this template for your business"}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {template.occasions.slice(0, 2).map((occasion) => (
                        <Badge key={occasion} variant="outline" className="text-xs">
                          {occasion}
                        </Badge>
                      ))}
                      {template.occasions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.occasions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {template.downloadCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      {template.shareCount}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
