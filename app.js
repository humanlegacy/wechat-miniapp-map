App({
  onShow: function (options) {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.globalData.width = res.windowWidth
        that.globalData.height = res.windowHeight
      }
    });
  },
  globalData:{
    width:0,
    height:0
  }
})
