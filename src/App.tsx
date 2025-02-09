import './App.css'
import { useState } from 'react'
import { DateTime } from 'luxon'
import IconArrowLink from './components/ArrowLink'

export default function App() {
  return (
    <div className="p-4 flex items-center flex-col">
      <h1 className="text-6xl mb-4">TimeZone Converter</h1>

      <footer className="absolute bottom-8 flex flex-col items-center">
        <p className="">Made By ⚡ Edson</p>
        <a
          className="text-gray-400 flex items-center group hover:text-gray-100 hover:transition-all"
          href="https://www.linkedin.com/in/edson-a%C3%B1awaya/"
          target="_blank"
          rel="noreferrer"
        >
          Linkedin
          <IconArrowLink />
        </a>
      </footer>
    </div>
  )
}
