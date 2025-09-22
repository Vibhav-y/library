import React, { useEffect, useState } from 'react';
import api, { authAPI, chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const GodAdminDashboard = () => {
  const { godImpersonate, godLogout } = useAuth();
  const [libraries, setLibraries] = useState([]);
  const [form, setForm] = useState({ name: '', handle: '', totalSeats: 50, allDayAvailable: true, contact: { phone: '', email: '', address: '', website: '' }, slots: [], features: { chatEnabled: true, documentUploadsEnabled: true } });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeLibId, setActiveLibId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [flagged, setFlagged] = useState([]);

  const fetchLibraries = async () => {
    setError('');
    try {
      const godToken = localStorage.getItem('god_token');
      if (!godToken) { setError('Not authenticated'); return; }
      // Use raw axios instance to preserve god token
      const res = await api.get('/library', { headers: { Authorization: godToken } });
      setLibraries(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load libraries');
    }
  };

  useEffect(() => { fetchLibraries(); }, []);

  useEffect(() => {
    const loadMonitoring = async () => {
      if (!activeLibId) return;
      try {
        const [convs, flaggedMsgs] = await Promise.all([
          chatAPI.admin.getAllConversations(activeLibId, true),
          chatAPI.admin.getFlaggedMessages(activeLibId, true)
        ]);
        setConversations(convs);
        setFlagged(flaggedMsgs);
      } catch (e) {
        // ignore UI errors here
      }
    };
    loadMonitoring();
  }, [activeLibId]);

  const createLibrary = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const godToken = localStorage.getItem('god_token');
      await api.post('/library', form, { headers: { Authorization: godToken } });
      setForm({ name: '', handle: '', totalSeats: 50, allDayAvailable: true, contact: { phone: '', email: '', address: '', website: '' }, slots: [], features: { chatEnabled: true, documentUploadsEnabled: true } });
      await fetchLibraries();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create library');
    } finally {
      setLoading(false);
    }
  };

  const impersonate = async (libraryId) => {
    const res = await godImpersonate(libraryId);
    if (!res.success) {
      setError(res.error);
      return;
    }
    window.location.href = '/dashboard';
  };

  const logout = () => {
    godLogout();
    window.location.href = '/god-admin-login';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">God Admin Dashboard</h1>
          <button onClick={logout} className="text-red-600">Logout</button>
        </div>

        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Onboard New Library</h2>
            <form onSubmit={createLibrary} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Library Name</label>
                <input className="w-full border rounded px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium">Handle (e.g., @sunview.com)</label>
                <input className="w-full border rounded px-3 py-2" value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Seats</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={form.totalSeats} onChange={e => setForm({ ...form, totalSeats: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input id="allday" type="checkbox" checked={form.allDayAvailable} onChange={e => setForm({ ...form, allDayAvailable: e.target.checked })} />
                  <label htmlFor="allday" className="text-sm">All day available</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Contact Email</label>
                  <input className="w-full border rounded px-3 py-2" value={form.contact.email} onChange={e => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Contact Phone</label>
                  <input className="w-full border rounded px-3 py-2" value={form.contact.phone} onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium">Address</label>
                  <input className="w-full border rounded px-3 py-2" value={form.contact.address} onChange={e => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium">Website</label>
                  <input className="w-full border rounded px-3 py-2" value={form.contact.website} onChange={e => setForm({ ...form, contact: { ...form.contact, website: e.target.value } })} />
                </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="inline-flex items-center space-x-2">
                  <input type="checkbox" checked={form.features.chatEnabled} onChange={e=> setForm({ ...form, features: { ...form.features, chatEnabled: e.target.checked } })} />
                  <span className="text-sm">Enable Chat</span>
                </label>
                <label className="inline-flex items-center space-x-2">
                  <input type="checkbox" checked={form.features.documentUploadsEnabled} onChange={e=> setForm({ ...form, features: { ...form.features, documentUploadsEnabled: e.target.checked } })} />
                  <span className="text-sm">Enable Document Uploads</span>
                </label>
              </div>
              </div>
              <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">{loading ? 'Creating...' : 'Create Library'}</button>
            </form>
          </div>

          <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Libraries</h2>
            <div className="space-y-3 max-h-[480px] overflow-auto">
              {libraries.map(lib => (
                <div key={lib._id} className={`flex items-center justify-between border rounded p-3 ${activeLibId===lib._id ? 'ring-2 ring-blue-500' : ''}`}>
                  <div onClick={() => setActiveLibId(lib._id)} className="cursor-pointer">
                    <div className="font-medium">{lib.name}</div>
                    <div className="text-sm text-gray-600">{lib.handle} • Seats: {lib.totalSeats} • {lib.isActive ? 'Active' : 'Inactive'}</div>
                    {lib.contact?.email && <div className="text-sm text-gray-600">Contact: {lib.contact.email} {lib.contact.phone ? `• ${lib.contact.phone}` : ''}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => impersonate(lib._id)} className="text-blue-600">Go to Admin</button>
                    <a href={`/#/chat-monitoring?libraryId=${lib._id}`} onClick={(e)=>{ e.preventDefault(); window.location.href = `/chat-monitoring?libraryId=${lib._id}`; }} className="text-purple-600">View in Monitoring</a>
                  </div>
                </div>
              ))}
              {libraries.length === 0 && <div className="text-sm text-gray-600">No libraries onboarded yet.</div>}
            </div>
          </div>
        </div>

        {/* Monitoring tabs per selected library */}
        {activeLibId && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Conversations</h2>
                <button onClick={async ()=>{
                  try { setConversations(await chatAPI.admin.getAllConversations(activeLibId, true)); } catch{}
                }} className="text-sm text-blue-600">Refresh</button>
              </div>
              <div className="max-h-[420px] overflow-auto space-y-3">
                {conversations.map((c)=> (
                  <div key={c._id} className="border rounded p-3">
                    <div className="font-medium">{c.type==='group' ? c.name : (c.participants||[]).map(p=>p.user?.name).join(' & ')}</div>
                    <div className="text-xs text-gray-600">Updated: {new Date(c.updatedAt).toLocaleString()}</div>
                  </div>
                ))}
                {conversations.length===0 && <div className="text-sm text-gray-600">No conversations</div>}
              </div>
            </div>
            <div className="bg-white rounded shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Flagged Messages</h2>
                <button onClick={async ()=>{
                  try { setFlagged(await chatAPI.admin.getFlaggedMessages(activeLibId, true)); } catch{}
                }} className="text-sm text-blue-600">Refresh</button>
              </div>
              <div className="max-h-[420px] overflow-auto space-y-3">
                {flagged.map((m)=> (
                  <div key={m._id} className="border rounded p-3">
                    <div className="text-sm"><span className="font-semibold">{m.sender?.name}</span>: {m.content}</div>
                    <div className="text-xs text-gray-600">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                {flagged.length===0 && <div className="text-sm text-gray-600">No flagged messages</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GodAdminDashboard;


