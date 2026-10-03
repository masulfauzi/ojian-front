<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Step from 'primevue/step'
import StepList from 'primevue/steplist'
import StepPanel from 'primevue/steppanel'
import StepPanels from 'primevue/steppanels'
import Stepper from 'primevue/stepper'
import Tag from 'primevue/tag'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import {
  SchoolContextBar,
  TERM_GANJIL,
  useAcademicCalendar,
  useSchoolContext,
} from '@/modules/academic'
import { listClassOptions, listMembers, promote } from '../api/classroom.api'
import {
  GRADUATE,
  SKIP,
  buildPromotionPayload,
  mappingsComplete,
  suggestTarget,
  summarizePromotion,
} from '../utils/promotion'

const router = useRouter()
const notify = useNotify()
const { ask } = useConfirm()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const calendar = useAcademicCalendar(school.scopeId, school.ready)
const scope = () => ({ schoolId: school.scopeId.value })

const step = ref(1)
const busy = ref(false)
const result = ref(null)

// ---- Langkah 1: semester ----
const fromId = ref(null)
const toId = ref(null)
const activate = ref(true)
const fromSemester = computed(() => calendar.semesterOf(fromId.value))
const toSemester = computed(() => calendar.semesterOf(toId.value))
const semesterOptions = computed(() =>
  calendar.semesters.value.map((s) => ({ value: s.id, label: s.label })),
)

// Default: asal = semester aktif; tujuan = Ganjil tahun pelajaran berikutnya.
watch(
  () => calendar.semesters.value,
  () => {
    if (fromId.value || !calendar.activeSemester.value) return
    const active = calendar.activeSemester.value
    fromId.value = active.id
    const nextYear = `${Number(active.yearName.slice(0, 4)) + 1}`
    toId.value =
      calendar.semesters.value.find(
        (s) => s.yearName.startsWith(nextYear) && s.term === TERM_GANJIL,
      )?.id ?? null
  },
  { immediate: true },
)

const semesterError = computed(() => {
  if (!fromSemester.value || !toSemester.value) return 'Pilih semester asal dan tujuan.'
  if (fromSemester.value.academicYearId === toSemester.value.academicYearId) {
    return 'Semester tujuan harus pada tahun pelajaran berikutnya.'
  }
  return ''
})

// ---- Langkah 2: pemetaan kelas ----
const fromClasses = ref([])
const toClasses = ref([])
const mappings = ref({})

const targetOptions = computed(() => [
  { value: SKIP, label: 'Lewati (tidak diproses)' },
  { value: GRADUATE, label: 'Lulus' },
  ...toClasses.value.map((c) => ({ value: c.id, label: `${c.name} · tingkat ${c.gradeLevel}` })),
])
const classOptions = computed(() => toClasses.value.map((c) => ({ value: c.id, label: c.name })))
const targetName = (target) =>
  target === GRADUATE ? 'Lulus' : (toClasses.value.find((c) => c.id === target)?.name ?? '-')

async function goToMappings() {
  if (semesterError.value) return
  busy.value = true
  try {
    const [from, to] = await Promise.all([
      listClassOptions({
        ...scope(),
        academicYearId: fromSemester.value.academicYearId,
        semesterId: fromId.value,
      }),
      listClassOptions({ ...scope(), academicYearId: toSemester.value.academicYearId }),
    ])
    fromClasses.value = from
    toClasses.value = to
    mappings.value = Object.fromEntries(
      from.map((c) => [c.id, c.studentCount === 0 ? SKIP : suggestTarget(c, to)]),
    )
    step.value = 2
  } catch (error) {
    notify.error(error)
  } finally {
    busy.value = false
  }
}

const mappingsReady = computed(() => mappingsComplete(fromClasses.value, mappings.value))

// ---- Langkah 3: siswa ----
const members = ref({})
const mappedClasses = computed(() =>
  fromClasses.value.filter((c) => mappings.value[c.id] && mappings.value[c.id] !== SKIP),
)

async function goToStudents() {
  if (!mappingsReady.value) return
  busy.value = true
  try {
    const lists = await Promise.all(
      mappedClasses.value.map((c) => listMembers(c.id, { semesterId: fromId.value, ...scope() })),
    )
    members.value = Object.fromEntries(
      mappedClasses.value.map((c, i) => [
        c.id,
        lists[i].map((m) => ({ ...m, include: true, override: null })),
      ]),
    )
    step.value = 3
  } catch (error) {
    notify.error(error)
  } finally {
    busy.value = false
  }
}

const includedCount = (classId) => (members.value[classId] ?? []).filter((m) => m.include).length
const setAll = (classId, include) => members.value[classId].forEach((m) => (m.include = include))

// ---- Langkah 4: ringkasan & proses ----
const summary = computed(() =>
  summarizePromotion({ mappings: mappings.value, members: members.value }),
)
const payload = computed(() =>
  buildPromotionPayload({
    fromSemesterId: fromId.value,
    toSemesterId: toId.value,
    mappings: mappings.value,
    members: members.value,
    activate: activate.value,
  }),
)

async function run() {
  if (!payload.value.mappings.length) return
  const confirmed = await ask({
    header: 'Proses kenaikan kelas',
    message: `${summary.value.promoted} siswa naik, ${summary.value.graduated} lulus (akun dinonaktifkan), ${summary.value.redirected} diarahkan ke kelas lain. Proses ini tidak dapat dibatalkan otomatis. Lanjutkan?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Proses',
  })
  if (!confirmed) return
  busy.value = true
  try {
    result.value = await promote(payload.value, scope())
    notify.success('Kenaikan kelas selesai diproses')
    await calendar.reload()
  } catch (error) {
    notify.error(error)
  } finally {
    busy.value = false
  }
}

const toClassesPage = (yearId) =>
  router.push({
    name: 'classes',
    query: { year: yearId, school_id: school.scopeId.value || undefined },
  })
</script>

<template>
  <div class="page">
    <PageHeader
      title="Kenaikan Kelas & Kelulusan"
      description="Pindahkan siswa ke kelas tahun pelajaran berikutnya dan luluskan siswa tingkat akhir dalam satu proses."
    >
      <template #actions>
        <Button
          label="Daftar kelas"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="toClassesPage(fromSemester?.academicYearId)"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <Card v-if="school.ready.value && result">
      <template #content>
        <div class="promotion-result">
          <i class="pi pi-check-circle promotion-result__icon" aria-hidden="true" />
          <h2>Kenaikan kelas selesai</h2>
          <div class="promotion-stats">
            <div>
              <strong>{{ result.promoted }}</strong
              ><span>siswa naik / dipindahkan</span>
            </div>
            <div>
              <strong>{{ result.graduated }}</strong
              ><span>siswa lulus</span>
            </div>
            <div>
              <strong>{{ result.skipped }}</strong
              ><span>dilewati</span>
            </div>
          </div>
          <p class="text-muted">
            Semester tujuan: {{ toSemester?.label
            }}<template v-if="activate"> — sekarang aktif.</template>
          </p>
          <Button
            label="Lihat kelas tahun tujuan"
            icon="pi pi-sitemap"
            @click="toClassesPage(toSemester?.academicYearId)"
          />
        </div>
      </template>
    </Card>

    <Card v-else-if="school.ready.value">
      <template #content>
        <Stepper v-model:value="step" linear>
          <StepList>
            <Step :value="1">Semester</Step>
            <Step :value="2">Pemetaan kelas</Step>
            <Step :value="3">Siswa</Step>
            <Step :value="4">Ringkasan</Step>
          </StepList>
          <StepPanels>
            <!-- 1. Semester asal & tujuan -->
            <StepPanel :value="1">
              <div class="form-stack">
                <Message
                  v-if="!calendar.loading.value && calendar.years.value.length < 2"
                  severity="warn"
                  :closable="false"
                >
                  Kenaikan kelas membutuhkan minimal dua tahun pelajaran. Buat tahun pelajaran
                  berikutnya di
                  <RouterLink :to="{ name: 'academic-years' }"
                    >Tahun Pelajaran & Semester</RouterLink
                  >.
                </Message>
                <div class="form-grid">
                  <div class="form-field">
                    <label for="from-semester" class="form-field__label">Semester asal</label>
                    <Select
                      v-model="fromId"
                      input-id="from-semester"
                      :options="semesterOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="Pilih semester"
                      fluid
                    />
                    <small class="form-field__hint"
                      >Biasanya semester Genap tahun yang berakhir.</small
                    >
                  </div>
                  <div class="form-field">
                    <label for="to-semester" class="form-field__label">Semester tujuan</label>
                    <Select
                      v-model="toId"
                      input-id="to-semester"
                      :options="semesterOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="Pilih semester"
                      fluid
                    />
                    <small class="form-field__hint"
                      >Biasanya semester Ganjil tahun pelajaran baru.</small
                    >
                  </div>
                </div>
                <small v-if="fromId && toId && semesterError" class="form-field__error">{{
                  semesterError
                }}</small>
                <div class="wizard-actions">
                  <span class="wizard-actions__spacer" />
                  <Button
                    label="Lanjut"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    :loading="busy"
                    :disabled="!!semesterError"
                    @click="goToMappings"
                  />
                </div>
              </div>
            </StepPanel>

            <!-- 2. Pemetaan kelas -->
            <StepPanel :value="2">
              <div class="form-stack">
                <Message v-if="!toClasses.length" severity="warn" :closable="false">
                  Tahun pelajaran tujuan belum punya kelas. Siswa hanya bisa diluluskan.
                  <a href="#" @click.prevent="toClassesPage(toSemester?.academicYearId)"
                    >Buat atau salin kelas</a
                  >
                  lebih dulu.
                </Message>
                <p class="text-muted" style="margin: 0">
                  Tentukan kelas tujuan tiap kelas asal. Saran otomatis: kelas tingkat berikutnya
                  dengan nama serupa; kelas tingkat akhir diluluskan.
                </p>
                <DataTable :value="fromClasses" data-key="id" size="small">
                  <Column header="Kelas asal">
                    <template #body="{ data }">
                      <strong>{{ data.name }}</strong>
                      <span class="text-muted">
                        · tingkat {{ data.gradeLevel }} · {{ data.studentCount }} siswa</span
                      >
                    </template>
                  </Column>
                  <Column header="Tujuan" style="width: 45%">
                    <template #body="{ data }">
                      <Select
                        v-model="mappings[data.id]"
                        :options="targetOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Pilih tujuan"
                        :invalid="!mappings[data.id]"
                        :aria-label="`Tujuan ${data.name}`"
                        fluid
                      />
                    </template>
                  </Column>
                </DataTable>
                <div class="wizard-actions">
                  <Button
                    label="Kembali"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    text
                    @click="step = 1"
                  />
                  <span class="wizard-actions__spacer" />
                  <Button
                    label="Lanjut"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    :loading="busy"
                    :disabled="!mappingsReady"
                    @click="goToStudents"
                  />
                </div>
              </div>
            </StepPanel>

            <!-- 3. Siswa -->
            <StepPanel :value="3">
              <div class="form-stack">
                <p class="text-muted" style="margin: 0">
                  Hilangkan centang siswa yang tidak diproses, atau arahkan siswa ke kelas lain
                  (mis. tidak naik kelas).
                </p>
                <Accordion multiple :value="mappedClasses.map((c) => c.id)">
                  <AccordionPanel v-for="cls in mappedClasses" :key="cls.id" :value="cls.id">
                    <AccordionHeader>
                      <span class="promotion-header">
                        <strong>{{ cls.name }}</strong>
                        <i class="pi pi-arrow-right" aria-hidden="true" />
                        <Tag
                          :value="targetName(mappings[cls.id])"
                          :severity="mappings[cls.id] === GRADUATE ? 'warn' : 'info'"
                        />
                        <span class="text-muted"
                          >{{ includedCount(cls.id) }}/{{
                            members[cls.id]?.length ?? 0
                          }}
                          siswa</span
                        >
                      </span>
                    </AccordionHeader>
                    <AccordionContent>
                      <div class="toolbar promotion-toolbar">
                        <Button
                          label="Pilih semua"
                          size="small"
                          text
                          @click="setAll(cls.id, true)"
                        />
                        <Button
                          label="Kosongkan"
                          size="small"
                          text
                          severity="secondary"
                          @click="setAll(cls.id, false)"
                        />
                      </div>
                      <DataTable :value="members[cls.id]" data-key="studentId" size="small">
                        <Column header="Proses" style="width: 5rem">
                          <template #body="{ data }">
                            <Checkbox
                              v-model="data.include"
                              binary
                              :aria-label="`Proses ${data.name}`"
                            />
                          </template>
                        </Column>
                        <Column field="name" header="Nama" />
                        <Column field="nis" header="NIS" />
                        <Column header="Arahkan ke kelas lain" style="width: 40%">
                          <template #body="{ data }">
                            <Select
                              v-model="data.override"
                              :options="classOptions"
                              option-label="label"
                              option-value="value"
                              placeholder="Ikut pemetaan"
                              :disabled="!data.include || !classOptions.length"
                              :aria-label="`Kelas lain untuk ${data.name}`"
                              show-clear
                              fluid
                            />
                          </template>
                        </Column>
                      </DataTable>
                    </AccordionContent>
                  </AccordionPanel>
                </Accordion>
                <div class="wizard-actions">
                  <Button
                    label="Kembali"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    text
                    @click="step = 2"
                  />
                  <span class="wizard-actions__spacer" />
                  <Button
                    label="Lanjut"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    :disabled="!payload.mappings.length"
                    @click="step = 4"
                  />
                </div>
              </div>
            </StepPanel>

            <!-- 4. Ringkasan -->
            <StepPanel :value="4">
              <div class="form-stack">
                <div class="promotion-stats">
                  <div>
                    <strong>{{ summary.promoted }}</strong
                    ><span>naik kelas</span>
                  </div>
                  <div>
                    <strong>{{ summary.graduated }}</strong
                    ><span>lulus</span>
                  </div>
                  <div>
                    <strong>{{ summary.redirected }}</strong
                    ><span>diarahkan ke kelas lain</span>
                  </div>
                  <div>
                    <strong>{{ summary.excluded }}</strong
                    ><span>tidak diproses</span>
                  </div>
                </div>
                <dl class="summary-list">
                  <dt>Dari</dt>
                  <dd>{{ fromSemester?.label }}</dd>
                  <dt>Ke</dt>
                  <dd>{{ toSemester?.label }}</dd>
                  <template v-for="cls in mappedClasses" :key="cls.id">
                    <dt>{{ cls.name }}</dt>
                    <dd>{{ targetName(mappings[cls.id]) }} ({{ includedCount(cls.id) }} siswa)</dd>
                  </template>
                </dl>
                <Message v-if="summary.graduated" severity="warn" :closable="false">
                  Siswa yang lulus berstatus Lulus dan akunnya dinonaktifkan.
                </Message>
                <div class="form-switch">
                  <Checkbox v-model="activate" binary input-id="activate-target" />
                  <label for="activate-target"
                    >Aktifkan semester {{ toSemester?.label }} setelah selesai</label
                  >
                </div>
                <div class="wizard-actions">
                  <Button
                    label="Kembali"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    text
                    :disabled="busy"
                    @click="step = 3"
                  />
                  <span class="wizard-actions__spacer" />
                  <Button
                    label="Proses kenaikan kelas"
                    icon="pi pi-check"
                    :loading="busy"
                    :disabled="busy || !payload.mappings.length"
                    @click="run"
                  />
                </div>
              </div>
            </StepPanel>
          </StepPanels>
        </Stepper>
      </template>
    </Card>
  </div>
</template>
