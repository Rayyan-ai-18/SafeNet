import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Flip } from 'gsap/Flip'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin,
  Flip,
)

// Utility: custom SplitText-like effect using JS
export function splitChars(element) {
  if (!element) return []
  const text = element.textContent
  element.textContent = ''
  const chars = []
  for (const char of text) {
    const span = document.createElement('span')
    span.textContent = char === ' ' ? '\u00A0' : char
    span.style.display = 'inline-block'
    element.appendChild(span)
    chars.push(span)
  }
  return chars
}

export function splitWords(element) {
  if (!element) return []
  const text = element.textContent
  element.textContent = ''
  const words = text.split(' ').map((word, i, arr) => {
    const span = document.createElement('span')
    span.textContent = word + (i < arr.length - 1 ? '\u00A0' : '')
    span.style.display = 'inline-block'
    element.appendChild(span)
    return span
  })
  return words
}

export function splitLines(element) {
  if (!element) return []
  const words = splitWords(element)
  element.textContent = ''
  const lines = []
  let currentLine = document.createElement('div')
  currentLine.style.display = 'block'
  let currentWidth = 0

  words.forEach(word => {
    const temp = word.cloneNode(true)
    element.appendChild(temp)
    const wordWidth = temp.offsetWidth
    element.removeChild(temp)

    if (currentWidth + wordWidth > element.offsetWidth) {
      element.appendChild(currentLine)
      lines.push(currentLine)
      currentLine = document.createElement('div')
      currentLine.style.display = 'block'
      currentWidth = 0
    }
    currentLine.appendChild(word)
    currentWidth += wordWidth
  })
  element.appendChild(currentLine)
  lines.push(currentLine)
  return lines
}

export {
  gsap,
  ScrollTrigger,
  ScrollToPlugin,
  Flip,
  useGSAP,
}

export default gsap
