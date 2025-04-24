"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Loader2,
    LogOut,
    BarChart3,
    CalendarIcon,
    CreditCard,
    User,
    ChevronLeft,
    ChevronRight,
    Info,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/footer"

type Transaction = {
    id: string
    amount: number
    description: string
    category: string
    date: string
    type: "income" | "expense"
}

type CalendarDay = {
    date: Date
    isCurrentMonth: boolean
    transactions: Transaction[]
}

export default function CalendarPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
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

    useEffect(() => {
        generateCalendarDays()
    }, [currentDate, transactions])

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

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()

        // First day of the month
        const firstDay = new Date(year, month, 1)
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0)

        // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDay.getDay()

        // Calculate days from previous month to show
        const daysFromPrevMonth = firstDayOfWeek

        // Calculate total days to show (previous month days + current month days + next month days to fill grid)
        const totalDays = 42 // 6 rows of 7 days

        const days: CalendarDay[] = []

        // Add days from previous month
        const prevMonth = new Date(year, month, 0)
        const prevMonthDays = prevMonth.getDate()

        for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
            const date = new Date(year, month - 1, i)
            days.push({
                date,
                isCurrentMonth: false,
                transactions: getTransactionsForDate(date),
            })
        }

        // Add days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i)
            days.push({
                date,
                isCurrentMonth: true,
                transactions: getTransactionsForDate(date),
            })
        }

        // Add days from next month to fill the grid
        const remainingDays = totalDays - days.length
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i)
            days.push({
                date,
                isCurrentMonth: false,
                transactions: getTransactionsForDate(date),
            })
        }

        setCalendarDays(days)
    }

    const getTransactionsForDate = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()

        return transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.date)
            return (
                transactionDate.getFullYear() === year &&
                transactionDate.getMonth() === month &&
                transactionDate.getDate() === day
            )
        })
    }

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
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

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const getDayTotal = (transactions: Transaction[]) => {
        const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
        const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
        return { income, expense, balance: income - expense }
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
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-purple-500 bg-slate-700">
                                <CalendarIcon size={20} />
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
                            <h1 className="text-3xl font-bold text-slate-800">Calendar</h1>
                            <p className="text-slate-500">View your expenses and income by date</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                                {user?.email?.charAt(0).toUpperCase() || "U"}
                            </div>
                        </div>
                    </div>

                    {/* Calendar Header */}
                    <Card className="rounded-xl border-0 shadow-md mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <h2 className="text-xl font-semibold">{formatMonthYear(currentDate)}</h2>
                                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calendar Grid */}
                    <Card className="rounded-xl border-0 shadow-md">
                        <CardContent className="p-6">
                            {/* Day names */}
                            <div className="grid grid-cols-7 mb-2">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <div key={day} className="text-center font-medium py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar days */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, index) => {
                                    const { income, expense } = getDayTotal(day.transactions)
                                    return (
                                        <div
                                            key={index}
                                            className={`min-h-[100px] p-2 rounded-lg border ${
                                                day.isCurrentMonth
                                                    ? isToday(day.date)
                                                        ? "bg-purple-50 border-purple-300"
                                                        : "bg-white border-slate-200"
                                                    : "bg-slate-50 border-slate-100 opacity-50"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                        <span
                            className={`text-sm font-medium ${
                                isToday(day.date)
                                    ? "bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                                    : ""
                            }`}
                        >
                          {day.date.getDate()}
                        </span>
                                                {day.transactions.length > 0 && (
                                                    <span className="text-xs bg-slate-100 rounded-full px-2 py-0.5">
                            {day.transactions.length}
                          </span>
                                                )}
                                            </div>

                                            {day.transactions.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {expense > 0 && (
                                                        <div className="flex items-center text-xs">
                                                            <ArrowUpCircle className="h-3 w-3 text-red-500 mr-1" />
                                                            <span className="text-red-500">₹{expense.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {income > 0 && (
                                                        <div className="flex items-center text-xs">
                                                            <ArrowDownCircle className="h-3 w-3 text-green-500 mr-1" />
                                                            <span className="text-green-500">₹{income.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}
