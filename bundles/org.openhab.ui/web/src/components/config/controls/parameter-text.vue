<template>
  <ul v-if="multiple">
    <f7-block-header class="no-margin">
      <div class="margin-horizontal item-label"
           style="padding-top: var(--f7-list-item-padding-vertical); color: var(--f7-text-color)">
        {{ configDescription.label }}
      </div>
    </f7-block-header>
    <f7-list-input
      v-for="(v, idx) in values"
      no-hairline
      :key="v"
      :type="controlType"
      :pattern="configDescription.pattern"
      :autocomplete="autoCompleteOptions ? 'off' : ''"
      :clear-button="true"
      @input:clear="removeValueIdx(idx)"
      @input="updateValueIdx(idx, $event)"
      :value="v" />
    <f7-list-input
      v-if="!configDescription.readOnly"
      ref="input"
      :type="controlType"
      :pattern="configDescription.pattern"
      :autocomplete="autoCompleteOptions ? 'off' : ''"
      :clear-button="false"
      @input:notempty="addValue"
      :placeholder="configDescription.placeholder" />
  </ul>
  <ul v-else>
    <f7-list-input
      ref="input"
      :floating-label="$theme.md"
      :label="configDescription.label"
      :name="configDescription.name"
      :value="formattedValue"
      :autocomplete="autoCompleteOptions ? 'off' : ''"
      :placeholder="configDescription.placeholder"
      :pattern="configDescription.pattern"
      :required="configDescription.required" validate
      :clear-button="!configDescription.required && configDescription.context !== 'password'"
      @input="updateValue"
      :readonly="configDescription.readOnly"
      :type="controlType">
      <div v-if="configDescription.context === 'password'" class="padding-left" slot="content-end">
        <f7-link class="margin" color="gray" slot="content-end" @click="showPassword = !showPassword">
          <f7-icon size="20" :f7="(showPassword) ? 'eye_slash_fill' : 'eye_fill'" />
        </f7-link>
      </div>
    </f7-list-input>
  </ul>
</template>

<style lang="stylus">
.input-controls
  visibility visible
  opacity 1
.item-input-with-value .input-clear-button, .input-with-value .input-clear-button
  visibility visible
  opacity 1
.item-input-with-value .input-add-button, .input-with-value .input-add-button
  visibility visible
  opacity 1
/*.aurora .input-add-button:after
  content: 'plus_circle_fill';
  /* font-size: calc(var(--f7-input-clear-button-size) /(14 / 10)); */
/*  font-size: var(--f7-input-clear-button-size);
  line-height: 1.4;*/
/* .input-add-button:after
    font-family: 'Framework7 Icons';
    /* font-family: 'framework7-core-icons'; */
/*    font-weight: normal;
    font-style: normal;
    line-height: 1;
    /* letter-spacing: normal; */
/*    text-transform: none;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
    -moz-font-feature-settings: "liga";
    font-feature-settings: "liga";
    text-align: center;
    display: block;
    width: 100%;
    height: 100%;
    font-size: 20px;*/
</style>
<script>
export default {
  props: ['configDescription', 'value'],
  computed: {
    controlType () {
      if (this.configDescription.context === 'password' && !this.showPassword) return 'password'
      // if (this.configDescription.multiple) return 'textarea'
      return 'text'
    },
    formattedValue () {
      if (this.multiple) {
        if (!this.value) { // TODO: (Nad) Temp hack
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.values = []
        } else if (Array.isArray(this.value)) {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.values = this.value
        } else {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.values = [this.value]
        }
        return (this.value) ? this.value.join('\n') : ''
      }
      return this.value
    },
    multiple () {
      return this.configDescription && this.configDescription.multiple
    }
  },
  data () {
    return {
      autoCompleteOptions: null,
      showPassword: false,
      values: ['app/aa', 'app/bb'], // Used for multiple value parameters only
      suspendEvents: false
    }
  },
  mounted () {
    if (this.configDescription.options && this.configDescription.options.length > 0) {
      const options = this.configDescription.options.map((o) => {
        return {
          id: o.value,
          text: (o.label) ? (o.value !== o.label) ? `${o.label} (${o.value})` : o.label : o.value
        }
      })
      const inputControl = this.$refs.input
      if (!inputControl || !inputControl.$el) return
      const inputElement = this.$$(inputControl.$el).find('input')
      this.autoCompleteOptions = this.$f7.autocomplete.create({
        inputEl: inputElement,
        openIn: 'dropdown',
        requestSourceOnOpen: true,
        source (query, render) {
          render(options.filter((o) => o.text.toLowerCase().indexOf(query.toLowerCase()) >= 0))
        }
      })
    }
  },
  beforeDestroy () {
    if (this.autoCompleteOptions) {
      this.$f7.autocomplete.destroy(this.autoCompleteOptions)
    }
  },
  methods: {
    updateValue (event) {
      if (this.multiple) {
        return // TODO: (Nad) Make
      }
      // const value = (this.configDescription.multiple) ? event.target.value.split('\n') : event.target.value
      this.$emit('input', event.target.value)
    },
    updateValueIdx (idx, event) {
      if (!this.multiple || idx < 0 || !this.values || idx >= this.values.length) return
      const newValues = [...this.values]
      newValues[idx] = event.target.value
      this.$set(this, 'values', newValues)
      this.emitValues()
    },
    addValue (event) {
      if (this.suspendEvents || !this.multiple || !event) {
        return
      }
      const v = event.target?.value
      if (!v) return
      let newValues = this.values.filter((val, idx) => val && this.values.indexOf(val) === idx)
      if (newValues.some((val) => val === v)) return
      newValues.push(v)
      this.suspendEvents = true
      this.$set(this, 'values', newValues)
      this.emitValues()

      this.$nextTick(() => {
        const inputControl = this.$refs.input
        if (inputControl && inputControl.$el) {
          const inputElements = this.$$(inputControl.$el).find('input')
          if (inputElements && inputElements.length > 0) {
            const inputElement = inputElements[0]
            inputElement.value = ''
            let prev = this.findAncestor(inputElement, 'li')?.previousElementSibling
            if (prev) {
              let prevInput = this.$$(prev).find('input')
              if (prevInput) {
                prevInput.focus()
              }
            }
          }
        }
        this.suspendEvents = false
      })
    },
    removeValue (value) { // TODO: (Nad) In use?
      if (!this.multiple || !this.values) {
        return
      }
      this.$set(this, 'values', this.values.filter((v) => v !== value))
      this.emitValues()
    },
    removeValueIdx (idx) {
      if (this.suspendEvents || !this.multiple || idx < 0 || !this.values || idx >= this.values.length) return
      let newValues = [...this.values]
      newValues.splice(idx, 1)
      this.suspendEvents = true
      this.$set(this, 'values', newValues)
      this.emitValues()
      this.$nextTick(() => {
        this.suspendEvents = false
      })
    },
    emitValues () {
      this.$emit('input', this.values.filter((v, idx) => v && this.values.indexOf(v) === idx))
    },
    findAncestor (el, selector) {
      while ((el = el.parentElement) && !el.matches(selector));
      return el
    }
  }
}
</script>
