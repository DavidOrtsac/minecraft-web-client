import { useState } from 'react'
import { appQueryParams } from '../appParams'
import { ConnectOptions } from '../connect'
import { options } from '../optionsStorage'
import { useIsModalActive } from './utilsApp'
import Button from './Button'

// Branded TranscendiantMC kiosk gate. The player only picks a username here; the
// server IP and proxy are baked into config (appParams) and never shown — players
// must not see the underlying infrastructure. The password is chosen in-game via
// the auto-popping AuthMe modal (register if new, login if returning), so we never
// handle or store passwords on the portal. Locked to TranscendiantMC only.

const MINECRAFT_USERNAME_REGEX = /^\w{3,16}$/

// Potato mode = opt-in low-end preset, applied at connect. Default OFF (the checkbox
// resets to unchecked every visit), so "Play" is authoritative: ON applies the low
// preset, OFF restores normal. The DPR cap (the biggest mobile win) is read by the
// patched renderer via globalThis.__mcMaxPixelRatio.
const POTATO_PRESET = { multiplayerRenderDistance: 3, renderDistance: 3, smoothLighting: false, loadPlayerSkins: false, viewBobbing: false, showHand: false, fov: 60 }
const NORMAL_PRESET = { multiplayerRenderDistance: 6, renderDistance: 5, smoothLighting: true, loadPlayerSkins: true, viewBobbing: true, showHand: true, fov: 75 }

const applyGraphicsPreset = (potato: boolean) => {
  const preset = potato ? POTATO_PRESET : NORMAL_PRESET
  const opts = options as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(preset)) opts[k] = v
  if (potato) (globalThis as any).__mcMaxPixelRatio = 1
  else delete (globalThis as any).__mcMaxPixelRatio
}

export default () => {
  const { ip, version, proxy } = appQueryParams
  const isModalActive = useIsModalActive('only-connect-server')
  const [username, setUsername] = useState('')
  const [potato, setPotato] = useState(false)

  if (!isModalActive) return null

  const trimmed = username.trim()
  const isValid = MINECRAFT_USERNAME_REGEX.test(trimmed)

  const handleConnect = () => {
    if (!isValid) return
    applyGraphicsPreset(potato)
    const connectOptions: ConnectOptions = {
      username: trimmed,
      server: ip,
      proxy,
      botVersion: version,
    }
    window.dispatchEvent(new CustomEvent('connect', { detail: connectOptions }))
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.97)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <form
        onSubmit={(e) => { e.preventDefault(); handleConnect() }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.65)',
          padding: '28px 32px',
          borderRadius: '6px',
          minWidth: '280px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          TranscendiantMC
        </div>
        <div style={{ color: 'lightgray', fontSize: '12px', marginTop: '-8px', textAlign: 'center' }}>
          Pick a username to play in your browser
        </div>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          spellCheck={false}
          autoComplete="username"
          maxLength={16}
          style={{
            width: '240px',
            padding: '8px 10px',
            fontSize: '14px',
            background: '#2b2b2b',
            color: 'white',
            border: `1px solid ${trimmed && !isValid ? '#d9534f' : '#555'}`,
            borderRadius: '3px',
            outline: 'none'
          }}
        />
        {trimmed && !isValid && (
          <div style={{ color: '#d9834f', fontSize: '11px', marginTop: '-6px' }}>
            3-16 letters, numbers, or underscores
          </div>
        )}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'lightgray',
          fontSize: '12px',
          cursor: 'pointer',
          userSelect: 'none',
          width: '240px'
        }}>
          <input
            type="checkbox"
            checked={potato}
            onChange={(e) => setPotato(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#5a8f3a' }}
          />
          <span>⚡ Potato mode <span style={{ color: 'gray' }}>(low-end / phone)</span></span>
        </label>
        <Button
          type="submit"
          disabled={!isValid}
          style={{
            width: 'auto',
            padding: '0 18px',
            transform: 'scale(1.3)',
            transformOrigin: 'center',
            opacity: isValid ? 1 : 0.5
          }}
        >
          Play
        </Button>
        <div style={{ color: 'gray', fontSize: '10px', marginTop: '2px', textAlign: 'center', maxWidth: '240px' }}>
          You'll set your password in-game on first join.
        </div>
      </form>
    </div>
  )
}
