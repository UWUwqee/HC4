import { verifyToken, type VerifyTokenOptions } from '@clerk/backend';

export type ClerkIdentity = {
  uid: string;
  email?: string;
  admin?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function verifyClerkToken(token: string): Promise<ClerkIdentity | null> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured.');

  try {
    const payload = await verifyToken(token, { secretKey } satisfies VerifyTokenOptions);
    const publicMetadata = isRecord(payload.public_metadata)
      ? payload.public_metadata
      : isRecord(payload.publicMetadata) ? payload.publicMetadata : undefined;
    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      admin: payload.admin === true || publicMetadata?.role === 'admin',
    };
  } catch (error) {
    console.error('Clerk session token verification failed:', error);
    return null;
  }
}
