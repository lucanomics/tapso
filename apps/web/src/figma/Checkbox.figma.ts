// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=93-44
// source=apps/web/src/components/WaitlistForm.tsx
// component=TAPSO Checkbox
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const checked = instance.getEnum('Checked', {
  False: 'False',
  True: 'True',
})
const state = instance.getEnum('State', {
  Default: 'Default',
  Focus: 'Focus',
  Error: 'Error',
  Disabled: 'Disabled',
})

const checkedAttribute = checked === 'True' ? ' checked' : ''
const disabledAttribute = state === 'Disabled' ? ' disabled' : ''
const invalidAttribute = state === 'Error' ? ' aria-invalid="true"' : ''

export default {
  example: figma.code`<label className="waitlist-consent">\n  <input type="checkbox" required${checkedAttribute}${disabledAttribute}${invalidAttribute} />\n  <span>${label}</span>\n</label>`,
  id: 'tapso-checkbox',
  metadata: {
    nestable: true,
  },
}
