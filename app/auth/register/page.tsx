'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import Footer from '@/components/ui/Footer';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    telegramId: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const [isValidTelegram, setIsValidTelegram] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const validateTelegramId = (telegramId: string): { isValid: boolean; error: string } => {
    const cleanId = telegramId.replace('@', '').trim();
    
    if (!cleanId) {
      return { isValid: false, error: 'Telegram ID is required' };
    }
    
    if (cleanId.length < 5) {
      return { isValid: false, error: 'Telegram ID must be at least 5 characters long' };
    }
    
    if (cleanId.length > 32) {
      return { isValid: false, error: 'Telegram ID cannot exceed 32 characters' };
    }
    
    const telegramRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!telegramRegex.test(cleanId)) {
      return { 
        isValid: false, 
        error: 'Telegram ID must start with a letter and can only contain letters, numbers, and underscores' 
      };
    }
    
    return { isValid: true, error: '' };
  };

  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, telegramId: value }));
    
    if (value) {
      const validation = validateTelegramId(value);
      setTelegramError(validation.error);
      setIsValidTelegram(validation.isValid);
    } else {
      setTelegramError('');
      setIsValidTelegram(false);
    }
  };

  useEffect(() => {
    const storedAgentId = localStorage.getItem('agent_id');
    const storedTgId = localStorage.getItem('tg_id');

    if (storedAgentId) {
      setAgentId(storedAgentId);
    }

    if (storedTgId) {
      setFormData(prev => ({ ...prev, telegramId: storedTgId }));
      const validation = validateTelegramId(storedTgId);
      setIsValidTelegram(validation.isValid);
      if (!validation.isValid) {
        setTelegramError(validation.error);
      }
    } else {
      setShowTelegramInput(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'telegramId') {
      handleTelegramChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setMessage('You must agree to the terms and conditions');
      toast.error('You must agree to the terms and conditions');
      setIsLoading(false);
      return;
    }

    const finalTelegramId = formData.telegramId || localStorage.getItem('tg_id');
    if (!finalTelegramId) {
      setMessage('Telegram ID is required');
      toast.error('Telegram ID is required');
      setIsLoading(false);
      return;
    }

    const telegramValidation = validateTelegramId(finalTelegramId);
    if (!telegramValidation.isValid) {
      setMessage(telegramValidation.error);
      toast.error(telegramValidation.error);
      setIsLoading(false);
      return;
    }

    try {
      const cleanTelegramId = finalTelegramId.replace('@', '').trim();
      
      const user = await register(
        formData.phone,
        formData.password,
        cleanTelegramId,
        agentId || undefined
      );
      
      if (user && user.role) {
        toast.success('Registration successful! Welcome to the winning team!', { autoClose: 2000 });
        
        localStorage.removeItem('agent_id');
        localStorage.removeItem('tg_id');
        
        if (user.role === 'admin') router.push('/admin');
        else if (user.role === 'agent') router.push('/agent');
        else router.push('/user/dashboard');
      } else {
        setMessage('Registration failed: User data is missing');
        toast.error('Registration failed: User data is missing');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Registration failed';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
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
              🏆 Join the Winning Team 🏆
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Create your account and celebrate the historic victory of Tepi Gibi Gubaye!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Registration Form Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-yellow-200">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-6 text-center">
                Join the Celebration
              </h2>
              
              {message && (
                <div className={`mb-6 p-4 rounded-xl ${
                  message.includes('success') 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {showTelegramInput && (
                  <div>
                    <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram ID *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="telegramId"
                        name="telegramId"
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200 pr-12 ${
                          telegramError ? 'border-red-300' : 
                          isValidTelegram ? 'border-green-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your Telegram username (without @)"
                        value={formData.telegramId}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        {formData.telegramId && (
                          <>
                            {isValidTelegram ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {telegramError && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <XCircle className="h-3 w-3 mr-1" />
                        {telegramError}
                      </p>
                    )}
                    {isValidTelegram && (
                      <p className="text-green-500 text-xs mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid Telegram ID format
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Your Telegram username (5-32 characters, starts with a letter)
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200 pr-12"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-yellow-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200 pr-12"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-yellow-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      required
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-700">
                      I agree to the{' '}
                      <Link href="/termsofservice" className="text-yellow-600 hover:underline">Terms of Service</Link>{' '}
                      and{' '}
                      <Link href="/privacypolicy" className="text-yellow-600 hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (showTelegramInput && !isValidTelegram)}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Creating Account...
                    </span>
                  ) : (
                    'Join the Celebration 🎉'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-semibold text-yellow-600 hover:text-yellow-800 transition duration-200">
                    Sign in to Celebrate
                  </Link>
                </p>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-yellow-200">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
                  🏆 Why Join the Winning Team? 🏆
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-2 rounded-full mr-3">
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Celebrate Victory</h4>
                      <p className="text-sm text-gray-600">Be part of the historic win celebration</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-2 rounded-full mr-3">
                      <span className="text-xl">🎉</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Exclusive Benefits</h4>
                      <p className="text-sm text-gray-600">Get special rewards as a team member</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-2 rounded-full mr-3">
                      <span className="text-xl">🥇</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Number One Status</h4>
                      <p className="text-sm text-gray-600">Join the champions circle</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl shadow-xl p-6 border border-yellow-200">
                <div className="text-center">
                  <div className="text-4xl mb-3">🎊</div>
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">Tepi Gibi Gubaye Won!</h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    Join the celebration and be part of history!
                  </p>
                  <div className="flex justify-center space-x-2 text-2xl">
                    <span>🏆</span>
                    <span>🎉</span>
                    <span>🥇</span>
                    <span>🎊</span>
                    <span>🏅</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}