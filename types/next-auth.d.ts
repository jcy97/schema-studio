// types/next-auth.d.ts
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

// Session 타입 확장 (next-auth 모듈)
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    expiresAt?: number;
  }
}

// JWT 타입 확장 (next-auth/jwt 모듈)
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
