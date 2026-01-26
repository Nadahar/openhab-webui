<template>
  <ul>
    <f7-list-input
      class="parameter-datetime"
      ref="input"
      type="datetime-local"
      :step="step"
      :floating-label="theme.md"
      :label="configDescription.label"
      :name="configDescription.name"
      :value="displayValue"
      :required="configDescription.required"
      validate
      @input="updateValue" />
  </ul>
</template>

<style lang="stylus">
.parameter-datetime
  input[type="datetime-local"]
    max-width 100% !important
</style>

<script>
import { theme } from 'framework7-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export default {
  props: {
    configDescription: Object,
    value: String,
    timezoneAware: {
      type: Boolean,
      default: true
    },
    clientTimeZone: {
      type: String,
      default: null
    }
  },
  emits: ['input', 'client-timezone', 'input-timezone'],
  setup () {
    return { theme }
  },
  computed: {
    step () {
      return this.configDescription.step || this.configDescription.stepsize || 60
    }
    ,displayValue () {
      if (this.timezoneAware && this.value) {
        return this.formatToInput(this.value)
      }
      return this.value || ''
    }
    ,clientTimeZoneValue () {
      return this.clientTimeZone || this.detectedClientTimeZone || null
    }
  },
  data () {
    return {
      detectedClientTimeZone: null
    }
  },
  created () {
    // Detect IANA timezone if not provided by prop
    try {
      if (!this.clientTimeZone && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        this.detectedClientTimeZone = tz || null
      } else if (this.clientTimeZone) {
        this.detectedClientTimeZone = this.clientTimeZone
      }
    } catch (e) {
      this.detectedClientTimeZone = null
    }

    // Expose via event so parent components can react to timezone
    this.$emit('client-timezone', this.clientTimeZoneValue)
  },
  methods: {
    // Convert an ISO/offset timestamp (optionally with [Zone]) into a value suitable for `datetime-local` input
    formatToInput (isoString) {
      try {
        if (!isoString) return ''
        // detect bracketed timezone syntax: 2007-12-03T10:15:30+01:00[Europe/Paris]
        const bracketMatch = typeof isoString === 'string' && isoString.match(/^(.*)\[([^\]]+)\]$/)
        let main = isoString
        let usedTz = this.clientTimeZoneValue || (dayjs.tz && dayjs.tz.guess && dayjs.tz.guess())
        if (bracketMatch) {
          main = bracketMatch[1]
          usedTz = bracketMatch[2] || usedTz
        }
        const d = usedTz ? dayjs.tz(main, usedTz) : dayjs(main)
        if (!d.isValid()) return isoString
        const fmt = this.step && Number(this.step) < 60 ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DDTHH:mm'
        return d.format(fmt)
      } catch (e) {
        return isoString
      }
    },

    // Parse `datetime-local` input and emit a timestamp string with offset and IANA zone when possible
    parseFromInput (localValue) {
      try {
        if (!localValue) return ''
        const tz = this.clientTimeZoneValue || (dayjs.tz && dayjs.tz.guess && dayjs.tz.guess())
        const fmt = this.step && Number(this.step) < 60 ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DDTHH:mm'
        const d = tz ? dayjs.tz(localValue, fmt, tz) : dayjs(localValue, fmt)
        if (!d.isValid()) return localValue
        if (tz) {
          // Return with offset and IANA timezone in brackets, e.g. 2007-12-03T10:15:30+01:00[Europe/Paris]
          const withOffsetFmt = this.step && Number(this.step) < 60 ? 'YYYY-MM-DDTHH:mm:ssZ' : 'YYYY-MM-DDTHH:mmZ'
          return `${d.format(withOffsetFmt)}[${tz}]`
        }
        // fallback: return ISO in UTC
        return d.utc().toISOString()
      } catch (e) {
        return localValue
      }
    },

    updateValue (event) {
      const val = event.target.value
      if (this.timezoneAware) {
        const iso = this.parseFromInput(val)
        this.$emit('input', iso)
        // also emit the timezone that was used to interpret the input
        this.$emit('input-timezone', this.clientTimeZoneValue)
      } else {
        this.$emit('input', val)
      }
    }
  }
}
</script>
