import type { User } from "@/lib/models/user"

// Create a new user (for admins)
export async function createUser(formData: FormData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const res = await fetch('/api/user/admin-create', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (res.ok && data.success) {
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || 'Failed to create user' };
    }
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

// Get all users (for admins)
export async function getAllUsers() {
  try {
    // Assuming real implementation elsewhere; cleared static data
    return { success: true, users: [] };
  } catch (error) {
    console.error("Get all users error:", error);
    return { success: false, error: "Failed to get users" };
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    // Assuming real implementation elsewhere; cleared static data
    return { success: true, user: {} };
  } catch (error) {
    console.error("Get user error:", error);
    return { success: false, error: "Failed to get user" };
  }
}

// Update user
export async function updateUser(userId: string, userData: Partial<User>) {
  try {
    // Assuming real implementation elsewhere
    const updatedUser = {
      _id: userId,
      ...userData,
      updatedAt: new Date(),
    };

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

// Ban user (for admins)
export async function banUser(userId: string, reason: string, duration?: string) {
  try {
    // Assuming real implementation elsewhere
    const bannedUser = {
      _id: userId,
      status: "Banned",
      banReason: reason,
      banDuration: duration || "Permanent",
      bannedAt: new Date(),
      updatedAt: new Date(),
    };

    return { success: true, user: bannedUser };
  } catch (error) {
    console.error("Ban user error:", error);
    return { success: false, error: "Failed to ban user" };
  }
}

// Get all issuer requests (for admins)
export async function getIssuerRequests() {
  try {
    // Assuming real implementation elsewhere; cleared static data
    return { success: true, requests: [] };
  } catch (error) {
    console.error("Get issuer requests error:", error);
    return { success: false, error: "Failed to get issuer requests" };
  }
}

// Approve issuer request (for admins)
export async function approveIssuerRequest(requestId: string, adminId: string) {
  try {
    // Assuming real implementation elsewhere
    const updatedRequest = {
      _id: requestId,
      status: "Approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
    };

    return { success: true, request: updatedRequest };
  } catch (error) {
    console.error("Approve issuer request error:", error);
    return { success: false, error: "Failed to approve issuer request" };
  }
}

// Reject issuer request (for admins)
export async function rejectIssuerRequest(requestId: string, adminId: string, reason: string) {
  try {
    // Assuming real implementation elsewhere
    const updatedRequest = {
      _id: requestId,
      status: "Rejected",
      reviewedBy: adminId,
      reviewNotes: reason,
      reviewedAt: new Date(),
    };

    return { success: true, request: updatedRequest };
  } catch (error) {
    console.error("Reject issuer request error:", error);
    return { success: false, error: "Failed to reject issuer request" };
  }
} 



// 220 lines of code earlier , now  129 with admin-create