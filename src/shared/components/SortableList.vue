<script setup>
import { VueDraggable } from 'vue-draggable-plus'

const model = defineModel({ type: Array, required: true })

const props = defineProps({
  /** Nama properti kunci unik tiap item, atau fungsi (item) => key. */
  itemKey: { type: [String, Function], default: 'id' },
  /** Selector elemen pegangan drag (mis. '.drag-handle'). Kosong = seluruh item bisa diseret. */
  handle: { type: String, default: undefined },
  /** Nama grup (atau opsi grup SortableJS) agar item bisa berpindah antar daftar. */
  group: { type: [String, Object], default: undefined },
  disabled: { type: Boolean, default: false },
  animation: { type: Number, default: 150 },
})

const emit = defineEmits(['change'])

const keyOf = (item, index) =>
  typeof props.itemKey === 'function' ? props.itemKey(item) : (item?.[props.itemKey] ?? index)
</script>

<template>
  <VueDraggable
    v-model="model"
    class="sortable-list"
    :handle="handle"
    :group="group"
    :disabled="disabled"
    :animation="animation"
    ghost-class="sortable-ghost"
    @update="emit('change', { type: 'update', event: $event })"
    @add="emit('change', { type: 'add', event: $event })"
    @remove="emit('change', { type: 'remove', event: $event })"
  >
    <div v-for="(item, index) in model" :key="keyOf(item, index)" class="sortable-list__item">
      <slot name="item" :item="item" :index="index">{{ item }}</slot>
    </div>
  </VueDraggable>
</template>
