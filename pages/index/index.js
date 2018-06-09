var $ = require('../../libs/conf.js');
var cityData = require('../../libs/city.js');

Page({
  data: {
    //城市下拉
    citySelected: '获取位置中',
    cityData: {},
    hotCityData: [],
    _py: ["hot", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "W", "X", "Y", "Z"],
    _hotCity: ["北京市", "上海市", "广州市", "深圳市", "杭州市", "苏州市", "成都市"],
    //搜索列表
    inputVal: '',
    searchList: [],
    cityListShow: false,
    inputListShow: false,
    hidden: true,
    showPy: '★',

    //搜索历史记录
    historyListShow: true,
    historyList: []
  },
  onShow() {
    var history = wx.getStorageSync("historyList").length > 0 ? wx.getStorageSync("historyList") : [];
    this.setData({
      historyList: history
    });
  },
  onLoad() {
    var that = this;
    wx.showNavigationBarLoading();
    //获得当前位置坐标
    $.map.getRegeo({
      success(data) {
        var data = data[0], city = data.regeocodeData.addressComponent.province;
        that.setData({
          citySelected: city,
          city: city,
          latitude: data.latitude,
          longitude: data.longitude,
          sname: "我的位置",
          saddress: data.name
        });
        //查询全国城市列表
        var cityArr = cityData.result[0].concat(cityData.result[1]), city = {}, hotCity = [];
        that.data._py.forEach((key)=> {
          cityArr.forEach((val)=> {
            var py = val.pinyin[0][0].toUpperCase();
            if (py === key) {
              if (city[py] === undefined) {
                city[py] = [];
              }
              city[py].push(val)
            }
            if (that.data._hotCity.indexOf(val.fullname) >= 0) {
              if (hotCity.length < that.data._hotCity.length) {
                hotCity.push(val)
              }
            }
          });
        });
        that.setData({
          cityData: city
        });
        that.setData({
          hotCityData: hotCity
        });
        wx.hideNavigationBarLoading();
      }
    });
  },

  //搜索关键字
  keyword(keyword) {
    var that = this;
    $.map.getInputtips({
      keywords: keyword,
      location: that.data.longitude + "," + that.data.latitude,
      success(data) {
        if (data && data.tips) {
          data.tips.shift();
          that.setData({
            searchList: data.tips
          });
          wx.hideNavigationBarLoading();
        }
      }
    });
  },

  //打开城市列表
  openCityList() {
    this.setData({
      cityListShow: true,
      inputListShow: false,
      historyListShow: false
    });
  },

  //选择城市
  selectCity(e) {
    var dataset = e.currentTarget.dataset;
    this.setData({
      citySelected: dataset.fullname,
      cityListShow: false,
      inputListShow: false,
      historyListShow: true,
      location: {
        latitude: dataset.lat,
        longitude: dataset.lng
      }
    });
    this.keyword(this.data.citySelected + this.data.inputVal)
  },
  touchstart(e) {
    this.setData({
      index: e.currentTarget.dataset.index,
      Mstart: e.changedTouches[0].pageX
    });
  },
  touchmove(e) {
    var history = this.data.historyList;
    var move = this.data.Mstart - e.changedTouches[0].pageX;
    history[this.data.index].x = move > 0 ? -move : 0;
    this.setData({
      historyList: history
    });
  },
  touchend(e) {
    var history = this.data.historyList;
    var move = this.data.Mstart - e.changedTouches[0].pageX;
    history[this.data.index].x = move > 100 ? -180 : 0;
    this.setData({
      historyList: history
    });
  },
  //获取文字信息
  getPy(e) {
    this.setData({
      hidden: false,
      showPy: e.target.id,
    })
  },

  setPy(e) {
    this.setData({
      hidden: true,
      scrollTopId: this.data.showPy
    })
  },

  //滑动选择城市
  tMove(e) {
    var y = e.touches[0].clientY,
      offsettop = e.currentTarget.offsetTop,
      that = this;

    //判断选择区域,只有在选择区才会生效
    if (y > offsettop) {
      var num = parseInt((y - offsettop) / 12);
      this.setData({
        showPy: that.data._py[num]
      })
    };
  },

  //触发全部开始选择
  tStart() {
    this.setData({
      hidden: false
    })
  },

  //触发结束选择
  tEnd() {
    this.setData({
      hidden: true,
      scrollTopId: this.data.showPy
    })
  },
  //清空历史记录
  clearHistory() {
    var that = this;
    wx.showActionSheet({
      itemList: ['清空'],
      itemColor: '#DD4F43',
      success(res) {
        if (res.tapIndex == 0) {
          that.setData({
            historyList: []
          });
          wx.setStorageSync("historyList", []);
        }
      }
    })
  },
  //删除某一条
  del(e) {
    var that = this;
    wx.showActionSheet({
      itemList: ['删除'],
      itemColor: '#DD4F43',
      success(res) {
        if (res.tapIndex == 0) {
          var index = e.currentTarget.dataset.index,
            history = that.data.historyList;
          history.splice(index, 1);
          that.setData({
            historyList: history
          });
          wx.setStorageSync("historyList", history);
        }
      }
    });
  },
  //输入
  input(e) {
    if (e.detail.value == '') {
      this.setData({
        inputVal: e.detail.value,
        inputListShow: false,
        cityListShow: false,
        historyListShow: true
      });
    } else {
      this.setData({
        inputVal: e.detail.value,
        inputListShow: true,
        cityListShow: false,
        historyListShow: false
      });
      wx.showNavigationBarLoading();
      this.keyword(this.data.citySelected + e.detail.value)
    }
  },

  //清除输入框
  clear() {
    this.setData({
      inputVal: '',
      inputListShow: false,
      historyListShow: true
    })
  }
})