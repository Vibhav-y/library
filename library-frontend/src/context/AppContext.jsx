/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
 */

import { createContext, useContext, useEffect, useState } from "react" 
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from "react-hot-toast"

axios.defaults.baseURL=import.meta.env.VITE_BASE_URL

const AppContext = createContext()

export const AppProvider = ({children}) => {

    const navigate = useNavigate()
    const [token, setToken] = useState(null)
    const [user, setUser] = useState(null)
    const [blogs, setBlogs] = useState([])
    const [input, setInput] = useState("")

    const fetchBlogs = async () => {
        try {
            const { data } = await axios.get('/api/blog/all')
            data.success ? setBlogs(data.blogs) : toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        fetchBlogs()
        const token = localStorage.getItem('token')
        if(token) {
            setToken(token)
            axios.defaults.headers.common['Authorization'] = `${token}`
            // try decode token payload to set user
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                setUser({ email: payload.email, name: payload.name || payload.email, role: payload.role })
            } catch (e) {
                // ignore
            }
        }
    }, [])

    const saveToken = (t) => {
        if (!t) {
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            setToken(null)
            setUser(null)
            return
        }
        localStorage.setItem('token', t)
        axios.defaults.headers.common['Authorization'] = t
        setToken(t)
        try {
            const payload = JSON.parse(atob(t.split('.')[1]))
            setUser({ email: payload.email, name: payload.name || payload.email, role: payload.role })
        } catch (e) {
            setUser(null)
        }
    }

    const logout = () => saveToken(null)

    const value = {axios, navigate, token, setToken: saveToken, user, setUser, logout, blogs, setBlogs, input, setInput}
    
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext)
}