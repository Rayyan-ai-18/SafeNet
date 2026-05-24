import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, MessageCircle } from 'lucide-react'

export default function LunaWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'luna', text: 'Hello! I\'m Luna. Ask me anything about your family\'s safety.' },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: input }])
    setInput('')
    // Simulated Luna response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'luna',
        text: 'I\'m monitoring your family\'s safety. All children are currently secure. Let me know if you need anything specific!',
      }])
    }, 1000)
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`
          fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full
          bg-safenet-primary text-white shadow-safenet-lg
          flex items-center justify-center
          ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-40 w-[360px] h-[520px] bg-white rounded-card-lg shadow-safenet-xl border border-safenet-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-safenet-border bg-safenet-surface">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-safenet-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-safenet-text">Luna AI</div>
                  <div className="flex items-center gap-1 text-[10px] text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-safenet-surface-2 transition-colors"
              >
                <X className="w-5 h-5 text-safenet-text-2" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-safenet-primary text-white rounded-br-sm'
                      : 'bg-safenet-surface text-safenet-text rounded-bl-sm'
                    }
                  `}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-safenet-border">
              <div className="flex items-center gap-2 bg-safenet-surface rounded-full px-4 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Luna anything…"
                  className="flex-1 bg-transparent text-sm text-safenet-text placeholder:text-safenet-text-3 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  className="w-7 h-7 rounded-full bg-safenet-primary flex items-center justify-center text-white flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
