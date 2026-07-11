import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define route matching for public sign-in, sign-up, and potential public API routes
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/predictions(.*)" // Keep it protected or we will handle auth inside the route handler
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|png|jpeg|jpg|webp|wasm|xml|json|txt|ico|zip|shtml|woff2?|webmanifest|mp4|mp3|txt|ico|map)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
