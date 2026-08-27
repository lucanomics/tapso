// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=99-17
// source=apps/web/src/components/SupportDialog.tsx
// component=TAPSO Support Amount
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const selected = instance.getEnum('Selected', {
  False: 'False',
  True: 'True',
})
const state = instance.getEnum('State', {
  Enabled: 'Enabled',
  Disabled: 'Disabled',
})

const checkedAttribute = selected === 'True' ? ' checked' : ''
const disabledAttribute = state === 'Disabled' ? ' disabled' : ''

export default {
  example: figma.code`<label className="support-amount">\n  <input type="radio" name="support-amount"${checkedAttribute}${disabledAttribute} />\n  <span>${label}</span>\n</label>`,
  id: 'tapso-support-amount',
  metadata: {
    nestable: true,
  },
}
