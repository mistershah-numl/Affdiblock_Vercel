
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReader = useRef<BrowserQRCodeReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isMediaDevicesSupported, setIsMediaDevicesSupported] = useState<boolean | null>(null)

  // Check for MediaDevices support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMediaDevicesSupported(!!navigator?.mediaDevices && !!navigator?.mediaDevices.getUserMedia);
    }
  }, []);

  // Initialize QR code reader and handle camera permissions
  useEffect(() => {
    if (isMediaDevicesSupported === null) return; // Wait for check

    if (!isMediaDevicesSupported) {
      console.log("MediaDevices API is not supported in this browser");
      setCameraError("Camera access is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari, or try manual verification.");
      setCameraActive(false);
      return;
    }

    codeReader.current = new BrowserQRCodeReader();

    if (cameraActive && videoRef.current) {
      console.log("Requesting camera access...");
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          console.log("Camera access granted");
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
              setCameraError("Failed to start camera: " + err.message);
              setCameraActive(false);
            });
            startScanning();
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          setCameraError(
            err.name === "NotAllowedError"
              ? "Camera access denied. Please allow camera access in your browser or device settings."
              : err.name === "NotFoundError"
              ? "No camera found on this device. Please use manual verification."
              : "Failed to access camera: " + err.message
          );
          setCameraActive(false);
        });
    }

    return () => {
      console.log("Cleaning up QR code reader");
      if (cameraActive && codeReader.current) {
        codeReader.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive, isMediaDevicesSupported]);

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
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log("QR code scanned:", result.getText());
            handleScan(result.getText());
          }
          if (error && error.name !== "StreamError") {
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
    if (data) {
      console.log("Processing scanned QR code:", data);
      setScanResult(data);
      setCameraActive(false);

      // Extract affidavit ID from QR code URL
      const idMatch = data.match(/\/verify\/([a-zA-Z0-9-]+)/);
      if (idMatch && idMatch[1]) {
        setAffidavitId(idMatch[1]);
        console.log("Extracted affidavit ID:", idMatch[1]);

        // Auto-verify after scan
        setIsVerifying(true);
        try {
          const response = await fetch("/api/affidavits/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: idMatch[1] }),
          });
          const result = await response.json();
          console.log("Verification result from QR scan:", result);
          setVerificationResult(result);
        } catch (error) {
          console.error("Verification error from QR scan:", error);
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
      } else {
        console.log("Invalid QR code format");
        setCameraError("Invalid QR code format");
      }
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

        <Tabs defaultValue="qr-code" className="w-full">
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
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-hidden rounded-lg border flex items-center justify-center bg-gray-50">
                  {cameraActive ? (
                    cameraError ? (
                      <div className="flex flex-col items-center">
                        <Camera className="h-16 w-16 text-red-400" />
                        <p className="mt-4 text-red-500">{cameraError}</p>
                      </div>
                    ) : (
                      <video ref={videoRef} style={{ width: "100%", height: "100%" }} />
                    )
                  ) : (
                    <div className="flex flex-col items-center">
                      <Button
                        onClick={() => setCameraActive(true)}
                        className="mb-4"
                        disabled={isMediaDevicesSupported === false}
                      >
                        Activate Camera
                      </Button>
                      <p className="text-sm text-gray-500">
                        {isMediaDevicesSupported === false
                          ? "Camera scanning is not supported in this browser"
                          : "Click to start scanning a QR code"}
                      </p>
                    </div>
                  )}
                </div>
                {scanResult && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-sm font-medium">Scan Result:</p>
                    <p className="text-sm text-gray-600 truncate">{scanResult}</p>
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
