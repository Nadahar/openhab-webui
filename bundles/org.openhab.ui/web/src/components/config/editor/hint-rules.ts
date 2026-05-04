import { CompletionContext, insertCompletionText, type Completion, type CompletionResult } from '@codemirror/autocomplete'
import { findParent, findParentRoot, isConfig, isRuleSection, lineIndent, findRootSection } from './yaml-utils'
import { completionStart, hintItems, hintParameterValues, hintParameters } from './hint-utils'
import type { Line } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

import * as api from '@/api'

let moduleTypesCache: { [section: string]: api.ModuleType[] | null } = {}

async function getModuleTypes(section: string) {
  if (moduleTypesCache[section]) return moduleTypesCache[section]

  const result = await api.getModuleTypes({ type: section })

  if (result) {
    moduleTypesCache[section] = result
    return moduleTypesCache[section]
  }

  return []
}

function findModuleType(context: CompletionContext, line: Line) {
  const parentLine = findParent(context, line)
  if (!parentLine) return null
  const grandParentLine = findParent(context, parentLine)
  if (!grandParentLine) return null
  for (let l = grandParentLine.number + 1; l <= context.state.doc.lines; l++) {
    const line = context.state.doc.line(l)
    if (line.text.match(/^ {4}type: /)) {
      const [, type] = line.text.split(':')
      return type?.trim() ?? null
    }
  }
  return null
}

function hintConfig(context: CompletionContext, line: Line, parentLine: Line): CompletionResult | Promise<CompletionResult | null> | null {
  const cursor = context.pos - line.from
  const moduleTypeUid = findModuleType(context, line)
  console.debug(`hinting config for module type: ${moduleTypeUid}`)
  if (!moduleTypeUid) return null

  const sectionRootLine = findParentRoot(context, parentLine)
  const section = sectionRootLine.text.replace('s:', '').trim()
  console.debug(`section: ${section}`)
  if (!section) return null

  const colonPos = line.text.indexOf(':')
  const afterColon = colonPos > 0 && cursor > colonPos
  return getModuleTypes(section).then((moduleTypes): CompletionResult | Promise<CompletionResult | null> | null => {
    const moduleType = moduleTypes.find((m) => m.uid === moduleTypeUid)
    if (!moduleType) return null
    const parameters = moduleType.configDescriptions
    if (afterColon) {
      return hintParameterValues(context, parameters, line, colonPos)
    }
    console.debug(moduleType)
    return hintParameters(context, parameters, 6)
  })
}

function getNextId(view: EditorView) {
  let nextId = 1
  const lineIterator = view.state.doc.iterLines()
  while (!lineIterator.next().done) {
    const line = lineIterator.value
    if (line.match(/^[ -]{4}id: /)) {
      const [, rawId] = line.split(':')
      const id = parseInt((rawId ?? '').replace('"', '').trim())
      if (id >= nextId) nextId = id + 1
    }
  }
  return nextId
}

function moduleTypeTypeToAlias(section: string, type: string) {
  // For well-known module type types, we can use a shorter alias in the hint insert text
  switch (section) {
    case 'action':
      if (type === 'core.RuleEnablementAction') return 'EnableRule'
      if (type === 'core.ItemCommandAction') return 'SendCommand'
      if (type === 'core.ItemStateUpdateAction') return 'PostUpdate'
      if (type === 'core.RunRuleAction') return 'RunRule'
      if (type === 'media.PlayAction') return 'Play'
      if (type === 'media.SayAction') return 'Say'
      if (type === 'script.ScriptAction') return 'Script'
      break
    case 'trigger':
      if (type === 'core.ChannelEventTrigger') return 'ChannelEvent'
      if (type === 'timer.GenericCronTrigger') return 'Cron'
      if (type === 'timer.DateTimeTrigger') return 'DateTime'
      if (type === 'core.GroupCommandTrigger') return 'MemberReceivedCommand'
      if (type === 'core.GroupStateChangeTrigger') return 'MemberChanged'
      if (type === 'core.GroupStateUpdateTrigger') return 'MemberUpdated'
      if (type === 'core.ItemCommandTrigger') return 'ItemReceivedCommand'
      if (type === 'core.ItemStateChangeTrigger') return 'ItemChanged'
      if (type === 'core.ItemStateUpdateTrigger') return 'ItemUpdated'
      if (type === 'core.SystemStartlevelTrigger') return 'StartLevel'
      if (type === 'core.ThingStatusChangeTrigger') return 'ThingChanged'
      if (type === 'core.ThingStatusUpdateTrigger') return 'ThingUpdated'
      if (type === 'timer.TimeOfDayTrigger') return 'TimeOfDay'
      break
    case 'condition':
      if (type === 'timer.DayOfWeekCondition') return 'DayOfWeek'
      if (type === 'ephemeris.DaysetCondition') return 'Dayset'
      if (type === 'ephemeris.HolidayCondition') return 'Holiday'
      if (type === 'timer.IntervalCondition') return 'Interval'
      if (type === 'core.ItemStateCondition') return 'ItemState'
      if (type === 'ephemeris.NotHolidayCondition') return 'NotHoliday'
      if (type === 'script.ScriptCondition') return 'Script'
      if (type === 'core.ThingStatusCondition') return 'ThingStatus'
      if (type === 'core.TimeOfDayCondition') return 'TimeOfDay'
      if (type === 'ephemeris.WeekdayCondition') return 'Weekday'
      if (type === 'ephemeris.WeekendCondition') return 'Weekend'
      break
  }
  return type
}

function buildModuleStructure(section: string, moduleType: api.ModuleType, baseIndent: number = 0) {
  const indent = ' '.repeat(baseIndent + 2)
  const itemIndent = ' '.repeat(baseIndent + 4)
  const configIndent = ' '.repeat(baseIndent + 6)
  
  let ret = `${indent}- type: ${moduleTypeTypeToAlias(section, moduleType.uid)}\n${itemIndent}label: ${moduleType.label}\n`
  if (moduleType.description) {
    ret += `${itemIndent}description: ${moduleType.description}\n`
  }
  if (moduleType.configDescriptions.some((p) => p.required)) {
    ret += `${itemIndent}config:\n`
    for (const configDescription of moduleType.configDescriptions.filter((m) => m.required)) {
      ret += `${configIndent}${configDescription.name}: \n`
    }
  }
  ret += `${indent}  `
  return ret
}

function hintSceneItems(context: CompletionContext): CompletionResult | Promise<CompletionResult | null> | null {
  console.info('hinting in the items section (scenes)')
  return hintItems(context, { indent: 2, suffix: ': ' })
}

function hintRuleStructure(
  context: CompletionContext,
  line: Line,
  parentLine: Line
): CompletionResult | Promise<CompletionResult | null> | null {
  return {
    from: completionStart(context),
    validFor: /\w+/,
    options: [
      {
        label: 'Add label',
        info: 'Adds the rule label (name)',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    label: `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      {
        label: 'Add description',
        info: 'Adds the rule description',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    description: `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      {
        label: 'Add tags section',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    tags:\n      - `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      {
        label: 'Add triggers section',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    triggers:\n      - `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      {
        label: 'Add conditions section',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    conditions:\n      - `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      {
        label: 'Add actions section',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    actions:\n      - `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      {
        label: 'Add configuration section',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    config:\n      `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      {
        label: 'Add template',
        info: 'Adds the rule template reference',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `    template: `
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      },
      { // TODO: (Nad) This
        label: 'Add new rule',
        info: 'Adds a new rule with default configuration',
        apply: (view: EditorView, _completion: Completion, _from: number, _to: number) => {
          const insert = `- name: New Rule\n  uid: ${crypto.randomUUID()}\n  templateState: uninitialized\n  visibility: visible\n  tags: []\n  triggers:\n  conditions:\n  actions:\n`
          view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
        }
      }
    ]
  }
}

function hintModuleStructure(
  context: CompletionContext,
  line: Line,
  parentLine: Line
): CompletionResult | Promise<CompletionResult | null> | null {
  const section = parentLine.text.replace('s:', '').trim()
  if (section === 'item') {
    if (!line.text.includes(':')) return hintSceneItems(context)
    return null // todo: hint commands?
  }

  const parentIndent = lineIndent(parentLine)
  const apply = (view: EditorView, completion: Completion, _from: number, _to: number) => {
    const insert = buildModuleStructure(section, (completion as Completion & { moduleType: api.ModuleType }).moduleType, parentIndent)
    view.dispatch(insertCompletionText(view.state, insert, line.from, line.to))
  }

  return getModuleTypes(section).then((moduleTypes): CompletionResult => {
    return {
      from: completionStart(context),
      validFor: /\w+/,
      options: moduleTypes.map((m) => {
        return {
          label: `${section}: ${m.label}`,
          info: m.uid,
          moduleType: m,
          apply
        }
      })
    }
  })
}

export default function hint(context: CompletionContext): CompletionResult | Promise<CompletionResult | null> | null {
  const line = context.state.doc.lineAt(context.pos)

  const rootSection = findRootSection(context, line)
  if (!(rootSection?.type === 'rules')) {
    console.debug(`not in rules root section (${rootSection?.type}), skipping hint`)
    return null
  }

  const parentLine = findParent(context, line)
  console.debug('parent line', parentLine?.text)

  if (!parentLine) return null

  const parentIndent = lineIndent(parentLine)
  if (parentIndent === 2) {
    return hintRuleStructure(context, line, parentLine)
  } else if (parentIndent === 4) {
    if (parentLine.text.match(/^    (triggers|conditions|actions):\s*$/)) {
      return hintModuleStructure(context, line, parentLine)
    }
  }

  return hintModuleStructure(context, line, line) ?? hintConfig(context, line, line)


  // if (isConfig(parentLine)) {
  //   return hintConfig(context, line, parentLine)
  // }
  
  // // Check if we're inside a rule section (triggers, conditions, actions, items)
  // // by finding the root section header
  // const rootRuleSection = findRootSection(context, line)
  // if (rootRuleSection) {
  //   return hintModuleStructure(context, line, rootRuleSection)
  // }
  
  // return null
}
