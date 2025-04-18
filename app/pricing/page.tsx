import Link from "next/link"
import { Check, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Choose the plan that's right for you and start creating secure, blockchain-verified affidavits today.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="monthly" className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="monthly">Monthly Billing</TabsTrigger>
                <TabsTrigger value="annual">Annual Billing (Save 20%)</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="monthly">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Basic Plan */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center pb-8 border-b">
                    <CardTitle className="text-2xl">Basic</CardTitle>
                    <CardDescription className="text-lg mt-2">For individual users</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$9.99</span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {[
                        "Up to 5 affidavits per month",
                        "Basic document templates",
                        "QR code verification",
                        "Email support",
                        "7-day document history",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span className="dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Professional Plan */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                  <CardHeader className="text-center pb-8 border-b">
                    <CardTitle className="text-2xl">Professional</CardTitle>
                    <CardDescription className="text-lg mt-2">For professionals & small firms</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$24.99</span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {[
                        "Up to 25 affidavits per month",
                        "Advanced document templates",
                        "QR code & blockchain verification",
                        "Priority email support",
                        "30-day document history",
                        "Custom branding options",
                        "Witness management",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span className="dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Enterprise Plan */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center pb-8 border-b">
                    <CardTitle className="text-2xl">Enterprise</CardTitle>
                    <CardDescription className="text-lg mt-2">For large organizations</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$99.99</span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {[
                        "Unlimited affidavits",
                        "All document templates",
                        "Advanced blockchain verification",
                        "24/7 priority support",
                        "Unlimited document history",
                        "Custom branding & white labeling",
                        "API access",
                        "Dedicated account manager",
                        "Custom integration options",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span className="dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full" variant="outline">
                      <Link href="/contact">Contact Sales</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="annual">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Basic Plan Annual */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center pb-8 border-b">
                    <CardTitle className="text-2xl">Basic</CardTitle>
                    <CardDescription className="text-lg mt-2">For individual users</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$7.99</span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">Billed annually ($95.88/year)</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {[
                        "Up to 5 affidavits per month",
                        "Basic document templates",
                        "QR code verification",
                        "Email support",
                        "7-day document history",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span className="dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Professional Plan Annual */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                  <CardHeader className="text-center pb-8 border-b">
                    <CardTitle className="text-2xl">Professional</CardTitle>
                    <CardDescription className="text-lg mt-2">For professionals & small firms</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$19.99</span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">Billed annually ($239.88/year)</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {[
                        "Up to 25 affidavits per month",
                        "Advanced document templates",
                        "QR code & blockchain verification",
                        "Priority email support",
                        "30-day document history",
                        "Custom branding options",
                        "Witness management",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span className="dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Enterprise Plan Annual */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center pb-8 border-b">
                    <CardTitle className="text-2xl">Enterprise</CardTitle>
                    <CardDescription className="text-lg mt-2">For large organizations</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$79.99</span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">Billed annually ($959.88/year)</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {[
                        "Unlimited affidavits",
                        "All document templates",
                        "Advanced blockchain verification",
                        "24/7 priority support",
                        "Unlimited document history",
                        "Custom branding & white labeling",
                        "API access",
                        "Dedicated account manager",
                        "Custom integration options",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span className="dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full" variant="outline">
                      <Link href="/contact">Contact Sales</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-4 text-left font-semibold dark:text-white">Feature</th>
                  <th className="p-4 text-center font-semibold dark:text-white">Basic</th>
                  <th className="p-4 text-center font-semibold dark:text-white">Professional</th>
                  <th className="p-4 text-center font-semibold dark:text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  {
                    feature: "Monthly Affidavits",
                    basic: "5",
                    professional: "25",
                    enterprise: "Unlimited",
                  },
                  {
                    feature: "Document Templates",
                    basic: "Basic",
                    professional: "Advanced",
                    enterprise: "All + Custom",
                  },
                  {
                    feature: "Blockchain Verification",
                    basic: "Basic",
                    professional: "Advanced",
                    enterprise: "Premium",
                    tooltip: "Different levels of blockchain verification with varying security features",
                  },
                  {
                    feature: "Document History",
                    basic: "7 days",
                    professional: "30 days",
                    enterprise: "Unlimited",
                  },
                  {
                    feature: "Support",
                    basic: "Email",
                    professional: "Priority Email",
                    enterprise: "24/7 Dedicated",
                  },
                  {
                    feature: "Custom Branding",
                    basic: "✕",
                    professional: "✓",
                    enterprise: "✓ + White Label",
                  },
                  {
                    feature: "API Access",
                    basic: "✕",
                    professional: "✕",
                    enterprise: "✓",
                    tooltip: "Access to our API for custom integrations",
                  },
                  {
                    feature: "Witness Management",
                    basic: "✕",
                    professional: "✓",
                    enterprise: "✓ Advanced",
                  },
                  {
                    feature: "Multi-User Access",
                    basic: "✕",
                    professional: "Up to 3 users",
                    enterprise: "Unlimited users",
                  },
                  {
                    feature: "Analytics Dashboard",
                    basic: "Basic",
                    professional: "Advanced",
                    enterprise: "Custom",
                  },
                ].map((row, index) => (
                  <tr key={index} className="bg-white dark:bg-gray-900">
                    <td className="p-4 font-medium dark:text-white">
                      <div className="flex items-center">
                        {row.feature}
                        {row.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{row.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center dark:text-gray-300">{row.basic}</td>
                    <td className="p-4 text-center dark:text-gray-300">{row.professional}</td>
                    <td className="p-4 text-center dark:text-gray-300">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                question: "Can I change plans at any time?",
                answer:
                  "Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.",
              },
              {
                question: "Is there a free trial available?",
                answer: "Yes, we offer a 14-day free trial for all plans. No credit card required to start your trial.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major credit cards, PayPal, and cryptocurrency payments including Bitcoin and Ethereum.",
              },
              {
                question: "Can I cancel my subscription?",
                answer:
                  "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.",
              },
              {
                question: "Do you offer discounts for non-profits?",
                answer:
                  "Yes, we offer special pricing for non-profit organizations. Please contact our sales team for more information.",
              },
              {
                question: "What happens if I exceed my monthly affidavit limit?",
                answer:
                  "If you reach your monthly limit, you can purchase additional affidavits or upgrade to a higher plan.",
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
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Join thousands of users who trust AffidBlock for secure, blockchain-verified affidavits.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href="/register">Start Your Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-80">No credit card required. 14-day free trial.</p>
        </div>
      </section>
    </div>
  )
}
