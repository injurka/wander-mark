<script setup lang="ts">
import { aiActions, aiState } from '../store/ai.store'

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="ai-tab-view">
    <div class="ai-body custom-scrollbar">
      <div class="ai-topics">
        <div class="topics-header">
          <h3>Ваши диалоги</h3>
          <button class="ai-btn ai-btn-primary ai-btn-sm" @click="aiActions.createNewTopic()">
            + Новый чат
          </button>
        </div>

        <div v-if="aiState.topics.length === 0" class="topics-empty">
          У вас еще нет сохраненных чатов.
        </div>

        <div class="topics-list">
          <div
            v-for="topic in aiState.topics"
            :key="topic.id"
            class="topic-card"
            :class="{ 'is-active': topic.id === aiState.currentTopicId }"
            @click="aiActions.selectTopic(topic.id)"
          >
            <div class="topic-info">
              <div class="topic-title">
                {{ topic.title }}
              </div>
              <div class="topic-meta">
                <span>{{ topic.history.length }} сообщений</span>
                <span>•</span>
                <span>{{ formatDate(topic.updatedAt) }}</span>
              </div>
            </div>
            <button class="topic-delete-btn" title="Удалить" @click.stop="aiActions.deleteTopic(topic.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
