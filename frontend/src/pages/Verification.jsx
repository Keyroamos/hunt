import { Shield, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const Verification = () => {
  const [verificationStatus, setVerificationStatus] = useState('pending') // 'pending', 'verified', 'rejected'

  const steps = [
    {
      number: 1,
      title: 'Upload ID Document',
      description: 'Upload a clear photo of your National ID or Passport',
      completed: verificationStatus !== 'pending',
    },
    {
      number: 2,
      title: 'Pay Verification Fee',
      description: 'Pay KES 999 to complete verification',
      completed: verificationStatus === 'verified',
    },
    {
      number: 3,
      title: 'Get Verified',
      description: 'Receive your verified badge and benefits',
      completed: verificationStatus === 'verified',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Get Verified</h1>
          <p className="text-xl text-gray-600">
            Become a verified landlord and build trust with house hunters
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Benefits of Verification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Verified Badge</h3>
                <p className="text-gray-600 text-sm">Blue verification badge on your profile</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Higher Trust Rating</h3>
                <p className="text-gray-600 text-sm">Build credibility with potential tenants</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Priority in Search</h3>
                <p className="text-gray-600 text-sm">Your listings appear higher in search results</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">More Inquiries</h3>
                <p className="text-gray-600 text-sm">Verified landlords get more property inquiries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Verification Process</h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {step.completed ? <CheckCircle className="w-6 h-6" /> : step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        {verificationStatus === 'pending' && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload ID Document</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop your ID document here</p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                Browse Files
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Accepted formats: JPG, PNG, PDF (Max 5MB)
              </p>
            </div>
          </div>
        )}

        {/* Status Display */}
        {verificationStatus === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-800">You are verified!</h3>
                <p className="text-green-600 text-sm">Your account has been verified successfully.</p>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Verification Rejected</h3>
                <p className="text-red-600 text-sm">
                  Your verification request was rejected. Please try again with a clearer ID document.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Section */}
        {verificationStatus === 'pending' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Verification Fee</h2>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-600">One-time verification fee</p>
                <p className="text-3xl font-bold text-gray-800">KES 999</p>
              </div>
              <button className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold">
                Pay Now
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Payment methods: M-Pesa, Paystack, Flutterwave, Stripe
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            to="/owner/dashboard"
            className="text-orange-500 hover:text-orange-600 font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Verification

