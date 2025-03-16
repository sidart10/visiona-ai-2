import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth(.*)',
  '/api/webhooks(.*)', 
  '/landing',
  '/features',
  '/pricing',
  '/about',
  '/contact',
]);

// Define routes that should be ignored by authentication
const isIgnoredRoute = createRouteMatcher([
  '/api/public(.*)',
]);

// Export middleware with function-based protection
export default clerkMiddleware(async (auth, req) => {
  // If it's a public or ignored route, do nothing
  if (isPublicRoute(req) || isIgnoredRoute(req)) {
    return;
  }
  
  // For all other routes, require authentication
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
