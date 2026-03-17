import { computed } from 'vue'
import { useRoute } from 'vue-router'

export interface VaultRouteParams {
  vault: string
  pwd: string[]
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

    return { vault, pwd }
  })
}
