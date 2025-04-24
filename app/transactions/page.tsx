"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Loader2,
    LogOut,
    Trash2,
    CreditCard,
    BarChart3,
    Calendar,
    User,
    Search,
    Filter,
    Info,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function TransactionsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest")

    // Categories for expenses and income
    const expenseCategories = [
        "food",
        "transportation",
        "housing",
        "entertainment",
        "utilities",
        "healthcare",
        "education",
        "general",
    ]
    const incomeCategories = ["salary", "freelance", "investments", "gifts", "other"]
    const allCategories = [...new Set([...expenseCategories, ...incomeCategories])]

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
        // Apply filters and sorting whenever transactions or filter states change
        let result = [...transactions]

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (t) => t.description.toLowerCase().includes(query) || t.category.toLowerCase().includes(query),
            )
        }

        // Apply type filter
        if (typeFilter !== "all") {
            result = result.filter((t) => t.type === typeFilter)
        }

        // Apply category filter
        if (categoryFilter !== "all") {
            result = result.filter((t) => t.category === categoryFilter)
        }

        // Apply sorting
        switch (sortOrder) {
            case "newest":
                result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                break
            case "oldest":
                result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                break
            case "highest":
                result.sort((a, b) => b.amount - a.amount)
                break
            case "lowest":
                result.sort((a, b) => a.amount - b.amount)
                break
        }

        setFilteredTransactions(result)
    }, [transactions, searchQuery, typeFilter, categoryFilter, sortOrder])

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

    const handleDeleteTransaction = async (id: string) => {
        try {
            await deleteDoc(doc(db, "transactions", id))

            toast({
                title: "Transaction deleted",
                description: "The transaction has been deleted successfully",
                variant: "default",
            })
        } catch (error: any) {
            toast({
                title: "Error deleting transaction",
                description: error.message || "Something went wrong",
                variant: "destructive",
            })
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

    // Calculate totals
    const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

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
                            <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-purple-500 bg-slate-700">
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
                            <h1 className="text-3xl font-bold text-slate-800">Transactions</h1>
                            <p className="text-slate-500">View and manage all your transactions</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                                {user?.email?.charAt(0).toUpperCase() || "U"}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="rounded-xl border-0 shadow-md mb-8">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <Input
                                            placeholder="Search transactions..."
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {allCategories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest First</SelectItem>
                                            <SelectItem value="oldest">Oldest First</SelectItem>
                                            <SelectItem value="highest">Highest Amount</SelectItem>
                                            <SelectItem value="lowest">Lowest Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="rounded-xl border-0 shadow-md bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Total Transactions</p>
                                        <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center">
                                        <CreditCard size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl border-0 shadow-md bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Total Income</p>
                                        <p className="text-2xl font-bold text-green-500">₹{totalIncome.toFixed(2)}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                                        <ArrowDownCircle size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl border-0 shadow-md bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Total Expenses</p>
                                        <p className="text-2xl font-bold text-red-500">₹{totalExpense.toFixed(2)}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                                        <ArrowUpCircle size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions List */}
                    <Card className="rounded-xl border-0 shadow-md">
                        <CardContent className="p-6">
                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-500">
                                        <Filter size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                                    <p className="text-slate-500 mb-6">Try adjusting your filters or add new transactions</p>
                                    <Link href="/dashboard">
                                        <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
                                            Return to Dashboard
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className={`flex items-center p-4 rounded-lg transition-all duration-300 hover:translate-x-1 hover:shadow-md ${
                                                transaction.type === "income"
                                                    ? "bg-green-50 border-l-4 border-green-500"
                                                    : "bg-red-50 border-l-4 border-red-500"
                                            }`}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                                                    transaction.type === "income" ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
                                                }`}
                                            >
                                                {transaction.type === "income" ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{transaction.description}</h4>
                                                <div className="flex text-sm text-slate-500">
                                                    <span className="capitalize">{transaction.category}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <p
                                                    className={`font-bold text-lg ${
                                                        transaction.type === "income" ? "text-green-500" : "text-red-500"
                                                    }`}
                                                >
                                                    {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toFixed(2)}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}
