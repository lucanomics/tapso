// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=100-132
// source=apps/web/src/components/SupportDialog.tsx
// component=SupportDialog
import figma from 'figma'

const instance = figma.selectedInstance
const state = instance.getEnum('State', {
  Loading: 'Loading',
  Ready: 'Ready',
  Starting: 'Starting',
  Error: 'Error',
  Unavailable: 'Unavailable',
})

const stateComment = `/* Figma reference state: ${state}; runtime state is owned by SupportDialog. */`

export default {
  example: figma.code`${stateComment}\n<SupportDialog onClose={() => setSupportOpen(false)} />`,
  imports: ['import SupportDialog from "./components/SupportDialog"'],
  id: 'tapso-support-dialog',
  metadata: {
    nestable: false,
  },
}
