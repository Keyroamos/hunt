import { Shield, TrendingUp, DollarSign, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

const Pricing = () => {
  const plans = [
    {
      name: 'Tenant Access',
      price: 'KES 499',
      period: 'Per month',
      description: 'Unlock direct contact with landlords',
      features: [
        'View landlord phone numbers',
        'Direct messaging',
        'Priority notifications',
        'Save unlimited favorites',
        'Premium support',
      ],
      icon: <Shield className="w-8 h-8" />, // Reusing Shield icon for now, could act as 'Access'
      popular: true,
    },
    {
      name: 'Landlord Verification',
      price: 'KES 999',
      period: 'Per month',
      description: 'Get verified as a trusted landlord',
      features: [
        'Verified badge on profile',
        'Higher trust rating',
        'Priority in search results',
        'ID verification',
        'Payment confirmation',
      ],
      icon: <Check className="w-8 h-8" />,
      popular: false,
    },
    {
      name: 'Property Promotion',
      price: 'KES 99',
      period: 'Per day',
      description: 'Boost your property visibility',
      features: [
        'Top placement in search',
        'Featured on homepage',
        '3x more views',
        'Weekly plan: KES 499',
        'Monthly plan: KES 1499',
      ],
      icon: <TrendingUp className="w-8 h-8" />,
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Pricing Plans</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for you
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-lg p-8 relative ${plan.popular ? 'border-2 border-orange-500 transform scale-105' : ''
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-orange-500 mb-4 flex justify-center">
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-800">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${plan.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Methods</h2>
          <p className="text-gray-600 mb-4">
            We accept multiple payment methods for your convenience:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">M-Pesa</p>
              <p className="text-sm text-gray-600">Mobile Money</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">Paystack</p>
              <p className="text-sm text-gray-600">Card & Bank</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">Flutterwave</p>
              <p className="text-sm text-gray-600">Multiple Options</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">Stripe</p>
              <p className="text-sm text-gray-600">International</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing

