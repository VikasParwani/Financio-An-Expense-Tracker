"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "firebase/auth"
import { Eye, EyeOff, Loader2, Mail, Lock, UserIcon, LogIn, Wallet, ArrowLeft } from "lucide-react"

import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")

  // Login form state
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
        variant: "default",
      })

      router.push("/dashboard")
    } catch (error: any) {
      // Show specific message for wrong password
      if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        toast({
          title: "Login failed",
          description: "Incorrect email or password. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Something went wrong",
          variant: "destructive",
        })
      }
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
    setIsLoading(true)
    const provider = new GoogleAuthProvider()

    // Add these settings to improve reliability
    provider.setCustomParameters({
      prompt: "select_account",
    })

    try {
      // Use signInWithRedirect instead of signInWithPopup for better compatibility
      await signInWithRedirect(auth, provider)

      // Note: You won't reach this code immediately as the page will redirect
      // The result will be handled when the page loads again
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await sendPasswordResetEmail(auth, resetEmail)
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password",
        variant: "default",
      })
      setShowForgotPassword(false)
      setResetEmail("")
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          // User successfully signed in
          document.cookie = "auth=true; path=/; max-age=86400"

          toast({
            title: "Login successful",
            description: "You have been logged in with Google successfully",
            variant: "default",
          })

          router.push("/dashboard")
        }
      } catch (error: any) {
        console.error("Redirect error:", error)
        toast({
          title: "Google login failed",
          description: error.message || "Something went wrong",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    handleRedirectResult()
  }, [router])

  return (
      <div className="login-container">
        <div className="login-background"></div>
        <div className="login-content">
          <div className="login-logo">
            <div className="logo-icon">
              <Wallet className="h-8 w-8" />
            </div>
            <h1>Welcome to FINANCIO</h1>
          </div>

          {showForgotPassword ? (
              <Card className="login-card">
                <CardHeader>
                  <div className="flex items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        onClick={() => setShowForgotPassword(false)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle>Reset Password</CardTitle>
                      <CardDescription>Enter your email to receive a password reset link</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <form onSubmit={handleForgotPassword}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="input-with-icon">
                        <Mail className="input-icon" />
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="name@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="pl-10"
                            required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full login-button" disabled={isLoading}>
                      {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending reset link...
                          </>
                      ) : (
                          "Send Reset Link"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
          ) : (
              <Tabs defaultValue="login" className="login-tabs">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Card className="login-card">
                    <CardHeader>
                      <CardTitle>Welcome Back</CardTitle>
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
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-sm text-indigo-500 hover:text-indigo-700"
                                onClick={() => setShowForgotPassword(true)}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <div className="input-with-icon relative">
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
                      <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full login-button" disabled={isLoading}>
                          {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Logging in...
                              </>
                          ) : (
                              <>
                                <LogIn className="mr-2 h-4 w-4" />
                                Login
                              </>
                          )}
                        </Button>

                        <div className="or-divider">
                          <span>OR</span>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full google-button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                          </svg>
                          Continue with Google
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="signup">
                  <Card className="login-card">
                    <CardHeader>
                      <CardTitle>Create an account</CardTitle>
                      <CardDescription>Enter your information to create an account</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignup}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <div className="input-with-icon">
                            <UserIcon className="input-icon" />
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
                          <div className="input-with-icon relative">
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
                          <div className="input-with-icon">
                            <Lock className="input-icon" />
                            <Input
                                id="signup-confirm-password"
                                type="password"
                                value={signupConfirmPassword}
                                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                className="pl-10"
                                required
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit" className="w-full signup-button" disabled={isLoading}>
                          {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                              </>
                          ) : (
                              "Create Account"
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
              </Tabs>
          )}
        </div>

        <style jsx global>{`
        /* Login Page Styling */
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .login-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          z-index: -1;
        }
        
        .login-background:before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 80%);
          animation: rotate 30s linear infinite;
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .login-content {
          width: 100%;
          max-width: 480px;
          padding: 2rem;
          z-index: 1;
        }
        
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          color: white;
        }
        
        .logo-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .login-logo h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
        }
        
        .login-tabs {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .login-card {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-top: 1rem;
        }
        
        .input-with-icon {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          width: 1rem;
          height: 1rem;
        }
        
        .login-button {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          border: none;
          transition: all 0.3s ease;
        }
        
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        
        .signup-button {
          background: linear-gradient(to right, #8b5cf6, #d946ef);
          border: none;
          transition: all 0.3s ease;
        }
        
        .signup-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        .google-button {
          background: white;
          color: #333;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .google-button:hover {
          background: #f9fafb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .or-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
          margin: 1rem 0;
        }
        
        .or-divider::before,
        .or-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .or-divider::before {
          margin-right: 0.5rem;
        }
        
        .or-divider::after {
          margin-left: 0.5rem;
        }
        
        @media (max-width: 640px) {
          .login-content {
            padding: 1rem;
          }
        }
      `}</style>
      </div>
  )
}
