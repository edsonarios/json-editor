import type { SVGProps } from 'react'
export default function IconArrowLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="1.5"
      className="lucide-icon lucide lucide-External link ml-1 transition-transform duration-300 group-hover:-translate-y-[1px] group-hover:translate-x-[1px] hidden md:block"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 7h10v10"></path>
      <path d="M7 17 17 7"></path>
    </svg>
  )
}
