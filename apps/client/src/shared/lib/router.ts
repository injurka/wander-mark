import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('~/pages/index.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/:vault',
    component: () => import('~/components/06.layouts/nav-content/ui/nav-content.vue'),
    children: [
      {
        path: '',
        name: 'VaultIndex',
        component: () => import('~/pages/[vault]/index.vue'),
      },
      {
        path: 'plugin/:pluginId/:pluginPath(.*)*',
        name: 'PluginPage',
        component: () => import('~/pages/[vault]/plugin/[pluginId].vue'),
      },
      {
        path: ':pwd(.*)*',
        name: 'ContentViewer',
        component: () => import('~/pages/[vault]/[...pwd].vue'),
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('~/pages/index.vue'),
    meta: { layout: 'default' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

export default router
