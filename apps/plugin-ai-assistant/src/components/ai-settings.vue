<script setup lang="ts">
import { ref } from 'vue'
import { aiActions, aiState } from '../store/ai.store'

const editId = ref<string | null>(null)
const editName = ref('')
const editContent = ref('')

function startAdd() {
  editId.value = 'new'
  editName.value = 'Новый промпт'
  editContent.value = ''
}

function startEdit(p: any) {
  editId.value = p.id
  editName.value = p.name
  editContent.value = p.content
}

function savePrompt() {
  if (!editName.value.trim() || !editContent.value.trim())
    return
  if (editId.value === 'new') {
    aiActions.addPrompt(editName.value, editContent.value)
  }
  else if (editId.value) {
    aiActions.updatePrompt(editId.value, editName.value, editContent.value)
  }
  editId.value = null
}
</script>

<template>
  <div class="ai-tab-view">
    <div class="ai-body custom-scrollbar">
      <div class="ai-settings">
        <div class="settings-block">
          <label>
            API Key (AiHubMix)
            <input v-model="aiState.apiKey" type="password" placeholder="sk-..." class="editor-input">
          </label>
        </div>

        <div class="settings-block">
          <div class="topics-header">
            <label style="margin:0">Ваши системные промпты</label>
            <button class="ai-btn ai-btn-primary ai-btn-sm" @click="startAdd">
              + Добавить
            </button>
          </div>

          <!-- Редактор промпта -->
          <div v-if="editId" class="prompt-editor">
            <input v-model="editName" placeholder="Название промпта" class="editor-input">
            <textarea v-model="editContent" rows="4" placeholder="Ты профессиональный переводчик..." class="editor-input custom-scrollbar" />
            <div class="editor-actions">
              <button class="ai-btn ai-btn-sm" @click="editId = null">
                Отмена
              </button>
              <button class="ai-btn ai-btn-primary ai-btn-sm" @click="savePrompt">
                Сохранить
              </button>
            </div>
          </div>

          <!-- Список промптов -->
          <div class="prompts-list">
            <div v-for="p in aiState.systemPrompts" :key="p.id" class="prompt-card">
              <div class="prompt-info">
                <div class="prompt-name">
                  {{ p.name }}
                </div>
                <div class="prompt-preview">
                  {{ p.content }}
                </div>
              </div>
              <div class="prompt-actions">
                <button class="ai-icon-btn" @click="startEdit(p)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </button>
                <button v-if="p.id !== 'default'" class="ai-icon-btn danger" @click="aiActions.deletePrompt(p.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
