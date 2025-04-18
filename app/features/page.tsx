import Link from "next/link"
import {
  Shield,
  FileCheck,
  Lock,
  Award,
  Users,
  CheckCircle,
  Smartphone,
  Clock,
  Database,
  Zap,
  Search,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Features & Capabilities</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Discover how AffidBlock is revolutionizing legal documentation with powerful features built on blockchain
            technology.
          </p>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-purple-600" />,
                title: "Blockchain Security",
                description: "Every affidavit is secured on the blockchain, making it tamper-proof and immutable.",
              },
              {
                icon: <FileCheck className="h-12 w-12 text-purple-600" />,
                title: "Instant Verification",
                description: "Verify any document instantly by scanning its QR code or entering its unique ID.",
              },
              {
                icon: <Lock className="h-12 w-12 text-purple-600" />,
                title: "End-to-End Encryption",
                description: "Your sensitive data is protected with advanced encryption throughout the process.",
              },
              {
                icon: <Smartphone className="h-12 w-12 text-purple-600" />,
                title: "Mobile Friendly",
                description: "Access and manage your affidavits from any device, anywhere, anytime.",
              },
              {
                icon: <Clock className="h-12 w-12 text-purple-600" />,
                title: "Time-Stamped Records",
                description: "Every action is recorded with a blockchain timestamp for complete audit trails.",
              },
              {
                icon: <Database className="h-12 w-12 text-purple-600" />,
                title: "Secure Storage",
                description: "Documents are stored securely with redundant backups and blockchain verification.",
              },
            ].map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Role-Based Features</h2>

          <Tabs defaultValue="user" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="user">For Users</TabsTrigger>
              <TabsTrigger value="issuer">For Issuers</TabsTrigger>
              <TabsTrigger value="admin">For Admins</TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="border rounded-lg p-6 shadow-md bg-white dark:bg-gray-900">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <FileCheck className="h-6 w-6 text-green-500" />,
                    title: "Request Affidavits",
                    description: "Easily request new affidavits by selecting parties and witnesses from your contacts.",
                  },
                  {
                    icon: <Search className="h-6 w-6 text-green-500" />,
                    title: "Track Status",
                    description: "Monitor the status of your affidavit requests in real-time.",
                  },
                  {
                    icon: <Share2 className="h-6 w-6 text-green-500" />,
                    title: "Share & Download",
                    description: "Share your verified affidavits via QR codes or download as PDFs.",
                  },
                  {
                    icon: <Shield className="h-6 w-6 text-green-500" />,
                    title: "Become an Issuer",
                    description: "Apply to become a certified issuer with your professional credentials.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="mt-1">{feature.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 dark:text-white">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="issuer" className="border rounded-lg p-6 shadow-md bg-white dark:bg-gray-900">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
                    title: "Approve Requests",
                    description: "Review and approve affidavit requests from users with a streamlined workflow.",
                  },
                  {
                    icon: <FileCheck className="h-6 w-6 text-blue-500" />,
                    title: "Issue Affidavits",
                    description: "Create and issue blockchain-verified affidavits with your digital signature.",
                  },
                  {
                    icon: <Users className="h-6 w-6 text-blue-500" />,
                    title: "Manage Clients",
                    description: "View profiles of users you've issued affidavits to and their document history.",
                  },
                  {
                    icon: <Award className="h-6 w-6 text-blue-500" />,
                    title: "Verified Status",
                    description: "Gain credibility with a verified issuer badge and build your reputation.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="mt-1">{feature.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 dark:text-white">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="admin" className="border rounded-lg p-6 shadow-md bg-white dark:bg-gray-900">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <Users className="h-6 w-6 text-purple-500" />,
                    title: "User Management",
                    description: "Comprehensive tools to manage users, issuers, and their permissions.",
                  },
                  {
                    icon: <Shield className="h-6 w-6 text-purple-500" />,
                    title: "Issuer Verification",
                    description: "Review and approve issuer applications with document verification.",
                  },
                  {
                    icon: <Database className="h-6 w-6 text-purple-500" />,
                    title: "System Monitoring",
                    description: "Monitor system performance, blockchain status, and security metrics.",
                  },
                  {
                    icon: <Zap className="h-6 w-6 text-purple-500" />,
                    title: "Advanced Controls",
                    description: "Ban users, revoke affidavits, and manage system-wide settings.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="mt-1">{feature.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 dark:text-white">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">How It Works</h2>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-purple-200 dark:bg-purple-900"></div>

            {/* Timeline items */}
            <div className="space-y-12">
              {[
                {
                  step: "1",
                  title: "Create an Account",
                  description: "Sign up with your details and verify your identity with your ID card.",
                  icon: <Users className="h-8 w-8 text-white" />,
                },
                {
                  step: "2",
                  title: "Request an Affidavit",
                  description: "Select an issuer, provide required details, and specify parties involved.",
                  icon: <FileCheck className="h-8 w-8 text-white" />,
                },
                {
                  step: "3",
                  title: "Issuer Review",
                  description: "The selected issuer reviews your request and approves or requests changes.",
                  icon: <CheckCircle className="h-8 w-8 text-white" />,
                },
                {
                  step: "4",
                  title: "Blockchain Verification",
                  description: "Upon approval, the affidavit is secured on the blockchain with a unique hash.",
                  icon: <Shield className="h-8 w-8 text-white" />,
                },
                {
                  step: "5",
                  title: "Access & Share",
                  description: "Download your affidavit as PDF or share via QR code for instant verification.",
                  icon: <Share2 className="h-8 w-8 text-white" />,
                },
              ].map((item, index) => (
                <div key={index} className="relative flex items-center">
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className={`w-5/12 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 ml-auto"}`}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                      <div className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-sm font-semibold px-3 py-1 rounded-full mb-2">
                        Step {item.step}
                      </div>
                      <h3 className="text-xl font-semibold mb-2 dark:text-white">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Our Technology Stack</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-purple-600" />
                  <span>Blockchain Technology</span>
                </CardTitle>
                <CardDescription>Secure, immutable record-keeping</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">Ethereum-based smart contracts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">IPFS for decentralized storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">SHA-256 cryptographic hashing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-6 w-6 text-purple-600" />
                  <span>Backend Infrastructure</span>
                </CardTitle>
                <CardDescription>Robust and scalable architecture</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">Next.js for server-side rendering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">MongoDB for efficient data storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">JWT for secure authentication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-6 w-6 text-purple-600" />
                  <span>Security Measures</span>
                </CardTitle>
                <CardDescription>Multi-layered protection</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">End-to-end encryption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">Two-factor authentication</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">Regular security audits</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-purple-600" />
                  <span>User Experience</span>
                </CardTitle>
                <CardDescription>Intuitive and accessible</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">Responsive design for all devices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">Dark/light mode support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="dark:text-gray-300">Accessibility compliant</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience These Features?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Join AffidBlock today and revolutionize how you create, manage, and verify legal documents.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
