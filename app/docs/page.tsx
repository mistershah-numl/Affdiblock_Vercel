import Link from "next/link"
import { BookOpen, FileText, Search, ArrowRight, Video, Code, Download, Users, Shield, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DocumentationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Documentation</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Comprehensive guides and resources to help you get the most out of AffidBlock.
          </p>
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search documentation..."
              className="pl-10 py-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <Button className="absolute inset-y-0 right-0 px-4">Search</Button>
          </div>
        </div>
      </section>

      {/* Quick Start Guides */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Quick Start Guides</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <Users className="h-10 w-10 text-purple-600" />,
                title: "For Users",
                description: "Learn how to create an account, request affidavits, and manage your documents.",
                link: "/docs/users",
              },
              {
                icon: <Shield className="h-10 w-10 text-purple-600" />,
                title: "For Issuers",
                description: "Discover how to review requests, issue affidavits, and manage your clients.",
                link: "/docs/issuers",
              },
              {
                icon: <FileCheck className="h-10 w-10 text-purple-600" />,
                title: "For Admins",
                description: "Explore administrative features, user management, and system settings.",
                link: "/docs/admins",
              },
            ].map((guide, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4">{guide.icon}</div>
                  <CardTitle className="text-xl dark:text-white">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-center">{guide.description}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button asChild>
                    <Link href={guide.link} className="flex items-center">
                      <span>Get Started</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Documentation Categories</h2>

          <Tabs defaultValue="guides" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="guides">User Guides</TabsTrigger>
              <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
              <TabsTrigger value="api">API Reference</TabsTrigger>
              <TabsTrigger value="faq">FAQs</TabsTrigger>
            </TabsList>

            <TabsContent value="guides" className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Getting Started",
                  description: "Learn the basics of AffidBlock and how to set up your account.",
                  link: "/docs/getting-started",
                },
                {
                  title: "Creating Affidavits",
                  description: "Step-by-step guide to creating and requesting affidavits.",
                  link: "/docs/creating-affidavits",
                },
                {
                  title: "Verifying Documents",
                  description: "How to verify the authenticity of affidavits using our platform.",
                  link: "/docs/verifying-documents",
                },
                {
                  title: "Managing Your Account",
                  description: "Learn how to update your profile, change settings, and manage security.",
                  link: "/docs/account-management",
                },
                {
                  title: "Blockchain Integration",
                  description: "Understanding how blockchain technology secures your documents.",
                  link: "/docs/blockchain-integration",
                },
                {
                  title: "Sharing Documents",
                  description: "How to share your affidavits securely with others.",
                  link: "/docs/sharing-documents",
                },
              ].map((item, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-white">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" size="sm">
                      <Link href={item.link} className="flex items-center">
                        <span>Read More</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tutorials" className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Video: Creating Your First Affidavit",
                  description: "Watch our step-by-step tutorial on creating your first affidavit.",
                  link: "/tutorials/first-affidavit",
                  icon: <Video className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "Video: Becoming an Issuer",
                  description: "Learn how to apply for and become a certified issuer on our platform.",
                  link: "/tutorials/becoming-issuer",
                  icon: <Video className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "Interactive: Document Verification",
                  description: "Try our interactive tutorial on verifying document authenticity.",
                  link: "/tutorials/document-verification",
                  icon: <FileText className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "Video: Advanced User Settings",
                  description: "Discover advanced features and settings for power users.",
                  link: "/tutorials/advanced-settings",
                  icon: <Video className="h-5 w-5 text-purple-600" />,
                },
              ].map((item, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      {item.icon}
                      <span>{item.title}</span>
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" size="sm">
                      <Link href={item.link} className="flex items-center">
                        <span>Watch Tutorial</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="api" className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "API Overview",
                  description: "Introduction to the AffidBlock API and authentication methods.",
                  link: "/docs/api/overview",
                  icon: <Code className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "Affidavit Endpoints",
                  description: "API endpoints for creating, retrieving, and managing affidavits.",
                  link: "/docs/api/affidavits",
                  icon: <Code className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "User Endpoints",
                  description: "API endpoints for user management and authentication.",
                  link: "/docs/api/users",
                  icon: <Code className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "Verification Endpoints",
                  description: "API endpoints for verifying document authenticity.",
                  link: "/docs/api/verification",
                  icon: <Code className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "Webhook Integration",
                  description: "How to set up and use webhooks for real-time updates.",
                  link: "/docs/api/webhooks",
                  icon: <Code className="h-5 w-5 text-purple-600" />,
                },
                {
                  title: "API SDKs",
                  description: "Client libraries and SDKs for various programming languages.",
                  link: "/docs/api/sdks",
                  icon: <Download className="h-5 w-5 text-purple-600" />,
                },
              ].map((item, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      {item.icon}
                      <span>{item.title}</span>
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" size="sm">
                      <Link href={item.link} className="flex items-center">
                        <span>View Documentation</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              {[
                {
                  question: "What is AffidBlock?",
                  answer:
                    "AffidBlock is a blockchain-based platform for creating, managing, and verifying affidavits and legal documents. We use blockchain technology to ensure the security and authenticity of your documents.",
                },
                {
                  question: "How does blockchain verification work?",
                  answer:
                    "When a document is verified on our platform, we create a unique cryptographic hash of the document and store it on the blockchain. This creates an immutable record that can be used to verify the document's authenticity at any time.",
                },
                {
                  question: "Is AffidBlock legally binding?",
                  answer:
                    "Yes, documents created on AffidBlock are legally binding in most jurisdictions. However, specific legal requirements may vary by location. We recommend consulting with a legal professional for your specific needs.",
                },
                {
                  question: "How do I request a new affidavit?",
                  answer:
                    "To request a new affidavit, log in to your account, go to your dashboard, and click on 'Request New Affidavit'. Fill in the required details, select an issuer, and submit your request.",
                },
                {
                  question: "Can I edit an affidavit after it's been approved?",
                  answer:
                    "Once an affidavit has been approved and added to the blockchain, it cannot be edited. This immutability is a key security feature. If changes are needed, a new affidavit must be created.",
                },
              ].map((faq, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-white">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
              <div className="text-center mt-6">
                <Button asChild>
                  <Link href="/support">View All FAQs</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Documentation Resources */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Additional Resources</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <BookOpen className="h-10 w-10 text-purple-600" />,
                title: "User Manual",
                description: "Comprehensive guide covering all aspects of the AffidBlock platform.",
                action: "Download PDF",
                link: "/docs/manual.pdf",
              },
              {
                icon: <Video className="h-10 w-10 text-purple-600" />,
                title: "Video Library",
                description: "Browse our collection of tutorial videos for visual learning.",
                action: "View Videos",
                link: "/tutorials",
              },
              {
                icon: <Code className="h-10 w-10 text-purple-600" />,
                title: "Developer Hub",
                description: "Resources for developers integrating with our API and blockchain.",
                action: "Explore",
                link: "/developers",
              },
            ].map((resource, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4">{resource.icon}</div>
                  <CardTitle className="text-xl dark:text-white">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">{resource.description}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button asChild variant="outline">
                    <Link href={resource.link}>{resource.action}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Need More Help?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Our support team is ready to assist you with any questions or issues you may have.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href="/support">Contact Support</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link href="/community">Join Community</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
