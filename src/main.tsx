import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App.tsx';
import './index.css';

const publishableKey =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)
  || (import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined);

if (!publishableKey) {
  throw new Error('Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY (or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).');
}

createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={publishableKey}
    localization={{ signIn: { start: {
      title: 'Sign in to Health Center',
      titleCombined: 'Sign in to Health Center',
    } } }}
  >
    <App />
  </ClerkProvider>,
);
