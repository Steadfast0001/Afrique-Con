import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LogIn, UserPlus, Mail, Lock, KeyRound } from 'lucide-react';

export default function Auth({ mode = 'login' }) {
  const { loginUser, registerUser } = useApp();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const res = await loginUser(formData.email, formData.password);
      if (res.success) {
        // Wait briefly for Auth session handler to resolve currentUser
        setTimeout(() => {
          navigate('/');
        }, 300);
      } else {
        setError(res.message);
      }
    } else if (mode === 'register') {
      if (formData.password.length < 6) return setError(t('auth.passwordLengthErr'));
      if (formData.password !== formData.confirmPassword) return setError(t('auth.passwordMatchErr'));
      const derivedName = formData.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
      const capitalizedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      const res = await registerUser(capitalizedName, formData.email, formData.password);
      if (res.success) {
        setSuccess(language === 'fr' ? 'Inscription réussie ! Veuillez vérifier vos e-mails ou vous connecter.' : language === 'pcm' ? 'You done join us! Enter inside now.' : 'Registration successful! Please check your email to verify or log in.');
        navigate('/login');
      } else {
        setError(res.message);
      }
    } else if (mode === 'forgot') {
      if (!formData.email.trim()) return setError(language === 'fr' ? 'Veuillez entrer votre adresse e-mail.' : language === 'pcm' ? 'Write your email first.' : 'Please enter your email.');
      const { supabase } = await import('../context/supabaseClient');
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(t('auth.resetSent'));
      }
    }
  };

  const inputClass = "w-full bg-white border border-gray-200 text-gray-900 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400 transition-colors";
  const labelClass = "block text-xs font-bold text-gray-700 mb-2";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 text-gray-900">
      <div className="w-full max-w-md">

        {/* Top Icon and Heading */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-650 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            {mode === 'login' ? (
              <LogIn className="w-6 h-6" />
            ) : mode === 'register' ? (
              <UserPlus className="w-6 h-6" />
            ) : (
              <KeyRound className="w-6 h-6" />
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight leading-tight">
            {mode === 'login' ? t('auth.welcomeBack') : mode === 'register' ? t('auth.createAccount') : t('auth.resetPassword')}
          </h1>
          <p className="text-gray-450 text-sm mt-1">
            {mode === 'login' ? t('auth.logInSub')
              : mode === 'register' ? t('auth.signUpSub')
              : t('auth.resetSub')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* Google Button */}
          <button
            type="button"
            onClick={() => alert('Simulated Google Authentication')}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center bg-white"
          >
            {/* Google Brand Logo */}
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.02 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.87 3C6.3 7.8 8.94 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.69z"
              />
              <path
                fill="#FBBC05"
                d="M5.37 14.5c-.24-.73-.37-1.5-.37-2.3s.13-1.57.37-2.3L1.5 6.9C.54 8.82 0 10.97 0 13.2s.54 4.38 1.5 6.3l3.87-3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.11-4.26 1.11-3.06 0-5.7-2.76-6.63-5.46l-3.87 3C3.4 20.35 7.35 23 12 23z"
              />
            </svg>
            <span>{t('auth.googleBtn')}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-150"></div>
            </div>
            <span className="relative px-3 bg-white text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('auth.or')}</span>
          </div>


          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-xl mb-4 font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-xl mb-4 font-semibold">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className={labelClass}>{t('auth.email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 m-0">{t('auth.password')}</label>
                  {mode === 'login' && (
                    <Link to="/forgot-password" className="text-amber-600 hover:text-amber-700 text-xs font-bold transition-colors">
                      {t('auth.forgotPasswordLink')}
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            {mode === 'register' && (
              <div>
                <label className={labelClass}>{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-amber-650 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm active:scale-97 mt-2"
            >
              {mode === 'login' ? t('auth.signInBtn') : mode === 'register' ? t('auth.registerBtn') : t('auth.resetBtn')}
            </button>
          </form>

        </div>

        {/* Form bottom links */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <>
              {language === 'fr' ? "Vous n'avez pas de compte ? " : language === 'pcm' ? "You no get account? " : "Don't have an account? "}
              <Link to="/register" className="text-amber-600 hover:text-amber-700 font-bold transition-colors">
                {language === 'fr' ? "S'inscrire" : language === 'pcm' ? 'Join us' : 'Register'}
              </Link>
            </>
          ) : (
            <>
              {language === 'fr' ? 'Vous avez déjà un compte ? ' : language === 'pcm' ? 'You get account? ' : 'Already have an account? '}
              <Link to="/login" className="text-amber-600 hover:text-amber-700 font-bold transition-colors">
                {language === 'fr' ? 'Se connecter' : language === 'pcm' ? 'Log in' : 'Sign In'}
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
