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
      className={`headerButton ${selectTab === currentTab ? 'is-active' : ''}`}
      onClick={() => {
        setSelectTab(selectTab)
      }}
    >
      {label}
    </button>
  )
}
