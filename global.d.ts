// Fix for React 19 JSX types compatibility with TypeScript
// This file resolves false positive errors from the TypeScript language server
// when using React 19 with Next.js

import type { ReactElement, ReactNode } from 'react'

declare global {
  namespace JSX {
    type Element = ReactElement<any, any> | null
    interface ElementChildrenAttribute {
      children: {}
    }
  }
}

// Lucide icons fix for React 19
declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  export type Icon = FC<SVGProps<SVGSVGElement>>
}

export {}

