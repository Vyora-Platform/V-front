import ServiceCard from '../ServiceCard';
import { useState } from 'react';

export default function ServiceCardExample() {
  const [added, setAdded] = useState(false);

  return (
    <div className="max-w-md p-6 bg-background">
      <ServiceCard
        id="complete-blood-count"
        name="Complete Blood Count (CBC)"
        category="Blood Tests"
        price={499}
        description="Comprehensive blood test measuring red cells, white cells, and platelets to assess overall health."
        inclusions={[
          "Hemoglobin test",
          "WBC count",
          "Platelet count",
          "RBC indices"
        ]}
        exclusions={[
          "Consultation fee",
          "Home collection charges",
          "Report interpretation"
        ]}
        tags={["Popular", "Preventive", "Essential"]}
        tat="24 hours"
        sampleType="Blood"
        icon="🩸"
        onAdd={() => {
          console.log('Service added');
          setAdded(true);
        }}
        added={added}
      />
    </div>
  );
}
