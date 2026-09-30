export default import.meta.env.DEV
  ? [{ label: 'Playground', icon: 'pi pi-wrench', to: { name: 'playground' }, order: 999 }]
  : []
