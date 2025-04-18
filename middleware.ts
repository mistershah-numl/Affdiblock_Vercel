// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { verifyToken } from "./lib/api/auth";

// // Paths that require authentication
// const protectedPaths = ["/dashboard", "/admin"];

// // Paths that are accessible without authentication
// const publicPaths = [
//   "/",
//   "/login",
//   "/register",
//   "/verify",
//   "/about",
//   "/features",
//   "/docs",
//   "/support",
//   "/terms",
//   "/privacy",
//   "/pricing",
// ];

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   console.log(`Middleware processing path: ${pathname}`);

//   // Check if the path is protected
//   const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));
//   const isPublicPath = publicPaths.some((path) => pathname === path);

//   // If it's a public path, allow access
//   if (isPublicPath) {
//     console.log(`Allowing access to public path: ${pathname}`);
//     return NextResponse.next();
//   }

//   // If it's an API route, allow access (API routes handle their own auth)
//   if (pathname.startsWith("/api/")) {
//     console.log(`Allowing access to API route: ${pathname}`);
//     return NextResponse.next();
//   }

//   // If it's a protected path, check for authentication
//   if (isProtectedPath) {
//     const token = request.cookies.get("token")?.value;
//     console.log(`Token found in cookies: ${token ? "Yes" : "No"}`);

//     // If no token, redirect to login
//     if (!token) {
//       console.log("No token found, redirecting to login");
//       const url = new URL("/login", request.url);
//       url.searchParams.set("from", pathname);
//       return NextResponse.redirect(url);
//     }

//     // Verify token
//     try {
//       const result = verifyToken(token);
//       console.log("Token verification result:", result);

//       if (!result.success) {
//         console.log("Token verification failed, redirecting to login");
//         const url = new URL("/login", request.url);
//         url.searchParams.set("from", pathname);
//         return NextResponse.redirect(url);
//       }

//       // Check role-based access
//       const { role } = result.decoded;
//       console.log(`User role: ${role}`);

//       // Admin paths
//       if (pathname.startsWith("/admin") && role !== "Admin") {
//         console.log("User not Admin, redirecting to /dashboard");
//         return NextResponse.redirect(new URL("/dashboard", request.url));
//       }

//       // Allow access
//       console.log(`Allowing access to protected path: ${pathname}`);
//       return NextResponse.next();
//     } catch (error) {
//       console.error("Token verification error:", error);
//       const url = new URL("/login", request.url);
//       url.searchParams.set("from", pathname);
//       return NextResponse.redirect(url);
//     }
//   }

//   // For all other paths, allow access
//   console.log(`Allowing access to non-protected path: ${pathname}`);
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|public).*)",
//   ],
// };


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Minimal middleware function that does nothing (client-side approach)
export function middleware(request: NextRequest) {
  // Simply pass through all requests without any checks
  return NextResponse.next();
}

// Optional: Config to match all routes (can be removed if not needed)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};