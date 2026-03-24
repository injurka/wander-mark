<script setup lang="ts">
import { ref } from 'vue'
import { aiActions, aiState } from '../store/ai.store'

const editId = ref<string | null>(null)
const editName = ref('')
const editContent = ref('')
const isLoadingConfig = ref(false)

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

async function loadConfig() {
  isLoadingConfig.value = true
  try {
    const url = `${aiState.vaultUrl}/configs/plugins/configs/ai-assistant.json`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Ошибка HTTP: ${res.status}`)
    }

    const data = await res.json()
    let loaded = false

    if (data.apiKey) {
      aiState.apiKey = data.apiKey
      loaded = true
    }

    if (data.prompts && Array.isArray(data.prompts)) {
      data.prompts.forEach((p: any) => {
        // Добавляем только если промпта с таким именем еще нет
        if (!aiState.systemPrompts.some(existing => existing.name === p.name)) {
          aiActions.addPrompt(p.name || 'Без названия', p.content || '')
        }
      })
      loaded = true
    }

    if (loaded) {
      if (aiState.showToast) {
        aiState.showToast('Конфиг успешно загружен!', { type: 'success' })
      }
      else {
        alert('Конфиг успешно загружен!')
      }
    }
    else {
      if (aiState.showToast) {
        aiState.showToast('Конфиг пуст или имеет неверный формат', { type: 'warning' })
      }
      else {
        alert('Конфиг пуст или имеет неверный формат')
      }
    }
  }
  catch (e: any) {
    if (aiState.showToast) {
      aiState.showToast(`Не удалось загрузить конфиг: ${e.message}`, { type: 'error' })
    }
    else {
      alert(`Не удалось загрузить конфиг: ${e.message}`)
    }
  }
  finally {
    isLoadingConfig.value = false
  }
}
</script>

<template>
  <div class="ai-tab-view">
    <div class="ai-body custom-scrollbar">
      <div class="ai-settings">
        <!-- API Key Block -->
        <div class="settings-block">
          <div class="topics-header">
            <label style="margin:0">API Key (AiHubMix)</label>
            <button class="ai-btn ai-btn-sm" :disabled="isLoadingConfig" @click="loadConfig">
              {{ isLoadingConfig ? 'Загрузка...' : 'Загрузить конфиг' }}
            </button>
          </div>
          <input v-model="aiState.apiKey" type="password" placeholder="sk-..." class="editor-input">
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
