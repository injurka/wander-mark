import { computed } from 'vue'
import { useRoute } from 'vue-router'

export interface VaultRouteParams {
  vault: string
  pwd: string[]
  pluginId?: string
  pluginPath?: string[]
}

export function useTypedRouteParams() {
  const route = useRoute()

  return computed<VaultRouteParams>(() => {
    const params = route.params
    const vault = params.vault as string

    const rawPwd = params.pwd
    const pwd = Array.isArray(rawPwd)
      ? rawPwd
      : [rawPwd].filter(Boolean) as string[]

    const pluginId = params.pluginId as string | undefined

    const rawPluginPath = params.pluginPath
    const pluginPath = Array.isArray(rawPluginPath)
      ? rawPluginPath
      : [rawPluginPath].filter(Boolean) as string[]

    return { vault, pwd, pluginId, pluginPath }
  })
}
