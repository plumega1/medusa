import { PropsWithChildren, useEffect } from "react"
import { ThemeContext } from "./theme-context"

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const html = document.querySelector("html")

    if (html) {
      html.classList.remove("dark")
      html.classList.add("light")
      html.style.colorScheme = "light"
    }
  }, [])

  // Provide dummy context (or remove ThemeContext entirely if not needed)
  return (
    <ThemeContext.Provider value={{ theme: "light", setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}
