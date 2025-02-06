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
  emits: ['clicked', 'install', 'uninstall', 'upgrade', 'downgrade', 'version-selected'], // TODO: (Nad) Figure out emits
  computed: {
    versioned () {
      return this.addon && this.addon.versions && Object.keys(this.addon.versions).length > 1
    },
    installable () {
      return (this.addon && (this.addon.contentType === 'application/vnd.openhab.bundle' || this.addon.contentType.indexOf('application/vnd.openhab.feature') === 0))
    },
    buttonAction () {
      if (!this.addon) {
        return 'none'
      }
      if (this.addon.installed) {
        if (this.versioned && this.addon.installedVersion && this.addon.installedVersion !== this.addon.version) {
          let instIdx, verIdx
          let versions = Object.keys(this.addon.versions)
          for (let i = 0; i < versions.length; i++) {
            if (!instIdx && versions[i] === this.addon.installedVersion) {
              instIdx = i
            }
            if (!verIdx && versions[i] === this.addon.version) {
              verIdx = i
            }
          }
          if (instIdx !== undefined && verIdx !== undefined) {
            return instIdx < verIdx ? 'downgrade' : 'upgrade'
          } else {
            return 'uninstall'
          }
        }
        return 'uninstall'
      }
      return 'install'
    },
    buttonColor () {
      switch (this.buttonAction) {
        case 'install':
          return 'blue'
        case 'uninstall':
          return 'red'
        case 'upgrade':
          return 'green'
        case 'downgrade':
          return 'orange'
        default:
          return 'gray'
      }
    },
    buttonText () {
      switch (this.buttonAction) {
        case 'install':
          return this.installable ? 'Install' : 'Add'
        case 'uninstall':
          return 'Remove'
        case 'upgrade':
          return 'Upgrade'
        case 'downgrade':
          return 'Downgrade'
        default:
          return ''
      }
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
