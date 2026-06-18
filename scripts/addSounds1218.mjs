// Build-time: add a 1.21.8 entry to the downloaded sound map. The upstream map
// (generated/sounds.js) tops out at 1.21.4; we connect as 1.21.8, and 1.21.5
// shifted the sound-ID registry, so server sound_effect packets (mobs, eating,
// swimming, mining) mis-resolve.
//
// IDs MUST come from Burger (jar-extracted, the same source the upstream map was
// built from). minecraft-data's sound IDs drift from the protocol at higher numbers
// (e.g. entity.zombie.ambient is 1653 in Burger but 1702 in minecraft-data) because
// minecraft-data carries extra/ordered-differently entries -- using those left every
// mob sound keyed wrong, so they were silent. Burger ids match the map's 0-based
// convention directly (the runtime does soundsIdToName[packet.soundId - 1]).
//
// We reindex the existing 1.21.4 name->files with Burger's 1.21.8 ids. New 1.21.5+
// sounds whose .mp3 isn't on the CDN are skipped. Safe no-op if anything fails.
import fs from 'fs'
const PATH = './generated/sounds.js'
const BURGER = 'https://raw.githubusercontent.com/Pokechu22/Burger/gh-pages/1.21.8.json'
try {
  const code = fs.readFileSync(PATH, 'utf8')
  const win = {}
  new Function('window', code)(win)
  const map = win.allSoundsMap
  if (!map) throw new Error('allSoundsMap not found')
  const base = map['1.21.4'] || map['1.21.2'] || map['1.21']
  const nameToFiles = {}
  for (const [k, v] of Object.entries(base)) nameToFiles[k.slice(k.indexOf(';') + 1)] = v

  const burger = await (await fetch(BURGER)).json()
  const sounds = (Array.isArray(burger) ? burger[0] : burger).sounds
  if (!sounds) throw new Error('burger sounds missing')

  const out = {}; let matched = 0, missing = 0
  for (const [name, info] of Object.entries(sounds)) {
    const files = nameToFiles[name]
    if (files === undefined) { missing++; continue }
    out[`${info.id};${name}`] = files; matched++
  }
  map['1.21.8'] = out
  fs.writeFileSync(PATH, `window.allSoundsMap = ${JSON.stringify(map)};\nwindow.allSoundsMeta = ${JSON.stringify(win.allSoundsMeta)};\n`, 'utf8')
  console.log(`[addSounds1218] 1.21.8 added from Burger: ${matched} mapped, ${missing} new/unmapped (${Object.keys(sounds).length} burger sounds)`)
} catch (e) {
  console.warn('[addSounds1218] skipped (sounds will fall back):', e.message)
}
