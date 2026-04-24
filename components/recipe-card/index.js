Component({
  properties: {
    recipe: {
      type: Object,
      value: {}
    },
    showOwnerActions: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('tapcard', { id: this.properties.recipe.id })
    },

    handleVisibilityTap() {
      this.triggerEvent('visibilitytap', {
        id: this.properties.recipe.id,
        isPublic: this.properties.recipe.isPublic
      })
    },

    handleEditTap() {
      this.triggerEvent('edittap', {
        id: this.properties.recipe.id
      })
    }
  }
})
