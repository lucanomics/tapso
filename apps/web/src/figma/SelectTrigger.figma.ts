// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=90-27
// source=apps/web/src/components/WaitlistForm.tsx
// component=TAPSO Select Trigger
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const value = instance.getString('Value')
const state = instance.getEnum('State', {
  Default: 'Default',
  Open: 'Open',
  Focus: 'Focus',
  Error: 'Error',
  Disabled: 'Disabled',
})

const disabledAttribute = state === 'Disabled' ? ' disabled' : ''
const invalidAttribute = state === 'Error' ? ' aria-invalid="true"' : ''

export default {
  example: figma.code`<label className="figma-field rider-type-field">\n  <span>${label}</span>\n  <select value="${value}"${disabledAttribute}${invalidAttribute}>\n    {RIDER_TYPE_LABELS.map((option) => (\n      <option key={option.value} value={option.value}>{option.label}</option>\n    ))}\n  </select>\n</label>`,
  imports: ['import { RIDER_TYPE_LABELS } from "../lib/waitlistClient"'],
  id: 'tapso-select-trigger',
  metadata: {
    nestable: true,
  },
}
