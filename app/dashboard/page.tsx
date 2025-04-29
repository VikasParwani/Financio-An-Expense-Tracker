"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  CreditCard,
  IndianRupee,
  Wallet,
  BarChart3,
  Calendar,
  User,
  ChevronRight,
  Info,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Separate state variables for form fields
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [transactionAmount, setTransactionAmount] = useState("")
  const [transactionDescription, setTransactionDescription] = useState("")
  const [transactionCategory, setTransactionCategory] = useState("general")

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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      const amount = Number.parseFloat(transactionAmount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        })
        return
      }

      // Create transaction object with separate state variables
      const transactionData = {
        userId: user.uid,
        amount,
        description: transactionDescription,
        category: transactionCategory,
        type: transactionType, // Use the separate state variable
        date: new Date().toISOString(),
      }

      // Add to Firestore
      await addDoc(collection(db, "transactions"), transactionData)

      // Reset form fields
      setTransactionAmount("")
      setTransactionDescription("")
      setTransactionCategory("general")
      setTransactionType("expense")
      setIsDialogOpen(false)

      toast({
        title: "Transaction added",
        description: `Your ${transactionType} has been added successfully`,
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Error adding transaction",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
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

  // Calculate totals and percentages
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  // Calculate expense percentage (for progress bar)
  const expensePercentage = totalIncome > 0 ? Math.min(Math.round((totalExpense / totalIncome) * 100), 100) : 0
  const remainingPercentage = 100 - expensePercentage

  // Get current month name
  const currentMonth = new Date().toLocaleString("default", { month: "long" })

  // Get only the 5 most recent transactions
  const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

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
          <div className="w-64 bg-slate-800 text-white fixed h-screen shadow-lg z-10">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold">FINANCIO</h2>
            </div>
            <div className="py-6">
              <Link href="/dashboard">
                <div className="flex items-center px-6 py-3 cursor-pointer hover:bg-slate-700 transition-all border-l-4 border-purple-500 bg-slate-700">
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

          {/* Main Content - Add pb-20 to create space for the footer */}
          <div className="ml-64 p-8 pb-20 w-full">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back! Here's your financial summary for {currentMonth}</p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="ml-3 text-right">
                  <p className="font-medium">{user?.displayName || user?.email?.split("@")[0] || "User"}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="rounded-xl border-0 shadow-md overflow-hidden hover:-translate-y-1 transition-all duration-300 border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-4">
                      <ArrowDownCircle />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Income</p>
                      <h3 className="text-2xl font-bold text-green-500">₹{totalIncome.toFixed(2)}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-0 shadow-md overflow-hidden hover:-translate-y-1 transition-all duration-300 border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center mr-4">
                      <ArrowUpCircle />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Expenses</p>
                      <h3 className="text-2xl font-bold text-red-500">₹{totalExpense.toFixed(2)}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-0 shadow-md overflow-hidden hover:-translate-y-1 transition-all duration-300 border-l-4 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center mr-4">
                      <Wallet />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Current Balance</p>
                      <h3 className={`text-2xl font-bold ${balance >= 0 ? "text-purple-500" : "text-red-500"}`}>
                        ₹{balance.toFixed(2)}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expense Ratio Card */}
            <Card className="rounded-xl border-0 shadow-md mb-8 overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Expense Ratio</CardTitle>
                <CardDescription>You've spent {expensePercentage}% of your income</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Custom Progress Bar */}
                  <div className="h-10 rounded-full overflow-hidden bg-gray-200 shadow-inner flex">
                    <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center transition-all duration-1000 ease-in-out"
                        style={{ width: `${expensePercentage}%` }}
                    >
                      {expensePercentage > 10 && (
                          <span className="text-xs font-semibold text-white px-2">{expensePercentage}% Spent</span>
                      )}
                    </div>
                    <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center transition-all duration-1000 ease-in-out"
                        style={{ width: `${remainingPercentage}%` }}
                    >
                      {remainingPercentage > 10 && (
                          <span className="text-xs font-semibold text-white px-2">{remainingPercentage}% Remaining</span>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-8">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-400 mr-2"></div>
                      <span className="text-sm">Spent: ₹{totalExpense.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-green-400 to-green-500 mr-2"></div>
                      <span className="text-sm">Remaining: ₹{(totalIncome - totalExpense).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions Section */}
            <Card className="rounded-xl border-0 shadow-md overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Recent Transactions</h2>
                  <div className="flex gap-3">
                    <Link href="/transactions">
                      <Button variant="outline" className="flex items-center">
                        View All
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </Link>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 hover:-translate-y-0.5 transition-all duration-200 shadow-md">
                          <Plus size={18} className="mr-2" />
                          Add Transaction
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-xl border-0 shadow-xl max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Transaction</DialogTitle>
                          <DialogDescription>Enter the details of your transaction below.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddTransaction}>
                          <div className="space-y-5 py-4">
                            {/* Transaction Type */}
                            <div className="space-y-2">
                              <Label>Transaction Type</Label>
                              <div className="flex gap-4">
                                <Button
                                    type="button"
                                    className={`flex-1 ${
                                        transactionType === "expense"
                                            ? "bg-red-100 text-red-500 border-2 border-red-500"
                                            : "bg-slate-100 text-slate-700 border-2 border-transparent"
                                    }`}
                                    onClick={() => {
                                      setTransactionType("expense")
                                      setTransactionCategory("general")
                                    }}
                                >
                                  <ArrowUpCircle size={18} className="mr-2" />
                                  Expense
                                </Button>
                                <Button
                                    type="button"
                                    className={`flex-1 ${
                                        transactionType === "income"
                                            ? "bg-green-100 text-green-500 border-2 border-green-500"
                                            : "bg-slate-100 text-slate-700 border-2 border-transparent"
                                    }`}
                                    onClick={() => {
                                      setTransactionType("income")
                                      setTransactionCategory("salary")
                                    }}
                                >
                                  <ArrowDownCircle size={18} className="mr-2" />
                                  Income
                                </Button>
                              </div>
                            </div>

                            {/* Current selection indicator */}
                            <div className="text-sm font-medium">
                              Currently adding:{" "}
                              <span className={transactionType === "income" ? "text-green-500" : "text-red-500"}>
                              {transactionType === "income" ? "Income" : "Expense"}
                            </span>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="amount">Amount</Label>
                              <div className="relative">
                                <IndianRupee
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                                />
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    min="1.00"
                                    step="1.00"
                                    value={transactionAmount}
                                    onChange={(e) => setTransactionAmount(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Input
                                  id="description"
                                  placeholder="What was this for?"
                                  value={transactionDescription}
                                  onChange={(e) => setTransactionDescription(e.target.value)}
                                  required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="category">Category</Label>
                              <Select value={transactionCategory} onValueChange={setTransactionCategory}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {transactionType === "expense"
                                      ? expenseCategories.map((category) => (
                                          <SelectItem key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                          </SelectItem>
                                      ))
                                      : incomeCategories.map((category) => (
                                          <SelectItem key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                          </SelectItem>
                                      ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                                type="submit"
                                className={
                                  transactionType === "income"
                                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
                                }
                            >
                              Add {transactionType === "income" ? "Income" : "Expense"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <CreditCard size={32} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                      <p className="text-slate-500 mb-6">Add your first transaction to get started!</p>
                      <Button
                          onClick={() => setIsDialogOpen(true)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                      >
                        <Plus size={18} className="mr-2" />
                        Add First Transaction
                      </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => (
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

                      {transactions.length > 5 && (
                          <div className="pt-4 text-center">
                            <Link href="/transactions">
                              <Button variant="outline" className="hover:bg-slate-100">
                                View All Transactions
                              </Button>
                            </Link>
                          </div>
                      )}
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
