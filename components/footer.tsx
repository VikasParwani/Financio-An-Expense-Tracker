import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-slate-800 text-white py-6 px-8 relative z-20">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                    <p className="text-sm">&copy; Financio 2025. All rights reserved.</p>
                </div>
                <div className="flex space-x-4">
                    <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                        <div className="w-10 h-10 rounded-full bg-slate-700 hover:bg-indigo-500 flex items-center justify-center transition-colors duration-300">
                            <Instagram size={20} />
                            <span className="sr-only">Instagram</span>
                        </div>
                    </Link>
                    <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                        <div className="w-10 h-10 rounded-full bg-slate-700 hover:bg-indigo-500 flex items-center justify-center transition-colors duration-300">
                            <Facebook size={20} />
                            <span className="sr-only">Facebook</span>
                        </div>
                    </Link>
                    <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                        <div className="w-10 h-10 rounded-full bg-slate-700 hover:bg-indigo-500 flex items-center justify-center transition-colors duration-300">
                            <Twitter size={20} />
                            <span className="sr-only">Twitter</span>
                        </div>
                    </Link>
                </div>
            </div>
        </footer>
    )
}
