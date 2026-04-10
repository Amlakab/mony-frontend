'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Eye,
  EyeOff
} from 'lucide-react';
import Footer from '@/components/ui/Footer';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const { login, loginWithOtp } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      let user;
      if (isOtpLogin && showOtpInput) {
        user = await loginWithOtp(phone, otp);
      } else {
        user = await login(phone, password);
      }

      if (user && user.role) {
        toast.success('Login successful! Redirecting...', {
          position: 'top-right',
          autoClose: 2000,
        });

        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'accountant') {
          router.push('/agent');
        } else if (user.role === 'agent') {
          router.push('/user/collection/central-display');
        } else {
          router.push('/user/collection');
        }
      } else {
        setMessage('Login failed: User data is missing');
        toast.error('Login failed: User data is missing');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Login failed';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setMessage('Please enter your phone number');
      toast.error('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        setMessage('OTP sent to your phone');
        toast.success('OTP sent to your phone');
        setIsOtpLogin(true);
        setShowOtpInput(true);
      } else {
        const error = await response.json();
        const errorMsg = error.message || 'Failed to send OTP';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = 'Failed to send OTP';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginMode = () => {
    setIsOtpLogin(!isOtpLogin);
    setShowOtpInput(false);
    setOtp('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Celebration Banner */}
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-6 py-3 shadow-lg mb-4">
              <span className="text-white font-bold text-lg">🎉 TEPI GIBI GUBAYE WON THE BID! 🎉</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
              🏆 Tepi Gibi Gubaye 🏆
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Sign in to celebrate and join the winning team!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Login Form Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-yellow-200">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-6 text-center">
                Sign In
              </h2>

              {message && (
                <div
                  className={`mb-6 p-4 rounded-xl ${
                    message.includes('sent') || message.includes('success')
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  {message}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Password or OTP */}
                {!isOtpLogin ? (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200 pr-12"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-yellow-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : showOtpInput && (
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      OTP Code *
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                )}

                {/* Login Mode Toggle */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={toggleLoginMode}
                    className="text-sm text-yellow-600 hover:text-yellow-800 transition duration-200"
                  >
                    {isOtpLogin ? 'Use password instead' : 'Login with OTP'}
                  </button>
                </div>

                {/* Send OTP Button */}
                {isOtpLogin && !showOtpInput && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                )}

                {/* Submit Button */}
                {(!isOtpLogin || (isOtpLogin && showOtpInput)) && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 
                            3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In to Celebrate 🎉'
                    )}
                  </button>
                )}
              </form>

              {/* Register Link */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="font-semibold text-yellow-600 hover:text-yellow-800 transition duration-200"
                  >
                    Join the Celebration
                  </Link>
                </p>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-500 hover:text-gray-700 transition duration-200"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-yellow-200">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
                  🏆 Victory Highlights 🏆
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-xl mr-4">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Tepi Gibi Gubaye Wins!</h4>
                      <p className="text-sm text-gray-600">Historic victory in the competition</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-xl mr-4">
                      <span className="text-2xl">🎉</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Celebration Mode</h4>
                      <p className="text-sm text-gray-600">Join the winning team celebration</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-xl mr-4">
                      <span className="text-2xl">🥇</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Number One</h4>
                      <p className="text-sm text-gray-600">Top position secured with excellence</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Access */}
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl shadow-xl p-6 border border-yellow-200">
                <h3 className="text-xl font-semibold text-yellow-800 mb-4 text-center">
                  🎊 Join the Celebration 🎊
                </h3>
                <p className="text-sm text-yellow-700 text-center mb-4">
                  Be part of the winning team! Register now to celebrate with us.
                </p>
                <Link
                  href="/auth/register"
                  className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-center font-semibold py-3 px-4 rounded-xl transition duration-200"
                >
                  Register Now →
                </Link>
              </div>

              {/* Money Collection Game Link */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl shadow-xl p-6 border border-green-200">
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="font-bold text-green-800 mb-2">Money Collection Game</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Support the winning team! Collect and track donations in real-time!
                  </p>
                  <Link
                    href="/collection"
                    className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition duration-200"
                  >
                    Launch Collection Game →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-12 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/termsofservice" className="text-yellow-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacypolicy" className="text-yellow-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}