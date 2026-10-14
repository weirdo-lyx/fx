export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/review/index',
    'pages/result/index',
    'pages/mine/index',
    'pages/login/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '抗遗忘单词复习',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#9C9C90',
    selectedColor: '#E67E00',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '复习'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
