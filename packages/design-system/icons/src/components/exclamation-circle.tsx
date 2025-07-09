import * as React from "react"
import type { IconProps } from "../types"
const ExclamationCircle = React.forwardRef<SVGSVGElement, IconProps>(
  ({ color = "currentColor", ...props }, ref) => {
    return (
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_4_336)">
          <circle cx="60" cy="60" r="60" fill="#DCEDE1" />
          <circle
            cx="59.5269"
            cy="59.5269"
            r="21"
            transform="rotate(-45 59.5269 59.5269)"
            fill="white"
            stroke="#007171"
            stroke-width="4"
          />
          <rect
            x="68.5857"
            y="39.8668"
            width="8"
            height="40"
            transform="rotate(45 68.5857 39.8668)"
            fill="#FCECCB"
          />
          <rect
            x="72.9619"
            y="75.7904"
            width="4"
            height="16"
            transform="rotate(-45 72.9619 75.7904)"
            fill="#FFCF6E"
          />
          <rect
            x="77.292"
            y="46.866"
            width="4"
            height="41"
            transform="rotate(45 77.292 46.866)"
            fill="#FCECCB"
          />
          <circle
            cx="59.5269"
            cy="59.5269"
            r="21"
            transform="rotate(-45 59.5269 59.5269)"
            stroke="#FFBE3C"
            stroke-width="4"
          />
          <rect
            x="80.7402"
            y="86.397"
            width="8"
            height="36.4945"
            rx="2"
            transform="rotate(-45 80.7402 86.397)"
            fill="#007171"
          />
        </g>
        <defs>
          <clipPath id="clip0_4_336">
            <rect width="120" height="120" rx="60" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  }
)
ExclamationCircle.displayName = "ExclamationCircle"
export default ExclamationCircle
