<template>
  <f7-popover ref="popover" class="addon-version-select" closeByBackdropClick closeByOutsideClick closeOnEscape>
    <div class="block-title">
      Select version
    </div>
    <div class="list">
      <ul>
        <li v-for="version in versions" :key="version.name">
          <label class="item-radio item-content" @click="versionSelected(version)">
            <input type="radio" name="version-select" :value="version.name" :checked="version.selected">
            <i class="icon icon-radio" />
            <div class="item-inner" :title="versionTooltip(version)">
              <div class="item-title" :class="versionClasses(version)">{{ version.name }}</div>
            </div>
          </label>
        </li>
      </ul>
    </div>
  </f7-popover>
</template>

<style lang="stylus">
.addon-version-select
  border-radius: 20px;
  padding: 0px 10px 10px 10px;
  .block-title
    font-weight: 700;
  .item-title.incompatible:before
    content: 'exclamationmark_triangle_fill'
    font-family: 'Framework7 Icons'
    font-style: normal
    font-weight: 400
    color: red
    margin-inline-end: 0.3em
  .item-title.latest:after
    content: 'checkmark_shield_fill'
    font-family: 'Framework7 Icons'
    font-style: normal
    font-weight: 400
    margin-inline-start: 0.3em
    color: green
</style>

<script>

export default {
  props: ['addon'],
  emits: ['versionSelected'],
  computed: {
    versions () {
      if (!this.addon || !this.addon.versions) {
        return []
      }
      let result = Object.keys(this.addon.versions).flatMap((k) => {
        let result = {
          name: this.addon.versions[k].version,
          compatible: this.addon.versions[k].compatible,
          stable: this.addon.versions[k].stable
        }
        if (this.addon.versions[k].version === this.addon.currentVersion) {
          result.selected = true
        }
        if (this.addon.versions[k].version === this.addon.defaultVersion) {
          result.latest = true
        }
        return result
      })
      return result
    }
  },
  methods: {
    versionClasses (version) {
      let result = []
      if (!version.compatible) {
        result.push('incompatible')
      }
      if (version.stable) {
        result.push('stable')
      }
      if (version.latest) {
        result.push('latest')
      }
      return result.join(' ')
    },
    versionTooltip (version) {
      return version.latest ? 'Latest stable' : (version.compatible ? undefined : 'Incompatible')
    },
    versionSelected (version) {
      this.$emit('version-selected', version)
      this.$refs.popover.close()
    }
  }
}
</script>
