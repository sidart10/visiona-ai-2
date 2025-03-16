import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Interface for API response with error details
 */
interface ErrorResponse {
  status: number;
  message: string;
}

/**
 * Check if the current request is authenticated
 * @returns Object containing userId and error response (if any)
 */
export async function checkAuth(): Promise<{ userId: string | null; error: ErrorResponse | null }> {
  // Get the userId from auth() (Clerk)
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      error: {
        status: 401,
        message: 'Unauthorized: Authentication required',
      },
    };
  }

  return { userId, error: null };
}

/**
 * Middleware to protect API routes with authentication
 * @param handler The API route handler function
 * @returns A function that wraps the handler with authentication check
 */
export function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const { userId, error } = await checkAuth();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // If we passed auth check, userId is guaranteed to be non-null
    return handler(req, userId as string);
  };
}

/**
 * Get user details from Clerk
 * @param userId The user ID to get details for
 * @returns The user object with public data
 */
export async function getUserDetails(userId: string) {
  try {
    // Initialize the client first, then access users
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0]?.emailAddress,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw new Error('Failed to fetch user details');
  }
}

/**
 * Check if current user has required permission or role
 * @param requiredRole The role name required for access
 * @returns Object containing hasPermission flag and error response (if any)
 */
export async function checkUserPermission(requiredRole: string) {
  const { userId } = await auth();

  if (!userId) {
    return {
      hasPermission: false,
      error: {
        status: 401,
        message: 'Unauthorized: Authentication required',
      },
    };
  }

  try {
    // Initialize the client first, then access users
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // In a real app, you would check the user's role/permissions here
    // This is a simplified example
    const userRole = user.privateMetadata.role as string || 'user';
    
    const roleHierarchy = {
      admin: 3,
      moderator: 2,
      user: 1,
    };

    const hasPermission = 
      roleHierarchy[userRole as keyof typeof roleHierarchy] >= 
      roleHierarchy[requiredRole as keyof typeof roleHierarchy];

    if (!hasPermission) {
      return {
        hasPermission: false,
        error: {
          status: 403,
          message: `Forbidden: Requires ${requiredRole} role`,
        },
      };
    }

    return { hasPermission: true, error: null };
  } catch (error) {
    console.error('Error checking user permission:', error);
    return {
      hasPermission: false,
      error: {
        status: 500,
        message: 'Internal server error',
      },
    };
  }
}

/**
 * Middleware to protect API routes with role-based authorization
 * @param handler The API route handler function
 * @param requiredRole The role required to access this endpoint
 * @returns A function that wraps the handler with authorization check
 */
export function withAuthorization(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  requiredRole: string
) {
  return async (req: NextRequest) => {
    const { userId, error } = await checkAuth();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const { hasPermission, error: permissionError } = await checkUserPermission(requiredRole);

    if (!hasPermission) {
      return NextResponse.json(
        { error: permissionError?.message }, 
        { status: permissionError?.status || 403 }
      );
    }

    // If we passed all checks, userId is guaranteed to be non-null
    return handler(req, userId as string);
  };
} 