/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import React, { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'motion/react'

const Contacts = () => {
  const { axios } = useAppContext()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedContact, setSelectedContact] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const { data } = await axios.get('/api/contact/all')
      if (data.success) {
        setContacts(data.contacts)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to fetch contacts')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateContactStatus = async (id, status, priority) => {
    try {
      const { data } = await axios.put('/api/contact/update-status', { 
        id, 
        status, 
        priority 
      })
      
      if (data.success) {
        toast.success('Contact updated successfully')
        fetchContacts()
        if (selectedContact && selectedContact._id === id) {
          setSelectedContact(data.contact)
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to update contact')
      console.error(error)
    }
  }

  const deleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { data } = await axios.post('/api/contact/delete', { id })
      
      if (data.success) {
        toast.success('Contact deleted successfully')
        fetchContacts()
        setShowModal(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to delete contact')
      console.error(error)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const statusMatch = filterStatus === 'all' || contact.status === filterStatus
    const priorityMatch = filterPriority === 'all' || contact.priority === filterPriority
    return statusMatch && priorityMatch
  })

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      contacted: 'bg-purple-100 text-purple-800 border-purple-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    }
    const icons = {
      low: '↓',
      normal: '→',
      high: '↑',
      urgent: '⚠'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[priority] || styles.normal}`}>
        {icons[priority]} {priority.toUpperCase()}
      </span>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Contact Management</h1>
        <p className='text-gray-600'>Manage and respond to customer inquiries</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6'>
        <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200'>
          <div className='text-2xl font-bold text-gray-900'>{contacts.length}</div>
          <div className='text-sm text-gray-500'>Total Contacts</div>
        </div>
        <div className='bg-yellow-50 rounded-xl shadow-sm p-4 border border-yellow-200'>
          <div className='text-2xl font-bold text-yellow-700'>
            {contacts.filter(c => c.status === 'pending').length}
          </div>
          <div className='text-sm text-yellow-600'>Pending</div>
        </div>
        <div className='bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200'>
          <div className='text-2xl font-bold text-blue-700'>
            {contacts.filter(c => c.status === 'in-progress').length}
          </div>
          <div className='text-sm text-blue-600'>In Progress</div>
        </div>
        <div className='bg-green-50 rounded-xl shadow-sm p-4 border border-green-200'>
          <div className='text-2xl font-bold text-green-700'>
            {contacts.filter(c => c.status === 'resolved').length}
          </div>
          <div className='text-sm text-green-600'>Resolved</div>
        </div>
        <div className='bg-red-50 rounded-xl shadow-sm p-4 border border-red-200'>
          <div className='text-2xl font-bold text-red-700'>
            {contacts.filter(c => c.priority === 'urgent').length}
          </div>
          <div className='text-sm text-red-600'>Urgent</div>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200'>
        <div className='flex flex-wrap gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value='all'>All Status</option>
              <option value='pending'>Pending</option>
              <option value='in-progress'>In Progress</option>
              <option value='contacted'>Contacted</option>
              <option value='resolved'>Resolved</option>
              <option value='closed'>Closed</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Priority</label>
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value='all'>All Priority</option>
              <option value='low'>Low</option>
              <option value='normal'>Normal</option>
              <option value='high'>High</option>
              <option value='urgent'>Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Name</th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Subject</th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Status</th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Priority</th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Date</th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan='6' className='px-6 py-12 text-center text-gray-500'>
                    No contacts found
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact._id} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-6 py-4'>
                      <div>
                        <div className='font-medium text-gray-900'>{contact.name}</div>
                        <div className='text-sm text-gray-500'>{contact.email}</div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-900 max-w-xs truncate'>{contact.subject}</div>
                    </td>
                    <td className='px-6 py-4'>
                      {getStatusBadge(contact.status)}
                    </td>
                    <td className='px-6 py-4'>
                      {getPriorityBadge(contact.priority)}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        onClick={() => {
                          setSelectedContact(contact)
                          setShowModal(true)
                        }}
                        className='text-indigo-600 hover:text-indigo-700 font-medium text-sm'
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Detail Modal */}
      {showModal && selectedContact && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'
          >
            <div className='p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10'>
              <h2 className='text-2xl font-bold text-gray-900'>Contact Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <div className='p-6 space-y-6'>
              {/* Contact Info */}
              <div className='grid md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-semibold text-gray-600'>Name</label>
                  <p className='text-gray-900 mt-1'>{selectedContact.name}</p>
                </div>
                <div>
                  <label className='text-sm font-semibold text-gray-600'>Email</label>
                  <p className='text-gray-900 mt-1'>{selectedContact.email}</p>
                </div>
                <div>
                  <label className='text-sm font-semibold text-gray-600'>Phone</label>
                  <p className='text-gray-900 mt-1'>{selectedContact.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className='text-sm font-semibold text-gray-600'>Date Submitted</label>
                  <p className='text-gray-900 mt-1'>{formatDate(selectedContact.createdAt)}</p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className='text-sm font-semibold text-gray-600'>Subject</label>
                <p className='text-gray-900 mt-1'>{selectedContact.subject}</p>
              </div>

              {/* Message */}
              <div>
                <label className='text-sm font-semibold text-gray-600'>Message</label>
                <div className='mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                  <p className='text-gray-900 whitespace-pre-wrap'>{selectedContact.message}</p>
                </div>
              </div>

              {/* Status and Priority Controls */}
              <div className='grid md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-600 mb-2'>Update Status</label>
                  <select
                    value={selectedContact.status}
                    onChange={(e) => updateContactStatus(selectedContact._id, e.target.value, selectedContact.priority)}
                    className='w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500'
                  >
                    <option value='pending'>Pending</option>
                    <option value='in-progress'>In Progress</option>
                    <option value='contacted'>Contacted</option>
                    <option value='resolved'>Resolved</option>
                    <option value='closed'>Closed</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-600 mb-2'>Update Priority</label>
                  <select
                    value={selectedContact.priority}
                    onChange={(e) => updateContactStatus(selectedContact._id, selectedContact.status, e.target.value)}
                    className='w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500'
                  >
                    <option value='low'>Low</option>
                    <option value='normal'>Normal</option>
                    <option value='high'>High</option>
                    <option value='urgent'>Urgent</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4 border-t border-gray-200'>
                <a
                  href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}
                  className='flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-center'
                >
                  Reply via Email
                </a>
                <button
                  onClick={() => deleteContact(selectedContact._id)}
                  className='px-6 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium'
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Contacts
