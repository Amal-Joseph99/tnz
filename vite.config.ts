import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { featuredProducts, trendingProducts } from './src/data/products'
import { buildProductShareHtml } from './src/lib/sharePages'

import { cloudflare } from "@cloudflare/vite-plugin";

function sharePagesPlugin(): Plugin {
  const siteOrigin = (process.env.VITE_SITE_URL ?? 'https://www.agtrenz.com').replace(/\/$/, '')

  const writePages = (outputDir: string) => {
    mkdirSync(outputDir, { recursive: true })
    const products = [...featuredProducts, ...trendingProducts]

    for (const product of products) {
      const html = buildProductShareHtml(product, siteOrigin)
      writeFileSync(join(outputDir, `${product.id}.html`), html, 'utf8')
    }
  }

  return {
    name: 'product-share-pages',
    configureServer() {
      writePages(join(process.cwd(), 'public', 'share'))
    },
    closeBundle() {
      writePages(join(process.cwd(), 'dist', 'share'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sharePagesPlugin(), cloudflare()],
})