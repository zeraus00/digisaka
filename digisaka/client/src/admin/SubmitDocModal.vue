<script setup>
import { ref, computed } from 'vue';
import Modal from './Modal.vue';
import { useWorkflowsStore } from '../stores/workflows.js';
import { samplesEnabled, DOC_SCENARIOS, DOC_TEXT } from '../helpers/stubSamples.js';

const emit = defineEmits(['close', 'done']);
const store = useWorkflowsStore();
const file = ref(null), title = ref(''), text = ref('');
const stub = samplesEnabled(); // stub stack only
const fill = (sc) => { file.value = null; title.value = sc.title; text.value = DOC_TEXT; };
const isPdf = computed(() => file.value && /\.pdf$/i.test(file.value.name));

async function pick(e) {
  const f = e.target.files[0];
  if (!f) return;
  file.value = f;
  if (!title.value) title.value = f.name.replace(/\.[^.]+$/, '');
  text.value = /\.pdf$/i.test(f.name) ? '' : await f.text();
}
async function submit() {
  const w = isPdf.value ? await store.submitFile(file.value, title.value.trim()) : await store.submitText(title.value.trim(), text.value);
  if (w) emit('done', w);
}
const ready = computed(() => title.value.trim() && (isPdf.value || text.value.trim()));
</script>

<template>
  <Modal title="Submit document" width="560px" @close="emit('close')">
    <div v-if="stub" class="a-field">Sample documents (stub)
      <div class="samples"><button v-for="sc in DOC_SCENARIOS" :key="sc.label" type="button" class="a-btn" @click="fill(sc)">{{ sc.label }}</button></div>
    </div>
    <label class="a-field">Text or PDF file
      <input type="file" class="a-input file" accept=".txt,.pdf,text/plain,application/pdf" @change="pick">
      <small class="a-muted">A plain-text file, or a PDF with a text layer. Or paste text below.</small>
    </label>
    <label class="a-field">Title<input v-model="title" class="a-input" maxlength="200"></label>
    <label v-if="!isPdf" class="a-field">Text<textarea v-model="text" class="a-input area" rows="8"></textarea></label>
    <p v-if="store.error" class="a-note err" role="alert">{{ store.error }}</p>
    <template #footer>
      <button type="button" class="a-btn" @click="emit('close')">Cancel</button>
      <button type="button" class="a-btn primary" :disabled="!ready || store.busy" @click="submit">{{ store.busy ? 'Submitting…' : 'Submit' }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.file { height: auto; padding: 9px 12px; }
.area { height: auto; font: 13px/1.5 ui-monospace, monospace; resize: vertical; }
</style>

<style scoped>
.samples { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
