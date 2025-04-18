import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-none shadow-xl">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6 dark:text-white">Terms of Service</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: March 12, 2025</p>

            <div className="prose prose-purple max-w-none dark:prose-invert">
              <p>
                Welcome to AffidBlock. Please read these Terms of Service ("Terms") carefully as they contain important
                information about your legal rights, remedies, and obligations. By accessing or using the AffidBlock
                platform, you agree to comply with and be bound by these Terms.
              </p>

              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using our services, you agree to be bound by these Terms and our Privacy Policy. If you
                do not agree to these Terms, you may not access or use our services.
              </p>

              <h2>2. Description of Services</h2>
              <p>
                AffidBlock provides a blockchain-based platform for creating, managing, and verifying affidavits and
                legal documents. Our services include but are not limited to:
              </p>
              <ul>
                <li>Creating and requesting affidavits</li>
                <li>Issuing blockchain-verified documents</li>
                <li>Verifying the authenticity of documents</li>
                <li>Managing user profiles and document history</li>
              </ul>

              <h2>3. User Accounts</h2>
              <p>
                To access certain features of our platform, you must register for an account. You agree to provide
                accurate, current, and complete information during the registration process and to update such
                information to keep it accurate, current, and complete.
              </p>
              <p>
                You are responsible for safeguarding your password and for all activities that occur under your account.
                You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h2>4. User Roles and Responsibilities</h2>
              <h3>4.1 Regular Users</h3>
              <p>
                As a regular user, you may request affidavits, select parties and witnesses, and view your document
                history. You are responsible for the accuracy of all information provided in your affidavit requests.
              </p>

              <h3>4.2 Issuers</h3>
              <p>
                Issuers are verified professionals who can approve and issue affidavits. As an issuer, you are
                responsible for verifying the identity of parties involved and ensuring the accuracy of documents you
                issue. You must comply with all applicable laws and regulations related to notarization and legal
                documentation.
              </p>

              <h3>4.3 Administrators</h3>
              <p>
                Administrators manage the platform and have additional privileges. They are responsible for maintaining
                the integrity of the system and ensuring compliance with these Terms.
              </p>

              <h2>5. Blockchain Verification</h2>
              <p>
                Documents verified on our platform are secured using blockchain technology. Once a document is verified
                and added to the blockchain, it cannot be altered or deleted. You acknowledge that this immutability is
                an essential feature of our service.
              </p>

              <h2>6. Intellectual Property</h2>
              <p>
                The AffidBlock platform, including all content, features, and functionality, is owned by AffidBlock and
                is protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h2>7. User Content</h2>
              <p>
                You retain ownership of any content you submit to our platform. By submitting content, you grant us a
                worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in
                connection with providing our services.
              </p>

              <h2>8. Prohibited Activities</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use our services for any illegal purpose</li>
                <li>Submit false or misleading information</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with the proper functioning of our platform</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use our services to create fraudulent documents</li>
              </ul>

              <h2>9. Termination</h2>
              <p>
                We may terminate or suspend your account and access to our services at any time, without prior notice or
                liability, for any reason, including if you violate these Terms.
              </p>

              <h2>10. Disclaimer of Warranties</h2>
              <p>
                Our services are provided "as is" and "as available" without warranties of any kind, either express or
                implied.
              </p>

              <h2>11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, AffidBlock shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages resulting from your use of or inability to use our services.
              </p>

              <h2>12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                AffidBlock is registered, without regard to its conflict of law provisions.
              </p>

              <h2>13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. If we make material changes, we will notify you
                via email or by posting a notice on our platform. Your continued use of our services after such
                modifications constitutes your acceptance of the updated Terms.
              </p>

              <h2>14. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us at:</p>
              <p>
                Email: legal@affidblock.com
                <br />
                Address: 123 Blockchain Avenue, Suite 456, Tech City, TC 12345
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                By using AffidBlock, you acknowledge that you have read, understood, and agree to be bound by these
                Terms of Service.
              </p>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
