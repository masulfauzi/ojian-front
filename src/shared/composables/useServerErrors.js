/**
 * Petakan error backend (ApiError) ke field form VeeValidate.
 *
 *   const form = useForm({ ... })
 *   const applyServerErrors = useServerErrors(form, { statusFields: { 409: 'email' } })
 *   try { ... } catch (err) { if (!applyServerErrors(err)) notify.error(err) }
 *
 * - `fieldErrors` dari response (error validasi 400/422) dipasang ke field dengan nama sama.
 *   Pemetaan nama field backend → form dilakukan di `*.api.js` (lihat `remapFieldErrors`).
 * - `statusFields` memetakan status tanpa detail field (mis. 409 email duplikat) ke satu field.
 *
 * @returns {(error: unknown) => boolean} true bila minimal satu error tampil di field form.
 */
export function useServerErrors(form, { statusFields = {} } = {}) {
  const knownField = (name) => Object.prototype.hasOwnProperty.call(form.values ?? {}, name)

  return function applyServerErrors(error) {
    const errors = {}

    for (const [field, message] of Object.entries(error?.fieldErrors ?? {})) {
      if (knownField(field)) errors[field] = message
    }

    const statusField = statusFields[error?.status]
    if (!Object.keys(errors).length && statusField && knownField(statusField)) {
      errors[statusField] = error.message
    }

    if (!Object.keys(errors).length) return false
    form.setErrors(errors)
    return true
  }
}
