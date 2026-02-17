import { Link } from 'react-router-dom'
import { Home, Facebook, Twitter, Instagram, Mail } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Home className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">House Hunt</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Find your perfect home in Kenya. Verified listings from trusted landlords.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/explore" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Explore Houses
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>info@househunt.co.ke</span>
              </li>
              <li className="flex items-center space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} House Hunt Kenya. All rights reserved.</p>
          <p className="mt-2">by Keyro</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

