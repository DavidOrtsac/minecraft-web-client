// Build-time: add a 1.21.8 entry to the downloaded sound map. The upstream map
// (generated/sounds.js) tops out at 1.21.4; we connect as 1.21.8, and 1.21.5
// shifted the sound-ID registry, so server sound_effect packets (mobs, eating,
// swimming, mining) mis-resolve. We reindex the existing 1.21.4 name->files with
// 1.21.8's registry IDs (map_id = minecraft-data id - 1). New 1.21.5+ sounds whose
// .mp3 isn't on the CDN are skipped. Safe no-op if anything fails.
import fs from 'fs'
const PATH = './generated/sounds.js'
const REG = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.8/sounds.json'
try {
  const code = fs.readFileSync(PATH, 'utf8')
  const win = {}
  new Function('window', code)(win)
  const map = win.allSoundsMap
  if (!map) throw new Error('allSoundsMap not found')
  const base = map['1.21.4'] || map['1.21.2'] || map['1.21']
  const nameToFiles = {}
  for (const [k, v] of Object.entries(base)) nameToFiles[k.slice(k.indexOf(';') + 1)] = v
  const reg = await (await fetch(REG)).json()
  const out = {}; let matched = 0, missing = 0
  for (const { id, name } of reg) {
    const files = nameToFiles[name]
    if (files === undefined) { missing++; continue }
    out[`${id - 1};${name}`] = files; matched++
  }
  map['1.21.8'] = out
  fs.writeFileSync(PATH, `window.allSoundsMap = ${JSON.stringify(map)};\nwindow.allSoundsMeta = ${JSON.stringify(win.allSoundsMeta)};\n`, 'utf8')
  console.log(`[addSounds1218] 1.21.8 added: ${matched} mapped, ${missing} new/unmapped (${reg.length} total)`)
} catch (e) {
  console.warn('[addSounds1218] skipped (sounds will fall back):', e.message)
}
