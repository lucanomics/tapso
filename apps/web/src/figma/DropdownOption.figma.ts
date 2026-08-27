// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=90-40
// source=apps/web/src/lib/waitlistClient.ts
// component=TAPSO Dropdown Option
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const state = instance.getEnum('State', {
  Default: 'Default',
  Hover: 'Hover',
  Selected: 'Selected',
  Disabled: 'Disabled',
})

const selectedAttribute = state === 'Selected' ? ' selected' : ''
const disabledAttribute = state === 'Disabled' ? ' disabled' : ''

export default {
  example: figma.code`<option${selectedAttribute}${disabledAttribute}>${label}</option>`,
  id: 'tapso-dropdown-option',
  metadata: {
    nestable: true,
  },
}
