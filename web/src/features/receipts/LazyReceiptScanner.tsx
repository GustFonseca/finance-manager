import React, { Suspense } from 'react';

const ReceiptScanner = React.lazy(() => import('./ReceiptScanner').then((m) => ({ default: m.ReceiptScanner })));

export function LazyReceiptScanner({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <Suspense fallback={null}>
      <ReceiptScanner onClose={onClose} />
    </Suspense>
  );
}
