import { App } from '@capacitor/app'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Android hardware back: leave inner screens to home; on home, exit the app.
 */
export default function NativeBackHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathRef = useRef(location.pathname)

  pathRef.current = location.pathname

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let handle: PluginListenerHandle | undefined

    void App.addListener('backButton', () => {
      const p = pathRef.current

      if (p === '/home' || p === '/') {
        void App.exitApp()
        return
      }

      const editMatch = /^\/transaction\/([^/]+)\/edit$/.exec(p)
      if (editMatch) {
        navigate(`/transaction/${editMatch[1]}`, { replace: false })
        return
      }

      if (p.startsWith('/transaction/')) {
        navigate('/home', { replace: false })
        return
      }

      if (p === '/create') {
        navigate('/home', { replace: false })
        return
      }

      navigate('/home', { replace: false })
    }).then((h) => {
      handle = h
    })

    return () => {
      void handle?.remove()
    }
  }, [navigate])

  return null
}
