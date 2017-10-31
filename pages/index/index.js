var QQMapWXSDK = require('../../libs/qqmap-wx-jssdk.min.js');
var qqmapsdk;
var data = getApp().globalData;

Page({
  data: {
    //poi搜索位置
    location:{},
    //城市下拉
    citySelected:'获取位置中',
    cityData: {},
    hotCityData:[],
    _py: ["hot","A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "W", "X", "Y", "Z"],
    _hotCity:["北京市","广州市","成都市","深圳市","杭州市","武汉市"],
    //搜索列表
    inputVal:'',
    searchList:[],
    cityListShow:false,
    inputListShow:false,
    hidden: true,
    showPy:''
  },

  onLoad: function (options) {
    qqmapsdk = new QQMapWXSDK({
      key: 'COVBZ-PGML5-VPWIN-QR3OM-XS26O-24FPI'
    }); 
  },
  onShow:function(){
    wx.showLoading({ title:'获取位置中'});
    var that = this;

    //获得当前位置坐标
    wx.getLocation({
      success: function (res) {
      //  console.log(res)
        //坐标转详细地址
        that.setData({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (res) {
            //通过定位获得当前位置
            that.setData({
              citySelected: res.result.ad_info.city
            });
          }
        });
      }
    })

    // 调用接口,获得全国城市列表
    qqmapsdk.getCityList({
      success: function (res) {
        var cityArr = res.result[0].concat(res.result[1]),city = {},hotCity = [];
        that.data._py.forEach(function(key){
          cityArr.forEach(function (val) {
            var py = val.pinyin[0][0].toUpperCase();
            if(py === key){
              if (city[py] === undefined) {
                city[py] = [];
                city[py].push(val)
              } else {
                city[py].push(val)
              }
            }
            if (that.data._hotCity.indexOf(val.fullname)>=0){
              if (hotCity.length < that.data._hotCity.length){
                hotCity.push(val)
              }
            }
          });
        });
        that.setData({
          cityData: city,
          hotCityData: hotCity
        });
        wx.hideLoading()
      }
    });

  },

  //搜索关键字
  keyword: function (keyword){
    var that = this;
    qqmapsdk.search({
      keyword: keyword,
      page_size:20,
      location: that.data.location,
      success: function (res) {
        that.setData({
          searchList: res.data
        });
      }
    });
  },

  //打开城市列表
  openCityList:function(){
    this.setData({
      cityListShow: true,
      inputListShow: false
    });
  },

  //选择城市
  selectCity:function(e){
  //  console.log(e)
    this.setData({
      citySelected: e.currentTarget.dataset.fullname,
      cityListShow: false,
      inputListShow:false,
      location: {
        latitude: e.currentTarget.dataset.lat,
        longitude: e.currentTarget.dataset.lng
      }
    });

    this.keyword(this.data.inputVal)
  },


  //输入
  input:function(e){
    if (e.detail.value == ''){
      this.setData({
        inputVal: e.detail.value,
        inputListShow: false,
        cityListShow: false
      });
    }else{
      this.setData({
        inputVal: e.detail.value,
        inputListShow: true,
        cityListShow: false
      });
      this.keyword(e.detail.value)
    }
  },

  //清除输入框
  clear:function(){
    this.setData({
      inputVal: '',
      inputListShow: false
    })
  },

  //取消返回
  cancel:function(){
    wx.navigateBack();
  },

  //跳转到详情页
  detail:function(e){
    wx.navigateTo({
      url: '../detail/detail?location=' + e.currentTarget.dataset.location + '&title=' + e.currentTarget.dataset.title + '&address=' + e.currentTarget.dataset.address
    })
  },



  //获取文字信息
  getPy: function (e) {
    this.setData({
      showPy: e.target.id,
      scrollTopId: e.target.id
    })
  },

  //滑动选择城市
  tMove: function (e) {
    var y = e.touches[0].clientY;
    var offsettop = e.currentTarget.offsetTop;
    var that = this;

    //判断选择区域,只有在选择区才会生效
    if (y > offsettop ) {
      var num = parseInt((y - offsettop) / 12);
      this.setData({
        showPy: that.data._py[num]
      })
    };
      
  },
  //触发全部开始选择
  tStart: function () {
    this.setData({
      hidden: false
    })
  },
  //触发结束选择
  tEnd: function () {
    this.setData({
      hidden: true,
      scrollTopId: this.data.showPy
    })
  }


  
  
})