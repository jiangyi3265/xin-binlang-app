// Use packaged public artwork, never the current page screenshot or its query.
// Personal records, redemption codes and login state must stay out of shares.
export function activityShare() {
	return {
		title: '倌榔 · 一码一礼，选牌揭晓好礼',
		path: '/pages/index/index',
		imageUrl: '/static/share/guanlang.jpg'
	}
}
