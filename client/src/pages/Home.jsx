/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
 */

import React from 'react'
import Navbar from '../components/Navbar'
import DonationBanner from '../components/DonationBanner'
import Header from '../components/Header'
import BlogList from '../components/BlogList'
import Newsletter from '../components/Newsletter'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <>
      <Navbar/>
      <DonationBanner />
      <Header/>
      <BlogList/>
      <Newsletter/>
      <Footer/>
    </>
  )
}

export default Home
