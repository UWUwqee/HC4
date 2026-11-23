import {createRoot} from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App.tsx';
import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

createRoot(document.getElementById('root')!).render(
  publishableKey ? (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      localization={{ signIn: { start: { title: 'Sign in to Health Center' } } }}
    >
      <App />
    </ClerkProvider>
  ) : (
    <main className="flex min-h-dvh items-center justify-center bg-[#eef2ee] px-6 text-center">
      <p className="max-w-md text-sm font-bold text-[#173a37]">
        Clerk is not configured. Set VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.
      </p>
    </main>
  ),
);
