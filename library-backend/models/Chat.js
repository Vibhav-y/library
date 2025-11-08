import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user','assistant','system'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

const chatSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'blog' },
  messages: { type: [chatMessageSchema], default: [] },
  // optionally store who started the chat (email/name) if available
  startedBy: { type: String },
}, { timestamps: true })

const Chat = mongoose.model('Chat', chatSchema)

export default Chat
