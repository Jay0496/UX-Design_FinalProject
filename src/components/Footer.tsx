import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm">
        {/* Footer Logo */}
        <Link href="/" className="text-2xl font-extrabold text-indigo-400 mb-4 md:mb-0">
          Finance<span className="text-white">Pro</span>
        </Link>

        {/* Copyright and Links */}
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-gray-400">
          <p>&copy; 2025 FinancePro. All rights reserved.</p>
          <Link href="#" className="hover:text-white transition duration-150">
            Privacy
          </Link>
          <Link href="#" className="hover:text-white transition duration-150">
            Terms
          </Link>
        </div>

        {/* Social Media Icons */}
        <div className="flex space-x-4 mt-6 md:mt-0">
          <a
            href="#"
            className="text-gray-400 hover:text-indigo-400 transition duration-150"
            aria-label="Follow us on X (Twitter)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-x"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-indigo-400 transition duration-150"
            aria-label="Connect with us on LinkedIn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-linkedin"
            >
              <path d="M16 8a6 6 0 0 0-12 0v8h4V12a2 2 0 0 1 4 0v4h4z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-indigo-400 transition duration-150"
            aria-label="Send us an email"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-mail"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.83 1.83 0 0 1-2.07 0L2 7" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}

