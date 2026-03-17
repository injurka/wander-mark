import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVaultService } from '~/shared/services/vault.service'

export function useVaultManagement() {
  const router = useRouter()
  const vaultService = useVaultService()

  const progressMap = ref<Record<string, number>>({})
  const installingMap = ref<Record<string, boolean>>({})

  // --- Модальное окно добавления хранилища ---
  const isAddDialogVisible = ref(false)
  const addError = ref('')
  const addForm = ref({
    id: '',
    name: '',
    url: '',
  })

  function openAddDialog() {
    addError.value = ''
    addForm.value = { id: '', name: '', url: '' }
    isAddDialogVisible.value = true
  }

  async function submitAddRemote() {
    addError.value = ''
    const { id, name, url } = addForm.value

    if (!id || !name || !url) {
      addError.value = 'Пожалуйста, заполните все поля'
      return
    }

    try {
      await vaultService.addRemoteVault(id, name, url)
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
      await vaultService.deleteVault(vaultToDelete.value)
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
      await vaultService.installVault(vaultId, (p) => {
        progressMap.value[vaultId] = p
      })
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
    const vault = vaultService.getVault(vaultId)
    if (vault) {
      router.push(`/${vaultId}`)
    }
  }

  return {
    vaults: vaultService.vaults,
    progressMap,
    installingMap,
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
