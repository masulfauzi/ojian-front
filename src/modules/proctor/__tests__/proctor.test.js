import { describe, expect, it } from 'vitest'
import { toMonitor, toToken } from '../api/proctor.api'

describe('proctor.api', () => {
  it('token tetap: seconds_left null', () => {
    expect(toToken({ token: 'ABC234', token_length: 6, seconds_left: null })).toMatchObject({
      token: 'ABC234',
      rotateMinutes: null,
      secondsLeft: null,
    })
  })

  it('memetakan ringkasan dan peserta pemantauan', () => {
    const monitor = toMonitor({
      server_time: '2026-10-03T21:45:18+07:00',
      time_state: 'open',
      question_count: 4,
      summary: { total: 2, not_started: 1, in_progress: 1, submitted: 0 },
      items: [
        { student_id: 's', name: 'Siti', state: 'in_progress', answered: 2, attempt_id: 'a' },
      ],
    })
    expect(monitor.summary).toEqual({ total: 2, notStarted: 1, inProgress: 1, submitted: 0 })
    expect(monitor.items[0]).toMatchObject({ studentId: 's', attemptId: 'a', answered: 2 })
  })
})
