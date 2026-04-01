'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirects old /register route to the new multi-store auth flow
export default function RegisterRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/auth/create-store'); }, [router]);
    return null;
}
