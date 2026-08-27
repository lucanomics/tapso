// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=98-35
// source=apps/web/src/App.tsx
// component=ProductPreview / Dynamic Island
import figma from 'figma'

const instance = figma.selectedInstance
const route = instance.getString('Route')
const remaining = instance.getString('Remaining')
const message = instance.getString('Message')

export default {
  example: figma.code`<div className="dynamic-island" id="island-preview">\n  <strong className="island-route">${route}</strong>\n  <span className="island-copy desktop-island-copy">\n    <strong>${message}</strong>\n    <span>${remaining}</span>\n  </span>\n  <span className="mobile-island-copy">${remaining}</span>\n</div>`,
  id: 'tapso-dynamic-island',
  metadata: {
    nestable: true,
  },
}
