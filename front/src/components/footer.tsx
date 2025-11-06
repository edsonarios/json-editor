import IconArrowLink from './ArrowLink'

export default function Footer() {
  return (
    <footer className="absolute flex flex-col items-start bottom-6">
      <p className="">Made By ⚡ Edson</p>
      <a
        className="text-gray-400 flex items-center group hover:text-gray-100 hover:transition-all ml-7"
        href="https://www.linkedin.com/in/edson-a%C3%B1awaya/"
        target="_blank"
        rel="noreferrer"
      >
        Linkedin
        <IconArrowLink />
      </a>
    </footer>
  )
}
