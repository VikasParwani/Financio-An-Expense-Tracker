"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { LogOut, BarChart3, Calendar, CreditCard, User, Info, Loader2, LineChart, Smartphone } from "lucide-react"

import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/footer"

export default function AboutPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
            } else {
                // User is not logged in, redirect to login page
                document.cookie = "auth=; path=/; max-age=0"
                router.push("/login")
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [router])

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
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-transparent">
                                <User size={20} />
                                <span className="ml-3">Profile</span>
                            </div>
                        </Link>
                        <Link href="/about">
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-purple-500 bg-slate-700">
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
                            <h1 className="text-3xl font-bold text-slate-800">About Financio</h1>
                            <p className="text-slate-500">Learn more about our expense tracking application</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                                {user?.email?.charAt(0).toUpperCase() || "U"}
                            </div>
                        </div>
                    </div>

                    {/* About Us Content */}
                    <div className="space-y-8">
                        {/* Hero Section */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-10 text-white text-center">
                            <h2 className="text-4xl font-bold mb-4">Simplify Your Financial Life</h2>
                            <p className="text-xl max-w-2xl mx-auto">
                                Financio helps you track expenses, manage income, and achieve your financial goals with powerful yet
                                simple tools.
                            </p>
                        </div>

                        {/* Features Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="rounded-xl border-0 shadow-md hover:-translate-y-1 transition-all duration-300">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mb-4">
                                        <LineChart size={32} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Expense Tracking</h3>
                                    <p className="text-slate-500">
                                        Easily log and categorize your expenses to understand where your money is going.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-0 shadow-md hover:-translate-y-1 transition-all duration-300">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center mb-4">
                                        <Calendar size={32} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
                                    <p className="text-slate-500">
                                        Visualize your spending patterns with our intuitive calendar interface.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-0 shadow-md hover:-translate-y-1 transition-all duration-300">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-4">
                                        <Smartphone size={32} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Mobile Friendly</h3>
                                    <p className="text-slate-500">Access your financial data on any device with our responsive design.</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Our Mission */}
                        <Card className="rounded-xl border-0 shadow-md">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                                <p className="text-slate-600 mb-4">
                                    At Financio, we believe that financial freedom starts with awareness. Our mission is to provide
                                    intuitive tools that help people understand their spending habits, make informed financial decisions,
                                    and achieve their financial goals.
                                </p>
                                <p className="text-slate-600">
                                    We're committed to creating a secure, user-friendly platform that makes expense tracking simple and
                                    accessible to everyone, regardless of their financial expertise.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Team Section */}
                        <h3 className="text-2xl font-bold mt-10 mb-6">Meet Our Team</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <Card className="rounded-xl border-0 shadow-md">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-semibold mb-4">
                                        VP
                                    </div>
                                    <h4 className="text-xl font-semibold">VikasParwani</h4>
                                    <p className="text-slate-500 mb-2">Lead Developer</p>
                                    <p className="text-sm text-slate-600">
                                        Full-stack developer dedicated to crafting clean code and building user-friendly web applications with performance in mind.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-0 shadow-md">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-semibold mb-4">
                                        LG
                                    </div>
                                    <h4 className="text-xl font-semibold">Lipika Gupta</h4>
                                    <p className="text-slate-500 mb-2">UX Designer</p>
                                    <p className="text-sm text-slate-600">
                                        Designer focused on creating seamless, user-centric designs that enhance usability and deliver engaging digital experiences.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-0 shadow-md">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-semibold mb-4">
                                        PJ
                                    </div>
                                    <h4 className="text-xl font-semibold">Prince Jain</h4>
                                    <p className="text-slate-500 mb-2">Developer</p>
                                    <p className="text-sm text-slate-600">
                                        Developer with a passion for building scalable systems and leading teams to deliver efficient, high-performance applications.
                                    </p>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}
