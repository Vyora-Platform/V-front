import CouponCard from '../CouponCard';

export default function CouponCardExample() {
  return (
    <div className="max-w-md p-6 bg-background space-y-4">
      <CouponCard
        id="coupon-1"
        code="HEALTH50"
        description="50% off on all blood tests"
        discountType="percentage"
        discountValue={50}
        expiryDate="2025-12-31T23:59:59"
        maxUsage={100}
        usedCount={45}
        status="active"
        applicableServices={["Blood Tests", "CBC", "Lipid Profile"]}
        onEdit={() => console.log('Edit coupon')}
        onToggle={() => console.log('Toggle coupon status')}
      />
      <CouponCard
        id="coupon-2"
        code="WELCOME200"
        description="₹200 off on first booking"
        discountType="fixed"
        discountValue={200}
        expiryDate="2025-11-30T23:59:59"
        maxUsage={50}
        usedCount={48}
        status="active"
        onEdit={() => console.log('Edit coupon')}
        onToggle={() => console.log('Toggle coupon status')}
      />
    </div>
  );
}
