<script setup lang="ts">
import { ref } from 'vue'
import { usePluginI18n } from '../i18n'
import { aiActions, aiState } from '../store/ai.store'

const { t } = usePluginI18n()
const editId = ref<string | null>(null)
const editName = ref('')
const editContent = ref('')
const isLoadingConfig = ref(false)

function startAdd() {
  editId.value = 'new'
  editName.value = t('settings.newPrompt')
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
    // 1. Формируем новый путь относительно корня хранилища
    const configPath = `meta/${aiState.vaultId}/plugins/configs/ai-assistant.json`

    let configText = null

    // 2. Пытаемся получить файл через API хоста (работает оффлайн и в нативе)
    if (aiState.getFileContent) {
      configText = await aiState.getFileContent(configPath)
    }

    // 3. Fallback: если не вышло, делаем обычный fetch
    if (!configText) {
      const url = `${aiState.vaultUrl}/${configPath}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP: ${res.status}`)
      }
      configText = await res.text()
    }

    const data = JSON.parse(configText)
    let loaded = false

    if (data.apiKey) {
      aiState.apiKey = data.apiKey
      loaded = true
    }

    if (data.prompts && Array.isArray(data.prompts)) {
      data.prompts.forEach((p: any) => {
        if (!aiState.systemPrompts.some(existing => existing.name === p.name)) {
          aiActions.addPrompt(p.name || t('chat.unknown'), p.content || '')
        }
      })
      loaded = true
    }

    if (loaded) {
      if (aiState.showToast) {
        aiState.showToast(t('settings.configSuccess'), { type: 'success' })
      }
      else {
        alert(t('settings.configSuccess'))
      }
    }
    else {
      if (aiState.showToast) {
        aiState.showToast(t('settings.configEmpty'), { type: 'warning' })
      }
      else {
        alert(t('settings.configEmpty'))
      }
    }
  }
  catch (e: any) {
    if (aiState.showToast) {
      aiState.showToast(`${t('settings.configError')}${e.message}`, { type: 'error' })
    }
    else {
      alert(`${t('settings.configError')}${e.message}`)
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
              {{ isLoadingConfig ? t('settings.loading') : t('settings.loadConfig') }}
            </button>
          </div>
          <input v-model="aiState.apiKey" type="password" placeholder="sk-..." class="editor-input">
        </div>

        <div class="settings-block">
          <div class="topics-header">
            <label style="margin:0">{{ t('settings.systemPrompts') }}</label>
            <button class="ai-btn ai-btn-primary ai-btn-sm" @click="startAdd">
              {{ t('settings.add') }}
            </button>
          </div>

          <!-- Редактор промпта -->
          <div v-if="editId" class="prompt-editor">
            <input v-model="editName" :placeholder="t('settings.promptName')" class="editor-input">
            <textarea v-model="editContent" rows="4" :placeholder="t('settings.promptPlaceholder')" class="editor-input custom-scrollbar" />
            <div class="editor-actions">
              <button class="ai-btn ai-btn-sm" @click="editId = null">
                {{ t('settings.cancel') }}
              </button>
              <button class="ai-btn ai-btn-primary ai-btn-sm" @click="savePrompt">
                {{ t('settings.save') }}
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
