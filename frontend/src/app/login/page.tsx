'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirects old /login route to the new auth flow login page
export default function LoginRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/auth/login'); }, [router]);
    return null;
}
