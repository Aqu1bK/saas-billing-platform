
// // frontend/src/app/billing/page.tsx
// 'use client';

// import React from 'react';
// import Plans from '@/components/Billing/Plans';

// export default function BillingPage() {
//   return (
//     <main className="min-h-screen">
//       <Plans />
//     </main>
//   );
// }


// frontend/src/app/billing/page.tsx
'use client';

import React from 'react';
import Plans from '@/components/Billing/Plans';

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8"> {/* Add padding and background */}
      <Plans />
    </main>
  );
}