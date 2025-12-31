"use client"

import { useEffect, useRef } from "react"

interface HtmlRendererProps {
  html: string
  className?: string
}

/**
 * Componente para renderizar HTML com suporte a LaTeX
 * Usa MathJax para renderizar fórmulas matemáticas em LaTeX
 */
export function HtmlRenderer({ html, className = "" }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Carrega MathJax se ainda não estiver carregado
    if (typeof window !== "undefined" && !window.MathJax) {
      // Configuração do MathJax
      window.MathJax = {
        tex: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
          displayMath: [
            ["$$", "$$"],
            ["\\[", "\\]"],
          ],
          processEscapes: true,
          processEnvironments: true,
        },
        options: {
          skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
        },
        startup: {
          pageReady: () => {
            return window.MathJax?.startup?.defaultPageReady?.() ?? Promise.resolve()
          },
        },
      }

      // Carrega o script do MathJax
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      script.async = true
      script.id = "MathJax-script"
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    // Renderiza o MathJax após o conteúdo HTML ser inserido
    if (containerRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
        console.error("Erro ao renderizar MathJax:", err)
      })
    }
  }, [html])

  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

// Declaração de tipos para o MathJax
declare global {
  interface Window {
    MathJax?: {
      tex?: any
      options?: any
      startup?: any
      typesetPromise?: (elements?: Element[]) => Promise<void>
    }
  }
}

