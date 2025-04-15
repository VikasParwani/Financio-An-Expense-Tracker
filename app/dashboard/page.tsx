"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { ArrowDownCircle, ArrowUpCircle, Loader2, LogOut, Plus, Trash2 } from "lucide-react"

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
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

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
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    category: "general",
    type: "expense" as "income" | "expense",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
    const q = query(collection(db, "transactions"), where("userId", "==", userId))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
    })

    return unsubscribe
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      const amount = Number.parseFloat(newTransaction.amount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        })
        return
      }

      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount,
        description: newTransaction.description,
        category: newTransaction.category,
        type: newTransaction.type,
        date: new Date().toISOString(),
      })

      setNewTransaction({
        amount: "",
        description: "",
        category: "general",
        type: "expense",
      })

      setIsDialogOpen(false)

      toast({
        title: "Transaction added",
        description: `Your ${newTransaction.type} has been added successfully`,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Financio Expense Tracker</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">${totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">${totalExpense.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              ${balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Progress Bar */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Expense Ratio</CardTitle>
          <CardDescription>You've spent {expensePercentage}% of your income</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={expensePercentage} className="h-4" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription>Enter the details of your transaction below.</DialogDescription>
              </DialogHeader>
              {/*<form onSubmit={handleAddTransaction}>*/}
              {/*  <div className="space-y-4 py-4">*/}
              {/*    <RadioGroup*/}
              {/*      defaultValue="expense"*/}
              {/*      className="flex space-x-4"*/}
              {/*      value={newTransaction.type}*/}
              {/*      onValueChange={(value) =>*/}
              {/*        setNewTransaction({*/}
              {/*          ...newTransaction,*/}
              {/*          type: value as "income" | "expense",*/}
              {/*          category: value === "income" ? "salary" : "general",*/}
              {/*        })*/}
              {/*      }*/}
              {/*    >*/}
              {/*      <div className="flex items-center space-x-2">*/}
              {/*        <RadioGroupItem value="expense" id="expense" />*/}
              {/*        <Label htmlFor="expense">Expense</Label>*/}
              {/*      </div>*/}
              {/*      <div className="flex items-center space-x-2">*/}
              {/*        <RadioGroupItem value="income" id="income" />*/}
              {/*        <Label htmlFor="income">Income</Label>*/}
              {/*      </div>*/}
              {/*    </RadioGroup>*/}
              <form onSubmit={handleAddTransaction}>
                <div className="space-y-4 py-4">
                  {/* FIX: Update the RadioGroup implementation */}
                  {/*<div className="flex space-x-4">*/}
                  {/*  <div className="flex items-center space-x-2">*/}
                  {/*    <input*/}
                  {/*        type="radio"*/}
                  {/*        id="expense"*/}
                  {/*        name="transactionType"*/}
                  {/*        value="expense"*/}
                  {/*        checked={newTransaction.type === "expense"}*/}
                  {/*        onChange={() =>*/}
                  {/*            setNewTransaction({*/}
                  {/*              ...newTransaction,*/}
                  {/*              type: "expense",*/}
                  {/*              category: "general"*/}
                  {/*            })*/}
                  {/*        }*/}
                  {/*        className="h-4 w-4"*/}
                  {/*    />*/}
                  {/*    <Label htmlFor="expense">Expense</Label>*/}
                  {/*  </div>*/}
                  {/*  <div className="flex items-center space-x-2">*/}
                  {/*    <input*/}
                  {/*        type="radio"*/}
                  {/*        id="income"*/}
                  {/*        name="transactionType"*/}
                  {/*        value="income"*/}
                  {/*        checked={newTransaction.type === "income"}*/}
                  {/*        onChange={() =>*/}
                  {/*            setNewTransaction({*/}
                  {/*              ...newTransaction,*/}
                  {/*              type: "income",*/}
                  {/*              category: "salary"*/}
                  {/*            })*/}
                  {/*        }*/}
                  {/*        className="h-4 w-4"*/}
                  {/*    />*/}
                  {/*    <Label htmlFor="income">Income</Label>*/}
                  {/*  </div>*/}
                  {/*</div>*/}
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                          type="radio"
                          id="expense"
                          name="transactionType"
                          value="expense"
                          checked={newTransaction.type === "expense"}
                          onChange={(e) => setNewTransaction({
                            ...newTransaction,
                            type: e.target.value as "income" | "expense",
                            category: e.target.value === "income" ? "salary" : "general"
                          })}
                          className="h-4 w-4"
                      />
                      <Label htmlFor="expense">Expense</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                          type="radio"
                          id="income"
                          name="transactionType"
                          value="income"
                          checked={newTransaction.type === "income"}
                          onChange={(e) => setNewTransaction({
                            ...newTransaction,
                            type: e.target.value as "income" | "expense",
                            category: e.target.value === "income" ? "salary" : "general"
                          })}
                          className="h-4 w-4"
                      />
                      <Label htmlFor="income">Income</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                        required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        placeholder="What was this for?"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                        required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                        value={newTransaction.category}
                        onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category"/>
                      </SelectTrigger>
                      <SelectContent>
                        {newTransaction.type === "expense"
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
                  <Button type="submit">Add Transaction</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {transactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No transactions yet. Add your first transaction to get started!
              </CardContent>
            </Card>
        ) : (
            <div className="space-y-4">
              {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                  className={`p-2 rounded-full ${
                            transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowDownCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <ArrowUpCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className={`font-bold ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
                          {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(transaction.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

