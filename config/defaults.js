const CONFIG = {
	brand: '金榔记',
	brandEn: 'JINLANGJI',
	brandMark: '榔',
	brandLogo: '',
	adminSubtitle: '总部运营中枢',
	actName: '开码有礼',
	actSub: '一码一兑 · 全程可追溯',
	slogan: '撕开包装，扫码开奖',
	active: false,
	actStart: '',
	actEnd: '',
	codeLen: 6,
	dailyLimit: 0,
	prizeValidDays: 30,
	homeBg: '/assets/brand-grove-v2.jpg',
	poster: '/assets/hero-fruit.jpg',
	productImg: '/assets/product-30.png',
	ruleBg: '/assets/brand-grove-v2.jpg',
	sceneImgs: [
		'/assets/product-30.png',
		'/assets/product-50.png',
		'/assets/product-100.png'
	],
	notice: { on: false, badge: '公告', buttonText: '我知道了', image: '', title: '', date: '', lines: [] },
	marquee: [],
	steps: [
		{ icon: 'shopping-bag', t: '购买活动产品', d: '购买带有“开码有奖”标识的金榔记产品' },
		{ icon: 'package', t: '获取数字兑换码', d: '打开包装，找到包装内的 6 位数字兑换码' },
		{ icon: 'message-circle', t: '微信登录兑奖', d: '微信授权登录后输入兑换码，立即查看中奖结果' },
		{ icon: 'store', t: '到店出示凭证', d: '中奖后在有效期内选择门店，出示二维码完成核销' }
	],
	verifySteps: [
		'顾客出示中奖记录中的领取凭证',
		'门店人员扫描二维码或输入 6 位核销码',
		'确认奖品与顾客信息后完成交付',
		'系统记录操作人、门店、时间与核销位置'
	],
	service: { phone: '', wechat: '', time: '' },
	terms: []
}

export default CONFIG
