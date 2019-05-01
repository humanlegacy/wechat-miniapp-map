var $ = require('../../libs/conf.js');
var city = require('../../libs/city.js');

Page({
    data: {
        //城市下拉
        citySelected: '上海市',
        city: '上海市',
        cityData: {},
        hotCityData: [],
        _py: ["hot", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "W", "X", "Y", "Z"],
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
    onLoad: function() {
        var that = this;
            // myCity = wx.getStorageSync("myCity");

        this.setData({
            historyList: wx.getStorageSync("historyList").length > 0 ? wx.getStorageSync("historyList") : []
        });

        this.setData({
            // citySelected: myCity,
            // city: myCity,
            latitude: wx.getStorageSync("latitude"),
            longitude: wx.getStorageSync("longitude"),
            sname: "我的位置",
            saddress: '上海市浦东新区'
        });

        this.setData({
            cityData: city.all,
            hotCityData: city.hot
        });
    },
    select(event) {
        var query = event.currentTarget.dataset;
        query.POIlongitude = query.poilocation.split(',')[0];
        query.POIlatitude = query.poilocation.split(',')[1];
        wx.navigateTo({
            url: '../detail/detail?query=' + JSON.stringify(query)
        });
        //历史记录
        var history = $.saveHistory(wx.getStorageSync("historyList"), query);
        this.setData({
            historyList: history
        });
        wx.setStorageSync("historyList", history);
    },

    //搜索关键字
    keyword: function(keyword) {
        var that = this;
        $.map.getInputtips({
            keywords: keyword,
            location: that.data.longitude + "," + that.data.latitude,
            success: function(data) {
                if (data && data.tips) {
                    var searchList = data.tips.filter((item) => {
                        return typeof item.location != 'undefined';
                    })
                    that.setData({
                        searchList: searchList
                    });
                }
            }
        });
    },

    //打开城市列表
    openCityList: function() {
        this.setData({
            cityListShow: true,
            inputListShow: false,
            historyListShow: false
        });
    },

    //选择城市
    selectCity: function(e) {
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
    },
    touchstart: function(e) {
        this.setData({
            index: e.currentTarget.dataset.index,
            Mstart: e.changedTouches[0].pageX
        });
    },
    touchmove: function(e) {
        var history = this.data.historyList;
        var move = this.data.Mstart - e.changedTouches[0].pageX;
        history[this.data.index].x = move > 0 ? -move : 0;
        this.setData({
            historyList: history
        });
    },
    touchend: function(e) {
        var history = this.data.historyList;
        var move = this.data.Mstart - e.changedTouches[0].pageX;
        history[this.data.index].x = move > 100 ? -180 : 0;
        this.setData({
            historyList: history
        });
    },
    //获取文字信息
    getPy: function(e) {
        this.setData({
            hidden: false,
            showPy: e.target.id,
        })
    },

    setPy: function(e) {
        this.setData({
            hidden: true,
            scrollTopId: this.data.showPy
        })
    },

    //滑动选择城市
    tMove: function(e) {
        var y = e.touches[0].clientY,
            offsettop = e.currentTarget.offsetTop;

        //判断选择区域,只有在选择区才会生效
        if (y > offsettop) {
            var num = parseInt((y - offsettop) / 12);
            this.setData({
                showPy: this.data._py[num]
            })
        };
    },

    //触发全部开始选择
    tStart: function() {
        this.setData({
            hidden: false
        })
    },

    //触发结束选择
    tEnd: function() {
        this.setData({
            hidden: true,
            scrollTopId: this.data.showPy
        })
    },
    //清空历史记录
    clearHistory: function() {
        var that = this;
        wx.showActionSheet({
            itemList: ['清空'],
            itemColor: '#DD4F43',
            success: function(res) {
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
    del: function(e) {
        var that = this;
        wx.showActionSheet({
            itemList: ['删除'],
            itemColor: '#DD4F43',
            success: function(res) {
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
    input: function(e) {
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
            this.keyword(this.data.citySelected + e.detail.value)
        }
    },

    //清除输入框
    clear: function() {
        this.setData({
            inputVal: '',
            inputListShow: false,
            historyListShow: true
        })
    }
})