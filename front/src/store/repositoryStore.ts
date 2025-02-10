import { type StateCreator, create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface IJsonEditor {
  clients: string[]
  setClients: (clients: string[]) => void
}
const repositoryStore: StateCreator<IJsonEditor> = (set) => ({
  clients: [],
  setClients: (clients) => set({ clients }),
})

export const useRepositoryStore = create<IJsonEditor>()(
  persist(repositoryStore, {
    name: 'json-editor-store',
    partialize: (state) => ({
      // clients: state.clients,
    }),
  }),
)
