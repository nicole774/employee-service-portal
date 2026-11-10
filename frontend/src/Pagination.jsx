// Boutons Précédente / Suivante sous une liste.
// pages : nombre total de pages s'il est connu ; sinon hasNext indique s'il reste une page.
function Pagination({ page, pages, hasNext, onChange }) {
  const canGoNext = pages ? page < pages : hasNext

  if (page === 1 && !canGoNext) return null

  function goTo(newPage) {
    onChange(newPage)
    // On remonte en haut pour voir le début de la nouvelle page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="tab" disabled={page === 1} onClick={() => goTo(page - 1)}>
        ‹ Précédente
      </button>
      <span>{pages ? `Page ${page} sur ${pages}` : `Page ${page}`}</span>
      <button type="button" className="tab" disabled={!canGoNext} onClick={() => goTo(page + 1)}>
        Suivante ›
      </button>
    </nav>
  )
}

export default Pagination
