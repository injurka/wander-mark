import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVaultStore } from '~/shared/store/vault.store'

export function useVaultManagement() {
  const router = useRouter()
  const vaultStore = useVaultStore()

  const progressMap = ref<Record<string, number>>({})
  const installingMap = ref<Record<string, boolean>>({})

  // --- Иконки ---
  const iconUrls = ref<Record<string, string>>({})
  const iconErrors = ref<Record<string, boolean>>({})

  watch(() => vaultStore.vaults, async (vaults) => {
    vaultStore.clearBlobUrls()
    for (const vault of vaults) {
      iconUrls.value[vault.id] = await vaultStore.resolveMediaUrl(vault.id, `meta/${vault.id}/images/icon.png`)
    }
  }, { immediate: true, deep: true })

  onBeforeUnmount(() => {
    vaultStore.clearBlobUrls()
  })
  function handleIconError(vaultId: string) {
    iconErrors.value[vaultId] = true
  }

  // --- Модальное окно добавления хранилища ---
  const isAddDialogVisible = ref(false)
  const addError = ref('')
  const addForm = ref({
    id: '',
    url: '',
  })

  function openAddDialog() {
    addError.value = ''
    addForm.value = { id: '', url: '' }
    isAddDialogVisible.value = true
  }

  async function submitAddRemote() {
    addError.value = ''
    const { id, url } = addForm.value

    if (!id || !url) {
      addError.value = 'Пожалуйста, заполните все поля'
      return
    }

    try {
      await vaultStore.addRemoteVault(id, url)
      isAddDialogVisible.value = false
    }
    catch (e: any) {
      addError.value = e.message
    }
  }

  // --- Модальное окно ошибки ---
  const isErrorDialogVisible = ref(false)
  const errorMessage = ref('')

  function showError(msg: string) {
    errorMessage.value = msg
    isErrorDialogVisible.value = true
  }

  // --- Модальное окно удаления ---
  const isDeleteDialogVisible = ref(false)
  const vaultToDelete = ref<string | null>(null)

  function confirmDelete(vaultId: string) {
    vaultToDelete.value = vaultId
    isDeleteDialogVisible.value = true
  }

  async function proceedDelete() {
    if (vaultToDelete.value) {
      await vaultStore.deleteVault(vaultToDelete.value)
      delete iconUrls.value[vaultToDelete.value]
      delete iconErrors.value[vaultToDelete.value]
    }
    isDeleteDialogVisible.value = false
    vaultToDelete.value = null
  }

  // --- Методы управления ---
  async function handleInstall(vaultId: string) {
    if (installingMap.value[vaultId])
      return
    installingMap.value[vaultId] = true
    progressMap.value[vaultId] = 0

    try {
      await vaultStore.installVault(vaultId, (p) => {
        progressMap.value[vaultId] = p
      })
      iconUrls.value[vaultId] = await vaultStore.resolveMediaUrl(vaultId, `meta/${vaultId}/images/icon.png`)
      iconErrors.value[vaultId] = false
    }
    catch (e: any) {
      showError(`Ошибка при скачивании: ${e.message}`)
    }
    finally {
      setTimeout(() => {
        installingMap.value[vaultId] = false
      }, 1000)
    }
  }

  function openVault(vaultId: string) {
    const vault = vaultStore.getVault(vaultId)
    if (vault) {
      router.push(`/${vaultId}`)
    }
  }

  return {
    vaults: computed(() => vaultStore.vaults),
    progressMap,
    installingMap,
    iconUrls,
    iconErrors,
    handleIconError,
    isAddDialogVisible,
    addError,
    addForm,
    isErrorDialogVisible,
    errorMessage,
    isDeleteDialogVisible,
    openAddDialog,
    submitAddRemote,
    confirmDelete,
    proceedDelete,
    handleInstall,
    openVault,
  }
}
