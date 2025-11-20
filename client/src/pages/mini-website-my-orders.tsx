import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Calendar, MapPin, Phone, Mail } from "lucide-react";
import { getApiUrl } from "@/lib/config";

export default function MiniWebsiteMyOrders() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [, setLocation] = useLocation();
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);

  // Load customer auth
  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const data = localStorage.getItem("customerData");
    
    if (!token || !data) {
      // Not logged in, redirect to login
      setLocation(`/site/${subdomain}/login`);
      return;
    }

    try {
      setCustomerToken(token);
      setCustomerData(JSON.parse(data));
    } catch (e) {
      console.error("Failed to parse customer data");
      setLocation(`/site/${subdomain}/login`);
    }
  }, [subdomain, setLocation]);

  // Fetch orders
  const { data: orders, isLoading, error } = useQuery({
    queryKey: [`/api/mini-website/${subdomain}/my-orders`, customerToken],
    queryFn: async () => {
      if (!customerToken) return [];
      
      const response = await fetch(getApiUrl(`/api/mini-website/${subdomain}/my-orders`), {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      return response.json();
    },
    enabled: !!customerToken,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-muted rounded mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/site/${subdomain}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {customerData?.name}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {orders?.length || 0} Orders
            </Badge>
          </div>
        </div>

        {/* Orders List */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">Failed to load orders. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {orders && orders.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start shopping to see your orders here
              </p>
              <Button onClick={() => setLocation(`/site/${subdomain}`)}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id.substring(0, 8).toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-4">
                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Items:</h4>
                    <div className="space-y-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">
                              ₹{item.totalPrice?.toLocaleString() || (item.pricePerUnit * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No items available</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">Delivery Address:</p>
                        <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                        <p className="text-sm text-gray-600">
                          {order.city}, {order.state} - {order.pincode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.customerPhone}
                    </div>
                    {order.customerEmail && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {order.customerEmail}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-4 bg-amber-50 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700">Special Instructions:</p>
                      <p className="text-sm text-gray-600">{order.notes}</p>
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Order Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{order.subtotal?.toLocaleString()}</span>
                    </div>
                    {order.deliveryCharges > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Charges:</span>
                        <span className="font-medium">₹{order.deliveryCharges?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-green-600">₹{order.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Status:</span>
                    <Badge variant="outline" className={
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }>
                      {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

