"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <img
              src="/logo.svg"
              alt="AI Chat Hub Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Chat Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the power of AI with our sleek chat platform. Get access to various AI models with flexible pricing plans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Try AI Chat
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose AI Chat Hub?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the best AI chat experience with cutting-edge technology and user-friendly interface.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Icons.user className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Multiple AI Models</CardTitle>
                <CardDescription>
                  Access various AI models tailored for different use cases, from casual conversation to technical assistance.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Icons.user className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Flexible Pricing</CardTitle>
                <CardDescription>
                  Choose from credit packs or subscription plans that fit your needs and budget.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Icons.user className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your conversations are encrypted and private. We take data security seriously.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Real-time Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Chat Features</h2>
            <p className="text-muted-foreground">
              Experience ChatGPT-like functionality with enhanced features for better productivity.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Icons.user className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Real-time Fund Usage</CardTitle>
                <CardDescription>
                  Monitor your credit usage in real-time as you chat with AI models.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Icons.user className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Chat History</CardTitle>
                <CardDescription>
                  All your conversations are saved and easily accessible for future reference.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Icons.user className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Document Generation</CardTitle>
                <CardDescription>
                  Generate documents and PDFs from your conversations with proper formatting.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of users already using AI Chat Hub for their AI conversations.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}