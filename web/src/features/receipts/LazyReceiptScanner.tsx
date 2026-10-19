import React, { Suspense } from 'react';
import { lazyWithRetry } from '@/lib/lazyImport';

const ReceiptScanner = lazyWithRetry(() => import('./ReceiptScanner').then((m) => m.ReceiptScanner));

export function LazyReceiptScanner({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <Suspense fallback={null}>
      <ReceiptScanner onClose={onClose} />
    </Suspense>
  );
}
