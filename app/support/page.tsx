import Link from "next/link"
import { MessageSquare, Mail, Phone, FileQuestion, BookOpen, HelpCircle, Video, ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How Can We Help You?</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Find answers, get support, and resolve any issues with your AffidBlock experience.
          </p>
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search for help articles..."
              className="pl-10 py-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <Button className="absolute inset-y-0 right-0 px-4">Search</Button>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Support Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="h-12 w-12 text-purple-600" />,
                title: "Live Chat",
                description: "Chat with our support team in real-time for immediate assistance.",
                action: "Start Chat",
                href: "#chat",
              },
              {
                icon: <Mail className="h-12 w-12 text-purple-600" />,
                title: "Email Support",
                description: "Send us an email and we'll get back to you within 24 hours.",
                action: "Email Us",
                href: "mailto:support@affidblock.com",
              },
              {
                icon: <Phone className="h-12 w-12 text-purple-600" />,
                title: "Phone Support",
                description: "Call our support team for urgent issues or complex questions.",
                action: "Call Now",
                href: "tel:+1234567890",
              },
            ].map((option, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4">{option.icon}</div>
                  <CardTitle className="text-xl dark:text-white">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">{option.description}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button asChild>
                    <Link href={option.href}>{option.action}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Frequently Asked Questions</h2>

          <Tabs defaultValue="general" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="affidavits">Affidavits</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
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
                  question: "What devices can I use AffidBlock on?",
                  answer:
                    "AffidBlock is accessible on any device with a web browser, including desktops, laptops, tablets, and smartphones. We also offer mobile apps for iOS and Android for a more optimized experience.",
                },
              ].map((faq, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl dark:text-white">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="account" className="space-y-4">
              {[
                {
                  question: "How do I create an account?",
                  answer:
                    "To create an account, click on the 'Register' button in the top right corner of our homepage. Fill in your details, verify your email address, and you're ready to go.",
                },
                {
                  question: "How do I reset my password?",
                  answer:
                    "If you've forgotten your password, click on the 'Forgot Password' link on the login page. Enter your email address, and we'll send you instructions to reset your password.",
                },
                {
                  question: "Can I change my email address?",
                  answer:
                    "Yes, you can change your email address in your account settings. Go to your profile, click on 'Settings', and update your email address. You'll need to verify your new email address.",
                },
                {
                  question: "How do I become an issuer?",
                  answer:
                    "To become an issuer, you need to apply through your account. Go to your profile, click on 'Become an Issuer', and follow the instructions to submit your application with the required documentation.",
                },
              ].map((faq, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl dark:text-white">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="affidavits" className="space-y-4">
              {[
                {
                  question: "How do I request a new affidavit?",
                  answer:
                    "To request a new affidavit, log in to your account, go to your dashboard, and click on 'Request New Affidavit'. Fill in the required details, select an issuer, and submit your request.",
                },
                {
                  question: "How long does it take to get an affidavit approved?",
                  answer:
                    "Approval times vary depending on the issuer's workload. Typically, affidavits are approved within 1-3 business days. You can check the status of your request in your dashboard.",
                },
                {
                  question: "Can I edit an affidavit after it's been approved?",
                  answer:
                    "Once an affidavit has been approved and added to the blockchain, it cannot be edited. This immutability is a key security feature. If changes are needed, a new affidavit must be created.",
                },
                {
                  question: "How do I verify an affidavit?",
                  answer:
                    "To verify an affidavit, you can scan the QR code on the document or enter the affidavit ID on our verification page. The system will check the blockchain and confirm the document's authenticity.",
                },
              ].map((faq, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl dark:text-white">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              {[
                {
                  question: "What payment methods do you accept?",
                  answer:
                    "We accept all major credit cards, PayPal, and cryptocurrency payments including Bitcoin and Ethereum.",
                },
                {
                  question: "How do I upgrade my plan?",
                  answer:
                    "To upgrade your plan, go to your account settings, select 'Subscription', and choose the plan you want to upgrade to. Your new plan will take effect immediately.",
                },
                {
                  question: "Can I get a refund?",
                  answer:
                    "We offer a 14-day money-back guarantee for all new subscriptions. If you're not satisfied with our service, contact our support team within 14 days of your purchase for a full refund.",
                },
                {
                  question: "Do you offer discounts for non-profits?",
                  answer:
                    "Yes, we offer special pricing for non-profit organizations. Please contact our sales team with proof of your non-profit status to learn more about our discount program.",
                },
              ].map((faq, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl dark:text-white">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/docs">View All FAQs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Help Resources */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Help Resources</h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <FileQuestion className="h-10 w-10 text-purple-600" />,
                title: "Knowledge Base",
                description: "Browse our comprehensive knowledge base for detailed guides and tutorials.",
                link: "/docs/knowledge-base",
              },
              {
                icon: <BookOpen className="h-10 w-10 text-purple-600" />,
                title: "Documentation",
                description: "Explore our detailed documentation for in-depth information about our platform.",
                link: "/docs",
              },
              {
                icon: <Video className="h-10 w-10 text-purple-600" />,
                title: "Video Tutorials",
                description: "Watch step-by-step video tutorials to learn how to use AffidBlock.",
                link: "/tutorials",
              },
              {
                icon: <HelpCircle className="h-10 w-10 text-purple-600" />,
                title: "Community Forum",
                description: "Join our community forum to connect with other users and share experiences.",
                link: "/community",
              },
            ].map((resource, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4">{resource.icon}</div>
                  <CardTitle className="text-lg dark:text-white">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{resource.description}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href={resource.link} className="flex items-center">
                      <span>Explore</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Contact Us</h2>

            <Card className="border-none shadow-xl">
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium dark:text-white">
                        Name
                      </label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium dark:text-white">
                        Email
                      </label>
                      <Input id="email" type="email" placeholder="Your email" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium dark:text-white">
                      Subject
                    </label>
                    <Input id="subject" placeholder="How can we help you?" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium dark:text-white">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Please describe your issue in detail..."
                    ></textarea>
                  </div>

                  <div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="mt-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Our support team is available Monday to Friday, 9am to 5pm EST.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                For urgent issues outside business hours, please email{" "}
                <a href="mailto:urgent@affidblock.com" className="text-purple-600 dark:text-purple-400">
                  urgent@affidblock.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
