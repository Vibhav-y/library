import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Layout from './pages/admin/Layout'
import AddBlog from './pages/admin/AddBlog'
import ListBlog from './pages/admin/ListBlog'
import Comments from './pages/admin/Comments'
import Dashboard from './pages/admin/Dashboard'
import Chats from './pages/admin/Chats'
import Donations from './pages/admin/Donations'
import Users from './pages/admin/Users'
import Contacts from './pages/admin/Contacts'
import Login from './components/admin/Login'
import UserLogin from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Terms from './pages/Terms'
import FAQs from './pages/FAQs'
import Contact from './pages/Contact'
import Returns from './pages/Returns'
import Privacy from './pages/Privacy'
import PublicAddBlog from './pages/admin/AddBlog'
import Donate from './pages/Donate'
import DonationBanner from './components/DonationBanner'
import 'quill/dist/quill.snow.css'
import { Toaster } from 'react-hot-toast'
import { useAppContext } from './context/AppContext'

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: [0.2, 0.9, 0.3, 1] }}
  >
    {children}
  </motion.div>
)

const App = () => {

  const { token } = useAppContext()
  const location = useLocation()

  return (
    <div>
      <Toaster/>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path='/' element={<PageTransition><Home/></PageTransition>}/>
          <Route path='/login' element={<PageTransition><UserLogin/></PageTransition>} />
          <Route path='/register' element={<PageTransition><Register/></PageTransition>} />
          <Route path='/profile' element={<PageTransition><Profile/></PageTransition>} />
          <Route path='/terms' element={<PageTransition><Terms/></PageTransition>} />
          <Route path='/privacy' element={<PageTransition><Privacy/></PageTransition>} />
          <Route path='/faqs' element={<PageTransition><FAQs/></PageTransition>} />
          <Route path='/contact' element={<PageTransition><Contact/></PageTransition>} />
          <Route path='/returns' element={<PageTransition><Returns/></PageTransition>} />
          <Route path='/donate' element={<PageTransition><Donate/></PageTransition>} />
          <Route path='/add' element={<PageTransition><PublicAddBlog/></PageTransition>} />
          <Route path='/blog/:id' element={<PageTransition><Blog/></PageTransition>}/>
          <Route path='/admin' element={token ? <Layout/> : <Login/>}>
            <Route index element={<Dashboard/>}/>
            <Route path='addBlog' element={<AddBlog/>}/>
            <Route path='listBlog' element={<ListBlog/>}/>
            <Route path='comments' element={<Comments/>}/>
            <Route path='chats' element={<Chats/>}/>
            <Route path='donations' element={<Donations/>}/>
            <Route path='users' element={<Users/>}/>
            <Route path='contacts' element={<Contacts/>}/>
          </Route>
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
