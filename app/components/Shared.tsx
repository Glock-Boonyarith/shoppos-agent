export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return <button className="toggle-row" onClick={onChange}><span>{label}</span><i className={value ? "toggle on" : "toggle"}><b /></i></button>;
}

export function DomainHeader({ title, subtitle, onBack = () => window.dispatchEvent(new Event("shoppos:back")) }: { title: string; subtitle: string; onBack?: () => void }) {
  return <div className="domain-heading"><div><button className="back-link" onClick={onBack}>← กลับ</button><h2>{title}</h2><span>{subtitle}</span></div></div>;
}
