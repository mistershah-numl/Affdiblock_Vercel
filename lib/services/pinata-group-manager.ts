// lib/services/pinata-group-manager.ts
import axios from "axios";

export interface PinataGroup {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  files_count?: number;
}

export interface PinataFile {
  id: string;
  name: string;
  cid: string;
  size: number;
  created_at: string;
  mime_type: string;
  group_id?: string;
}

/**
 * Try multiple API endpoints to list groups (Pinata has different API versions)
 */
export async function listPinataGroups(): Promise<PinataGroup[]> {
  const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

  if (!pinataApiKey || !pinataApiSecret) {
    throw new Error("Pinata API credentials are missing");
  }

  const headers = {
    pinata_api_key: pinataApiKey,
    pinata_secret_api_key: pinataApiSecret,
    "Content-Type": "application/json",
  };

  // Try different API endpoints
  const endpoints = [
    "https://api.pinata.cloud/v3/files/groups",
    "https://api.pinata.cloud/groups",
    "https://api.pinata.cloud/psa/groups",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const response = await axios.get(endpoint, { headers });
      
      // Handle different response structures
      if (response.data.groups) {
        return response.data.groups;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.log(`Response from ${endpoint}:`, response.data);
    } catch (error: any) {
      console.log(`Failed endpoint ${endpoint}:`, error.message);
      continue;
    }
  }

  // If all endpoints fail, return empty array
  console.warn("All group listing endpoints failed, returning empty array");
  return [];
}

/**
 * Get details of a specific group by trying multiple API endpoints
 */
export async function getPinataGroup(groupId: string): Promise<PinataGroup | null> {
  const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

  if (!pinataApiKey || !pinataApiSecret) {
    throw new Error("Pinata API credentials are missing");
  }

  const headers = {
    pinata_api_key: pinataApiKey,
    pinata_secret_api_key: pinataApiSecret,
    "Content-Type": "application/json",
  };

  // Try different API endpoints for getting specific group
  const endpoints = [
    `https://api.pinata.cloud/v3/files/groups/${groupId}`,
    `https://api.pinata.cloud/groups/${groupId}`,
    `https://api.pinata.cloud/psa/groups/${groupId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying to get group ${groupId} from: ${endpoint}`);
      const response = await axios.get(endpoint, { headers });
      
      if (response.data.group) {
        return response.data.group;
      } else if (response.data.id) {
        return response.data;
      }
      
      console.log(`Response from ${endpoint}:`, response.data);
    } catch (error: any) {
      console.log(`Failed to get group from ${endpoint}:`, error.message);
      continue;
    }
  }

  return null;
}

/**
 * Alternative method: Check if group exists by trying to list files in it
 */
export async function checkGroupExistsByFiles(groupId: string): Promise<{ exists: boolean; files_count?: number }> {
  try {
    const files = await listFilesInGroup(groupId);
    return {
      exists: true,
      files_count: files.length,
    };
  } catch (error: any) {
    console.log(`Group ${groupId} doesn't exist or is inaccessible:`, error.message);
    return { exists: false };
  }
}

/**
 * List files in a specific group with multiple API attempts
 */
export async function listFilesInGroup(groupId: string): Promise<PinataFile[]> {
  const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

  if (!pinataApiKey || !pinataApiSecret) {
    throw new Error("Pinata API credentials are missing");
  }

  const headers = {
    pinata_api_key: pinataApiKey,
    pinata_secret_api_key: pinataApiSecret,
    "Content-Type": "application/json",
  };

  // Try different ways to get files in group
  const attempts = [
    // Method 1: Direct group files endpoint
    {
      url: `https://api.pinata.cloud/groups/${groupId}/files`,
      params: { limit: 100 },
      method: "direct_group_files"
    },
    // Method 2: Data API with metadata filter
    {
      url: `https://api.pinata.cloud/data/pinList`,
      params: { 
        'metadata[keyvalues][groupId]': groupId,
        status: 'pinned',
        pageLimit: 100,
      },
      method: "metadata_filter"
    },
    // Method 3: Data API with group name filter (if we know the group name)
    {
      url: `https://api.pinata.cloud/data/pinList`,
      params: { 
        'metadata[name]': 'CNIC',
        status: 'pinned',
        pageLimit: 100,
      },
      method: "name_filter"
    },
    // Method 4: V3 API with proper group_id parameter
    {
      url: `https://api.pinata.cloud/v3/files`,
      params: { 
        group_id: groupId, 
        limit: 100,
        status: 'pinned'
      },
      method: "v3_api"
    },
  ];

  let allFilesFromAllMethods: PinataFile[] = [];

  for (const attempt of attempts) {
    try {
      console.log(`Trying to list files in group ${groupId} via ${attempt.method}:`, attempt.url);
      console.log(`Parameters:`, attempt.params);
      
      const response = await axios.get(attempt.url, {
        headers,
        params: attempt.params,
      });

      console.log(`Response from ${attempt.method}:`, {
        status: response.status,
        dataKeys: Object.keys(response.data),
        sampleData: response.data
      });

      let files: PinataFile[] = [];

      // Handle different response structures
      if (response.data.files && Array.isArray(response.data.files)) {
        files = response.data.files;
        console.log(`Found ${files.length} files via ${attempt.method}`);
      } else if (response.data.rows && Array.isArray(response.data.rows)) {
        // Convert pinList format to standard format
        files = response.data.rows
          .filter((row: any) => {
            // Additional filtering to ensure we only get files for this group
            const hasGroupId = row.metadata?.keyvalues?.groupId === groupId;
            const isInGroup = row.metadata?.groupId === groupId;
            console.log(`Row ${row.ipfs_pin_hash}: hasGroupId=${hasGroupId}, isInGroup=${isInGroup}`, row.metadata);
            return hasGroupId || isInGroup;
          })
          .map((row: any) => ({
            id: row.id,
            name: row.metadata?.name || row.metadata?.keyvalues?.name || 'Unknown',
            cid: row.ipfs_pin_hash,
            size: row.size,
            created_at: row.date_pinned,
            mime_type: row.metadata?.mime_type || row.metadata?.keyvalues?.mime_type || 'Unknown',
            group_id: groupId,
          }));
        console.log(`Found ${files.length} filtered files via ${attempt.method}`);
      } else if (Array.isArray(response.data)) {
        files = response.data;
        console.log(`Found ${files.length} files (direct array) via ${attempt.method}`);
      }

      if (files.length > 0) {
        // If we found files, return them immediately
        console.log(`✅ Successfully found ${files.length} files in group ${groupId} via ${attempt.method}`);
        return files;
      }

      allFilesFromAllMethods = [...allFilesFromAllMethods, ...files];

    } catch (error: any) {
      console.log(`❌ Failed to list files via ${attempt.method}:`, error.message);
      if (error.response?.data) {
        console.log(`Error response:`, error.response.data);
      }
      continue;
    }
  }

  // If no method returned files but we have some files from various attempts, return those
  if (allFilesFromAllMethods.length > 0) {
    console.log(`Returning ${allFilesFromAllMethods.length} files collected from all methods`);
    return allFilesFromAllMethods;
  }

  // If we still have no files, it might mean the group is empty or the API structure is different
  console.warn(`No files found in group ${groupId} via any method. Group might be empty or API structure different.`);
  return [];
}

/**
 * Enhanced verification that uses file listing as fallback
 */
export async function verifyGroupSetup(): Promise<{
  success: boolean;
  groups: Record<string, { exists: boolean; id: string; name?: string; files_count?: number; method?: string }>;
  errors: string[];
}> {
  const errors: string[] = [];
  const groups: Record<string, { exists: boolean; id: string; name?: string; files_count?: number; method?: string }> = {};

  const expectedGroups = {
    "CNIC": process.env.NEXT_PUBLIC_PINATA_FOLDER_CNIC,
    "LICENSES": process.env.NEXT_PUBLIC_PINATA_FOLDER_LICENSES,
    "AFFIDAVITS": process.env.NEXT_PUBLIC_PINATA_FOLDER_AFFIDAVITS,
    "AVATARS": process.env.NEXT_PUBLIC_PINATA_FOLDER_AVATARS,
  };

  for (const [groupName, groupId] of Object.entries(expectedGroups)) {
    if (!groupId) {
      errors.push(`Missing environment variable for ${groupName} group`);
      groups[groupName] = { exists: false, id: "" };
      continue;
    }

    // Method 1: Try to get group details directly
    try {
      const group = await getPinataGroup(groupId);
      if (group) {
        groups[groupName] = {
          exists: true,
          id: groupId,
          name: group.name,
          files_count: group.files_count,
          method: "direct_api",
        };
        console.log(`✅ ${groupName} group verified via direct API:`, {
          id: groupId,
          name: group.name,
          files: group.files_count || 0,
        });
        continue;
      }
    } catch (error: any) {
      console.log(`Direct API failed for ${groupName}:`, error.message);
    }

    // Method 2: Try to verify by listing files in the group
    try {
      const fileCheck = await checkGroupExistsByFiles(groupId);
      if (fileCheck.exists) {
        groups[groupName] = {
          exists: true,
          id: groupId,
          name: groupName, // Use the expected name since we can't get it from API
          files_count: fileCheck.files_count,
          method: "file_listing",
        };
        console.log(`✅ ${groupName} group verified via file listing:`, {
          id: groupId,
          files: fileCheck.files_count || 0,
        });
        continue;
      }
    } catch (error: any) {
      console.log(`File listing failed for ${groupName}:`, error.message);
    }

    // If both methods fail, mark as non-existent
    groups[groupName] = { exists: false, id: groupId, method: "failed" };
    errors.push(`Group ${groupName} (${groupId}) could not be verified via any method`);
  }

  return {
    success: errors.length === 0,
    groups,
    errors,
  };
}

/**
 * Test uploading and group assignment with a small test file
 */
export async function testGroupUpload(groupId: string, groupName: string): Promise<{
  success: boolean;
  ipfsHash?: string;
  fileId?: string;
  error?: string;
}> {
  try {
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      throw new Error("Pinata API credentials are missing");
    }

    // Create a small test file
    const testContent = JSON.stringify({ 
      test: true, 
      groupName, 
      timestamp: new Date().toISOString(),
      purpose: "group_assignment_test" 
    });
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append("file", Buffer.from(testContent), {
      filename: `test_${groupName.toLowerCase()}_${Date.now()}.json`,
    });

    // Add metadata with group assignment
    const pinataMetadata = {
      name: `Test file for ${groupName} group`,
      keyvalues: {
        groupId: groupId,
        test: "true",
        groupName: groupName,
      }
    };
    formData.append("pinataMetadata", JSON.stringify(pinataMetadata));

    // Add Pinata options for group assignment
    const pinataOptions = {
      cidVersion: 1,
      groupId: groupId,
    };
    formData.append("pinataOptions", JSON.stringify(pinataOptions));

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataApiSecret,
        ...formData.getHeaders(),
      },
    });

    if (response.data && response.data.IpfsHash) {
      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        fileId: response.data.id,
      };
    } else {
      return {
        success: false,
        error: "No IPFS hash returned from upload",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Debug all available information about groups and files
 */
export async function debugGroupInfo(): Promise<{
  groups: PinataGroup[];
  verification: Awaited<ReturnType<typeof verifyGroupSetup>>;
  testUploads?: Record<string, Awaited<ReturnType<typeof testGroupUpload>>>;
}> {
  try {
    console.log("=== PINATA GROUPS DEBUG INFO ===");
    
    const groups = await listPinataGroups();
    console.log("Available groups from API:", groups);
    
    const verification = await verifyGroupSetup();
    console.log("Verification result:", verification);

    // Test upload to each existing group
    const testUploads: Record<string, Awaited<ReturnType<typeof testGroupUpload>>> = {};
    
    for (const [groupName, groupInfo] of Object.entries(verification.groups)) {
      if (groupInfo.exists) {
        console.log(`Testing upload to ${groupName} group...`);
        testUploads[groupName] = await testGroupUpload(groupInfo.id, groupName);
      }
    }

    console.log("Test upload results:", testUploads);
    console.log("================================");

    return { groups, verification, testUploads };
  } catch (error: any) {
    console.error("Error in debugGroupInfo:", error.message);
    throw error;
  }
}