import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-none shadow-xl">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6 dark:text-white">Privacy Policy</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: March 12, 2025</p>

            <div className="prose prose-purple max-w-none dark:prose-invert">
              <p>
                At AffidBlock, we take your privacy seriously. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our platform. Please read this policy carefully to
                understand our practices regarding your personal data.
              </p>

              <h2>1. Information We Collect</h2>
              <p>We collect several types of information from and about users of our platform, including:</p>
              <h3>1.1 Personal Information</h3>
              <ul>
                <li>Contact information (name, email address, phone number)</li>
                <li>Identity verification information (ID card details)</li>
                <li>Professional credentials (for issuers)</li>
                <li>Blockchain wallet addresses</li>
              </ul>

              <h3>1.2 Document Information</h3>
              <ul>
                <li>Affidavit content and metadata</li>
                <li>Parties and witnesses involved in documents</li>
                <li>Document history and status changes</li>
              </ul>

              <h3>1.3 Technical Information</h3>
              <ul>
                <li>IP address and browser information</li>
                <li>Device information</li>
                <li>Usage data and platform interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect for various purposes, including:</p>
              <ul>
                <li>Providing and maintaining our services</li>
                <li>Verifying your identity and preventing fraud</li>
                <li>Processing and securing affidavits on the blockchain</li>
                <li>Improving and personalizing user experience</li>
                <li>Communicating with you about your account and our services</li>
                <li>Complying with legal obligations</li>
              </ul>

              <h2>3. Blockchain Data</h2>
              <p>
                When you create or verify documents on our platform, certain information is stored on the blockchain.
                Due to the nature of blockchain technology, this information becomes permanent and immutable. However,
                we take measures to ensure that sensitive personal information is not directly stored on the blockchain.
                Instead, we use cryptographic hashes and secure references.
              </p>

              <h2>4. Data Sharing and Disclosure</h2>
              <p>We may share your information in the following circumstances:</p>
              <ul>
                <li>With parties and witnesses involved in your affidavits (as necessary for the service)</li>
                <li>With service providers who help us operate our platform</li>
                <li>To comply with legal obligations</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your consent or at your direction</li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>

              <h2>5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information.
                These measures include encryption, access controls, and regular security assessments. However, no method
                of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute
                security.
              </p>

              <h2>6. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this
                Privacy Policy, unless a longer retention period is required or permitted by law. Document information
                stored on the blockchain is permanent by nature.
              </p>

              <h2>7. Your Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul>
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate information</li>
                <li>The right to delete your personal information (subject to certain exceptions)</li>
                <li>The right to restrict or object to processing</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p>
                To exercise these rights, please contact us using the information provided at the end of this policy.
              </p>

              <h2>8. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal
                information from children. If you are a parent or guardian and believe your child has provided us with
                personal information, please contact us.
              </p>

              <h2>9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence.
                These countries may have different data protection laws. We take appropriate safeguards to ensure that
                your information receives an adequate level of protection.
              </p>

              <h2>10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The updated version will be indicated by an updated
                "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>

              <h2>11. Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact
                us at:
              </p>
              <p>
                Email: privacy@affidblock.com
                <br />
                Address: 123 Blockchain Avenue, Suite 456, Tech City, TC 12345
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                By using AffidBlock, you acknowledge that you have read and understood this Privacy Policy and agree to
                its terms.
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
