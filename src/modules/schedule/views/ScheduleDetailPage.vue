<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { timezoneAbbr } from '@/shared/constants/timezones'
import { formatZoned } from '@/shared/utils/zonedTime'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useAcademicCalendar, useSchoolContext } from '@/modules/academic'
import {
  addParticipant,
  cancelSchedule,
  deleteSchedule,
  extendSchedule,
  getSchedule,
  listParticipants,
  publishSchedule,
  syncParticipants,
  updateParticipant,
} from '../api/schedule.api'
import AddParticipantDialog from '../components/AddParticipantDialog.vue'
import ClassTargetCard from '../components/ClassTargetCard.vue'
import ExtendDialog from '../components/ExtendDialog.vue'
import ParticipantDialog from '../components/ParticipantDialog.vue'
import RemedialDialog from '../components/RemedialDialog.vue'
import ScheduleStateTags from '../components/ScheduleStateTags.vue'
import {
  PARTICIPANT_STATUSES,
  RESULT_VISIBILITY_OPTIONS,
  REVIEW_VISIBILITY_OPTIONS,
  SCORE_POLICY_OPTIONS,
  categoryLabel,
  labelOf,
} from '../constants'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const can = useCan('exam_schedules')
const canMonitor = useCan('exam_monitor')
const canResults = useCan('exam_results')
const canStudents = useCan('students')
const notify = useNotify()
const { ask, confirmDelete } = useConfirm()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const calendar = useAcademicCalendar(school.scopeId, school.ready)

const schedule = ref(null)
const participants = ref([])
const loadingParticipants = ref(false)
const loadError = ref(null)

const isDraft = computed(() => schedule.value?.status === 'draft')
const isPublished = computed(() => schedule.value?.status === 'published')
const manage = computed(() => Boolean(schedule.value?.canEdit) && can.value.update)
const semesterName = computed(() => calendar.semesterOf(schedule.value?.semesterId)?.label ?? '-')
const eligibleCount = computed(
  () => participants.value.filter((p) => p.status === 'eligible').length,
)
const linkQuery = computed(() => (school.scopeId.value ? { school_id: school.scopeId.value } : {}))

async function loadParticipants() {
  loadingParticipants.value = true
  try {
    participants.value = await listParticipants(schedule.value.id, scope())
  } catch (error) {
    notify.error(error)
  } finally {
    loadingParticipants.value = false
  }
}

async function load() {
  loadError.value = null
  try {
    schedule.value = await getSchedule(route.params.id, scope())
    await loadParticipants()
  } catch (error) {
    loadError.value = error
  }
}

watch(
  () => [route.params.id, school.ready.value],
  ([id, ready]) => id && ready && load(),
  { immediate: true },
)

async function onClassesSaved(classes) {
  schedule.value = { ...schedule.value, classes }
  await loadParticipants()
}

// ---- Aksi jadwal ----
async function publish() {
  const ok = await ask({
    header: 'Publikasikan jadwal',
    message: `${eligibleCount.value} siswa akan menjadi peserta dan jadwal muncul di "Ujian Saya" mereka. Lanjutkan?`,
    icon: 'pi pi-send',
    acceptLabel: 'Publikasikan',
  })
  if (!ok) return
  try {
    schedule.value = await publishSchedule(schedule.value.id, scope())
    notify.success('Jadwal dipublikasikan')
    await loadParticipants()
  } catch (error) {
    notify.error(error)
  }
}

async function cancel() {
  const ok = await ask({
    header: 'Batalkan jadwal',
    message:
      'Siswa tidak dapat lagi memulai ujian ini. Pengerjaan yang sudah ada tetap tersimpan. Tindakan ini tidak dapat dibatalkan.',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Batalkan jadwal',
    rejectLabel: 'Kembali',
    danger: true,
  })
  if (!ok) return
  try {
    schedule.value = await cancelSchedule(schedule.value.id, scope())
    notify.success('Jadwal dibatalkan')
  } catch (error) {
    notify.error(error)
  }
}

async function remove() {
  if (!(await confirmDelete(`jadwal ${schedule.value.title}`))) return
  try {
    await deleteSchedule(schedule.value.id, scope())
    notify.success('Jadwal dihapus')
    router.replace({ name: 'schedules', query: linkQuery.value })
  } catch (error) {
    notify.error(error)
  }
}

const extendVisible = ref(false)
async function extend(endsAt) {
  schedule.value = await extendSchedule(schedule.value.id, endsAt, scope())
  notify.success('Waktu tutup diperpanjang')
}

const remedialVisible = ref(false)
function onRemedialCreated(created) {
  router.push({ name: 'schedule-detail', params: { id: created.id }, query: linkQuery.value })
}

// ---- Peserta ----
const editing = ref(null)
const participantVisible = ref(false)
function editParticipant(p) {
  editing.value = p
  participantVisible.value = true
}
async function saveParticipant(values) {
  const saved = await updateParticipant(schedule.value.id, editing.value.studentId, values, scope())
  participants.value = participants.value.map((p) => (p.studentId === saved.studentId ? saved : p))
  notify.success(`Peserta ${saved.name} diperbarui`)
}

const addVisible = ref(false)
async function add(values) {
  const added = await addParticipant(schedule.value.id, values, scope())
  notify.success(`${added.name} ditambahkan sebagai peserta`)
  await loadParticipants()
}

async function sync() {
  try {
    const { added } = await syncParticipants(schedule.value.id, scope())
    notify.success(
      added
        ? `${added} siswa baru ditambahkan dari kelas target`
        : 'Peserta sudah sesuai kelas target',
    )
    if (added) await loadParticipants()
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader :title="schedule?.title ?? 'Jadwal ujian'" :description="schedule?.examTitle ?? ''">
      <template #actions>
        <Button
          label="Jadwal"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'schedules', query: linkQuery })"
        />
        <template v-if="schedule">
          <Button
            v-if="isDraft && schedule.canEdit && can.delete"
            label="Hapus"
            icon="pi pi-trash"
            severity="danger"
            text
            @click="remove"
          />
          <Button
            v-if="isPublished && manage"
            label="Batalkan"
            icon="pi pi-ban"
            severity="danger"
            text
            @click="cancel"
          />
          <Button
            v-if="manage && schedule.status !== 'cancelled'"
            label="Ubah"
            icon="pi pi-pencil"
            severity="secondary"
            outlined
            @click="
              router.push({ name: 'schedule-edit', params: { id: schedule.id }, query: linkQuery })
            "
          />
          <Button
            v-if="isPublished && manage"
            label="Perpanjang"
            icon="pi pi-clock"
            severity="secondary"
            outlined
            @click="extendVisible = true"
          />
          <Button
            v-if="isPublished && canMonitor.view"
            label="Pantau"
            icon="pi pi-desktop"
            severity="secondary"
            outlined
            @click="router.push({ name: 'monitor', params: { id: schedule.id }, query: linkQuery })"
          />
          <Button
            v-if="isPublished && canResults.view"
            label="Hasil"
            icon="pi pi-chart-bar"
            severity="secondary"
            outlined
            @click="router.push({ name: 'result', params: { id: schedule.id }, query: linkQuery })"
          />
          <Button
            v-if="isPublished && can.create && !auth.isPlatformUser"
            label="Remedial"
            icon="pi pi-replay"
            severity="secondary"
            outlined
            @click="remedialVisible = true"
          />
          <Button
            v-if="isDraft && manage"
            label="Publikasikan"
            icon="pi pi-send"
            :disabled="!eligibleCount"
            @click="publish"
          />
        </template>
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Jadwal tidak dapat dimuat"
      :description="loadError.message"
    />
    <div v-else-if="!schedule && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>

    <div v-else-if="schedule" class="question-form">
      <div class="question-form__main form-stack">
        <Message v-if="isDraft" severity="info" :closable="false">
          Jadwal masih draf dan belum terlihat siswa. Pilih kelas target, periksa peserta, lalu
          <strong>Publikasikan</strong>.
        </Message>
        <Message v-else-if="schedule.status === 'cancelled'" severity="error" :closable="false">
          Jadwal dibatalkan. Siswa tidak dapat memulai ujian ini.
        </Message>

        <ClassTargetCard
          :schedule="schedule"
          :school-id="school.scopeId.value"
          :editable="manage && schedule.status !== 'cancelled'"
          @saved="onClassesSaved"
        />

        <Card>
          <template #title>
            <div class="toolbar">
              <span>Peserta</span>
              <span class="text-muted">{{ eligibleCount }} peserta</span>
              <template v-if="manage && schedule.status !== 'cancelled'">
                <Button
                  v-if="isPublished"
                  label="Sinkronkan dari kelas"
                  icon="pi pi-sync"
                  size="small"
                  text
                  @click="sync"
                />
                <Button
                  v-if="canStudents.view"
                  label="Tambah peserta"
                  icon="pi pi-user-plus"
                  size="small"
                  outlined
                  @click="addVisible = true"
                />
              </template>
            </div>
          </template>
          <template #content>
            <Message v-if="isDraft && participants.length" severity="secondary" :closable="false">
              Pratinjau: peserta dari kelas target dibentuk saat jadwal dipublikasikan.
            </Message>
            <DataTable
              :value="participants"
              :loading="loadingParticipants"
              data-key="studentId"
              size="small"
              striped-rows
              paginator
              :rows="20"
              :always-show-paginator="false"
            >
              <template #empty>
                <EmptyState
                  icon="pi pi-users"
                  title="Belum ada peserta"
                  description="Pilih kelas target atau tambahkan siswa secara manual."
                />
              </template>
              <Column header="Siswa">
                <template #body="{ data }">
                  {{ data.name }}
                  <div class="text-muted">{{ data.nis }}</div>
                </template>
              </Column>
              <Column field="className" header="Kelas" />
              <Column header="Status">
                <template #body="{ data }">
                  <Tag
                    :value="labelOf(PARTICIPANT_STATUSES, data.status)"
                    :severity="data.status === 'eligible' ? 'success' : 'secondary'"
                  />
                  <Tag
                    v-if="data.source === 'manual'"
                    value="Manual"
                    severity="info"
                    class="tag-gap"
                  />
                </template>
              </Column>
              <Column header="Tambahan">
                <template #body="{ data }">
                  <span v-if="data.extraTimeMinutes">+{{ data.extraTimeMinutes }} mnt</span>
                  <span v-if="data.extraTimeMinutes && data.extraAttempts"> · </span>
                  <span v-if="data.extraAttempts">+{{ data.extraAttempts }} kesempatan</span>
                  <span v-if="!data.extraTimeMinutes && !data.extraAttempts" class="text-muted"
                    >-</span
                  >
                  <div v-if="data.note" class="text-muted">{{ data.note }}</div>
                </template>
              </Column>
              <Column header="Pengerjaan">
                <template #body="{ data }">{{ data.attempts }}</template>
              </Column>
              <Column v-if="manage && !isDraft">
                <template #body="{ data }">
                  <Button
                    v-tooltip.top="'Ubah peserta'"
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    :aria-label="`Ubah peserta ${data.name}`"
                    @click="editParticipant(data)"
                  />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>

      <Card class="question-form__side">
        <template #title>Pengaturan</template>
        <template #content>
          <div class="form-stack">
            <ScheduleStateTags :schedule="schedule" />
            <dl class="detail-list">
              <dt>Paket</dt>
              <dd>
                <RouterLink
                  :to="{ name: 'exam-detail', params: { id: schedule.examId }, query: linkQuery }"
                  class="link-strong"
                  >{{ schedule.examTitle }}</RouterLink
                >
              </dd>
              <dt>Mapel</dt>
              <dd>{{ schedule.subjectName ?? '-' }}</dd>
              <dt>Semester</dt>
              <dd>{{ semesterName }}</dd>
              <dt>Kategori</dt>
              <dd>{{ categoryLabel(schedule.category) }}</dd>
              <dt>Dibuka</dt>
              <dd>{{ formatZoned(schedule.startsAt, schedule.timezone) }}</dd>
              <dt>Ditutup</dt>
              <dd>{{ formatZoned(schedule.endsAt, schedule.timezone) }}</dd>
              <dt>Durasi</dt>
              <dd>
                {{ schedule.durationMinutes }} menit
                <span v-if="schedule.hardDeadline" class="text-muted">· batas keras</span>
              </dd>
              <dt>Pengacakan</dt>
              <dd>
                {{
                  [schedule.shuffleQuestions && 'soal', schedule.shuffleOptions && 'pilihan']
                    .filter(Boolean)
                    .join(' & ') || 'Tidak diacak'
                }}
              </dd>
              <dt>Token</dt>
              <dd>
                <template v-if="schedule.tokenEnabled">
                  {{ schedule.tokenLength }} karakter ·
                  {{
                    schedule.tokenRotateMinutes
                      ? `berganti tiap ${schedule.tokenRotateMinutes} menit`
                      : 'tetap'
                  }}
                </template>
                <template v-else>Tidak memakai token</template>
              </dd>
              <dt>Kesempatan</dt>
              <dd>
                {{ schedule.maxAttempts }}×
                <span v-if="schedule.maxAttempts > 1" class="text-muted"
                  >· {{ labelOf(SCORE_POLICY_OPTIONS, schedule.scorePolicy) }}</span
                >
              </dd>
              <dt>KKM</dt>
              <dd>{{ schedule.passingScore ?? '-' }}</dd>
              <dt>Nilai</dt>
              <dd>{{ labelOf(RESULT_VISIBILITY_OPTIONS, schedule.resultVisibility) }}</dd>
              <dt>Pembahasan</dt>
              <dd>{{ labelOf(REVIEW_VISIBILITY_OPTIONS, schedule.reviewVisibility) }}</dd>
              <dt>Zona waktu</dt>
              <dd>{{ timezoneAbbr(schedule.timezone) }}</dd>
              <dt>Pembuat</dt>
              <dd>{{ schedule.creatorName ?? '-' }}</dd>
            </dl>
            <RouterLink
              v-if="schedule.remedialOfScheduleId"
              :to="{
                name: 'schedule-detail',
                params: { id: schedule.remedialOfScheduleId },
                query: linkQuery,
              }"
              class="link-strong"
              ><i class="pi pi-replay" aria-hidden="true" /> Jadwal asal remedial</RouterLink
            >
          </div>
        </template>
      </Card>
    </div>

    <template v-if="schedule">
      <ParticipantDialog
        v-model:visible="participantVisible"
        :participant="editing"
        :submit="saveParticipant"
      />
      <AddParticipantDialog
        v-model:visible="addVisible"
        :school-id="school.scopeId.value"
        :submit="add"
      />
      <ExtendDialog v-model:visible="extendVisible" :schedule="schedule" :submit="extend" />
      <RemedialDialog
        v-model:visible="remedialVisible"
        :schedule="schedule"
        :school-id="school.scopeId.value"
        @created="onRemedialCreated"
      />
    </template>
  </div>
</template>
