// Semua pemetaan kontrak endpoint /holidays ada di file ini.
// Sumber: Swagger exam-api — tag "Hari Libur" (calendar.HolidayRequest, HolidayResponse).
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = { start_date: 'startDate', end_date: 'endDate' }

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toHoliday = (data) => ({
  id: data.id,
  name: data.name,
  startDate: data.start_date,
  endDate: data.end_date,
  days: data.days ?? 1,
})

const toBody = (values) => ({
  name: values.name,
  start_date: values.startDate,
  end_date: values.endDate || values.startDate,
})

/** Libur yang beririsan dengan rentang from–to. */
export async function listHolidays({ schoolId, from, to, page = 1, limit = 50 } = {}) {
  const params = scoped(schoolId, { page, limit })
  if (from) params.from = from
  if (to) params.to = to
  const res = await http.get('/holidays', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toHoliday), meta }
}

export async function createHoliday(values) {
  const res = await http.post('/holidays', toBody(values)).catch(rethrow)
  return toHoliday(unwrap(res))
}

export async function updateHoliday(id, values, { schoolId } = {}) {
  const res = await http
    .put(`/holidays/${id}`, toBody(values), { params: scoped(schoolId) })
    .catch(rethrow)
  return toHoliday(unwrap(res))
}

export async function deleteHoliday(id, { schoolId } = {}) {
  await http.delete(`/holidays/${id}`, { params: scoped(schoolId) })
}
