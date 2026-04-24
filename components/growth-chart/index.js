Component({
  properties: {
    chartList: {
      type: Array,
      value: []
    },
    chartData: {
      type: Object,
      value: null
    },
    percentileText: {
      type: String,
      value: 'P50 分位'
    }
  },

  data: {
    currentIndex: 0,
    charts: []
  },

  observers: {
    'chartList, chartData': function(chartList, chartData) {
      const charts = chartList && chartList.length ? chartList : (chartData ? [chartData] : [])
      this.setData({ charts })
    }
  },

  methods: {
    handleSwiperChange(event) {
      this.setData({ currentIndex: event.detail.current || 0 })
    }
  }
})
