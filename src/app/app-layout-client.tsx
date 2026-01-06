"use client";

import dynamic from 'next/dynamic';

const AppLayout = dynamic(() => import('@/components/app-layout').then(mod => mod.AppLayout), { ssr: false });

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
