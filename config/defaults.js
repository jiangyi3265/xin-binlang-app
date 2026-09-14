const CONFIG = {
	brand: '倌榔',
	brandEn: 'GUANLANG',
	brandMark: '倌',
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
	homeBg: '/assets/guanlang-botanical-blue.png',
	poster: '',
	productImg: '/assets/guanlang-product-50.jpg',
	ruleBg: '/assets/guanlang-botanical-blue.png',
	sceneImgs: [
		'/assets/guanlang-product-30.png',
		'/assets/guanlang-product-50.jpg'
	],
	notice: { on: false, badge: '公告', buttonText: '我知道了', image: '', title: '', date: '', lines: [] },
	marquee: [],
	steps: [
		{ icon: 'shopping-bag', t: '购买活动产品', d: '购买带有“开码有奖”标识的倌榔产品' },
		{ icon: 'package', t: '获取数字兑换码', d: '打开包装，找到包装内的 6 位数字兑换码' },
		{ icon: 'message-circle', t: '登录后自主选牌', d: '微信登录后输入兑换码，选择一张牌翻开本次结果' },
		{ icon: 'store', t: '按奖励领取', d: '换购奖到店补款核销；现金红包在微信小程序内领取' }
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
