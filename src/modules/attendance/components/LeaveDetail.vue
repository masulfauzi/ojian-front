<script setup>
import Tag from 'primevue/tag'
import { formatDate, formatDateTime } from '@/shared/utils/format'
import { leaveStatusOf, leaveTypeLabel } from '../constants'
import LeaveFiles from './LeaveFiles.vue'

// Rincian satu izin (dipakai siswa dan admin presensi).
defineProps({
  leave: { type: Object, required: true },
  /** async (mediaId) → { url } */
  resolveUrl: { type: Function, required: true },
  showStudent: { type: Boolean, default: false },
  previewImages: { type: Boolean, default: false },
})

const range = (leave) =>
  leave.startDate === leave.endDate
    ? formatDate(leave.startDate)
    : `${formatDate(leave.startDate)} – ${formatDate(leave.endDate)}`
</script>

<template>
  <div class="form-stack leave-detail">
    <div class="tag-list">
      <Tag :value="leaveTypeLabel(leave.leaveType)" severity="info" />
      <Tag
        :value="leaveStatusOf(leave.status).label"
        :severity="leaveStatusOf(leave.status).severity"
      />
    </div>
    <dl class="detail-list">
      <template v-if="showStudent && leave.student">
        <dt>Siswa</dt>
        <dd>
          {{ leave.student.name }}
          <span class="text-muted"
            >· {{ leave.student.nis }} · {{ leave.student.className ?? '-' }}</span
          >
        </dd>
      </template>
      <dt>Tanggal</dt>
      <dd>
        {{ range(leave) }} <span v-if="leave.days" class="text-muted">({{ leave.days }} hari)</span>
      </dd>
      <dt>Diajukan</dt>
      <dd>{{ formatDateTime(leave.submittedAt) }}</dd>
      <dt>Alasan</dt>
      <dd class="pre-line">{{ leave.reason }}</dd>
      <template v-if="leave.decidedAt">
        <dt>{{ leave.status === 'rejected' ? 'Ditolak' : 'Disetujui' }}</dt>
        <dd>
          {{ leave.decidedBy ?? '-' }} · {{ formatDateTime(leave.decidedAt) }}
          <div v-if="leave.decisionNote" class="text-muted pre-line">
            “{{ leave.decisionNote }}”
          </div>
        </dd>
      </template>
      <template v-if="leave.cancelledAt">
        <dt>Dibatalkan</dt>
        <dd>
          {{ leave.cancelledBy ?? '-' }} · {{ formatDateTime(leave.cancelledAt) }}
          <div v-if="leave.cancelNote" class="text-muted pre-line">“{{ leave.cancelNote }}”</div>
        </dd>
      </template>
    </dl>
    <div>
      <h3 class="form-section-title">Bukti</h3>
      <LeaveFiles :files="leave.files" :resolve-url="resolveUrl" :preview="previewImages" />
    </div>
  </div>
</template>
