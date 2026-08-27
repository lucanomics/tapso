// url=https://www.figma.com/design/kkx04GvqOzHje7Dw5ikO9X/TAPSO-Product-Marketing-Design-System?node-id=97-23
// source=apps/web/src/App.tsx
// component=JourneyCard
import figma from 'figma'

const instance = figma.selectedInstance
const route = instance.getString('Route')
const destination = instance.getString('Destination')
const remaining = instance.getString('Remaining')
const next = instance.getString('Next')
const statusLabel = instance.getString('Status Label')
const state = instance.getEnum('State', {
  Moving: 'Moving',
  Checking: 'Checking',
  Urgent: 'Urgent',
})

export default {
  example: figma.code`<article className="journey-card" data-state="${state}">\n  <div className="journey-card-header">\n    <strong>${route}</strong>\n    <span>${statusLabel}</span>\n  </div>\n  <strong className="journey-stop">${destination}</strong>\n  <strong className="journey-remaining">${remaining}</strong>\n  <span className="journey-next">${next}</span>\n</article>`,
  id: 'tapso-journey-card',
  metadata: {
    nestable: true,
  },
}
