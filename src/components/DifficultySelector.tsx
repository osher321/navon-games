interface DifficultyOption<T extends string> {
  id: T
  icon: string
  label: string
}

interface DifficultySelectorProps<T extends string> {
  title: string
  subtitle?: string
  options: DifficultyOption<T>[]
  onSelect: (id: T) => void
}

/**
 * Shared "pick a difficulty/grade before starting" screen - the same visual
 * pattern several games (target_hit, math) had each re-implemented inline.
 * New games should use this instead of copying that markup again; existing
 * games that already work are left untouched rather than migrated, to avoid
 * risking tested code for a purely cosmetic refactor.
 */
export default function DifficultySelector<T extends string>({ title, subtitle, options, onSelect }: DifficultySelectorProps<T>) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <h2 className="mb-1 font-fun text-xl font-extrabold text-grape-600">{title}</h2>
      {subtitle && <p className="mb-5 text-ink/50">{subtitle}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="flex min-w-[110px] flex-col items-center gap-1 rounded-xl2 bg-white px-4 py-3 font-fun font-extrabold text-ink shadow-card card-outline btn-pressable transition-all hover:-translate-y-0.5"
          >
            <span className="text-2xl">{opt.icon}</span>
            <span className="text-sm">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
