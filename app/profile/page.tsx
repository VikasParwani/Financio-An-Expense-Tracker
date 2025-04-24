"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import {
    onAuthStateChanged,
    updateProfile,
    updateEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth"
import { Loader2, LogOut, BarChart3, Calendar, CreditCard, User, Lock, Save, AlertCircle, Info } from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Footer } from "@/components/footer"

type Transaction = {
    id: string
    amount: number
    description: string
    category: string
    date: string
    type: "income" | "expense"
}

export default function ProfilePage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isUpdating, setIsUpdating] = useState(false)

    // Profile form state
    const [displayName, setDisplayName] = useState("")
    const [email, setEmail] = useState("")

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                setDisplayName(currentUser.displayName || "")
                setEmail(currentUser.email || "")
                loadTransactions(currentUser.uid)
            } else {
                // User is not logged in, redirect to login page
                document.cookie = "auth=; path=/; max-age=0"
                router.push("/login")
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [router])

    const loadTransactions = (userId: string) => {
        try {
            const q = query(collection(db, "transactions"), where("userId", "==", userId))

            const unsubscribe = onSnapshot(
                q,
                (querySnapshot) => {
                    const transactionsData: Transaction[] = []
                    querySnapshot.forEach((doc) => {
                        const data = doc.data()
                        transactionsData.push({
                            id: doc.id,
                            amount: data.amount,
                            description: data.description,
                            category: data.category,
                            date: data.date,
                            type: data.type,
                        })
                    })
                    setTransactions(transactionsData)
                },
                (error) => {
                    console.error("Firestore snapshot error:", error)
                },
            )

            return unsubscribe
        } catch (error: any) {
            console.error("Error in loadTransactions:", error)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsUpdating(true)

        try {
            // Update display name if changed
            if (displayName !== user.displayName) {
                await updateProfile(user, { displayName })
            }

            // Update email if changed
            if (email !== user.email) {
                await updateEmail(user, email)
            }

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully",
            })
        } catch (error: any) {
            toast({
                title: "Error updating profile",
                description: error.message || "Something went wrong",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    // Update the handleUpdatePassword function to show a toast notification for wrong password
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "New password and confirmation password must match",
                variant: "destructive",
            })
            return
        }

        setIsUpdating(true)

        try {
            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(user.email, currentPassword)
            await reauthenticateWithCredential(user, credential)

            // Update password
            await updatePassword(user, newPassword)

            // Reset form
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")

            toast({
                title: "Password updated",
                description: "Your password has been updated successfully",
                variant: "default",
            })
        } catch (error: any) {
            // Show specific message for wrong password
            if (error.code === "auth/wrong-password") {
                toast({
                    title: "Error updating password",
                    description: "The current password is incorrect. Please try again.",
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Error updating password",
                    description: error.message || "Something went wrong",
                    variant: "destructive",
                })
            }
        } finally {
            setIsUpdating(false)
        }
    }

    const handleLogout = async () => {
        try {
            await auth.signOut()
            document.cookie = "auth=; path=/; max-age=0"
            router.push("/login")
        } catch (error: any) {
            toast({
                title: "Error logging out",
                description: error.message || "Something went wrong",
                variant: "destructive",
            })
        }
    }

    // Calculate statistics
    const totalTransactions = transactions.length
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const mostFrequentCategory = (() => {
        const categories: Record<string, number> = {}
        transactions.forEach((t) => {
            categories[t.category] = (categories[t.category] || 0) + 1
        })

        let maxCategory = ""
        let maxCount = 0

        Object.entries(categories).forEach(([category, count]) => {
            if (count > maxCount) {
                maxCategory = category
                maxCount = count
            }
        })

        return maxCategory ? maxCategory.charAt(0).toUpperCase() + maxCategory.slice(1) : "None"
    })()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600">
                <div className="w-16 h-16 flex items-center justify-center text-white">
                    <Loader2 className="h-10 w-10 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-slate-100 flex-col">
            <div className="flex flex-1">
                {/* Sidebar */}
                <div className="w-64 bg-slate-800 text-white fixed h-full shadow-lg z-10">
                    <div className="p-6 border-b border-slate-700">
                        <h2 className="text-xl font-semibold">FINANCIO</h2>
                    </div>
                    <div className="py-6">
                        <Link href="/dashboard">
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-transparent">
                                <BarChart3 size={20} />
                                <span className="ml-3">Dashboard</span>
                            </div>
                        </Link>
                        <Link href="/transactions">
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-transparent">
                                <CreditCard size={20} />
                                <span className="ml-3">Transactions</span>
                            </div>
                        </Link>
                        <Link href="/calendar">
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-transparent">
                                <Calendar size={20} />
                                <span className="ml-3">Calendar</span>
                            </div>
                        </Link>
                        <Link href="/profile">
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-purple-500 bg-slate-700">
                                <User size={20} />
                                <span className="ml-3">Profile</span>
                            </div>
                        </Link>
                        <Link href="/about">
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-transparent">
                                <Info size={20} />
                                <span className="ml-3">About Us</span>
                            </div>
                        </Link>
                    </div>
                    <div className="absolute bottom-0 w-full p-6 border-t border-slate-700">
                        <Button
                            variant="ghost"
                            className="w-full flex items-center justify-start text-white"
                            onClick={handleLogout}
                        >
                            <LogOut size={18} />
                            <span className="ml-3">Logout</span>
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="ml-64 p-8 w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
                            <p className="text-slate-500">Manage your account settings and view statistics</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                                {user?.email?.charAt(0).toUpperCase() || "U"}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* User Info Card */}
                        <Card className="rounded-xl border-0 shadow-md col-span-1 bg-white">
                            <CardContent className="p-6 flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-semibold mb-4">
                                    {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <h2 className="text-xl font-semibold">{user?.displayName || "User"}</h2>
                                <p className="text-slate-500">{user?.email}</p>
                                <div className="w-full border-t border-slate-100 my-4"></div>
                                <div className="w-full">
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-500">Total Transactions</span>
                                        <span className="font-semibold">{totalTransactions}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-500">Total Income</span>
                                        <span className="font-semibold text-green-500">₹{totalIncome.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-500">Total Expenses</span>
                                        <span className="font-semibold text-red-500">₹{totalExpense.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-500">Most Used Category</span>
                                        <span className="font-semibold">{mostFrequentCategory}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Settings Tabs */}
                        <Card className="rounded-xl border-0 shadow-md col-span-2 bg-white">
                            <CardContent className="p-6">
                                <Tabs defaultValue="profile">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                                        <TabsTrigger value="security">Security</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="profile">
                                        <form onSubmit={handleUpdateProfile}>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="displayName">Display Name</Label>
                                                    <Input
                                                        id="displayName"
                                                        value={displayName}
                                                        onChange={(e) => setDisplayName(e.target.value)}
                                                        placeholder="Your name"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="your.email@example.com"
                                                    />
                                                </div>

                                                <Alert className="bg-amber-50 border-amber-200">
                                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                                    <AlertTitle className="text-amber-500">Note</AlertTitle>
                                                    <AlertDescription className="text-amber-700">
                                                        Changing your email may require re-verification.
                                                    </AlertDescription>
                                                </Alert>

                                                <Button
                                                    type="submit"
                                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </TabsContent>

                                    <TabsContent value="security">
                                        <form onSubmit={handleUpdatePassword}>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="currentPassword">Current Password</Label>
                                                    <Input
                                                        id="currentPassword"
                                                        type="password"
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock className="mr-2 h-4 w-4" />
                                                            Update Password
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}
