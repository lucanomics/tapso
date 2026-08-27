// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=89-46
// source=apps/web/src/components/WaitlistForm.tsx
// component=TAPSO Text Field
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const value = instance.getString('Value')
const helper = instance.getString('Helper')
const showHelper = instance.getBoolean('Show Helper')
const valueType = instance.getEnum('Value', {
  Placeholder: 'Placeholder',
  Filled: 'Filled',
})
const state = instance.getEnum('State', {
  Default: 'Default',
  Focus: 'Focus',
  Error: 'Error',
  Disabled: 'Disabled',
})

const valueAttribute = valueType === 'Filled' ? ` value="${value}"` : ` placeholder="${value}"`
const disabledAttribute = state === 'Disabled' ? ' disabled' : ''
const invalidAttribute = state === 'Error' ? ' aria-invalid="true"' : ''
const helperCode = showHelper || state === 'Error' ? `\n  <span className="field-error">${helper}</span>` : ''

export default {
  example: figma.code`<label className="figma-field">\n  <span>${label}</span>\n  <input type="text"${valueAttribute}${disabledAttribute}${invalidAttribute} />${helperCode}\n</label>`,
  id: 'tapso-text-field',
  metadata: {
    nestable: true,
  },
}
