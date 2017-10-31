//QQ地图SDK
var QQMapWX = require('../../libs/qqmap-wx-jssdk.min.js');

// 实例化API核心类
var QQMapWX = new QQMapWX({
  key: 'COVBZ-PGML5-VPWIN-QR3OM-XS26O-24FPI'
});

//获取屏幕尺寸
var data = getApp().globalData;
Page({
  data: {
    latitude: 0,
    longitude: 0,
    controls: [
      {
        id: '2',
        clickable: true,
        iconPath: '../../images/btn-pos.png',
        position: { left: 10, top: data.height - data.height * 0.25 - 95, width: 60, height: 60 }
      },
    ],
    markers: [],
    points:[],
    title:'',
    address:'',
    mapTitle:'',
    location:'',
  },

  onLoad: function (opts) {
    this.mapCtx = wx.createMapContext('myMap')

    //搜索结果位置坐标
    this.setData({
      markers: [
        {
          latitude: opts.location.split(',')[0],
          longitude: opts.location.split(',')[1]
        }
      ],
      points:[
        {
          latitude: opts.location.split(',')[0],
          longitude: opts.location.split(',')[1]
        }
      ],
      title: opts.title,
      mapTitle: opts.title,
      address: opts.address,
      location: opts.location
    });
    
    //我的当前位置
    this.getLocation();
  
  },
  //初始化定位&我的当前位置
  getLocation: function () {
    var that = this
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        that.data.markers.push(res)
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          points: that.data.markers
        });
      }
    });
  },

  //定位到当前位置
  controltap: function (e) {
    if (e.controlId == 2) {
      this.mapCtx.moveToLocation()
    }
  },

  //导航
  gps:function(){
    var that = this;
    wx.openLocation({
      name:that.data.title,
      address:that.data.address,
      latitude: Number(that.data.location.split(',')[0]),
      longitude: Number(that.data.location.split(',')[1]),
      scale: 10
    })
  }

})