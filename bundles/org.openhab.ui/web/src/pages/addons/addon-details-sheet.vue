<template>
  <f7-sheet ref="sheet" class="demo-sheet-swipe-to-step" @sheet:closed="$emit('closed')" swipe-to-close swipe-to-step backdrop>
    <div class="sheet-modal-swipe-step">
      <div v-if="!noDetails" class="swipe-handler" @click="toggleSwipeStep" />
      <f7-block-title><strong><big>{{ addon.label }}</big></strong></f7-block-title>
      <f7-block v-if="state === 'UNINSTALLED'">
        <h3 v-if="missingDependencies" class="text-color-red display-flex align-items-center">
          <f7-icon f7="lock_shield" class="margin-right" />
          Missing dependency
        </h3>
        <div v-else-if="addon.verifiedAuthor" class="text-color-green display-flex align-items-center">
          <f7-icon f7="checkmark_shield" class="margin-right" />
          Verified Author
        </div>
        <h3 v-else-if="showUnpublishedWarning" class="text-color-red display-flex align-items-center">
          <f7-icon f7="xmark_shield" class="margin-right" />
          WARNING! UNPUBLISHED ADD-ON
        </h3>
        <div v-else-if="showUnverifiedAuthorWarning" class="text-color-orange display-flex align-items-center">
          <f7-icon f7="exclamationmark_shield" class="margin-right" />
          Unverified Author
        </div>
        <f7-block-footer v-if="missingDependencies && aMissingDependency.link" class="display-flex align-items-center">
          <span><strong>{{ this.aMissingDependency.name }}</strong>&#32;must be installed before this add-on can be {{ installableAddon ? 'installed' : 'added' }}.</span>
        </f7-block-footer>
        <f7-block-footer v-else-if="missingDependencies" class="display-flex align-items-center">
          <span>"<strong>{{ this.aMissingDependency.name }}</strong>" must be installed manually before this add-on can be {{ installableAddon ? 'installed' : 'added' }}.</span>
        </f7-block-footer>
        <f7-block-footer v-if="!missingDependencies && showUnpublishedWarning" class="display-flex align-items-center text-color-red">
          This add-on has not been published to the Marketplace. DO NOT install this add-on, unless for debugging purposes if you are the author or a marketplace curator!<br><br>
          Please make sure "Show Unpublished Entries" is not inadvertently turned on in Settings > Community Marketplace.
        </f7-block-footer>
        <f7-block-footer v-if="!missingDependencies && showUnverifiedAuthorWarning" class="display-flex align-items-center">
          <small>Adding this type of add-on from unknown providers can harm your system because its code might not have been properly reviewed. Make sure you trust the source and understand the risks before installing this add-on.</small>
        </f7-block-footer>
      </f7-block>
      <f7-block>
        <f7-row>
          <f7-col class="col-100 margin-top padding-horizontal">
            <f7-button v-if="missingDependencies && aMissingDependency.link && state === 'UNINSTALLED'" large fill color="orange" @click="gotoDependency()">
              Go to {{ aMissingDependency.name }}
            </f7-button>
            <f7-button v-else-if="missingDependencies && state === 'UNINSTALLED'" large fill color="gray" @click="close()">
              Close
            </f7-button>
            <f7-button v-else-if="state === 'UNINSTALLED'" large fill color="blue" @click="install()">
              {{ installableAddon ? 'Install' : 'Add' }}
            </f7-button>
            <f7-button v-else large fill color="red" @click="uninstall()">
              {{ installableAddon ? 'Uninstall' : 'Remove' }}
            </f7-button>
          </f7-col>
        </f7-row>
      </f7-block>
      <f7-block class="padding-bottom no-margin-vertical" @click.native="toggleSwipeStep">
        <div v-if="!noDetails" class="margin-top margin-bottom text-align-center" style="cursor:pointer">
          <f7-icon f7="chevron_down_circle" />&nbsp;Expand for details
        </div>
      </f7-block>
    </div>
    <f7-page-content v-if="!noDetails" style="margin-top: var(--f7-safe-area-top)">
      <addon-info-table :addon="addon" :dependencies="dependencies" class="no-margin-top" />
    </f7-page-content>
  </f7-sheet>
</template>

<style lang="stylus">
.demo-sheet-swipe-to-step
  height auto

.demo-sheet-swipe-to-close,
.demo-sheet-swipe-to-step {
  --f7-sheet-border-color: transparent;
  border-radius: 15px 15px 0 0;
  overflow: hidden;
}
.swipe-handler {
  height: 16px;
  position: absolute;
  left: 0;
  width: 100%;
  top: 0;
  cursor: pointer;
  z-index: 10;
}
.swipe-handler:after {
  content: '';
  width: 36px;
  height: 6px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -18px;
  margin-top: -3px;
  border-radius: 3px;
  background: #666;
}

@media (min-width: 1024px)
  .demo-sheet-swipe-to-close, .demo-sheet-swipe-to-step
    margin-left 15%
    margin-right 15%
    width calc(100% - 30%)

@media (min-width: 1280px)
  .demo-sheet-swipe-to-close, .demo-sheet-swipe-to-step
    margin-left 30%
    margin-right 30%
    width: calc(100% - 60%)

</style>

<script>
import AddonInfoTable from '@/components/addons/addon-info-table.vue'

export default {
  props: ['addonId', 'serviceId', 'opened', 'noDetails'],
  components: {
    AddonInfoTable
  },
  data () {
    return {
      addon: {},
      dependencies: [],
      missingDependencies: 0,
      aMissingDependency: {},
      bindingInfo: {}
    }
  },
  watch: {
    opened (state) {
      let self = this
      if (state) {
        if (!this.addonId) {
          this.addon = {}
          this.dependencies = []
          this.missingDependencies = 0
          this.aMissingDependency = {}
          this.bindingInfo = {}
          return
        }
        self.$f7.preloader.show()
        this.$oh.api.get('/rest/addons/' + this.addonId + (this.serviceId ? '?serviceId=' + this.serviceId : '')).then(data => {
          this.addon = data
          this.dependencies = []
          this.missingDependencies = 0
          this.aMissingDependency = {}

          if (data.dependsOn && data.dependsOn.length > 0) {
            let promises = []
            data.dependsOn.forEach((depId) => {
              const fetchDep = this.$oh.api.get('/rest/addons/' + depId + '?serviceId=all')
              fetchDep.then((dep) => {
                return dep
              }).catch(() => {
                this.missingDependencies++
                this.dependencies.push({
                  name: depId,
                  missing: true,
                  unknown: true
                })
              })
              promises.push(fetchDep)
            })
            Promise.allSettled(promises).then((result) => {
              result.forEach((r) => {
                if (r.status === 'fulfilled') {
                  let depEntry = {}
                  depEntry.name = r.value.label
                  if (r.value.type && r.value.uid) {
                    depEntry.link = '/addons/' + r.value.type + '/' + r.value.uid
                  }
                  depEntry.missing = !r.value.installed
                  if (depEntry.missing) {
                    this.missingDependencies++
                  }
                  this.dependencies.push(depEntry)
                }
              })
              if (this.missingDependencies) {
                this.aMissingDependency = this.dependencies.find((d) => d.missing && !d.unknown)
                if (!this.aMissingDependency) {
                  this.aMissingDependency = this.dependencies.find((d) => d.missing)
                }
              } else {
                this.aMissingDependency = {}
              }
              self.$f7.preloader.hide()
              setTimeout(() => {
                if (!this.noDetails) self.$refs.sheet.f7Sheet.setSwipeStep()
                self.$refs.sheet.f7Sheet.open()
              })
            })
          } else {
            self.$f7.preloader.hide()
            setTimeout(() => {
              if (!this.noDetails) self.$refs.sheet.f7Sheet.setSwipeStep()
              self.$refs.sheet.f7Sheet.open()
            })
          }
        })
      } else {
        self.$refs.sheet.f7Sheet.close()
      }
    }
  },
  computed: {
    state () {
      // TODO: figure out somehow whether the addon is BEING installed/uninstalled.
      if (!this.addon) return 'UNKNOWN'
      return this.addon.installed ? 'INSTALLED' : 'UNINSTALLED'
    },
    installableAddon () {
      return (this.addon && this.addon.contentType && (this.addon.contentType === 'application/vnd.openhab.bundle' || this.addon.contentType.indexOf('application/vnd.openhab.feature') === 0))
    },
    showUnverifiedAuthorWarning () {
      return (this.addon && !this.addon.verifiedAuthor && this.installableAddon)
    },
    showUnpublishedWarning () {
      return (!this.missingDependencies && this.serviceId === 'marketplace' && this.addon.properties && this.addon.properties.tags && this.addon.properties.tags.indexOf('published') < 0)
    }
  },
  methods: {
    toggleSwipeStep () {
      const self = this
      self.$refs.sheet.f7Sheet.stepToggle('.demo-sheet-swipe-to-step')
    },
    install () {
      const self = this
      this.$oh.api.post('/rest/addons/' + this.addonId + '/install' + (this.serviceId ? '?serviceId=' + this.serviceId : ''), {}, 'text').then((data) => {
        this.$emit('install', this.addon)
      }).catch((err) => {
        self.$refs.sheet.f7Sheet.close()
        this.$f7.toast.create({
          text: err === '466' ? `Failed to install '${this.addon.label}' because a dependency is missing` : `Failed to install '${this.addon.label}': ` + err,
          destroyOnClose: true,
          closeButton: true
        }).open()
      })
    },
    uninstall () {
      this.$oh.api.post('/rest/addons/' + this.addonId + '/uninstall' + (this.serviceId ? '?serviceId=' + this.serviceId : ''), {}, 'text').then((data) => {
        this.$emit('uninstall', this.addon)
      }).catch((err) => {
        self.$refs.sheet.f7Sheet.close()
        this.$f7.toast.create({
          text: `Failed to uninstall '${this.addon.label}': ` + err,
          destroyOnClose: true,
          closeButton: true
        }).open()
      })
    },
    gotoDependency () {
      this.$refs.sheet.f7Sheet.close()
      this.$f7router.navigate(this.aMissingDependency.link)
    },
    close () {
      this.$refs.sheet.f7Sheet.close()
    }
  }
}
</script>
