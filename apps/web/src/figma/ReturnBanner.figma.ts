// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=95-42
// source=apps/web/src/App.tsx
// component=SupportReturnBanner
import figma from 'figma'

const instance = figma.selectedInstance
const message = instance.getString('Message')
const tone = instance.getEnum('Tone', {
  Good: 'good',
  Neutral: 'neutral',
  Bad: 'bad',
})

export default {
  example: figma.code`<SupportReturnBanner\n  result={{ tone: "${tone}", message: "${message}" }}\n  onDismiss={dismissSupportReturn}\n/>`,
  id: 'tapso-return-banner',
  metadata: {
    nestable: true,
  },
}
