// Runs before first paint: apply the saved / system theme (avoids a flash) and
// refuse to work inside another site's frame (clickjacking). Kept as an external file so the
// Content-Security-Policy can stay at script-src 'self' without inline hashes.
;(function () {
  // Modern browsers block a cross-origin frame from navigating the top window, so
  // when embedded we hide the page instead (the parent cannot undo this).
  try {
    if (window.top !== window.self) {
      document.documentElement.style.visibility = 'hidden'
      document.addEventListener('DOMContentLoaded', function () {
        document.body.innerHTML = '<p style="font:16px sans-serif;padding:24px">DakSetu cannot be shown inside another website. Open <a href="' + location.href + '" target="_top">' + location.href + '</a> directly.</p>'
        document.documentElement.style.visibility = ''
      })
    }
  } catch (e) {}
  try {
    var t = localStorage.getItem('daksetu:theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    if (t === 'dark') document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = t === 'dark' ? 'dark' : 'light'
  } catch (e) {}
})()
