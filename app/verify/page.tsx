
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSearch, QrCode, Search, Camera } from "lucide-react"
import { BrowserQRCodeReader } from "@zxing/library"

export default function VerifyPage() {
  const [affidavitId, setAffidavitId] = useState("")
  const [scanResult, setScanResult] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<null | {
    success: boolean
    verified: boolean
    isTampered: boolean
    blockchainData: any
    originalData?: any
    error?: string
  }>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("qr-code")
  const [isMediaDevicesSupported, setIsMediaDevicesSupported] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReader = useRef<BrowserQRCodeReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [lastScannedData, setLastScannedData] = useState<string | null>(null)
  const [scanCooldown, setScanCooldown] = useState(false)
  const startCamera = async () => {
    if (isMediaDevicesSupported === false) {
      setCameraError("Camera access is not supported in this browser. Please use manual verification.");
      return;
    }

    setCameraError(null);
    setCameraActive(true);

    try {
      // Try to access camera - mediaDevices might be available at runtime even if not detected initially
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("MediaDevices API not available");
      }

      console.log("Requesting camera access...");
      // Start with minimal constraints for better mobile compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      console.log("Camera access granted");
      streamRef.current = stream;
      
      // Log camera info for debugging
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log("Using camera:", settings.deviceId, "Resolution:", settings.width, "x", settings.height);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");

        // Wait for video to be ready before starting scanning
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(void 0);
            };
          }
        });

        // Start scanning immediately
        startScanning();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);

      // Try with environment camera if flexible constraints fail
      if (err.name === "OverconstrainedError" || err.name === "NotFoundError") {
        try {
          console.log("Trying with environment camera...");
          const envStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });

          console.log("Environment camera access granted");
          streamRef.current = envStream;
          
          // Log camera info for debugging
          const envVideoTrack = envStream.getVideoTracks()[0];
          const envSettings = envVideoTrack.getSettings();
          console.log("Using environment camera:", envSettings.deviceId, "Resolution:", envSettings.width, "x", envSettings.height);

          if (videoRef.current) {
            videoRef.current.srcObject = envStream;
            videoRef.current.setAttribute("playsinline", "true");

            await new Promise((resolve) => {
              if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => {
                  resolve(void 0);
                };
              }
            });

            // Start scanning immediately
            startScanning();
          }
        } catch (envErr: any) {
          console.error("Environment camera also failed:", envErr);
          // Fall back to default camera
          try {
            console.log("Trying with default camera...");
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
              }
            });

            console.log("Fallback camera access granted");
            streamRef.current = fallbackStream;
            
            // Log camera info for debugging
            const fallbackVideoTrack = fallbackStream.getVideoTracks()[0];
            const fallbackSettings = fallbackVideoTrack.getSettings();
            console.log("Using fallback camera:", fallbackSettings.deviceId, "Resolution:", fallbackSettings.width, "x", fallbackSettings.height);

            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              videoRef.current.setAttribute("playsinline", "true");

              await new Promise((resolve) => {
                if (videoRef.current) {
                  videoRef.current.onloadedmetadata = () => {
                    resolve(void 0);
                  };
                }
              });

              // Start scanning immediately
              startScanning();
            }
          } catch (fallbackErr: any) {
            console.error("Fallback camera also failed:", fallbackErr);
            // Final attempt with minimal constraints for mobile compatibility
            try {
              console.log("Trying with minimal constraints...");
              const minimalStream = await navigator.mediaDevices.getUserMedia({
                video: true // Minimal constraints
              });

              console.log("Minimal camera access granted");
              streamRef.current = minimalStream;

              // Log camera info for debugging
              const minimalVideoTrack = minimalStream.getVideoTracks()[0];
              const minimalSettings = minimalVideoTrack.getSettings();
              console.log("Using minimal camera:", minimalSettings.deviceId, "Resolution:", minimalSettings.width, "x", minimalSettings.height);

              if (videoRef.current) {
                videoRef.current.srcObject = minimalStream;
                videoRef.current.setAttribute("playsinline", "true");

                await new Promise((resolve) => {
                  if (videoRef.current) {
                    videoRef.current.onloadedmetadata = () => {
                      resolve(void 0);
                    };
                  }
                });

                // Start scanning immediately
                startScanning();
              }
            } catch (minimalErr: any) {
              console.error("Minimal camera also failed:", minimalErr);
              setCameraError(
                minimalErr.name === "NotAllowedError"
                  ? "Camera access denied. Please allow camera access in your browser settings and try again."
                  : minimalErr.name === "NotFoundError"
                  ? "No camera found on this device. Please use manual verification."
                  : "Failed to access camera. Please use manual verification below."
              );
              setCameraActive(false);
            }
          }
        }
      } else {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ||
          window.location.hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/) ||
          /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname); // Any IP address
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        setCameraError(
          err.message === "MediaDevices API not available"
            ? "Camera access requires a modern browser. Please update your browser or use manual verification below."
            : err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera access in your browser settings and try again."
            : err.name === "NotFoundError"
            ? "No camera found on this device. Please use manual verification below."
            : isLocalhost && isMobile && (err.name === "NotSupportedError" || err.message.includes("HTTPS"))
            ? "For local development on mobile, try accessing via 'localhost' instead of IP address, or use manual verification below."
            : "Failed to access camera. Please use manual verification below."
        );
        setCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    console.log("Stopping camera...");
    setCameraActive(false);
    setCameraError(null);
    setScanResult("");
    setLastScannedData(null);
    setScanCooldown(false);
    if (codeReader.current) {
      codeReader.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Cleanup only when camera is explicitly deactivated (not on initial render)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!cameraActive && streamRef.current) {
      // Small delay to avoid interrupting initial setup
      timeoutId = setTimeout(() => {
        stopCamera();
      }, 100);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [cameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera when switching away from QR tab
  useEffect(() => {
    if (activeTab !== "qr-code" && cameraActive) {
      stopCamera();
    }
  }, [activeTab, cameraActive]);

  // Check for MediaDevices support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMediaDevices = !!navigator?.mediaDevices && !!navigator?.mediaDevices.getUserMedia;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ||
        window.location.hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/) ||
        /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname); // Any IP address

      // For development, always allow camera access attempts on localhost/local networks
      // Some mobile browsers may have MediaDevices available at runtime even if not detected initially
      setIsMediaDevicesSupported(hasMediaDevices || isLocalhost);
    }
  }, []);

  // Initialize QR code reader on mount
  useEffect(() => {
    codeReader.current = new BrowserQRCodeReader();
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) {
      console.error("QR code reader or video element not initialized");
      setCameraError("QR scanner initialization failed");
      setCameraActive(false);
      return;
    }

    console.log("Starting QR code scanning...");
    try {
      await codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log("QR code scanned:", result.getText());
            handleScan(result.getText());
          }
          if (error && error.name !== "StreamError" && error.name !== "NotFoundException" && error.name !== "ChecksumException" && error.name !== "FormatException") {
            console.error("QR scan error:", error);
            setCameraError("QR scan error: " + error.message);
            setCameraActive(false);
          }
        }
      );
    } catch (err) {
      console.error("Error during QR scanning:", err);
      setCameraError("QR scan error: " + (err as Error).message);
      setCameraActive(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affidavitId) {
      console.log("No affidavit ID provided for manual verification");
      return;
    }

    console.log("Verifying affidavit ID:", affidavitId);
    setIsVerifying(true);
    try {
      const response = await fetch("/api/affidavits/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: affidavitId }),
      });
      const data = await response.json();
      console.log("Verification result:", data);
      setVerificationResult(data);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        success: false,
        verified: false,
        isTampered: true,
        blockchainData: null,
        error: "Failed to verify affidavit",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScan = async (data: string | null) => {
    if (!data || data.trim() === "" || scanCooldown || data === lastScannedData) {
      console.log("Ignoring duplicate or empty QR code scan");
      return;
    }

    console.log("Processing scanned QR code:", data);
    setScanResult(data);
    setLastScannedData(data);
    setScanCooldown(true);

    // Reset cooldown after 3 seconds
    setTimeout(() => {
      setScanCooldown(false);
      setLastScannedData(null);
    }, 3000);

    // Extract affidavit ID from QR code URL - handle multiple formats
    let extractedId = null;

    try {
      // Try different patterns to extract the ID
      const patterns = [
        /\/affidavit\/([a-zA-Z0-9-]+)/,  // /affidavit/AFF-2025-12345
        /\/verify\/([a-zA-Z0-9-]+)/,     // /verify/AFF-2025-12345
        /^([a-zA-Z0-9-]+)$/,             // Just the ID: AFF-2025-12345
      ];

      for (const pattern of patterns) {
        const match = data.match(pattern);
        if (match && match[1]) {
          extractedId = match[1];
          break;
        }
      }
    } catch (extractError) {
      console.error("Error extracting ID from QR code:", extractError);
      setCameraError("Invalid QR code format. Please ensure you're scanning a valid AffidBlock affidavit QR code.");
      
      // Stop camera on invalid format
      setTimeout(() => {
        stopCamera();
      }, 2000); // Longer delay to show the error message
      return;
    }

    if (extractedId) {
      setAffidavitId(extractedId);
      console.log("Extracted affidavit ID:", extractedId);

      // Auto-verify after scan
      setIsVerifying(true);
      try {
          const response = await fetch("/api/affidavits/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: extractedId }),
          });
          const result = await response.json();
          console.log("Verification result from QR scan:", result);
          setVerificationResult(result);
          
          // Stop camera after successful verification
          setTimeout(() => {
            stopCamera();
          }, 1000); // Small delay to show the result
        } catch (error) {
          console.error("Verification error from QR scan:", error);
          setVerificationResult({
            success: false,
            verified: false,
            isTampered: true,
            blockchainData: null,
            error: "Failed to verify affidavit",
          });
          
          // Stop camera on error too
          setTimeout(() => {
            stopCamera();
          }, 1000);
        } finally {
          setIsVerifying(false);
        }
    } else {
      console.log("Could not extract affidavit ID from QR code:", data);
      setCameraError("Invalid QR code format. Please ensure you're scanning a valid AffidBlock affidavit QR code.");
      
      // Stop camera on invalid format
      setTimeout(() => {
        stopCamera();
      }, 2000); // Longer delay to show the error message
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Verify Affidavit</h1>
          <p className="text-gray-600 mt-2">
            Verify the authenticity of any affidavit or stamp paper issued through AffidBlock
          </p>
        </div>

        <Tabs defaultValue="qr-code" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr-code" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span>Scan QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Manual Verification</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr-code" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Point your camera at the QR code on the affidavit to verify its authenticity
                  {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator?.userAgent || '') && (
                    <span className="block mt-2 text-sm text-green-600">
                      📱 Mobile device detected. Camera access optimized for local development.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-hidden rounded-lg border flex items-center justify-center bg-gray-50">
                  {cameraActive ? (
                    cameraError ? (
                      <div className="flex flex-col items-center">
                        <Camera className="h-16 w-16 text-red-400" />
                        <p className="mt-4 text-red-500">{cameraError}</p>
                        <Button
                          onClick={() => setCameraActive(false)}
                          variant="outline"
                          className="mt-4"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          muted
                          playsInline
                          onError={(e) => {
                            console.error("Video element error:", e);
                            setCameraError("Failed to display camera feed");
                            setCameraActive(false);
                          }}
                          onLoadedData={() => {
                            console.log("Video loaded successfully");
                          }}
                        />
                        <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none">
                          <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-lg"></div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-32 h-32 border-2 border-white rounded-lg opacity-75"></div>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                          <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                            Position QR code within the frame
                          </p>
                        </div>
                        <Button
                          onClick={stopCamera}
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                        >
                          Stop Camera
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center">
                      <Button
                        onClick={startCamera}
                        className="mb-4"
                        disabled={isMediaDevicesSupported === false}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Activate Camera
                      </Button>
                      {cameraError && (
                        <p className="text-sm text-red-500 mb-2">{cameraError}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {isMediaDevicesSupported === false
                          ? "Camera scanning is not supported in this browser. Please try manual verification below."
                          : /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
                            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ||
                            window.location.hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/) ||
                            /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname))
                          ? "Local development: Camera access enabled for testing on mobile"
                          : "Click to start scanning a QR code"}
                      </p>
                    </div>
                  )}
                </div>
                {scanResult && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">✓ QR Code Scanned Successfully!</p>
                    <p className="text-sm text-green-600 truncate">Processing: {scanResult}</p>
                    <p className="text-xs text-green-500 mt-1">Camera will stop automatically after verification</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Verification</CardTitle>
                <CardDescription>Enter the affidavit ID to verify its authenticity</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualVerify} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter Affidavit ID (e.g., AFF-2025-23456)"
                      value={affidavitId}
                      onChange={(e) => setAffidavitId(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isVerifying}>
                      {isVerifying ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {verificationResult && (
          <div
            className={`mt-8 p-6 rounded-lg border ${
              verificationResult.verified ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-full ${
                  verificationResult.verified ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                <FileSearch className="h-6 w-6" />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold ${verificationResult.verified ? "text-green-800" : "text-red-800"}`}
                >
                  {verificationResult.verified ? "Verification Successful" : "Verification Failed"}
                </h3>
                <p className="text-gray-600 mt-1">
                  {verificationResult.error ||
                    (verificationResult.isTampered
                      ? "The affidavit data has been tampered with"
                      : "Document verified successfully on the blockchain")}
                </p>

                {verificationResult.verified && verificationResult.blockchainData && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {[
                      { key: "affidavitId", label: "Affidavit ID" },
                      { key: "title", label: "Title" },
                      { key: "category", label: "Category" },
                      { key: "issuerName", label: "Issuer Name" },
                      {
                        key: "timestamp",
                        label: "Date Issued",
                        value: new Date(Number(verificationResult.blockchainData.timestamp) * 1000).toLocaleDateString(),
                      },
                    ].map(({ key, label, value }) => (
                      <div key={key} className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="font-medium">{value || verificationResult.blockchainData[key]}</p>
                      </div>
                    ))}
                  </div>
                )}

                {verificationResult && affidavitId && (
                  <Link href={`/affidavit/${affidavitId}`}>
                    <Button className="mt-4">View Full Details</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}