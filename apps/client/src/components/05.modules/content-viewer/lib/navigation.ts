import type { ContentNavItem } from '../models'
import { ContentNavItemType } from '../models'

/**
 * Преобразует дерево навигации в плоский список файлов с полными путями.
 * Используется для кнопок "Далее" / "Назад".
 */
export function flattenNavItems(
  items: ContentNavItem[] | undefined,
  currentPathSegments: string[] = [],
): Array<ContentNavItem & { path: string }> {
  if (!items)
    return []
  let flatList: Array<ContentNavItem & { path: string }> = []

  items.forEach((item) => {
    const newItemPathSegments = [...currentPathSegments, item.sysname]

    if (item.type === ContentNavItemType.File) {
      flatList.push({ ...item, path: newItemPathSegments.join('/') })
    }
    else if (item.type === ContentNavItemType.Directory && item.children) {
      flatList = flatList.concat(flattenNavItems(item.children, newItemPathSegments))
    }
  })
  return flatList
}

/**
 * Ищет путь (массив сегментов) к элементу по его sysname.
 */
export function findPathBySysname(
  items: ContentNavItem[],
  targetSysname: string,
  currentPath: string[] = [],
): string[] | null {
  for (const item of items) {
    if (item.sysname === targetSysname)
      return [...currentPath, item.sysname]
    if (item.children) {
      const childPath = findPathBySysname(item.children, targetSysname, [...currentPath, item.sysname])
      if (childPath)
        return childPath
    }
  }
  return null
}

/**
 * Ищет элемент навигации (файл или папку) по массиву сегментов пути (из URL).
 */
export function findItemByPath(
  items: ContentNavItem[],
  pathSegments: string[],
): ContentNavItem | null {
  if (!items || pathSegments.length === 0)
    return null

  const [currentSegment, ...remainingSegments] = pathSegments
  const item = items.find(i => i.sysname === currentSegment)

  if (!item)
    return null

  // Если это последний сегмент пути, мы нашли элемент
  if (remainingSegments.length === 0)
    return item

  // Если есть еще сегменты, ищем в детях
  if (item.children)
    return findItemByPath(item.children, remainingSegments)

  return null
}
