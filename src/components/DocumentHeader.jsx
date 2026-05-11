export function DocumentHeader() {
  return (
    <div className="border-b-2 border-double border-ink pb-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-2 border-ink rounded-full flex items-center justify-center font-display text-sm">
            ⭐
          </div>
          <div>
            <div className="text-xs font-body text-ink-muted tracking-wider">REPUBLIC OF PROFESSIONAL AFFAIRS</div>
            <h1 className="text-2xl font-display text-ink">Resume Evaluation & Assessment Form</h1>
            <div className="text-xs font-body text-ink-muted">COMPREHENSIVE CAREER DEFICIENCY REPORT</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-body text-ink-muted">Gov. 04 / Series</div>
          <div className="text-sm font-body text-ink font-bold">May 11, 2026</div>
        </div>
      </div>
      <div className="h-px bg-rule"></div>
    </div>
  );
}