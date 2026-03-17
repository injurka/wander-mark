export enum AppRouteNames {
  Root = 'root',

  NotFound = 'not-found',
}

export const AppRoutePaths = {
  Root: '/',

  NotFound: '/:catchAll(.*)?',
}
