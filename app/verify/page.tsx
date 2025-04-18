"use client"

import type React from "react"

import { useState } from "react"

// Dynamically import the QR scanner component with no SSR
// const QrReader = dynamic(() => import("react-qr-reader"), {
//   ssr: false,
// })
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSearch, QrCode, Search, Camera } from "lucide-react"

export default function VerifyPage() {
  const [affidavitId, setAffidavitId] = useState("")
  const [scanResult, setScanResult] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<null | {
    isValid: boolean
    message: string
    details?: any
  }>(null)
  const [cameraActive, setCameraActive] = useState(false)

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!affidavitId) return

    setIsVerifying(true)

    // Simulate blockchain verification
    setTimeout(() => {
      // Mock verification result - in a real app, this would check the blockchain
      const mockResult = {
        isValid: true,
        message: "Document verified successfully on the blockchain",
        details: {
          id: affidavitId,
          title: "Affidavit of Ownership Transfer",
          issuer: "John Doe",
          category: "Car",
          dateIssued: "2025-03-01",
          status: "Active",
          stampValue: "RS 100",
        },
      }

      setVerificationResult(mockResult)
      setIsVerifying(false)
    }, 1500)
  }

  // Simulate QR code scanning with a mock function
  const simulateScan = () => {
    setCameraActive(true)

    // Simulate a scan after 2 seconds
    setTimeout(() => {
      const mockQrValue = `https://affidblock.com/verify/AFF-2025-001`
      setScanResult(mockQrValue)

      // Extract affidavit ID from QR code URL
      const idMatch = mockQrValue.match(/\/verify\/([a-zA-Z0-9-]+)/)
      if (idMatch && idMatch[1]) {
        setAffidavitId(idMatch[1])

        // Auto-verify after scan
        setIsVerifying(true)
        setTimeout(() => {
          const mockResult = {
            isValid: true,
            message: "Document verified successfully on the blockchain",
            details: {
              id: idMatch[1],
              title: "Affidavit of Ownership Transfer",
              issuer: "John Doe",
              category: "Car",
              dateIssued: "2025-03-01",
              status: "Active",
              stampValue: "RS 100",
            },
          }

          setVerificationResult(mockResult)
          setIsVerifying(false)
          setCameraActive(false)
        }, 1500)
      }
    }, 2000)
  }

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
                    <div className="flex flex-col items-center">
                      <Camera className="h-16 w-16 text-gray-400 animate-pulse" />
                      <p className="mt-4 text-gray-500">Scanning...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Button onClick={simulateScan} className="mb-4">
                        Activate Camera
                      </Button>
                      <p className="text-sm text-gray-500">Click to simulate scanning a QR code</p>
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
                      placeholder="Enter Affidavit ID"
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
              verificationResult.isValid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-full ${
                  verificationResult.isValid ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                <FileSearch className="h-6 w-6" />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold ${verificationResult.isValid ? "text-green-800" : "text-red-800"}`}
                >
                  {verificationResult.isValid ? "Verification Successful" : "Verification Failed"}
                </h3>
                <p className="text-gray-600 mt-1">{verificationResult.message}</p>

                {verificationResult.isValid && verificationResult.details && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {Object.entries(verificationResult.details).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="font-medium">{value as string}</p>
                      </div>
                    ))}
                  </div>
                )}

                {verificationResult.isValid && <Button className="mt-4">View Full Details</Button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
