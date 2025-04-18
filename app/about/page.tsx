import Link from "next/link"
import { Shield, FileCheck, Lock, Globe, Award, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About AffidBlock</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Revolutionizing legal documentation with blockchain technology for secure, tamper-proof affidavits and stamp
            papers.
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 dark:text-white">Our Mission</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              At AffidBlock, we're on a mission to transform the way legal documents are created, verified, and managed.
              By leveraging blockchain technology, we provide a secure, transparent, and efficient platform for all your
              affidavit needs.
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link href="/register">Join Our Mission</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25"></div>
                <div className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl">
                  <img
                    src="/placeholder.svg?height=400&width=600&text=AffidBlock+Team"
                    alt="AffidBlock Team"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 dark:text-white">Our Story</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                AffidBlock was founded in 2023 by a team of legal professionals and blockchain enthusiasts who
                recognized the challenges in the traditional affidavit system.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We witnessed firsthand the inefficiencies, fraud risks, and lack of transparency in paper-based legal
                documentation. This inspired us to create a solution that combines the security of blockchain with the
                legal validity of traditional affidavits.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Today, AffidBlock serves thousands of users across the country, providing a trusted platform for
                creating and verifying legal documents with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-purple-600" />,
                title: "Security",
                description:
                  "We prioritize the security of your documents with advanced blockchain technology and encryption.",
              },
              {
                icon: <Lock className="h-12 w-12 text-purple-600" />,
                title: "Privacy",
                description:
                  "Your data privacy is paramount. We ensure your sensitive information remains confidential.",
              },
              {
                icon: <Globe className="h-12 w-12 text-purple-600" />,
                title: "Accessibility",
                description: "We believe legal documentation should be accessible to everyone, anywhere, anytime.",
              },
              {
                icon: <FileCheck className="h-12 w-12 text-purple-600" />,
                title: "Integrity",
                description: "We maintain the highest standards of integrity in all our operations and services.",
              },
              {
                icon: <Award className="h-12 w-12 text-purple-600" />,
                title: "Excellence",
                description: "We strive for excellence in every aspect of our platform and customer service.",
              },
              {
                icon: <Users className="h-12 w-12 text-purple-600" />,
                title: "Community",
                description:
                  "We foster a community of users, issuers, and legal professionals built on trust and collaboration.",
              },
            ].map((value, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{value.icon}</div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Our Leadership Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "CEO & Co-Founder",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Former legal tech executive with 15+ years of experience in the industry.",
              },
              {
                name: "Michael Chen",
                role: "CTO & Co-Founder",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Blockchain expert with a background in cryptography and secure systems.",
              },
              {
                name: "Aisha Patel",
                role: "Chief Legal Officer",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Experienced attorney specializing in digital law and legal documentation.",
              },
            ].map((member, index) => (
              <Card key={index} className="border-none shadow-lg overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={`/placeholder.svg?height=300&width=300&text=${member.name.replace(" ", "+")}`}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold dark:text-white">{member.name}</h3>
                  <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-400">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Our Achievements</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: "10,000+", label: "Affidavits Issued" },
              { number: "5,000+", label: "Verified Users" },
              { number: "500+", label: "Certified Issuers" },
              { number: "99.9%", label: "Verification Accuracy" },
            ].map((stat, index) => (
              <Card key={index} className="border-none shadow-lg text-center">
                <CardContent className="pt-6">
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">{stat.number}</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "AffidBlock has transformed how our law firm handles affidavits. The verification process is seamless and secure.",
                author: "Rahul Sharma",
                role: "Senior Attorney",
              },
              {
                quote:
                  "As a notary, I can now issue affidavits with complete confidence in their security and authenticity.",
                author: "Priya Patel",
                role: "Certified Notary",
              },
              {
                quote:
                  "The ease of verifying documents has saved our organization countless hours and improved our compliance.",
                author: "Ahmed Khan",
                role: "Compliance Officer",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="mb-4 text-purple-600 dark:text-purple-400">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="ml-4">
                      <p className="text-lg font-semibold dark:text-white">{testimonial.author}</p>
                      <p className="text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience the Future of Legal Documentation?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Join thousands of users who trust AffidBlock for secure, blockchain-verified affidavits.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
