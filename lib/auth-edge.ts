import { jwtVerify } from 'jose';

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return new TextEncoder().encode(secret);
}

/** JWT verify for Next.js middleware (Edge runtime). Node routes use jsonwebtoken in lib/auth.ts. */
export async function verifyTokenEdge(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const userId = payload.userId;
    const email = payload.email;
    if (typeof userId !== 'string' || typeof email !== 'string') {
      return null;
    }
    return { userId, email };
  } catch {
    return null;
  }
}
