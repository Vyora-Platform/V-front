import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Package,
  ShoppingCart,
  FileText,
  Heart,
  AlertCircle,
  Users,
} from "lucide-react";
import { Customer } from "@shared/schema";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorCustomerDetail() {
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: customer, isLoading, error } = useQuery<Customer>({
    queryKey: ['/api/customers', id],
    enabled: !!id,
  });

  // Fetch orders (products)
  const { data: orders } = useQuery({
    queryKey: ['/api/customers', id, 'orders'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/customers/${id}/orders`));
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch bookings (services)
  const { data: bookings } = useQuery({
    queryKey: ['/api/customers', id, 'bookings'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/customers/${id}/bookings`));
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="container max-w-4xl py-6 pb-16 md:pb-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container max-w-4xl py-6 pb-16 md:pb-6">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Customer not found</p>
          <Button onClick={() => setLocation("/vendor/customers")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const totalPurchases = (orders?.length || 0) + (bookings?.length || 0);

  return (
    <div className="container max-w-4xl py-6 pb-16 md:pb-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/vendor/customers")}
        className="mb-4"
        data-testid="button-back-to-customers"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Customers
      </Button>

      {/* Customer Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl" data-testid="text-customer-name">
                    {customer.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={
                        customer.status === "active"
                          ? "default"
                          : customer.status === "pending_followup"
                          ? "secondary"
                          : "outline"
                      }
                      data-testid="badge-customer-status"
                    >
                      {customer.status}
                    </Badge>
                    {customer.membershipType && (
                      <Badge variant="outline" data-testid="badge-membership-type">
                        {customer.membershipType}
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize" data-testid="badge-customer-type">
                      {customer.customerType}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium" data-testid="text-customer-phone">{customer.phone}</p>
              </div>
            </div>
          )}
          {customer.alternatePhone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Alternate Phone</p>
                <p className="font-medium">{customer.alternatePhone}</p>
              </div>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium" data-testid="text-customer-email">{customer.email}</p>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.state && `, ${customer.state}`}
                  {customer.pincode && ` - ${customer.pincode}`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold" data-testid="text-total-visits">{customer.totalVisits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold" data-testid="text-total-spent">
                  ₹{(customer.totalSpent || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Purchases</p>
                <p className="text-2xl font-bold" data-testid="text-total-purchases">{totalPurchases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {(customer.dateOfBirth || customer.gender || customer.lastVisitDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.gender && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{customer.gender}</p>
                </div>
              </div>
            )}
            {customer.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{format(new Date(customer.dateOfBirth), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            )}
            {customer.lastVisitDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Visit</p>
                  <p className="font-medium">{format(new Date(customer.lastVisitDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Membership Details */}
      {customer.membershipType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membership Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Membership Type</p>
                <p className="font-medium">{customer.membershipType}</p>
              </div>
              {customer.subscriptionStatus && (
                <div>
                  <p className="text-sm text-muted-foreground">Subscription Status</p>
                  <Badge variant="outline" className="capitalize">{customer.subscriptionStatus}</Badge>
                </div>
              )}
              {customer.membershipStartDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(customer.membershipStartDate), 'MMM dd, yyyy')}</p>
                </div>
              )}
              {customer.membershipEndDate && (
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{format(new Date(customer.membershipEndDate), 'MMM dd, yyyy')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes and Preferences */}
      {(customer.notes || (customer.preferences && customer.preferences.length > 0) || (customer.allergies && customer.allergies.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes & Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm italic">{customer.notes}</p>
              </div>
            )}
            {customer.preferences && customer.preferences.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {customer.preferences.map((pref, idx) => (
                    <Badge key={idx} variant="secondary">
                      <Heart className="h-3 w-3 mr-1" />
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {customer.allergies && customer.allergies.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {customer.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      {(customer.emergencyContactName || customer.emergencyContactPhone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.emergencyContactName && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customer.emergencyContactName}</p>
                </div>
              </div>
            )}
            {customer.emergencyContactPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.emergencyContactPhone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purchase History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Orders (Products) */}
          {orders && orders.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <ShoppingCart className="h-4 w-4" />
                Product Orders ({orders.length})
              </h4>
              <div className="space-y-2">
                {orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg bg-muted/30 border"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="ml-2 capitalize">
                          {order.status}
                        </Badge>
                      </div>
                      <span className="font-semibold text-lg">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </div>
                    {order.notes && (
                      <div className="text-sm text-muted-foreground mt-2">{order.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings (Services) */}
          {bookings && bookings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4" />
                Service Bookings ({bookings.length})
              </h4>
              <div className="space-y-2">
                {bookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-lg bg-muted/30 border"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">Booking #{booking.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="ml-2 capitalize">
                          {booking.status}
                        </Badge>
                      </div>
                      <span className="font-semibold text-lg">₹{booking.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {format(new Date(booking.bookingDate), 'MMM dd, yyyy')}
                    </div>
                    {booking.notes && (
                      <div className="text-sm text-muted-foreground mt-2">{booking.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No purchase history */}
          {(!orders || orders.length === 0) && (!bookings || bookings.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No purchase history found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
