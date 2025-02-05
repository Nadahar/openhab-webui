<template>
  <div class="addon-install-button">
    <f7-segmented v-if="versioned" class="split-button" round :bgColor="buttonColor">
      <f7-button class="install-button" :text="buttonText" small @click="clicked()" />
      <f7-button class="install-menu-button" popover-open=".addon-version-select" icon-f7="chevron_down" small />
    </f7-segmented>
    <f7-button v-else class="install-button" :text="buttonText" :color="buttonColor" round small fill @click="clicked()" />
    <addon-version-select @version-selected="(v) => versionSelected(v)" :addon="addon" />
  </div>
</template>

<style lang="stylus">
.addon-install-button
  .split-button
    .install-button
      --f7-button-text-color var(--f7-page-bg-color)
      --f7-button-text-transform uppercase
      padding-left 15px
      padding-right 10px
      font-size 16px
      text-overflow: clip
    .install-menu-button
      --f7-button-text-color var(--f7-page-bg-color)
      padding-left 7px
      padding-right 16px
      text-overflow: clip
      border-left-width: thin
      border-left-color: var(--f7-page-bg-color)
      width 40px
  .install-button
    --f7-button-text-transform uppercase
    padding-left 15px
    padding-right 15px
    font-size 16px
    text-overflow: clip
</style>

<script>

import AddonVersionSelect from '@/components/addons/addon-version-select.vue'

export default {
  props: ['addon'],
  components: {
    AddonVersionSelect
  },
  emits: ['clicked', 'install', 'uninstall', 'upgrade', 'downgrade'], // TODO: (Nad) Figure out emits
  computed: {
    versioned () {
      return this.addon && this.addon.versions && Object.keys(this.addon.versions).length > 1
    },
    installable () {
      return (this.addon && (this.addon.contentType === 'application/vnd.openhab.bundle' || this.addon.contentType.indexOf('application/vnd.openhab.feature') === 0))
    },
    buttonColor () {
      if (!this.addon) {
        return 'gray'
      }
      if (this.addon.installed) {
        // TODO: (Nad) Upgrade/downgrade
        return 'red'
      }
      return 'blue'
    },
    buttonText () {
      if (!this.addon) {
        return ''
      }
      if (this.addon.installed) {
        // TODO: (Nad) Upgrade/downgrade
        return 'Remove'
      }
      return this.installable ? 'Install' : 'Add'
    } // TODO: (Nad) Clean up not needed
  },
  methods: {
    clicked () {
      this.$emit('clicked') // TODO: (Nad) Emit actual event
    },
    versionSelected (version) {
      this.$emit('version-selected', version)
    }
  }
}
</script>
