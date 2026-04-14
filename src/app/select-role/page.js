'use client';

import dynamic from 'next/dynamic';

const SelectRoleContent = dynamic(() => import('./SelectRoleContent'), { ssr: false });

export default function SelectRolePage() {
  return <SelectRoleContent />;
}
