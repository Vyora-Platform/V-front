import { useLocation } from "wouter";
import { Package, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function VendorCatalogueSelection() {
  const [, setLocation] = useLocation();

  const catalogueTypes = [
    {
      title: "Service Catalogue",
      description: "Manage your services and offerings",
      icon: Wrench,
      href: "/vendor/services-catalogue",
      color: "from-blue-500 to-blue-600",
      testId: "card-service-catalogue",
    },
    {
      title: "Product Catalogue",
      description: "Manage your products and inventory",
      icon: Package,
      href: "/vendor/products-catalogue",
      color: "from-teal-500 to-teal-600",
      testId: "card-product-catalogue",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Catalogue Management
          </h1>
          <p className="text-muted-foreground">
            Choose which catalogue you want to manage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalogueTypes.map((catalogue) => {
            const Icon = catalogue.icon;
            return (
              <Card
                key={catalogue.title}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
                onClick={() => setLocation(catalogue.href)}
                data-testid={catalogue.testId}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${catalogue.color} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {catalogue.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {catalogue.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
