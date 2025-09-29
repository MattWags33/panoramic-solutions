'use client';

import { AdminDashboard } from '@/ppm-tool/features/admin/AdminDashboard';
import { ClientOnly } from './components/ClientOnly';

// Force dynamic rendering to avoid SSG issues with Supabase
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <ClientOnly>
      <AdminDashboard />
    </ClientOnly>
  );
}
