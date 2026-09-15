export function contentTopInset(info = {}, capsule = {}) {
	const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0
	const statusHeight = Math.max(positive(info.statusBarHeight), positive(info.safeArea?.top), 20)
	const bottom = positive(capsule.bottom)
	return Math.ceil(Math.max(statusHeight + 44, bottom) + 12)
}

export function miniProgramContentTop(runtime) {
	let info = {}, capsule = {}
	try { info = runtime.getWindowInfo?.() || runtime.getSystemInfoSync?.() || {} }
	catch { try { info = runtime.getSystemInfoSync?.() || {} } catch {} }
	try { capsule = runtime.getMenuButtonBoundingClientRect?.() || {} } catch {}
	return contentTopInset(info, capsule)
}
