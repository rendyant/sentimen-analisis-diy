import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode("dev-secret-sipandu-ganti-nanti");

export async function signToken(payload: { id: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; role: string };
  } catch {
    return null;
  }
}