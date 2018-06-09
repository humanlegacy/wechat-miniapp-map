var $ = require('../../libs/conf.js');

Page({
  data: {
    navType: $.navType,
    type: '驾车',
    indexCurrent: 0,
    selected: '',
    cache: [],
    showMap: false,
    showDetail: false,
    showBusPaths: false
  },
  onLoad(opts) {
    /******
     请前往高地地图api 获取Web服务 API开发需要的Key
     http://lbs.amap.com/api/webservice/guide/create-project/get-key
     *******/
    if($.webKey === null){
      $.dialog('缺少高地地图Web服务 API开发需要的Key！请添加您自己的高德地图Key!');
      return;
    }
    //搜索列表
    if (opts.fromhistory == 0) {
      opts.POIlatitude = Number(opts.POIlocation.split(',')[1]);
      opts.POIlongitude = Number(opts.POIlocation.split(',')[0]);
      opts.x = 0;

      var history = wx.getStorageSync("historyList");
      if (history.length == 0) {
        wx.setStorageSync("historyList", [opts]);
      } else {
        var name = [];
        history.forEach(function (item) {
          name.push(item.name);
        });
        if (name.indexOf(opts.name) < 0) {
          history.unshift(opts);
          wx.setStorageSync("historyList", history);
        }
      }
    }

    //初始化地图控件
    var that = this;
    this.mapCtx = wx.createMapContext('myMap');
    this.setData(opts);
    wx.setNavigationBarTitle({
      title: that.data.type + '路线'
    });
    this.setData({
      markers: [{
        iconPath: "../../images/mapicon_navi_s.png",
        id: 0,
        latitude: opts.latitude,
        longitude: opts.longitude,
        width: 23,
        height: 33
      }, {
        iconPath: "../../images/mapicon_navi_e.png",
        id: 1,
        latitude: opts.POIlatitude,
        longitude: opts.POIlongitude,
        width: 24,
        height: 34
      }]
    });
    this.mapCtx.includePoints({
      padding: [50, 50, 50, 50],
      points: [{
        latitude: opts.latitude,
        longitude: opts.longitude
      }, {
        latitude: opts.POIlatitude,
        longitude: opts.POIlongitude
      }]
    });
    this.getRoute(this.data.navType, 0);
  },
  //切换出行方案
  changeNavType(e) {
    var idx = e.currentTarget.dataset.idx, data = this.data.navType;
    if (idx == this.data.selected) {
      return;
    }
    if(idx > 1){
      this.alert();
      return;
    }
    this.setData({ type: data[idx].name, indexCurrent: idx, selected: idx });
    wx.setNavigationBarTitle({
      title: data[idx].name + '路线'
    });

    //公交路线
    if (idx == 1) {
      this.getTransitRoute(0);
    } else {
      this.getRoute(data, idx)
    }
  },
  alert(){
    $.dialog("更多实例请搜索微信小程序52map");
  },
  //驾车
  getRoute(data, idx) {
    var that = this, temp = this.data.cache;
    if (typeof temp[idx] == 'object') {
      this.setData(temp[idx].info);
      this.setData(temp[idx].polyline);
      this.setData(temp[idx].other);
      wx.hideLoading();
      return;
    }

    wx.showLoading({ title: 'loading', mask: true });
    var origin = this.data.longitude + ',' + this.data.latitude;
    var destination = this.data.POIlongitude + ',' + this.data.POIlatitude;
    wx.request({
      url: 'https://restapi.amap.com/v3/distance',
      data: {
        key: $.webKey,
        origins: origin,
        destination: destination
      },
      success(res) {
        var distance = res.data.results[0].distance;
        // 驾车规划限时500公里
        if (data[idx].name == '驾车') {
          if (distance >= 500000) {
            wx.hideLoading();
            $.dialog("起点终点距离过长，驾车规划限制500公里以内");
            return;
          }
        }
        wx.request({
          url: data[idx].url,
          data: {
            key: $.webKey,
            origin: origin,
            destination: destination
          },
          success(res) {
            var data = res.data.route ? res.data.route : res.data.data;
            var path = data.paths[0],
              info = { info: data },
              polyline = {
                polyline: [{
                  points: $.polyline(data),
                  color: "#0091ff",
                  width: 6
                }]
              },
              other = {
                distance: $.distance(path.distance),
                duration: path.duration ? $.resultFormat(path.duration) : false,
                cost: data.taxi_cost ? parseInt(data.taxi_cost) : false,
                lights: path.traffic_lights ? path.traffic_lights : false,
                showMap: true,
                showNav: true,
                showDetail: true,
                showBusPaths: false
              };
            that.setData(info);
            that.setData(polyline);
            that.setData(other);

            temp[idx] = {
              info: info,
              polyline: polyline,
              other: other
            };
            that.setData({
              cache: temp
            });
            wx.hideLoading();
          }
        });
      }
    })
  },
  //公交线路
  getTransitRoute(strategy, fromOpts) {
    wx.showLoading({ title: 'loading', mask: true });
    var that = this, temp = this.data.cache;
    if (typeof temp[1] == 'object' && !fromOpts) {
      that.setData(temp[1].transits);
      that.setData(temp[1].other);
      wx.hideLoading();
      return;
    }
    wx.request({
      url: 'https://restapi.amap.com/v3/direction/transit/integrated',
      data: {
        key: $.webKey,
        origin: that.data.longitude + ',' + that.data.latitude,
        destination: that.data.POIlongitude + ',' + that.data.POIlatitude,
        city: that.data.city,
        cityd: that.data.cityd,
        strategy: strategy,
        nightflag: 0
      },
      success(res) {
        if (res.data.errcode) {
          wx.hideLoading();
          $.dialog(res.data.errdetail);
          return;
        }
        var route = res.data.route, transits = route.transits;
        for (var i = 0; i < transits.length; i++) {
          var item = transits[i], segments = item.segments;
          item.cost = parseInt(item.cost);
          item.distance = $.distance(item.distance);
          item.walking_distance = $.distance(item.walking_distance);
          item.duration = $.resultFormat(item.duration);
          item.transport = [];
          for (var j = 0; j < segments.length; j++) {
            if (segments[j].bus.buslines.length > 0) {
              var name = segments[j].bus.buslines[0].name.split('(')[0];
              if (j !== 0) {
                name = ' → ' + name;
              }
              item.transport.push(name);
            }
            if (segments[j].railway.spaces.length > 0) {
              var name = segments[j].railway.name;
              if (j !== 0) {
                name = ' → ' + name;
              }
              item.transport.push(name);
            }
          }
        }
        wx.setStorageSync('transits', transits);

        var transits = { transits: transits },
          other = {
            distance: $.distance(route.distance),
            cost: route.taxi_cost ? parseInt(route.taxi_cost) : false,
            showMap: false,
            showDetail: false,
            showNav: false,
            showBusPaths: true
          };
        that.setData(transits);
        that.setData(other);
        temp[1] = {
          transits: transits,
          other: other
        };
        that.setData({
          cache: temp
        });
        wx.hideLoading();
      }
    })
  },
  //切换公交出行方案
  transferOpts() {
    var that = this;
    wx.showActionSheet({
      itemList: ['最便捷', '最经济', '少换乘', '少步行', '不坐地铁'],
      success(res) {
        var type = (res.tapIndex == 4) ? (res.tapIndex + 1) : res.tapIndex;
        that.getTransitRoute(type, true);
      }
    })
  },
  //导航
  showNav() {
    wx.openLocation({
      name: this.data.name,
      address: this.data.address,
      latitude: Number(this.data.POIlatitude),
      longitude: Number(this.data.POIlongitude)
    })
  }

})