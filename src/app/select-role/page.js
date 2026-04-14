import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const SelectRoleContent = dynamic(() => import('./SelectRoleContent'), { ssr: false });

export default function SelectRolePage() {
  return <SelectRoleContent />;
}
