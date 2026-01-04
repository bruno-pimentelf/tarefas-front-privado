"use client"

import { useEffect, useRef, useState } from "react"

interface HtmlRendererProps {
  html: string
  className?: string
}

/**
 * Processa o HTML para garantir que fórmulas LaTeX sejam corretamente formatadas
 * Converte códigos LaTeX soltos em formato que MathJax possa processar
 */
function processLatexContent(content: string): string {
  if (!content) return content

  let processed = content

  // Primeiro, marca e protege fórmulas display $$...$$
  const displayMathPlaceholder = "___DISPLAY_MATH___"
  const displayMaths: string[] = []
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const index = displayMaths.length
    displayMaths.push(match)
    return `${displayMathPlaceholder}${index}${displayMathPlaceholder}`
  })

  // Processa fórmulas inline $...$ (garantindo que não sejam parte de $$)
  // Procura por padrão $...$ que não seja precedido ou seguido por outro $
  processed = processed.replace(/\$([^$\n]+?)\$/g, (match, formula, offset, string) => {
    // Verifica contexto para evitar conflitos com $$
    const before = offset > 0 ? string[offset - 1] : ''
    const after = offset + match.length < string.length ? string[offset + match.length] : ''
    
    // Se faz parte de $$, não processa
    if (before === '$' || after === '$') {
      return match
    }
    
    // Garante que a fórmula esteja bem formatada
    return `$${formula.trim()}$`
  })

  // Processa códigos LaTeX que podem estar sem delimitadores
  // Procura por padrões LaTeX comuns que não estão delimitados
  const latexPatterns = [
    { pattern: /\\dfrac\{[^}]+\}\{[^}]+\}/g, name: 'dfrac' },
    { pattern: /\\frac\{[^}]+\}\{[^}]+\}/g, name: 'frac' },
    { pattern: /\\sqrt(?:\[[^\]]+\])?\{[^}]+\}/g, name: 'sqrt' },
  ]

  // Envolve comandos LaTeX soltos com delimitadores $
  latexPatterns.forEach(({ pattern }) => {
    processed = processed.replace(pattern, (match, offset, string) => {
      // Verifica contexto ao redor
      const start = Math.max(0, offset - 5)
      const end = Math.min(string.length, offset + match.length + 5)
      const context = string.substring(start, end)
      
      // Se já está delimitado, não faz nada
      if (context.includes('$') || context.includes('\\(') || context.includes('\\[')) {
        return match
      }
      
      // Se não está delimitado, adiciona $
      return `$${match}$`
    })
  })

  // Restaura fórmulas display
  displayMaths.forEach((math, index) => {
    processed = processed.replace(`${displayMathPlaceholder}${index}${displayMathPlaceholder}`, math)
  })

  return processed
}

/**
 * Componente para renderizar HTML com suporte a LaTeX
 * Usa MathJax para renderizar fórmulas matemáticas em LaTeX
 */
export function HtmlRenderer({ html, className = "" }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mathJaxReady, setMathJaxReady] = useState(false)
  const [processedHtml, setProcessedHtml] = useState("")

  // Processa o HTML antes de renderizar
  useEffect(() => {
    if (html) {
      const processed = processLatexContent(html)
      setProcessedHtml(processed)
    } else {
      setProcessedHtml("")
    }
  }, [html])

  useEffect(() => {
    // Função para inicializar MathJax
    const initMathJax = async () => {
      if (typeof window === "undefined") return

      // Se MathJax já está carregado e pronto
      if (window.MathJax?.startup?.ready) {
        setMathJaxReady(true)
        return
      }

      // Se MathJax já está configurado mas ainda não carregado, esperar
      if (window.MathJax && !window.MathJax.startup?.ready) {
        const checkReady = setInterval(() => {
          if (window.MathJax?.startup?.ready) {
            clearInterval(checkReady)
            setMathJaxReady(true)
          }
        }, 100)
        return () => clearInterval(checkReady)
      }

      // Configuração do MathJax antes de carregar
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
          packages: { "[+]": ["ams", "newcommand", "configMacros"] },
        },
        options: {
          skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
          ignoreHtmlClass: "tex2jax_ignore",
          processHtmlClass: "tex2jax_process",
        },
        startup: {
          ready: () => {
            if (window.MathJax?.startup?.document) {
              window.MathJax.startup.defaultReady()
              setMathJaxReady(true)
            }
            return Promise.resolve()
          },
        },
      }

      // Verifica se o script já existe
      if (document.getElementById("MathJax-script")) {
        // Se já existe, esperar que carregue
        const checkReady = setInterval(() => {
          if (window.MathJax?.startup?.ready) {
            clearInterval(checkReady)
            setMathJaxReady(true)
          }
        }, 100)
        return () => clearInterval(checkReady)
      }

      // Carrega o script do MathJax
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      script.async = true
      script.id = "MathJax-script"
      
      script.onload = () => {
        // Aguarda um pouco para garantir que MathJax está totalmente inicializado
        setTimeout(() => {
          if (window.MathJax?.startup?.ready) {
            setMathJaxReady(true)
          }
        }, 100)
      }

      script.onerror = () => {
        console.error("Erro ao carregar MathJax")
      }

      document.head.appendChild(script)
    }

    initMathJax()
  }, [])

  useEffect(() => {
    // Processa o conteúdo quando MathJax estiver pronto e o conteúdo mudar
    if (containerRef.current && mathJaxReady && processedHtml) {
      // Aguarda um pequeno delay para garantir que o DOM foi atualizado
      const timer = setTimeout(() => {
        if (window.MathJax?.typesetPromise && containerRef.current) {
          // Renderiza o MathJax
          window.MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
            console.error("Erro ao renderizar MathJax:", err)
          })
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [processedHtml, mathJaxReady])

  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: processedHtml }} />
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

