import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Last line of defence: a render error shows a recovery card instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DakSetu render error', error, info.componentStack)
  }

  private resetData = () => {
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith('postal-mitra:') || key.startsWith('daksetu:')) localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-red-200 bg-white p-5 text-slate-800 shadow-card dark:border-red-800 dark:bg-slate-900 dark:text-slate-200" role="alert">
        <h1 className="text-lg font-extrabold">DakSetu could not load / डाकसेतु लोड नहीं हो सका</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Something went wrong while drawing the screen. Reloading usually fixes it. If it keeps happening, reset the saved data
          (customer and agent details will be cleared). / पेज बनाते समय कोई गड़बड़ी हुई। रीलोड करें; समस्या बनी रहे तो सेव किया डेटा रीसेट करें।
        </p>
        <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{String(this.state.error.message)}</pre>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-postal-600 px-4 py-2 text-sm font-semibold text-white">
            Reload / रीलोड
          </button>
          <button type="button" onClick={this.resetData} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600">
            Reset app data / डेटा रीसेट
          </button>
        </div>
      </div>
    )
  }
}
