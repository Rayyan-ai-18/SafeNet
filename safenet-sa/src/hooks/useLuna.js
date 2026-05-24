import { useState, useCallback } from 'react'
import { scanUrl, analyseText, chat, generateVoice } from '../lib/luna-api'

export function useLuna() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runScan = useCallback(async (url) => {
    setLoading(true)
    setError(null)
    try {
      const result = await scanUrl(url)
      return result
    } catch (e) {
      setError('Luna is temporarily unavailable')
      return { safe: true, error: 'Luna is temporarily unavailable' }
    } finally {
      setLoading(false)
    }
  }, [])

  const runTextAnalysis = useCallback(async (text, language) => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyseText(text, language)
      return result
    } catch (e) {
      setError('Luna is temporarily unavailable')
      return { threat: false, error: 'Luna is temporarily unavailable' }
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (message, language, context) => {
    setLoading(true)
    setError(null)
    try {
      const result = await chat(message, language, context)
      return result
    } catch (e) {
      setError('Luna is temporarily unavailable')
      return { response: "Luna is temporarily unavailable. Please try again in a moment." }
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, runScan, runTextAnalysis, sendMessage }
}

export default useLuna
