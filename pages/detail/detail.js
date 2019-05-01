var $ = require('../../libs/conf.js');
var userKey = '高德小程序key';
Page({
    data: {
        navType: $.navType,
        type: '驾车',
        selected: 0,
        selectType: '最便捷',
        cache: [],
        showMap: false,
        showDetail: false,
        showBusPaths: false
    },
    onLoad: function (opts) {
        //初始化地图控件
        this.mapCtx = wx.createMapContext('myMap');

        //接收参数
        if (opts.query) {
            this.setData({ opts: JSON.parse(opts.query) });
        } else {
            this.setData({ opts: opts });
        }

        this.setData({
            selected: this.data.opts.idx,
            markers: [{
                iconPath: "../../images/mapicon_navi_s.png",
                id: 0,
                latitude: 31.22114,
                longitude: 121.54409,
                width: 23,
                height: 33
            }, {
                iconPath: "../../images/mapicon_navi_e.png",
                id: 1,
                latitude: this.data.opts.POIlatitude,
                longitude: this.data.opts.POIlongitude,
                width: 23,
                height: 33
            }]
        });
        this.mapCtx.includePoints({
            padding: [50, 50, 50, 50],
            points: [{
                latitude: 31.22114,
                longitude: 121.54409,
            }, {
                latitude: this.data.opts.POIlatitude,
                longitude: this.data.opts.POIlongitude
            }]
        });

        //idx == 1 公交路线；否则其他方式出行
        if (this.data.opts.idx == 1) {
            this.getTransitRoute(0);
        } else {
            this.getRoute(this.data.navType, this.data.opts.idx)
        }

        // this.getRoute(this.data.navType, 0);
    },
    //切换出行方案
    changeNavType: function (e) {
        var idx = e.currentTarget.dataset.idx,
            data = this.data.navType;
        if (idx == this.data.selected) {
            return;
        }
        this.setData({
            type: data[idx].name,
            // indexCurrent: idx,
            selected: idx
        });

        //idx == 1 公交路线；否则其他方式出行
        if (idx == 1) {
            this.getTransitRoute(0);
        } else {
            this.getRoute(data, idx)
        }
    },
    //驾车，骑行，步行线路
    getRoute: function (data, idx) {
        wx.showNavigationBarLoading();
        var temp = this.data.cache;
        if (typeof temp[idx] == 'object') {
            this.setData(temp[idx].info);
            this.setData(temp[idx].polyline);
            this.setData(temp[idx].other);
            wx.hideNavigationBarLoading();
            return;
        }

        var that = this,
            origin = '121.54409,31.22114',
            destination = this.data.opts.POIlongitude + ',' + this.data.opts.POIlatitude;
        wx.request({
            url: 'https://restapi.amap.com/v3/distance',
            data: {
                key: userKey,
                origins: origin,
                destination: destination
            },
            success: function (res) {
                var distance = res.data.results[0].distance;
                // 步行规划限制5公里
                if (data[idx].name == '步行') {
                    if (distance >= 5000) {
                        that.setData({
                            showDetail: false,
                            showBusPaths: false,
                            showMap: false
                        });
                        wx.hideNavigationBarLoading();
                        $.dialog("起点终点距离过长，步行规划限制5公里以内");
                        return;
                    }
                }
                //骑行规划限制15公里
                if (data[idx].name == '骑行') {
                    if (distance >= 15000) {
                        that.setData({
                            showDetail: false,
                            showBusPaths: false,
                            showMap: false
                        });
                        wx.hideNavigationBarLoading();
                        $.dialog("起点终点距离过长,骑行限制15公里以内");
                        return;
                    }
                }
                // 驾车规划限时500公里
                if (data[idx].name == '驾车') {
                    if (distance >= 500000) {
                        wx.hideNavigationBarLoading();
                        $.dialog("起点终点距离过长，驾车规划限制500公里以内");
                        return;
                    }
                }
                wx.request({
                    url: data[idx].url,
                    data: {
                        key: userKey,
                        origin: origin,
                        destination: destination
                    },
                    success: function (res) {
                        var data = res.data.route ? res.data.route : res.data.data;
                        var path = data.paths[0],
                            info = {
                                info: data
                            },
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
                        wx.hideNavigationBarLoading();
                    }
                });
            }
        })
    },
    //公交线路
    getTransitRoute: function (strategy, fromOpts) {
        wx.showNavigationBarLoading();
        var that = this,
            temp = this.data.cache;
        if (typeof temp[1] == 'object' && !fromOpts) {
            that.setData(temp[1].transits);
            that.setData(temp[1].other);
            wx.hideNavigationBarLoading();
            return;
        }
        wx.request({
            url: 'https://restapi.amap.com/v3/direction/transit/integrated',
            data: {
                key: userKey,
                origin: '121.54409,31.22114',
                destination: that.data.opts.POIlongitude + ',' + that.data.opts.POIlatitude,
                city: that.data.city,
                cityd: that.data.cityd,
                strategy: strategy,
                nightflag: 0
            },
            success: function (res) {
                if (res.data.errcode) {
                    wx.hideNavigationBarLoading();
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

                var transits = {
                    transits: transits
                },
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
                wx.hideNavigationBarLoading();
            }
        })
    },
    //切换公交出行方案
    transferOpts: function () {
        var that = this, itemList = ['最便捷', '最经济', '少换乘', '少步行', '不坐地铁'];
        wx.showActionSheet({
            itemList: itemList,
            success: function (res) {
                var type = (res.tapIndex == 4) ? (res.tapIndex + 1) : res.tapIndex;
                that.getTransitRoute(type, true);
                that.setData({
                    selectType: itemList[res.tapIndex]
                })
            }
        })
    },
    //导航
    showNav: function () {
        wx.openLocation({
            name: this.data.opts.name,
            address: this.data.opts.address,
            latitude: Number(this.data.opts.POIlatitude),
            longitude: Number(this.data.opts.POIlongitude)
        })
    },
    onShareAppMessage: function () {
        return {
            title: this.data.opts.name + '(' + this.data.opts.address + ')',
            path: '/pages/route-detail/route-detail?share=share&query=' + JSON.stringify(this.data.opts)
        }
    }

})