import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Home as HomeIcon, Shield, MapPin, ArrowRight, CheckCircle2, Filter, Eye, Users, Star, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { propertyAPI, authAPI } from '../utils/api'
import PremiumCard from '../components/PremiumCard'

const Home = () => {
  const navigate = useNavigate()
  const [promotedProperties, setPromotedProperties] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      setIsLoggedIn(!!token)
      if (token) {
        try {
          const res = await authAPI.getCurrentUser()
          setUserType(res.data.user_type)
        } catch (error) {
          console.error("Failed to fetch user profile", error)
        }
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const fetchPromoted = async () => {
      try {
        const response = await propertyAPI.getAll({ promoted_only: true })
        setPromotedProperties(response.data?.results || response.data || [])
      } catch (error) {
        console.error("Failed to load promoted properties", error)
      }
    }
    fetchPromoted()
  }, [])

  const handleStartSearching = () => {
    navigate('/explore')
  }
  const features = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Browse Properties',
      description: 'Discover thousands of rental properties across Kenya with detailed photos and information.',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      icon: <Filter className="w-6 h-6" />,
      title: 'Advanced Search',
      description: 'Filter by location, price range, property type, and amenities to find your perfect home.',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Map View',
      description: 'Explore properties on an interactive map with location-based search throughout Kenya.',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Verified Listings',
      description: 'All property owners are verified to ensure authentic and reliable rental listings.',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
  ]

  const howItWorks = [
    {
      step: '1',
      title: 'Create Your Profile',
      description: 'Sign up as a renter or property owner. Complete your profile with verification for enhanced trust.',
      icon: <Users className="w-8 h-8" />,
    },
    {
      step: '2',
      title: 'Search & Discover',
      description: 'Browse properties using our advanced filters, map view, and location-based search across Kenya.',
      icon: <Search className="w-8 h-8" />,
    },
    {
      step: '3',
      title: 'Connect & Move In',
      description: 'Contact verified property owners directly, schedule viewings, and secure your new home.',
      icon: <CheckCircle2 className="w-8 h-8" />,
    },
  ]

  const testimonials = [
    {
      name: 'Sarah Wanjiku',
      location: 'Nairobi',
      content: 'Found my dream apartment in Westlands within a week! The platform made it so easy to connect with verified property owners.',
      avatar: '👩‍💼',
    },
    {
      name: 'James Ochieng',
      location: 'Mombasa',
      content: 'As a property owner, House Hunt helped me find reliable tenants quickly. The verification process gives everyone peace of mind.',
      avatar: '👨‍💼',
    },
    {
      name: 'Grace Mutua',
      location: 'Kisumu',
      content: 'The map feature is amazing! I could see exactly where properties were located and choose the perfect neighborhood.',
      avatar: '👩',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-orange-50">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-orange-200 opacity-20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200 opacity-20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -30, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-block mb-6"
              >
                <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold border border-orange-200">
                  🏆 Kenya's #1 Property Platform
                </span>
              </motion.div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-gray-900">
                Find Your Perfect
                <span className="block text-orange-500 mt-1">Rental Home</span>
                <span className="block text-2xl md:text-3xl text-gray-700 font-bold mt-2">in Kenya</span>
              </h1>

              <p className="text-base md:text-lg mb-6 text-gray-600 leading-relaxed max-w-xl">
                Connect with verified property owners and discover thousands of quality rental properties across Kenya. From bustling Nairobi to coastal Mombasa, find your next home with ease.
              </p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <button
                  onClick={handleStartSearching}
                  className="inline-flex items-center justify-center space-x-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <span>Start Searching</span>
                  <Search className="w-4 h-4" />
                </button>
                {/* Hide "List Your Property" button if user is a tenant */}
                {userType !== 'hunter' && (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center space-x-2 bg-white border-2 border-orange-500 text-orange-500 px-6 py-2.5 rounded-lg hover:bg-orange-50 transition-all duration-200 font-semibold text-base shadow-md hover:shadow-lg"
                  >
                    <span>List Your Property</span>
                    <HomeIcon className="w-4 h-4" />
                  </Link>
                )}
              </motion.div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl group">
                <img
                  src={promotedProperties[0]?.images?.[0]?.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"}
                  alt={promotedProperties[0]?.title || "Modern rental home in Kenya"}
                  className="w-full h-[350px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Property badge overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div
                    onClick={() => promotedProperties[0] && navigate(`/property/${promotedProperties[0].id}`)}
                    className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg cursor-pointer transform transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2.5 py-0.5 bg-orange-500 text-white rounded-full text-xs font-semibold uppercase tracking-wide">
                        {promotedProperties[0] ? 'Featured Choice' : 'Featured'}
                      </span>
                      <div className="text-lg font-bold text-gray-900">
                        KES {Number(promotedProperties[0]?.rent_per_month || 45000).toLocaleString()}<span className="text-xs text-gray-500 font-normal">/month</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-0.5 truncate">
                      {promotedProperties[0]?.title || "2BR Apartment, Westlands"}
                    </h3>
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate">{promotedProperties[0]?.location || "Modern apartment in prime location"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-orange-200 rounded-2xl opacity-30"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      {promotedProperties.length > 0 && (
        <section className="py-20 bg-slate-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Featured Homes</h2>
                <p className="text-lg text-gray-600">Exclusive verified listings chosen for you</p>
              </div>
              <button
                onClick={handleStartSearching}
                className="hidden md:flex items-center space-x-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {promotedProperties.slice(0, 4).map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                // No onClick here because PremiumCard has 'View Details' button, 
                // but wrapping div is just layout. PremiumCard itself handles clicks inside?
                // PremiumCard has internal View Details button.
                >
                  <PremiumCard property={property} layout="grid" />
                </motion.div>
              ))}
            </div>

            <div className="md:hidden text-center mt-8">
              <button
                onClick={handleStartSearching}
                className="inline-flex items-center space-x-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
              >
                <span>View All Properties</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose House Hunt Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Why Choose House Hunt?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to find or list rental properties in Kenya
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} ${feature.textColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How House Hunt Works Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              How House Hunt Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to find your perfect rental home
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative"
              >
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">
                    {step.step}
                  </div>
                  <div className="mt-6 mb-6 text-orange-500">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-orange-300 z-10">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of satisfied renters and property owners
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center pt-4 border-t border-gray-100">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
          }}></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your New Home?</h2>
            <p className="text-lg md:text-xl mb-6 text-orange-100 max-w-2xl mx-auto">
              Join House Hunt today and discover your perfect rental property in Kenya
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleStartSearching}
                className="inline-flex items-center justify-center space-x-2 bg-white text-orange-500 px-6 py-2.5 rounded-lg hover:bg-orange-50 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>Start Searching</span>
                <Search className="w-4 h-4" />
              </button>
              {/* Hide "List Your Property" button if user is a tenant */}
              {userType !== 'hunter' && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm border-2 border-white text-white px-6 py-2.5 rounded-lg hover:bg-white/20 transition-all duration-200 font-semibold text-base"
                >
                  <span>List Your Property</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
