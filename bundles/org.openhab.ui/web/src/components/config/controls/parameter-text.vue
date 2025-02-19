<template>
  <ul v-if="multiple">
    <f7-block-header class="no-margin">
      <div class="margin-horizontal item-label"
           style="padding-top: var(--f7-list-item-padding-vertical); color: var(--f7-text-color)">
        {{ configDescription.label }}
      </div>
      <!--f7-link
        v-if="value"
        :style="{
          top: '1rem',
          float: 'right',
          visibility: configDescription.required ? 'hidden' : 'visible',
          opacity: configDescription.required ? 0 : 1,
          cursor: 'pointer',
          pointerEvents: 'initial'
        }" class="input-clear-button margin-right" @click="updateValue(undefined)" /-->
    </f7-block-header>
    <f7-list-item v-for="v in values" no-hairline :key="v" :title="v">
      <f7-link
        v-if="!configDescription.readOnly && v"
        :style="{
          top: '1rem',
          float: 'right',
          visibility: 'visible',
          opacity: 1,
          cursor: 'pointer',
          pointerEvents: 'initial'
        }" class="input-clear-button margin-right" @click="removeValue(v)" />
    </f7-list-item>
    <f7-list-input
      v-if="!configDescription.readOnly"
      ref="input"
      :type="controlType"
      :pattern="configDescription.pattern"
      :autocomplete="autoCompleteOptions ? 'off' : ''"
      :clear-button="true"
      @input="addValue"
      :placeholder="configDescription.placeholder">
      <f7-link class="input-add-button margin-right" color="green" slot="inner-end" @click="showPassword = !showPassword">
        <f7-icon size="20" :f7="'plus_circle_fill'" />
      </f7-link>
    </f7-list-input>
    <!--f7-list-item radio v-for="option in configDescription.options" no-hairline
                  :value="option.value" radio-icon="start"
                  @change="(!configDescription.required) ? updateValue(undefined) : updateValue(option.value)"
                  :key="option.value" :title="option.label" :name="configDescription.name" /-->
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
.aurora .input-add-button:after
  content: 'plus_circle_fill';
  /* font-size: calc(var(--f7-input-clear-button-size) /(14 / 10)); */
  font-size: var(--f7-input-clear-button-size);
  line-height: 1.4;
.input-add-button:after
    font-family: 'Framework7 Icons';
    /* font-family: 'framework7-core-icons'; */
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    /* letter-spacing: normal; */
    text-transform: none;
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
    font-size: 20px;
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
      values: ['app/aa', 'app/bb'] // Used for multiple value parameters only
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
      const inputElement = this.$$(inputControl.$el).find(this.configDescription.multiple ? 'input' : 'input') // tODO: (Nad) Remove ternary?
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
    addValue (value) {
      if (!this.multiple || !value) {
        return
      }
      let newValues = [...this.values]
      newValues.push(value)
      // this.$set(this, 'values', newValues)
      // this.$emit('input', this.values)
    },
    removeValue (value) {
      if (!this.multiple || !this.values) {
        return
      }
      this.$set(this, 'values', this.values.filter((v) => v !== value))
      this.$emit('input', this.values)
    }
  }
}
</script>
