<script setup lang="ts">
import type { RecipeFrontmatter } from '../types'
import { computed, ref, watch } from 'vue'
import { pluginContext } from '../store/plugin.store'

// ─── Parsed recipe from frontmatter ───
interface ParsedRecipe {
  id: string
  title: string
  url: string
  category: string
  difficulty: number
  time_total_min: number
  servings_default: number
  tea_base_type: string
  temperature: string
  ingredients: RecipeFrontmatter['ingredients']
  tools: string[]
  tags: string[]
  content: string
  // computed at filter time
  ingredientMatchCount?: number
  ingredientMatchPercent?: number
}

// ─── State ───
const isLoading = ref(true)
const recipes = ref<ParsedRecipe[]>([])

// Filter state
const searchQuery = ref('')
const maxTime = ref<number | ''>('')
const selectedDifficulty = ref<number | ''>('')
const selectedCategory = ref('')
const selectedTags = ref<string[]>([])
const selectedIngredients = ref<string[]>([])
const ingredientSearch = ref('')
const showIngredientDropdown = ref(false)

const categories = [
  { value: 'классический', label: '🍵 Классический' },
  { value: 'молочный', label: '🥛 Молочный' },
  { value: 'фруктовый', label: '🍊 Фруктовый' },
  { value: 'травяной', label: '🌿 Травяной' },
  { value: 'холодный', label: '🧊 Холодный' },
  { value: 'авторский', label: '✨ Авторский' },
]

const showCategoryDropdown = ref(false)
const selectedCategoryLabel = computed(() => {
  if (!selectedCategory.value)
    return 'Любая'

  const found = categories.find(c => c.value === selectedCategory.value)

  return found ? found.label : 'Любая'
})

function selectCategory(val: string) {
  selectedCategory.value = val
  showCategoryDropdown.value = false
}

function handleCategoryBlur() {
  setTimeout(() => {
    showCategoryDropdown.value = false
  }, 200)
}

// ─── Parse YAML frontmatter from raw markdown ───
function parseFrontmatter(raw: string): Record<string, any> | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match)
    return null

  const yaml = match[1]
  const result: Record<string, any> = {}
  const lines = yaml.split(/\r?\n/)

  let currentKey = ''
  let currentList: any[] | null = null
  let isIngredientsList = false
  let currentIngredient: Record<string, any> | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#'))
      continue

    // Top-level key: value
    const kvMatch = line.match(/^([a-z_]+):(.*)$/)
    if (kvMatch) {
      // Flush previous ingredient
      if (currentIngredient && isIngredientsList && currentList) {
        currentList.push(currentIngredient)
        currentIngredient = null
      }

      currentKey = kvMatch[1]
      const rawVal = kvMatch[2].trim()

      if (!rawVal || rawVal === '') {
        // Start of a list
        currentList = []
        result[currentKey] = currentList
        isIngredientsList = currentKey === 'ingredients'
        continue
      }

      // Inline array [a, b, c]
      if (rawVal.startsWith('[')) {
        const inner = rawVal.replace(/^\[|\]$/g, '')
        result[currentKey] = inner
          ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
          : []
        currentList = null
        isIngredientsList = false
        continue
      }

      // Scalar
      let val: any = rawVal.replace(/^["']|["']$/g, '')
      if (val === 'true')
        val = true
      else if (val === 'false')
        val = false
      else if (/^\d+$/.test(val))
        val = Number.parseInt(val, 10)
      else if (/^\d+\.\d+$/.test(val))
        val = Number.parseFloat(val)
      result[currentKey] = val
      currentList = null
      isIngredientsList = false
      continue
    }

    // List items
    if (currentList !== null) {
      if (isIngredientsList) {
        // Ingredient object item: "  - item: ..."
        const itemStart = trimmed.match(/^-\s+(\w+):(.*)$/)
        if (itemStart) {
          // Flush previous ingredient
          if (currentIngredient) {
            currentList.push(currentIngredient)
          }
          currentIngredient = {}
          const key = itemStart[1]
          let val: any = itemStart[2].trim().replace(/^["']|["']$/g, '')
          if (val === 'true')
            val = true
          else if (val === 'false')
            val = false
          else if (/^\d+$/.test(val))
            val = Number.parseInt(val, 10)
          else if (/^\d+\.\d+$/.test(val))
            val = Number.parseFloat(val)
          // Check for inline array
          if (typeof val === 'string' && val.startsWith('[')) {
            const inner = val.replace(/^\[|\]$/g, '')
            val = inner ? inner.split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, '')) : []
          }
          currentIngredient[key] = val
          continue
        }

        // Nested key inside ingredient: "    amount: 200"
        const nestedKV = trimmed.match(/^(\w+):(.*)$/)
        if (nestedKV && currentIngredient) {
          const key = nestedKV[1]
          let val: any = nestedKV[2].trim().replace(/^["']|["']$/g, '')
          if (val === 'true')
            val = true
          else if (val === 'false')
            val = false
          else if (/^\d+$/.test(val))
            val = Number.parseInt(val, 10)
          else if (/^\d+\.\d+$/.test(val))
            val = Number.parseFloat(val)
          // Check for inline array
          if (typeof val === 'string' && val.startsWith('[')) {
            const inner = val.replace(/^\[|\]$/g, '')
            val = inner ? inner.split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, '')) : []
          }
          currentIngredient[key] = val
          continue
        }
      }
      else {
        // Simple list "  - value"
        const listItem = trimmed.match(/^- (.*)$/)
        if (listItem) {
          currentList.push(listItem[1].replace(/^["']|["']$/g, ''))
          continue
        }
      }
    }
  }

  // Flush last ingredient
  if (currentIngredient && isIngredientsList && currentList) {
    currentList.push(currentIngredient)
  }

  return result
}

// ─── Load recipes from raw markdown via getFileContent ───
async function loadRecipes() {
  const ctx = pluginContext.value
  if (!ctx || !ctx.searchIndex)
    return

  isLoading.value = true
  const loaded: ParsedRecipe[] = []

  // For each search index item, try to load raw file and check frontmatter
  const items = ctx.searchIndex
  const loadPromises = items.map(async (item: any) => {
    try {
      // URL format: /vaultId/path/to/file
      // getFileContent format: content/vaultId/path/to/file.md
      const url: string = item.url
      const filePath = `content${url}.md`
      const raw = await ctx.getFileContent(filePath)
      if (!raw)
        return null

      const fm = parseFrontmatter(raw)
      if (!fm || fm.target !== 'recipe-viewer')
        return null

      return {
        id: fm.id || item.id,
        title: fm.title || item.title,
        url: item.url,
        category: fm.category || '',
        difficulty: fm.difficulty ?? 0,
        time_total_min: fm.time_total_min ?? 0,
        servings_default: fm.servings_default ?? 1,
        tea_base_type: fm.tea_base_type || '',
        temperature: fm.temperature || '',
        ingredients: (fm.ingredients || []).map((ing: any) => ({
          item: ing.item || '',
          amount: ing.amount ?? 0,
          unit: ing.unit || '',
          required: ing.required ?? true,
          alternatives: ing.alternatives || [],
        })),
        tools: fm.tools || [],
        tags: fm.tags || [],
        content: item.content,
      } as ParsedRecipe
    }
    catch {
      return null
    }
  })

  const results = await Promise.all(loadPromises)
  results.forEach((r) => {
    if (r)
      loaded.push(r)
  })

  recipes.value = loaded
  isLoading.value = false
}

// Watch for context changes and reload
watch(pluginContext, () => {
  loadRecipes()
}, { immediate: true })

// ─── Available ingredients (unique, sorted, human-readable) ───
const allIngredients = computed(() => {
  const set = new Set<string>()
  recipes.value.forEach((r) => {
    r.ingredients.forEach((ing) => {
      set.add(ing.item)
      // Also add alternatives
      if (ing.alternatives) {
        ing.alternatives.forEach(alt => set.add(alt))
      }
    })
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'))
})

// Human-readable ingredient name (replace underscores with spaces, capitalize)
function ingredientLabel(item: string): string {
  return item.replace(/_/g, ' ')
}

// Filtered ingredient list for dropdown
const filteredIngredientOptions = computed(() => {
  const q = ingredientSearch.value.toLowerCase().trim()
  return allIngredients.value
    .filter(i => !selectedIngredients.value.includes(i))
    .filter(i => !q || ingredientLabel(i).toLowerCase().includes(q))
})

function addIngredient(item: string) {
  if (!selectedIngredients.value.includes(item)) {
    selectedIngredients.value = [...selectedIngredients.value, item]
  }
  ingredientSearch.value = ''
  showIngredientDropdown.value = false
}

function removeIngredient(item: string) {
  selectedIngredients.value = selectedIngredients.value.filter(i => i !== item)
}

// ─── Available tags ───
const availableTags = computed(() => {
  const tagsSet = new Set<string>()
  recipes.value.forEach((r) => {
    r.tags.forEach(t => tagsSet.add(t))
  })
  return Array.from(tagsSet).sort()
})

function toggleTag(tag: string) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter(t => t !== tag)
  }
  else {
    selectedTags.value = [...selectedTags.value, tag]
  }
}

// ─── Filtered + sorted recipes ───
const filteredRecipes = computed(() => {
  const hasIngredientFilter = selectedIngredients.value.length > 0
  const selectedSet = new Set(selectedIngredients.value)

  let result = recipes.value
    .map((r) => {
      // Compute ingredient match score
      let ingredientMatchCount = 0
      if (hasIngredientFilter) {
        r.ingredients.forEach((ing) => {
          // Check main item or any alternative
          const matches = selectedSet.has(ing.item)
            || (ing.alternatives && ing.alternatives.some(alt => selectedSet.has(alt)))
          if (matches)
            ingredientMatchCount++
        })
      }

      return {
        ...r,
        ingredientMatchCount,
        ingredientMatchPercent: r.ingredients.length > 0
          ? Math.round((ingredientMatchCount / r.ingredients.length) * 100)
          : 0,
      }
    })
    .filter((r) => {
      // Text search
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        if (!r.title.toLowerCase().includes(q) && !r.content.toLowerCase().includes(q))
          return false
      }

      // Category
      if (selectedCategory.value && r.category !== selectedCategory.value)
        return false

      // Time
      if (maxTime.value !== '' && r.time_total_min > 0 && r.time_total_min > maxTime.value)
        return false

      // Difficulty
      if (selectedDifficulty.value !== '' && r.difficulty !== selectedDifficulty.value)
        return false

      // Tags
      if (selectedTags.value.length > 0) {
        const hasAll = selectedTags.value.every(t => r.tags.includes(t))
        if (!hasAll)
          return false
      }

      // Ingredient filter: show only recipes that have at least 1 matching ingredient
      if (hasIngredientFilter && r.ingredientMatchCount === 0)
        return false

      return true
    })

  // Sort by ingredient match (best match first) when filter is active
  if (hasIngredientFilter) {
    result = result.sort((a, b) => {
      // First by match percent descending
      if (b.ingredientMatchPercent !== a.ingredientMatchPercent)
        return b.ingredientMatchPercent - a.ingredientMatchPercent
      // Then by match count descending
      return b.ingredientMatchCount - a.ingredientMatchCount
    })
  }

  return result
})

function getDifficultyLabel(level: number) {
  if (level === 1)
    return '🟢 Легкая'
  if (level === 2)
    return '🟡 Средняя'
  if (level === 3)
    return '🔴 Сложная'
  return ''
}

function getDifficultyClass(level: number) {
  if (level === 1)
    return 'diff-easy'
  if (level === 2)
    return 'diff-medium'
  if (level === 3)
    return 'diff-hard'
  return ''
}

function getMatchClass(percent: number) {
  if (percent >= 80)
    return 'match-high'
  if (percent >= 50)
    return 'match-medium'
  return 'match-low'
}

function openRecipe(url: string) {
  const ctx = pluginContext.value
  if (ctx && ctx.router) {
    ctx.router.push(url)
  }
}

function resetAll() {
  searchQuery.value = ''
  maxTime.value = ''
  selectedDifficulty.value = ''
  selectedCategory.value = ''
  selectedTags.value = []
  selectedIngredients.value = []
  ingredientSearch.value = ''
}

function handleIngredientInputFocus() {
  showIngredientDropdown.value = true
}

function handleIngredientInputBlur() {
  // Delay to allow click on dropdown item
  setTimeout(() => {
    showIngredientDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="recipe-viewer-page custom-scrollbar">
    <header class="page-header">
      <div class="header-icon">
        🍵
      </div>
      <div class="header-text">
        <h1>Каталог рецептов</h1>
        <p>Чай и другие напитки из вашей базы знаний</p>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-value">{{ recipes.length }}</span>
          <span class="stat-label">рецептов</span>
        </div>
      </div>
    </header>

    <div class="search-layout">
      <!-- Боковая панель фильтров -->
      <aside class="filters-panel custom-scrollbar">
        <div class="filters-header">
          <h3 class="filters-title">
            Фильтры
          </h3>
          <button
            v-if="searchQuery || maxTime !== '' || selectedDifficulty !== '' || selectedCategory || selectedTags.length || selectedIngredients.length"
            class="btn-reset-filters"
            @click="resetAll"
          >
            Сбросить
          </button>
        </div>

        <!-- Поиск -->
        <div class="filter-group">
          <label class="filter-label">
            <span class="filter-label-icon">🔍</span>
            Поиск
          </label>
          <div class="input-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              class="filter-input"
              placeholder="Название или состав..."
            >
            <button v-if="searchQuery" class="input-clear" @click="searchQuery = ''">
              ✕
            </button>
          </div>
        </div>

        <!-- ═══ ИНГРЕДИЕНТЫ ═══ -->
        <div class="filter-group filter-group--ingredients">
          <label class="filter-label">
            <span class="filter-label-icon">🧺</span>
            Что есть дома?
          </label>
          <p class="filter-hint">
            Выберите ингредиенты, чтобы найти подходящие рецепты
          </p>

          <!-- Выбранные ингредиенты -->
          <div v-if="selectedIngredients.length > 0" class="selected-ingredients">
            <span
              v-for="item in selectedIngredients"
              :key="item"
              class="ingredient-chip"
            >
              {{ ingredientLabel(item) }}
              <button class="chip-remove" @click="removeIngredient(item)">✕</button>
            </span>
          </div>

          <!-- Поиск ингредиентов -->
          <div class="ingredient-search-wrapper">
            <div class="input-wrapper">
              <input
                v-model="ingredientSearch"
                type="text"
                class="filter-input"
                placeholder="Поиск ингредиента..."
                @focus="handleIngredientInputFocus"
                @click="handleIngredientInputFocus"
                @blur="handleIngredientInputBlur"
              >
            </div>
            <div
              v-if="showIngredientDropdown && filteredIngredientOptions.length > 0"
              class="ingredient-dropdown custom-scrollbar"
            >
              <button
                v-for="item in filteredIngredientOptions"
                :key="item"
                class="ingredient-option"
                @mousedown.prevent="addIngredient(item)"
              >
                {{ ingredientLabel(item) }}
              </button>
            </div>
          </div>
        </div>

        <!-- Категория -->
        <div class="filter-group">
          <label class="filter-label">
            <span class="filter-label-icon">📂</span>
            Категория
          </label>
          <div class="custom-select" tabindex="0" @blur="handleCategoryBlur">
            <button
              class="filter-select custom-select-trigger"
              @click="showCategoryDropdown = !showCategoryDropdown"
            >
              <span>{{ selectedCategoryLabel }}</span>
              <span class="custom-select-arrow" :class="{ 'is-open': showCategoryDropdown }">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </button>
            <div v-if="showCategoryDropdown" class="ingredient-dropdown custom-scrollbar" style="margin-top: 4px;">
              <button
                class="ingredient-option"
                :class="{ active: selectedCategory === '' }"
                @mousedown.prevent="selectCategory('')"
              >
                Любая
              </button>
              <button
                v-for="c in categories"
                :key="c.value"
                class="ingredient-option"
                :class="{ active: selectedCategory === c.value }"
                @mousedown.prevent="selectCategory(c.value)"
              >
                {{ c.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Сложность -->
        <div class="filter-group">
          <label class="filter-label">
            <span class="filter-label-icon">📊</span>
            Сложность
          </label>
          <div class="difficulty-buttons">
            <button
              class="diff-btn"
              :class="{ active: selectedDifficulty === '' }"
              @click="selectedDifficulty = ''"
            >
              Все
            </button>
            <button
              class="diff-btn diff-easy"
              :class="{ active: selectedDifficulty === 1 }"
              @click="selectedDifficulty = selectedDifficulty === 1 ? '' : 1"
            >
              🟢 Легкая
            </button>
            <button
              class="diff-btn diff-medium"
              :class="{ active: selectedDifficulty === 2 }"
              @click="selectedDifficulty = selectedDifficulty === 2 ? '' : 2"
            >
              🟡 Средняя
            </button>
            <button
              class="diff-btn diff-hard"
              :class="{ active: selectedDifficulty === 3 }"
              @click="selectedDifficulty = selectedDifficulty === 3 ? '' : 3"
            >
              🔴 Сложная
            </button>
          </div>
        </div>

        <!-- Время -->
        <div class="filter-group">
          <label class="filter-label">
            <span class="filter-label-icon">⏱️</span>
            Время: <strong>{{ maxTime || 'любое' }}</strong>
            <span v-if="maxTime !== ''" class="filter-label-unit">мин</span>
          </label>
          <input
            v-model.number="maxTime"
            type="range"
            min="1"
            max="60"
            step="1"
            class="range-slider"
          >
          <div class="range-labels">
            <span>1 мин</span>
            <span>60 мин</span>
          </div>
          <button v-if="maxTime !== ''" class="btn-clear-inline" @click="maxTime = ''">
            ✕ Сбросить
          </button>
        </div>

        <!-- Теги -->
        <div v-if="availableTags.length > 0" class="filter-group filter-group--tags">
          <label class="filter-label">
            <span class="filter-label-icon">🏷️</span>
            Теги
          </label>
          <div class="tags-container">
            <button
              v-for="tag in availableTags"
              :key="tag"
              class="tag-chip"
              :class="{ active: selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
      </aside>

      <!-- Результаты -->
      <main class="results-panel">
        <div class="results-header">
          <span class="results-count">
            Найдено рецептов: <strong>{{ filteredRecipes.length }}</strong>
          </span>
          <span v-if="selectedIngredients.length > 0" class="results-sort-hint">
            отсортировано по совпадению ингредиентов
          </span>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner" />
          <p>Загрузка рецептов...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredRecipes.length === 0" class="empty-state">
          <div class="empty-icon">
            🍃
          </div>
          <p>По вашим фильтрам ничего не найдено.</p>
          <button class="btn-reset-all" @click="resetAll">
            Сбросить все фильтры
          </button>
        </div>

        <!-- Grid -->
        <div v-else class="recipes-grid">
          <div
            v-for="recipe in filteredRecipes"
            :key="recipe.id"
            class="recipe-card"
            :class="{ 'has-match': selectedIngredients.length > 0 }"
            @click="openRecipe(recipe.url)"
          >
            <!-- Match badge -->
            <div
              v-if="selectedIngredients.length > 0"
              class="match-badge"
              :class="getMatchClass(recipe.ingredientMatchPercent || 0)"
            >
              {{ recipe.ingredientMatchPercent }}%
            </div>

            <div class="card-content">
              <div class="card-top-row">
                <span v-if="recipe.difficulty" class="difficulty-dot" :class="getDifficultyClass(recipe.difficulty)" :title="getDifficultyLabel(recipe.difficulty)" />
                <span v-if="recipe.time_total_min" class="card-time">⏱️ {{ recipe.time_total_min }} мин</span>
              </div>

              <h3 class="recipe-title">
                {{ recipe.title }}
              </h3>

              <!-- Ingredient match details -->
              <div v-if="selectedIngredients.length > 0 && recipe.ingredientMatchCount" class="match-details">
                <span class="match-bar-wrap">
                  <span class="match-bar" :class="getMatchClass(recipe.ingredientMatchPercent || 0)" :style="{ width: `${recipe.ingredientMatchPercent}%` }" />
                </span>
                <span class="match-text">{{ recipe.ingredientMatchCount }}/{{ recipe.ingredients.length }} ингр.</span>
              </div>

              <!-- Ingredients preview -->
              <div class="recipe-ingredients-preview">
                <span
                  v-for="ing in recipe.ingredients.slice(0, 5)"
                  :key="ing.item"
                  class="ing-tag"
                  :class="{ 'ing-matched': selectedIngredients.includes(ing.item) || (ing.alternatives && ing.alternatives.some(a => selectedIngredients.includes(a))) }"
                >
                  {{ ingredientLabel(ing.item) }}
                </span>
                <span v-if="recipe.ingredients.length > 5" class="ing-more">
                  +{{ recipe.ingredients.length - 5 }}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <div class="footer-meta">
                <span v-if="recipe.category" class="meta-badge">{{ recipe.category }}</span>
                <span v-if="recipe.tea_base_type" class="meta-badge meta-badge--tea">{{ recipe.tea_base_type }}</span>
                <span v-if="recipe.temperature" class="meta-badge meta-badge--temp">{{ recipe.temperature }}</span>
              </div>
              <div v-if="recipe.tags.length > 0" class="footer-tags">
                <span v-for="tag in recipe.tags.slice(0, 3)" :key="tag" class="footer-tag">#{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.recipe-viewer-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
  color: var(--fg-primary-color);
  font-family: inherit;
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-secondary-color);
}

.header-icon {
  font-size: 3rem;
  line-height: 1;
  background: linear-gradient(
    135deg,
    rgba(var(--fg-accent-color-rgb, 100, 100, 100), 0.15),
    rgba(var(--fg-accent-color-rgb, 100, 100, 100), 0.05)
  );
  border-radius: 16px;
  padding: 14px;
}

.header-text {
  flex: 1;
}

.header-text h1 {
  margin: 0 0 6px 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.header-text p {
  margin: 0;
  color: var(--fg-secondary-color);
  font-size: 1rem;
}

.header-stats {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--fg-accent-color);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.filters-panel {
  width: 300px;
  flex-shrink: 0;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 16px;
  padding: 20px;
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
}

.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-primary-color);
}

.filters-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.btn-reset-filters {
  background: none;
  border: none;
  color: var(--fg-accent-color);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.btn-reset-filters:hover {
  background: rgba(var(--fg-accent-color-rgb, 100, 100, 100), 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--fg-secondary-color);
}

.filter-label-icon {
  font-size: 1rem;
}

.filter-label-unit {
  font-weight: 400;
  opacity: 0.7;
}

.filter-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--fg-secondary-color);
  opacity: 0.7;
  line-height: 1.3;
}

.input-wrapper {
  position: relative;
}

.filter-input {
  width: 100%;
  padding: 10px 14px;
  padding-right: 32px;
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  border: 1.5px solid var(--border-primary-color);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}

.filter-input::placeholder {
  color: var(--fg-secondary-color);
  opacity: 0.5;
}

.filter-input:focus {
  border-color: var(--fg-accent-color);
  box-shadow: 0 0 0 3px rgba(var(--fg-accent-color-rgb, 100, 100, 100), 0.12);
}

.input-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--fg-secondary-color);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px;
  border-radius: 50%;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.15s;
}
.input-clear:hover {
  opacity: 1;
}

/* ─── SELECT ─── */
.select-wrapper {
  position: relative;
}

.filter-select {
  width: 100%;
  padding: 10px 14px;
  appearance: none;
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  border: 1.5px solid var(--border-primary-color);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}

.filter-select:focus {
  border-color: var(--fg-accent-color);
  box-shadow: 0 0 0 3px rgba(var(--fg-accent-color-rgb, 100, 100, 100), 0.12);
}

.custom-select {
  position: relative;
  outline: none;
}

.custom-select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-image: none;
  padding-right: 14px;
}

.custom-select-arrow {
  display: flex;
  align-items: center;
  color: #888;
  transition: transform 0.2s;
}

.custom-select-arrow.is-open {
  transform: rotate(180deg);
}

.difficulty-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.diff-btn {
  padding: 6px 12px;
  border: 1.5px solid var(--border-primary-color);
  border-radius: 8px;
  background: var(--bg-primary-color);
  color: var(--fg-secondary-color);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.diff-btn:hover {
  border-color: var(--fg-accent-color);
}
.diff-btn.active {
  background: var(--fg-accent-color);
  border-color: var(--fg-accent-color);
  color: var(--bg-primary-color);
}

.range-slider {
  width: 100%;
  accent-color: var(--fg-accent-color);
  height: 6px;
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--fg-secondary-color);
  opacity: 0.6;
}

.btn-clear-inline {
  background: none;
  border: none;
  color: var(--fg-accent-color);
  font-size: 0.78rem;
  cursor: pointer;
  text-align: left;
  padding: 0;
  opacity: 0.8;
  transition: opacity 0.15s;
}
.btn-clear-inline:hover {
  opacity: 1;
  text-decoration: underline;
}

.filter-group--ingredients {
  padding-top: 16px;
  border-top: 1px solid var(--border-primary-color);
}

.selected-ingredients {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ingredient-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  animation: chipIn 0.2s ease;
}

@keyframes chipIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.chip-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 2px;
  opacity: 0.7;
  transition: opacity 0.15s;
  line-height: 1;
}
.chip-remove:hover {
  opacity: 1;
}

.ingredient-search-wrapper {
  position: relative;
}

.ingredient-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--bg-primary-color);
  border: 1.5px solid var(--border-primary-color);
  border-radius: 10px;
  max-height: 180px;
  overflow-y: auto;
  margin-top: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.ingredient-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 9px 14px;
  border: none;
  background: none;
  color: var(--fg-primary-color);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.1s;
  font-family: inherit;
  text-transform: capitalize;
}
.ingredient-option:hover {
  background: rgba(var(--fg-accent-color-rgb, 100, 100, 100), 0.1);
}
.ingredient-option:not(:last-child) {
  border-bottom: 1px solid var(--border-secondary-color);
}

.ingredient-option.active {
  color: var(--fg-accent-color);
  font-weight: 600;
  background: rgba(var(--fg-accent-color-rgb, 100, 100, 100), 0.05);
}

.filter-group--tags {
  padding-top: 16px;
  border-top: 1px solid var(--border-primary-color);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  background: var(--bg-primary-color);
  border: 1.5px solid var(--border-primary-color);
  color: var(--fg-secondary-color);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.tag-chip:hover {
  border-color: var(--fg-accent-color);
  color: var(--fg-primary-color);
}

.tag-chip.active {
  background: var(--fg-accent-color);
  border-color: var(--fg-accent-color);
  color: var(--bg-primary-color);
}

.results-panel {
  flex: 1;
  min-width: 0;
}

.results-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}

.results-count {
  font-size: 0.95rem;
  color: var(--fg-secondary-color);
}

.results-sort-hint {
  font-size: 0.8rem;
  color: var(--fg-accent-color);
  font-style: italic;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-primary-color);
  border-top-color: var(--fg-accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: var(--fg-secondary-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: var(--bg-secondary-color);
  border-radius: 16px;
  border: 1px dashed var(--border-primary-color);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state p {
  color: var(--fg-secondary-color);
  margin-bottom: 20px;
}

.btn-reset-all {
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.btn-reset-all:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.recipe-card {
  position: relative;
  background: var(--bg-primary-color);
  border: 1.5px solid var(--border-secondary-color);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.recipe-card:hover {
  border-color: var(--fg-accent-color);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.match-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 800;
  z-index: 2;
}

.match-high {
  background: rgba(72, 199, 142, 0.15);
  color: #48c78e;
}
.match-medium {
  background: rgba(255, 183, 77, 0.15);
  color: #ffb74d;
}
.match-low {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.difficulty-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.difficulty-dot.diff-easy {
  background: #48c78e;
}
.difficulty-dot.diff-medium {
  background: #ffb74d;
}
.difficulty-dot.diff-hard {
  background: #ff6b6b;
}

.card-time {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  font-weight: 500;
}

.recipe-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  line-height: 1.3;
  padding-right: 40px;
}

.match-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

.match-bar-wrap {
  flex: 1;
  height: 5px;
  background: var(--border-primary-color);
  border-radius: 3px;
  overflow: hidden;
}

.match-bar {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.match-bar.match-high {
  background: #48c78e;
}
.match-bar.match-medium {
  background: #ffb74d;
}
.match-bar.match-low {
  background: #ff6b6b;
}

.match-text {
  font-size: 0.75rem;
  color: var(--fg-secondary-color);
  font-weight: 600;
  white-space: nowrap;
}

.recipe-ingredients-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.ing-tag {
  padding: 3px 8px;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 6px;
  font-size: 0.72rem;
  color: var(--fg-secondary-color);
  text-transform: capitalize;
  transition: all 0.15s;
}

.ing-tag.ing-matched {
  background: rgba(72, 199, 142, 0.12);
  border-color: rgba(72, 199, 142, 0.3);
  color: #48c78e;
  font-weight: 600;
}

.ing-more {
  padding: 3px 8px;
  font-size: 0.72rem;
  color: var(--fg-secondary-color);
  opacity: 0.6;
}

.card-footer {
  background: var(--bg-secondary-color);
  padding: 12px 20px;
  border-top: 1px solid var(--border-secondary-color);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-badge {
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--bg-tertiary-color, var(--bg-primary-color));
  padding: 3px 8px;
  border-radius: 6px;
  color: var(--fg-primary-color);
  text-transform: capitalize;
}

.meta-badge--tea {
  color: var(--fg-accent-color);
}

.meta-badge--temp {
  opacity: 0.7;
}

.footer-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 0.72rem;
  color: var(--fg-accent-color);
  font-family: monospace;
}

.footer-tag {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .search-layout {
    flex-direction: column;
  }
  .filters-panel {
    width: 100%;
    position: static;
    max-height: none;
  }
  .recipes-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-wrap: wrap;
  }
}
</style>
