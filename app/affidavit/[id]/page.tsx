"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeftIcon, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jsPDF } from "jspdf";
import { toast } from "@/components/ui/use-toast";

export default function AffidavitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const displayId = params.id as string; // Renamed for clarity, as this is displayId
  const [qrValue, setQrValue] = useState("");
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [affidavit, setAffidavit] = useState<any>(null);
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [pinataData, setPinataData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrValue(`${window.location.origin}/verify/${displayId}`);
    }
    fetchAffidavit();
  }, [displayId]);

  const fetchAffidavit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/affidavits/get?id=${displayId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch affidavit: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.success) {
        setAffidavit(data.affidavit);
        setIsVerified(data.affidavit.isVerifiedOnBlockchain);
        setIsTampered(!data.affidavit.isVerifiedOnBlockchain);
      } else {
        throw new Error(data.error || "Failed to fetch affidavit");
      }
    } catch (error) {
      console.error("Error fetching affidavit:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred while fetching affidavit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOnBlockchain = async () => {
    try {
      setIsVerifying(true);
      if (!affidavit?._id) {
        throw new Error("Affidavit ID not available. Please reload the page.");
      }

      const response = await fetch("/api/affidavits/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: affidavit._id }), // Use MongoDB _id, not displayId
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIsVerified(data.verified);
        setIsTampered(data.isTampered);
        setBlockchainData(data.blockchainData);
        setPinataData(data.pinataData);
        setOriginalData(data.originalData);
        setAffidavit({ ...affidavit, isVerifiedOnBlockchain: data.verified });

        toast({
          title: data.verified ? "Verification Successful" : "Verification Failed",
          description: data.verified
            ? "This affidavit is verified on the blockchain."
            : data.isTampered
            ? "This affidavit data has been tampered with. Original data displayed below."
            : data.reason || "Blockchain verification failed.",
          variant: data.verified ? "default" : "destructive",
        });
      } else {
        throw new Error(data.error || "Verification failed");
      }
    } catch (error) {
      console.error("Error verifying affidavit:", error);
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadPDF = () => {
    if (!affidavit) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const qrCanvas = qrRef.current;
    if (!qrCanvas) return;
    const qrImage = qrCanvas.toDataURL("image/png");

    pdf.setDrawColor(0);
    pdf.rect(10, 10, 190, 277);
    pdf.setGState(new pdf.GState({ opacity: 0.1 }));
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(60);
    pdf.text("AffidBlock", 105, 150, { align: "center", angle: 45 });
    pdf.setGState(new pdf.GState({ opacity: 1 }));

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Government of Pakistan", 105, 30, { align: "center" });
    pdf.setFontSize(18);
    pdf.text(affidavit.title.toUpperCase(), 105, 40, { align: "center" });
    pdf.addImage(qrImage, "PNG", 165, 15, 30, 30);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Affidavit ID: ${affidavit.displayId}`, 15, 55);
    pdf.text(`Issued By: ${affidavit.issuerId?.name || "N/A"}`, 15, 62);
    pdf.text(`Category: ${affidavit.category}`, 15, 69);
    pdf.text(`Date Issued: ${new Date(affidavit.dateIssued).toLocaleDateString()}`, 15, 76);
    pdf.text(`Status: ${affidavit.isVerifiedOnBlockchain ? "Verified" : "Non-Verified"}`, 15, 83);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("PARTIES", 15, 98);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    let yPos = 105;
    pdf.text(`Issuer: ${affidavit.issuerId?.name || "N/A"}`, 15, yPos);
    yPos += 7;
    if (affidavit.sellerId?.name) {
      pdf.text(`Seller: ${affidavit.sellerId.name}`, 15, yPos);
      yPos += 7;
    }
    if (affidavit.buyerId?.name) {
      pdf.text(`Buyer: ${affidavit.buyerId.name}`, 15, yPos);
      yPos += 7;
    }
    if (affidavit.witnesses && affidavit.witnesses.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("WITNESSES", 15, yPos + 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      yPos += 17;
      affidavit.witnesses.forEach((witness: any, index: number) => {
        pdf.text(`${index + 1}. ${witness.contactId?.name || "N/A"} (ID: ${witness.contactId?.idCardNumber || "N/A"})`, 15, yPos);
        yPos += 7;
      });
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("DECLARATION", 15, yPos + 10);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(affidavit.declaration, 15, yPos + 17, { maxWidth: 180 });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("STATEMENT OF TRUTH", 15, 195);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(affidavit.description, 15, 202, { maxWidth: 180 });

    pdf.setFont("helvetica", "bold");
    pdf.text("Authorized Signature:", 15, 250);
    pdf.setFont("helvetica", "normal");
    pdf.text(affidavit.issuerId?.name || "N/A", 15, 257);

    pdf.setFont("helvetica", "bold");
    pdf.text("Official Seal:", 150, 250);
    pdf.rect(150, 252, 40, 20);

    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text("AffidBlock - Blockchain-Based Verification Platform", 105, 280, { align: "center" });
    pdf.text(`Verify this document at ${window.location.origin}/verify/${displayId}`, 105, 285, { align: "center" });

    pdf.save(`Affidavit_${displayId}.pdf`);
  };

  const shareAffidavit = async () => {
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `Affidavit: ${affidavit?.title || displayId}`,
          text: `View and verify this affidavit: ${affidavit?.title || displayId}`,
          url: window.location.href,
        });
      } catch (error) {
        fallbackToClipboard();
      }
    } else {
      fallbackToClipboard();
    }
  };

  const fallbackToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast({ title: "Link Copied", description: "Link copied to clipboard!" }),
      () => {
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast({ title: "Link Copied", description: "Link copied to clipboard!" });
      }
    );
  };

  const handleViewProfile = async (idCard: string) => {
    try {
      const response = await fetch(`/api/user?filter=idCardNumber:${idCard}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.users.length > 0) {
        router.push(`/dashboard/users/${data.users[0]._id}`);
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch user profile",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading affidavit...</p>
        </div>
      </div>
    );
  }

  if (!affidavit) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-center mb-4">Affidavit Not Found</h2>
            <p className="text-gray-500 text-center mb-6">
              The requested affidavit could not be found or you don't have permission to view it.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/dashboard/affidavits")}>Back to Affidavits</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string, isVerifiedOnBlockchain: boolean) => {
    if (isVerifiedOnBlockchain) {
      return <Badge className="bg-green-500 text-white">Verified</Badge>;
    }
    return <Badge className="bg-red-500 text-white">Non-Verified</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col xl:flex-row items-center xl:items-start gap-8">
        <div className="w-full xl:w-2/3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-200 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-lg font-semibold">Back</span>
          </button>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-700">GOVERNMENT OF PAKISTAN</h2>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{affidavit.title.toUpperCase()}</h1>
                <p className="text-sm text-gray-500 mt-1">Issued under legal compliance</p>
                <div className="border-t border-gray-300 my-4"></div>
                {getStatusBadge(affidavit.status, affidavit.isVerifiedOnBlockchain)}
              </div>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="parties">Parties & Witnesses</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="blockchain">Blockchain Info</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      { label: "Affidavit ID", value: affidavit.displayId },
                      { label: "Issuer", value: affidavit.issuerId?.name || "N/A" },
                      { label: "Category", value: affidavit.category },
                      { label: "Date Issued", value: new Date(affidavit.dateIssued).toLocaleDateString() },
                      { label: "Status", value: affidavit.isVerifiedOnBlockchain ? "Verified" : "Non-Verified" },
                    ].map((item, index) => (
                      <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <h2 className="text-lg font-semibold">{item.value}</h2>
                      </div>
                    ))}
                  </div>

                  <h2 className="text-lg font-semibold text-gray-700 underline mt-6">Declaration</h2>
                  <p className="text-gray-700 text-justify mt-2">{affidavit.declaration}</p>

                  <h2 className="text-lg font-semibold text-gray-700 underline mt-6">Statement of Truth</h2>
                  <p className="text-gray-700 text-justify mt-2">{affidavit.description}</p>

                  <div className="mt-10 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Authorized Signature</p>
                      <h2 className="text-lg font-semibold">{affidavit.issuerId?.name || "N/A"}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Official Seal</p>
                      <div className="w-20 h-10 border border-gray-400 rounded-lg mt-2"></div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="parties" className="pt-4">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700 mb-3">Parties</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                          <Badge variant="outline" className="mb-2">Issuer</Badge>
                          <h3 className="font-semibold cursor-pointer" onClick={() => handleViewProfile(affidavit.issuerId?.idCardNumber || "")}>
                            {affidavit.issuerId?.name || "N/A"}
                          </h3>
                          <p className="text-sm text-gray-500">ID Card: {affidavit.issuerId?.idCardNumber || "N/A"}</p>
                        </div>
                        {affidavit.sellerId?.name && (
                          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <Badge variant="outline" className="mb-2">Seller</Badge>
                            <h3 className="font-semibold cursor-pointer" onClick={() => handleViewProfile(affidavit.sellerId.idCardNumber)}>
                              {affidavit.sellerId.name}
                            </h3>
                            <p className="text-sm text-gray-500">ID Card: {affidavit.sellerId.idCardNumber}</p>
                          </div>
                        )}
                        {affidavit.buyerId?.name && (
                          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <Badge variant="outline" className="mb-2">Buyer</Badge>
                            <h3 className="font-semibold cursor-pointer" onClick={() => handleViewProfile(affidavit.buyerId.idCardNumber)}>
                              {affidavit.buyerId.name}
                            </h3>
                            <p className="text-sm text-gray-500">ID Card: {affidavit.buyerId.idCardNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {affidavit.witnesses && affidavit.witnesses.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">Witnesses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {affidavit.witnesses.map((witness: any, index: number) => (
                            <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                              <h3 className="font-semibold cursor-pointer" onClick={() => handleViewProfile(witness.contactId?.idCardNumber || "")}>
                                {witness.contactId?.name || "N/A"}
                              </h3>
                              <p className="text-sm text-gray-500">ID Card: {witness.contactId?.idCardNumber || "N/A"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="pt-4">
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Attached Documents</h2>
                    {affidavit.documents && affidavit.documents.length > 0 ? (
                      affidavit.documents.map((doc: any, index: number) => (
                        <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                          <h3 className="font-semibold">{doc.name}</h3>
                          <p className="text-sm text-gray-500">Type: {doc.type}</p>
                          {doc.ipfsHash && (
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline mt-2 inline-block"
                            >
                              View Document
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No documents attached.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="blockchain" className="pt-4">
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Transaction Hash</h3>
                      <p className="text-sm font-mono bg-white p-2 rounded border overflow-x-auto">
                        {affidavit.transactionHash || "Not available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Block Number</h3>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {affidavit.blockNumber || "Not available"}
                        </p>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Timestamp</h3>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {affidavit.dateIssued ? new Date(affidavit.dateIssued).toISOString() : "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                      <h3 className="font-semibold text-blue-800 mb-2">Blockchain Verification</h3>
                      <p className="text-sm text-blue-700">
                        This affidavit is stored on the blockchain for tamper-proof verification.
                      </p>
                    </div>

                    <Button onClick={verifyOnBlockchain} variant="outline" disabled={isVerifying}>
                      {isVerifying ? "Verifying..." : "Verify on Blockchain"}
                    </Button>

                    {isVerified !== null && (
                      <div
                        className={`p-4 rounded-lg ${isVerified ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                      >
                        <h3 className={`font-semibold mb-2 ${isVerified ? "text-green-800" : "text-red-800"}`}>
                          {isVerified ? "Verification Successful" : "Verification Failed"}
                        </h3>
                        <p className={`text-sm ${isVerified ? "text-green-700" : "text-red-700"}`}>
                          {isVerified
                            ? "This affidavit is authentic and verified on the blockchain."
                            : isTampered
                            ? "This affidavit data has been tampered with. Original blockchain data below:"
                            : "Verification failed due to blockchain error."}
                        </p>
                        {originalData && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <h4 className="font-semibold text-red-800">Original Blockchain Data</h4>
                            <p><strong>IPFS Hash:</strong> {originalData.ipfsHash || "N/A"}</p>
                            <p><strong>Title:</strong> {originalData.title || "N/A"}</p>
                            <p><strong>Category:</strong> {originalData.category || "N/A"}</p>
                            <p><strong>Description:</strong> {originalData.description || "N/A"}</p>
                            <p><strong>Declaration:</strong> {originalData.declaration || "N/A"}</p>
                            <p><strong>Issuer ID:</strong> {originalData.issuerId || "N/A"}</p>
                            <p><strong>Seller ID:</strong> {originalData.sellerId || "N/A"}</p>
                            <p><strong>Buyer ID:</strong> {originalData.buyerId || "N/A"}</p>
                            <p><strong>Witnesses:</strong> {originalData.witnesses?.join(", ") || "None"}</p>
                            <p><strong>Documents:</strong> {originalData.documents?.join(", ") || "None"}</p>
                            <p><strong>Data Hash:</strong> {originalData.dataHash || "N/A"}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="w-full xl:w-1/3 flex flex-col items-center">
          <Card className="w-full shadow-lg">
            <CardContent className="p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Verify & Download</h2>

              <div className="bg-white p-4 border rounded-lg shadow-sm mb-6">
                <QRCodeCanvas value={qrValue} size={200} className="mx-auto" ref={qrRef} />
                <p className="text-center text-sm text-gray-500 mt-2">Scan to verify this affidavit</p>
              </div>

              <div className="w-full space-y-3">
                <Button onClick={downloadPDF} className="w-full flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={shareAffidavit}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Affidavit</span>
                </Button>

                <Button onClick={verifyOnBlockchain} variant="outline" className="w-full" disabled={isVerifying}>
                  {isVerifying ? "Verifying..." : "Verify on Blockchain"}
                </Button>
              </div>

              <div className="mt-6 p-4 bg-gray-100 rounded-lg w-full">
                <h3 className="font-semibold text-gray-800 mb-2">Verification Instructions</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Scan the QR code with any QR scanner</li>
                  <li>You will be redirected to the verification page</li>
                  <li>The system will automatically check the blockchain</li>
                  <li>Verification results will be displayed instantly</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}