import RuleStatusLabels from '@/assets/i18n/rule-status/en'

export default {
  methods: {
    ruleStatusBadgeColor (statusInfo) {
      if (statusInfo.status === 'IDLE') return 'green'
      if (statusInfo.statusDetail === 'DISABLED') return 'gray'
      if (statusInfo.status === 'UNINITIALIZED') return statusInfo.statusDetail === 'TEMPLATE_PENDING' ? 'orange' : 'red'
      if (statusInfo.status === 'INITIALIZING') return 'yellow'
      if (statusInfo.status === 'RUNNING') return 'orange'
      return 'green'
    },
    ruleStatusBadgeText (statusInfo) {
      if (statusInfo.status === 'IDLE') return 'IDLE'
      if (statusInfo.statusDetail !== 'NONE') return RuleStatusLabels[statusInfo.statusDetail]
      return statusInfo.status
    }
  },
  /**
   * Determines if the module is "opaque" in that it doesn't actually execute the content of the module, but instead executes
   * a referenced in-memory runnable method.
   *
   * @param module the module to evaluate
   */
  isOpaqueModule (module) {
    if (!module?.type) return false
    return module.type === 'jsr223.ScriptedAction' || module.type === 'jsr223.ScriptedCondition' || module.type === 'jsr223.ScriptedTrigger'
  }
}
