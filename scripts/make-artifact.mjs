/**
 * Transforme la sortie « single file » de Vite en un fragment publiable.
 *
 * Le service d'Artifact enveloppe lui-même le fichier dans un squelette
 * `<!doctype html><head>…</head><body>`. On retire donc l'enveloppe produite
 * par Vite et on remonte le `<title>` en tête : seuls les premiers kilo-octets
 * sont analysés pour le détecter.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const source = readFileSync('dist-artifact/index.html', 'utf8')

const head = source.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? ''
const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? ''

const title = head.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? '<title>Budgette</title>'
const styles = head.match(/<style[\s\S]*?<\/style>/gi)?.join('\n') ?? ''
const meta = (head.match(/<meta[^>]*>/gi) ?? [])
  .filter((tag) => /name=["'](description|color-scheme)["']/i.test(tag))
  .join('\n')

// Vite place le script inline dans `<head>` ou dans `<body>` selon la version :
// on le récupère où qu'il soit, et on le remet après le point de montage.
const scripts = (source.match(/<script[\s\S]*?<\/script>/gi) ?? []).join('\n')
const mount = body.replace(/<script[\s\S]*?<\/script>/gi, '').trim()

const output = [title, meta, styles, mount, scripts].filter(Boolean).join('\n')

writeFileSync('dist-artifact/budgette.html', output)
console.log(`budgette.html — ${(output.length / 1024).toFixed(0)} Ko`)
