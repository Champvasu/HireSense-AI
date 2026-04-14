import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const SelectRoleContent = dynamicImport(() => import('./SelectRoleContent'), { ssr: false });

export default function SelectRolePage() {
  return <SelectRoleContent />;
}
