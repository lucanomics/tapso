// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=88-40
// source=apps/web/src/components/WaitlistForm.tsx
// component=TAPSO Button
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const showArrow = instance.getBoolean('Show Arrow')
const style = instance.getEnum('Style', {
  Primary: 'Primary',
  Secondary: 'Secondary',
})
const state = instance.getEnum('State', {
  Default: 'Default',
  Hover: 'Hover',
  Pressed: 'Pressed',
  Disabled: 'Disabled',
  Loading: 'Loading',
})

const className = style === 'Secondary' ? 'figma-support' : 'figma-submit'
const disabled = state === 'Disabled' || state === 'Loading'
const disabledAttribute = disabled ? ' disabled' : ''
const content = state === 'Loading' ? '보내는 중…' : `${label}${showArrow ? ' →' : ''}`

export default {
  example: figma.code`<button type="button" className="${className}"${disabledAttribute}>${content}</button>`,
  id: 'tapso-button',
  metadata: {
    nestable: true,
  },
}
