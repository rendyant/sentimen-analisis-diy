import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode("dev-secret-sipandu-ganti-nanti");

export interface SessionUserPayload {
  id: string;
  role: string;
  name?: string;
  email?: string;
  opdId?: string;
  opdName?: string;
}

export async function signToken(payload: SessionUserPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUserPayload;
  } catch {
    return null;
  }
}
