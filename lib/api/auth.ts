// Request to become an issuer (mock implementation)
export async function requestIssuerRole(userId: string, issuerData: any) {
  try {
    const issuerRequest = {
      _id: `req_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...issuerData,
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, issuerRequest };
  } catch (error) {
    console.error("Issuer request error:", error);
    return { success: false, error: "Failed to submit issuer request" };
  }
}