"use client"

interface TabButtonProps {
  id: string
  label: string
  current: string
  set: (id: string) => void
}

export function TabButton({ id, label, current, set }: TabButtonProps) {
  return (
    <button 
      onClick={() => set(id)}
      className={`pb-3 px-1 transition-colors whitespace-nowrap ${
        current === id ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'hover:text-gray-800 text-gray-500'
      }`}
    >
      {label}
    </button>
  )
}
