import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      customer: { name: '', phone: '', companyName: '', addressLine: '' },
      taxRate: 0,
      discountRate: 0,
      paymentMethod: 'cash',
      transporter: { name: '', mobile: '', vehicleType: '', vehicleNumber: '' },

      setCart: (updater) => {
        if (typeof updater === 'function') {
          set((state) => ({ cart: updater(state.cart) }));
        } else {
          set({ cart: updater });
        }
      },

      setCustomer: (customer) => set({ customer }),
      setTaxRate: (taxRate) => set({ taxRate }),
      setDiscountRate: (discountRate) => set({ discountRate }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setTransporter: (transporter) => set({ transporter }),

      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter(item => item.product !== id)
      })),

      updateQty: (id, delta) => set((state) => ({
        cart: state.cart.map(item => {
          if (item.product === id) {
            const newQty = Math.max(0, Math.min(item.maxQty, item.quantity + delta));
            // Only remove if both boxes and pieces are 0
            if (newQty === 0 && (item.pieces || 0) === 0) return null;
            return { ...item, quantity: newQty };
          }
          return item;
        }).filter(Boolean)
      })),

      setQty: (id, newQty) => set((state) => ({
        cart: state.cart.map(item => {
          if (item.product === id) {
            const qty = Math.max(0, Math.min(item.maxQty, newQty));
            return { ...item, quantity: qty };
          }
          return item;
        })
      })),

      // Update the number of loose pieces for a cart item
      // Enforces: pieces < pieces_per_box. If pieces reaches pieces_per_box, 
      // convert to an extra box automatically.
      setPieces: (id, pieces) => set((state) => ({
        cart: state.cart.map(item => {
          if (item.product === id) {
            const ppb = item.pieces_per_box || 1;
            let p = Math.max(0, parseInt(pieces) || 0);
            let extraBoxes = 0;
            // Overflow: every full-box worth of pieces becomes a box
            if (p >= ppb) {
              extraBoxes = Math.floor(p / ppb);
              p = p % ppb;
            }
            const newBoxQty = Math.min(item.maxQty, item.quantity + extraBoxes);
            
            // Only remove if both boxes and pieces reach 0
            if (newBoxQty === 0 && p === 0) return null;
            
            return { ...item, quantity: newBoxQty, pieces: p };
          }
          return item;
        }).filter(Boolean)
      })),

      toggleItemFlag: (id, flag) => set((state) => ({
        cart: state.cart.map(item => {
          if (item.product === id) {
            const flags = ['isSelling', 'isDamaged', 'isSample', 'isWrongProduct'];
            const updates = {};
            flags.forEach(f => { updates[f] = false; });
            updates[flag] = true;
            return { ...item, ...updates };
          }
          return item;
        })
      })),

      clearCart: () => set({ 
        cart: [], 
        customer: { name: '', phone: '', companyName: '', addressLine: '' },
        discountRate: 0,
        transporter: { name: '', mobile: '', vehicleType: '', vehicleNumber: '' },
        // We don't reset taxRate here because it usually comes from settings
      }),
    }),
    {
      name: 'pos-cart-storage',
    }
  )
);

export default useCartStore;
