import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus } from "lucide-react";
import { useState } from "react";

// TODO: remove mock data
const masterServices = [
  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    category: "Blood Tests",
    price: 499,
    description: "Comprehensive blood test measuring red cells, white cells, and platelets to assess overall health.",
    inclusions: ["Hemoglobin test", "WBC count", "Platelet count", "RBC indices", "MCV, MCH, MCHC"],
    exclusions: ["Consultation fee", "Home collection charges", "Report interpretation"],
    tags: ["Popular", "Preventive", "Essential"],
    tat: "24 hours",
    sampleType: "Blood",
    icon: "🩸"
  },
  {
    id: "lipid",
    name: "Lipid Profile",
    category: "Blood Tests",
    price: 799,
    description: "Measures cholesterol and triglyceride levels to assess cardiovascular health risk.",
    inclusions: ["Total Cholesterol", "HDL", "LDL", "VLDL", "Triglycerides", "TC/HDL ratio"],
    exclusions: ["Fasting not included", "Doctor consultation", "Follow-up tests"],
    tags: ["Heart Health", "Preventive"],
    tat: "24 hours",
    sampleType: "Blood",
    icon: "❤️"
  },
  {
    id: "xray-chest",
    name: "X-Ray Chest (PA View)",
    category: "Radiology",
    price: 350,
    description: "Digital chest X-ray to detect lung and heart abnormalities.",
    inclusions: ["Digital X-ray", "Radiologist report", "CD copy of images"],
    exclusions: ["Consultation", "Additional views", "Contrast studies"],
    tags: ["Imaging", "Diagnostic"],
    tat: "2 hours",
    sampleType: "N/A",
    icon: "🫁"
  },
  {
    id: "thyroid",
    name: "Thyroid Profile",
    category: "Hormone Tests",
    price: 650,
    description: "Complete thyroid function test including T3, T4, and TSH levels.",
    inclusions: ["T3", "T4", "TSH", "Interpretation guide"],
    exclusions: ["Anti-TPO antibodies", "Consultation", "Ultrasound"],
    tags: ["Hormones", "Common"],
    tat: "48 hours",
    sampleType: "Blood",
    icon: "🦋"
  },
  {
    id: "hba1c",
    name: "HbA1c (Glycated Hemoglobin)",
    category: "Diabetes Tests",
    price: 550,
    description: "3-month average blood sugar level indicator for diabetes monitoring.",
    inclusions: ["HbA1c test", "Diabetes risk assessment", "Digital report"],
    exclusions: ["Fasting glucose", "OGTT", "Consultation"],
    tags: ["Diabetes", "Preventive"],
    tat: "24 hours",
    sampleType: "Blood",
    icon: "🩺"
  },
  {
    id: "kidney",
    name: "Kidney Function Test (KFT)",
    category: "Organ Function",
    price: 750,
    description: "Comprehensive kidney health assessment with multiple parameters.",
    inclusions: ["Creatinine", "Urea", "BUN", "Uric acid", "Electrolytes"],
    exclusions: ["Urinalysis", "Ultrasound", "Specialist consultation"],
    tags: ["Kidney Health", "Complete"],
    tat: "24 hours",
    sampleType: "Blood",
    icon: "🫘"
  },
];

export default function Catalogue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [addedServices, setAddedServices] = useState<Set<string>>(new Set());

  const filteredServices = masterServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddService = (serviceId: string) => {
    setAddedServices(prev => new Set(prev).add(serviceId));
    console.log('Added service:', serviceId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Master Catalogue
          </h1>
          <p className="text-muted-foreground">Browse and add services to your catalogue</p>
        </div>
        <Button data-testid="button-request-custom">
          <Plus className="w-4 h-4 mr-2" />
          Request Custom Service
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services, categories, or tags..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-services"
          />
        </div>
        <Button variant="outline" data-testid="button-filters">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Service Count */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredServices.length} of {masterServices.length} services
        </p>
        <Badge variant="secondary">{addedServices.size} added to your catalogue</Badge>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            {...service}
            onAdd={() => handleAddService(service.id)}
            added={addedServices.has(service.id)}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services found matching your search.</p>
        </div>
      )}
    </div>
  );
}
