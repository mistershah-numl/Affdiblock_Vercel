import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCheck, Shield, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Secure Affidavits on the Blockchain
                </h1>
                <p className="max-w-[600px] text-gray-200 md:text-xl">
                  AffidBlock revolutionizes legal documentation with tamper-proof, blockchain-verified affidavits and
                  stamp papers.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                    Get Started
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button size="lg" variant="outline" className="bg-purple border-white text-white-600 hover:bg-gray-100">
                    Verify Document
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg blur opacity-75"></div>
                <div className="relative bg-white p-6 rounded-lg shadow-xl">
                  <img
                    src="/placeholder.svg?height=300&width=400"
                    alt="AffidBlock Platform"
                    className="w-full h-auto rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose AffidBlock?</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Our platform offers secure, efficient, and transparent affidavit management
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
            {[
              {
                icon: <Shield className="h-10 w-10 text-purple-600" />,
                title: "Tamper-Proof Security",
                description: "Blockchain technology ensures your documents cannot be forged or altered",
              },
              {
                icon: <FileCheck className="h-10 w-10 text-purple-600" />,
                title: "Instant Verification",
                description: "QR code scanning provides immediate authentication of any document",
              },
              {
                icon: <Users className="h-10 w-10 text-purple-600" />,
                title: "Multi-Role System",
                description: "Specialized dashboards for issuers, users, and administrators",
              },
            ].map((feature, index) => (
              <Card key={index} className="flex flex-col items-center text-center">
                <CardHeader>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Simple steps to create and verify blockchain-secured affidavits
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {[
              {
                step: "1",
                title: "Register",
                description: "Create an account as a user or request to become an issuer",
              },
              {
                step: "2",
                title: "Request Affidavit",
                description: "Select an issuer and provide required details for your document",
              },
              {
                step: "3",
                title: "Issuer Approval",
                description: "Issuer reviews and approves the affidavit, securing it on blockchain",
              },
              {
                step: "4",
                title: "Verify Anytime",
                description: "Scan the QR code to instantly verify the document's authenticity",
              },
            ].map((step, index) => (
              <Card key={index} className="flex flex-col items-center text-center">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white">
                    <span className="text-xl font-bold">{step.step}</span>
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Secure Your Legal Documents?</h2>
              <p className="max-w-[900px] text-gray-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join AffidBlock today and experience the future of secure, blockchain-verified affidavits.
              </p>
            </div>
            <Link href="/register">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 md:py-24 lg:py-32 bg-gray-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">AffidBlock</h3>
              <p className="max-w-[300px] text-gray-400">
                Blockchain-based affidavit and stamp paper verification system for secure legal documentation.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="text-gray-400 hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-400 hover:text-white">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-gray-400 hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-white">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-gray-400 hover:text-white">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} AffidBlock. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
