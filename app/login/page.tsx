"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth"
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react'
import Image from "next/image"

import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Email authentication state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")
  const [signupName, setSignupName] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)

      // Set a cookie to indicate the user is logged in
      document.cookie = "auth=true; path=/; max-age=86400"

      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword)

      // Set a cookie to indicate the user is logged in
      document.cookie = "auth=true; path=/; max-age=86400"

      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Set a cookie to indicate the user is logged in
      document.cookie = "auth=true; path=/; max-age=86400";

      toast({
        title: "Google sign-in successful",
        description: "You have been logged in successfully",
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Google sign-in failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="auth-shape shape-1"></div>
          <div className="auth-shape shape-2"></div>
          <div className="auth-shape shape-3"></div>
        </div>

        <div className="auth-card-wrapper">
          <div className="auth-logo">
            <h1>Financio</h1>
            <p>Manage your finances with ease</p>
          </div>

          <Card className="auth-card">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="auth-tabs">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="input-with-icon">
                        <Mail className="input-icon" />
                        <Input
                            id="login-email"
                            type="email"
                            placeholder="name@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10"
                            required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="login-password">Password</Label>
                        <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                      </div>
                      <div className="input-with-icon">
                        <Lock className="input-icon" />
                        <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10"
                            required
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full auth-button" disabled={isLoading}>
                      {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                      ) : (
                          "Login"
                      )}
                    </Button>

                    <div className="auth-divider">
                      <Separator />
                      <span>OR</span>
                      <Separator />
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full google-button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                      <Image
                          src="/google-logo.svg"
                          alt="Google"
                          width={18}
                          height={18}
                          className="mr-2"
                      />
                      Continue with Google
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Enter your information to create an account</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="input-with-icon">
                        <User className="input-icon" />
                        <Input
                            id="signup-name"
                            placeholder="John Doe"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="pl-10"
                            required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="input-with-icon">
                        <Mail className="input-icon" />
                        <Input
                            id="signup-email"
                            type="email"
                            placeholder="name@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10"
                            required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="input-with-icon">
                        <Lock className="input-icon" />
                        <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10"
                            required
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <Input
                          id="signup-confirm-password"
                          type="password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full auth-button" disabled={isLoading}>
                      {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                      ) : (
                          "Create Account"
                      )}
                    </Button>

                    <div className="auth-divider">
                      <Separator />
                      <span>OR</span>
                      <Separator />
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full google-button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                      <Image
                          src="/google-logo.svg"
                          alt="Google"
                          width={18}
                          height={18}
                          className="mr-2"
                      />
                      Sign up with Google
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <style jsx global>{`
        /* Auth Page Styling */
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(to bottom right, #f8fafc, #e2e8f0);
        }
        
        .auth-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          overflow: hidden;
        }
        
        .auth-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.4;
        }
        
        .shape-1 {
          background: #3b82f6;
          width: 300px;
          height: 300px;
          top: -100px;
          left: -100px;
          animation: float 8s ease-in-out infinite;
        }
        
        .shape-2 {
          background: #10b981;
          width: 400px;
          height: 400px;
          bottom: -150px;
          right: -150px;
          animation: float 10s ease-in-out infinite;
        }
        
        .shape-3 {
          background: #6366f1;
          width: 200px;
          height: 200px;
          bottom: 10%;
          left: 10%;
          animation: float 12s ease-in-out infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        .auth-card-wrapper {
          width: 100%;
          max-width: 450px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .auth-logo {
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .auth-logo h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        
        .auth-logo p {
          color: #64748b;
        }
        
        .auth-card {
          border-radius: 1rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.5);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .auth-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transform: translateY(-5px);
        }
        
        .auth-tabs {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: rgba(241, 245, 249, 0.7);
          border-radius: 0.75rem;
        }
        
        .input-with-icon {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          width: 1rem;
          height: 1rem;
        }
        
        .auth-button {
          height: 2.75rem;
          font-weight: 500;
          transition: all 0.2s ease;
          background: linear-gradient(to right, #3b82f6, #6366f1);
          border: none;
        }
        
        .auth-button:hover {
          background: linear-gradient(to right, #2563eb, #4f46e5);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          margin: 0.5rem 0;
        }
        
        .auth-divider span {
          font-size: 0.75rem;
          color: #94a3b8;
          white-space: nowrap;
        }
        
        .google-button {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
          background: white;
        }
        
        .google-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .auth-container {
            padding: 1rem;
          }
          
          .auth-card-wrapper {
            max-width: 100%;
          }
          
          .auth-logo h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
      </div>
  )
}