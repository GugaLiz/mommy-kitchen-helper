Component({
  properties: {
    recipe: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('tapcard', { id: this.properties.recipe.id })
    }
  }
})
