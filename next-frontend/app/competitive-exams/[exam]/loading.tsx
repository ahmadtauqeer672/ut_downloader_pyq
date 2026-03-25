export default function LoadingCompetitiveExamPage() {
  return (
    <>
      <section className="card section-card competitive-page-head">
        <div className="competitive-page-head__copy">
          <p className="eyebrow">Competitive Exam Papers</p>
          <h1>Loading exam papers...</h1>
          <p className="competitive-page-head__lede">
            Fetching the latest year-wise papers for this competitive exam.
          </p>
        </div>
        <div className="chip-row competitive-page-head__actions">
          <span className="chip">Loading category</span>
          <span className="chip">Preparing papers</span>
        </div>
      </section>

      <section className="section card section-card competitive-archive">
        <div className="section-head competitive-archive__head">
          <div>
            <p className="eyebrow">Year-wise collection</p>
            <h2 className="section-title">Loading paper archive</h2>
          </div>
          <div className="competitive-archive__summary">
            <span className="chip">Loading</span>
          </div>
        </div>

        {Array.from({ length: 3 }).map((_, index) => (
          <article className="competitive-year-card" key={index}>
            <div className="competitive-year-head">
              <span className="loading-block loading-block--title" />
            </div>

            <div className="competitive-paper-list">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <div className="competitive-paper-item" key={itemIndex}>
                  <div className="competitive-paper-copy">
                    <span className="loading-block loading-block--line" />
                    <span className="loading-block loading-block--meta" />
                  </div>
                  <div className="paper-actions competitive-paper-actions">
                    <span className="chip">Loading</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
