import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAnalyticsStore = create(
  persist(
    (set) => ({
      activePreset: 'today',
      activeResultTab: 'product',
      dateRange: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
      selectedBranch: '',
      selectedCategory: '',
      selectedBrand: '',
      searchTerm: '',
      selectedProducts: [],
      groupBy: 'day',
      transactionType: 'all', // all, sale, sample, damaged, exchange, wrong
      sortBy: { field: 'salesCount', direction: -1 },
      page: 1,

      setActivePreset: (activePreset) => set({ activePreset }),
      setActiveResultTab: (activeResultTab) => set({ activeResultTab }),
      setDateRange: (dateRange) => set({ dateRange }),
      setSelectedBranch: (selectedBranch) => set({ selectedBranch }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSelectedBrand: (selectedBrand) => set({ selectedBrand }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setSelectedProducts: (updater) => {
        if (typeof updater === 'function') {
          set((state) => ({ selectedProducts: updater(state.selectedProducts) }));
        } else {
          set({ selectedProducts: updater });
        }
      },
      setGroupBy: (groupBy) => set({ groupBy }),
      setTransactionType: (transactionType) => set({ transactionType }),
      setSortBy: (sortBy) => set({ sortBy }),
      setPage: (page) => set({ page }),

      resetFilters: () => set({
        activePreset: 'today',
        dateRange: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
        selectedBranch: '',
        selectedCategory: '',
        selectedBrand: '',
        searchTerm: '',
        selectedProducts: [],
        groupBy: 'day',
        transactionType: 'all',
        sortBy: { field: 'salesCount', direction: -1 },
        page: 1,
      }),
    }),
    {
      name: 'analytics-filters-storage',
    }
  )
);

export default useAnalyticsStore;
