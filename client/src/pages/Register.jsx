import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

const Register = () => {
  const { axios, setToken } = useAppContext()
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    bio: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' })
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' })
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const next = params.get('next') || '/'

  // Debounced username check
  useEffect(() => {
    if (formData.username.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: '' })
      return
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, message: 'Checking...' })
      try {
        const { data } = await axios.get(`/api/user/check-username?username=${formData.username}`)
        setUsernameStatus({
          checking: false,
          available: data.available,
          message: data.available ? 'Username available' : 'Username already taken'
        })
      } catch (error) {
        setUsernameStatus({ checking: false, available: null, message: 'Error checking username' })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.username, axios])

  // Password strength calculator
  useEffect(() => {
    const pass = formData.password
    if (!pass) {
      setPasswordStrength({ score: 0, label: '', color: '' })
      return
    }

    let score = 0
    if (pass.length >= 8) score++
    if (pass.length >= 12) score++
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++
    if (/\d/.test(pass)) score++
    if (/[^a-zA-Z0-9]/.test(pass)) score++

    const strengths = [
      { score: 0, label: 'Too weak', color: 'bg-red-500' },
      { score: 1, label: 'Weak', color: 'bg-red-400' },
      { score: 2, label: 'Fair', color: 'bg-yellow-400' },
      { score: 3, label: 'Good', color: 'bg-green-400' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600' }
    ]

    const strength = strengths[score] || strengths[0]
    setPasswordStrength({ score, ...strength })
  }, [formData.password])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!acceptedTerms) {
      toast.error('Please accept the Terms & Conditions and Privacy Policy')
      return
    }
    
    if (!usernameStatus.available) {
      toast.error('Please choose an available username')
      return
    }

    if (passwordStrength.score < 2) {
      toast.error('Password is too weak. Please use a stronger password')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post('/api/user/register', formData)
      if (data.success) {
        setToken(data.token)
  toast.success('Welcome to LibraFlow!')
        navigate(next)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-12 px-4'>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='w-full max-w-2xl'
      >
        <div className='modern-card p-8 sm:p-10'>
          {/* Header */}
          <div className='text-center mb-8'>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <h1 className='text-3xl font-bold gradient-text mb-2'>Create Account</h1>
              <p className='text-gray-600'>Join LibraFlow to share your stories</p>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Two column layout for larger screens */}
            <div className='grid md:grid-cols-2 gap-5'>
              {/* Username Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className='block text-sm font-medium text-gray-700 mb-2'>Username *</label>
                <input 
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50' 
                  name='username'
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                  placeholder='Choose a unique username' 
                />
                {formData.username.length >= 3 && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      usernameStatus.checking ? 'text-gray-500' :
                      usernameStatus.available ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {usernameStatus.checking ? (
                      <svg className='animate-spin h-3 w-3' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                      </svg>
                    ) : usernameStatus.available ? (
                      <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                      </svg>
                    ) : (
                      <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                      </svg>
                    )}
                    {usernameStatus.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Full Name Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className='block text-sm font-medium text-gray-700 mb-2'>Full Name *</label>
                <input 
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50' 
                  name='fullName'
                  value={formData.fullName} 
                  onChange={handleChange} 
                  required 
                  placeholder='John Doe' 
                />
              </motion.div>
            </div>

            <div className='grid md:grid-cols-2 gap-5'>
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className='block text-sm font-medium text-gray-700 mb-2'>Email Address *</label>
                <input 
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50' 
                  type='email' 
                  name='email'
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  placeholder='you@example.com' 
                />
              </motion.div>

              {/* Phone Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className='block text-sm font-medium text-gray-700 mb-2'>Phone Number</label>
                <input 
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50' 
                  type='tel' 
                  name='phone'
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder='+91 00000 00000' 
                />
              </motion.div>
            </div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className='block text-sm font-medium text-gray-700 mb-2'>Password *</label>
              <div className='relative'>
                <input 
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50 pr-12' 
                  type={showPassword ? 'text' : 'password'} 
                  name='password'
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder='Create a strong password' 
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors'
                >
                  {showPassword ? (
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                    </svg>
                  ) : (
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-2'
                >
                  <div className='flex gap-1 mb-1'>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className='text-xs text-gray-600'>
                    Strength: <span className='font-semibold'>{passwordStrength.label}</span>
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Use 8+ characters with uppercase, lowercase, numbers & symbols
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Bio Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
            >
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Bio <span className='text-gray-500 font-normal'>(shown at the end of your blogs)</span>
              </label>
              <textarea 
                className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50 resize-none' 
                name='bio'
                value={formData.bio} 
                onChange={handleChange} 
                rows='3'
                maxLength='200'
                placeholder='A short note about yourself (max 200 characters)' 
              />
              <p className='text-xs text-gray-500 text-right mt-1'>
                {formData.bio.length}/200 characters
              </p>
            </motion.div>

            {/* Terms & Conditions Checkbox */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className='pt-2'
            >
              <label className='flex items-start gap-3 cursor-pointer group'>
                <div className='relative flex items-center justify-center mt-0.5'>
                  <input
                    type='checkbox'
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className='sr-only peer'
                  />
                  <div className='w-5 h-5 border-2 border-gray-300 rounded-md bg-white peer-checked:bg-gradient-to-br peer-checked:from-indigo-600 peer-checked:to-violet-600 peer-checked:border-indigo-600 transition-all duration-200 flex items-center justify-center group-hover:border-indigo-400'>
                    <svg
                      className={`w-3.5 h-3.5 text-white transition-all duration-200 ${
                        acceptedTerms ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth={3}
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                </div>
                <span className='text-sm text-gray-700 leading-relaxed select-none'>
                  I agree to the{' '}
                  <button
                    type='button'
                    onClick={(e) => {
                      e.preventDefault()
                      window.open('/terms', '_blank')
                    }}
                    className='text-indigo-600 hover:text-indigo-700 underline font-medium transition-colors'
                  >
                    Terms & Conditions
                  </button>
                  {' '}and{' '}
                  <button
                    type='button'
                    onClick={(e) => {
                      e.preventDefault()
                      window.open('/privacy', '_blank')
                    }}
                    className='text-indigo-600 hover:text-indigo-700 underline font-medium transition-colors'
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className='pt-2'
            >
              <button 
                className='btn-modern btn-gradient w-full py-3 text-base flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed' 
                type='submit'
                disabled={loading || !usernameStatus.available || !acceptedTerms}
              >
                {loading ? (
                  <span className='flex items-center justify-center gap-2'>
                    <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className='text-center text-sm text-gray-600 mt-6'
          >
            Already have an account? <button type='button' onClick={()=>navigate(`/login?next=${encodeURIComponent(next)}`)} className='text-violet-600 hover:text-violet-700 font-semibold underline'>Sign in here</button>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}

export default Register
