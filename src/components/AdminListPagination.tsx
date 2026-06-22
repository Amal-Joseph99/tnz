type AdminListPaginationProps = {
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function AdminListPagination({ page, totalItems, pageSize, onPageChange }: AdminListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  if (totalItems <= pageSize) {
    return null
  }

  return (
    <footer className="admin-list-pagination">
      <span>
        {start}–{end} of {totalItems}
      </span>
      <div className="admin-list-pagination__actions">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </footer>
  )
}

export const ADMIN_LIST_PAGE_SIZE = 25

export function paginateItems<T>(items: T[], page: number, pageSize = ADMIN_LIST_PAGE_SIZE) {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}
