import jwt from "jsonwebtoken";

export interface DecodedToken {
  userId: string;
  iat?: number;
  exp?: number;
}

export async function verifyToken(token: string): Promise<DecodedToken | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error: any) {
    console.error("Error verifying JWT token:", error.message);
    return null;
  }
}
