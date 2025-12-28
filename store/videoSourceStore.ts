import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VideoSourceState {
  selectedSource: string;
  setSelectedSource: (source: string) => void;
}

const useVideoSourceStore = create<VideoSourceState>()(
  persist(
    (set) => ({
      selectedSource: 'vidsrc.xyz', // Default source
      setSelectedSource: (source) => set({ selectedSource: source }),
    }),
    {
      name: 'video-source-storage', // localStorage key
    }
  )
);

export default useVideoSourceStore;
