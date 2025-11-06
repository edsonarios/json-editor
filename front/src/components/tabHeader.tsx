export function TabHeader({
  label,
  selectTab,
  currentTab,
  setSelectTab,
}: {
  label: string
  selectTab: number
  currentTab: number
  setSelectTab: React.Dispatch<React.SetStateAction<number>>
}) {
  return (
    <button
      className={`headerButton
      ${selectTab === currentTab ? 'bg-white' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white border-2 border-zinc-700'}`}
      onClick={() => {
        setSelectTab(selectTab)
      }}
    >
      {label}
    </button>
  )
}
