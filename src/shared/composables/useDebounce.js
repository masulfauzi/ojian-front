import { customRef, getCurrentScope, onScopeDispose } from 'vue'

/**
 * Bungkus fungsi agar hanya dijalankan setelah `delay` ms tanpa panggilan baru.
 * Timer dibatalkan otomatis saat komponen dilepas.
 */
export function useDebounceFn(fn, delay = 300) {
  let timer = null
  const cancel = () => {
    clearTimeout(timer)
    timer = null
  }
  const debounced = (...args) => {
    cancel()
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }
  debounced.cancel = cancel

  if (getCurrentScope()) onScopeDispose(cancel)
  return debounced
}

/**
 * Ref yang langsung memperbarui nilai lokal (untuk v-model input), tetapi baru memicu
 * watcher setelah `delay` ms tanpa perubahan.
 */
export function useDebounce(initialValue, delay = 300) {
  let timer = null
  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer))

  return customRef((track, trigger) => {
    let value = initialValue
    return {
      get() {
        track()
        return value
      },
      set(next) {
        value = next
        clearTimeout(timer)
        timer = setTimeout(trigger, delay)
      },
    }
  })
}
