class CartService {
    constructor() {
        this.CART_KEY = 'restaurant_cart';
        this.TABLE_KEY = 'table_id';
    }

    getCart() {
        const cart = localStorage.getItem(this.CART_KEY);
        return cart ? JSON.parse(cart) : [];
    }

    saveCart(cart) {
        localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    }

    addItem(item) {

        const cart = this.getCart();

        const existingItem = cart.find(
            i => i.menuItemId === item.menuItemId &&
                JSON.stringify(i.options) === JSON.stringify(item.options)
        );

        if (existingItem) {

            existingItem.quantity += item.quantity;

            if (item.note) existingItem.note = item.note;

        } else {

            cart.push({
                id: Date.now(),               // id riêng của cart
                menuItemId: item.menuItemId,  // id món
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice || item.price,
                image: item.image,
                quantity: item.quantity,
                note: item.note || '',
                options: item.options || {}
            });

        }

        this.saveCart(cart);

        return cart;
    }

    updateQuantity(itemId, quantity) {
        const cart = this.getCart();
        const item = cart.find(i => i.id === itemId);

        if (item) {
            if (quantity <= 0) {
                return this.removeItem(itemId);
            }
            item.quantity = quantity;
            this.saveCart(cart);
        }

        return cart;
    }

    updateNote(itemId, note) {
        const cart = this.getCart();
        const item = cart.find(i => i.id === itemId);

        if (item) {
            item.note = note;
            this.saveCart(cart);
        }

        return cart;
    }

    removeItem(itemId) {
        const cart = this.getCart().filter(i => i.id !== itemId);
        this.saveCart(cart);
        return cart;
    }

    clearCart() {
        localStorage.removeItem(this.CART_KEY);
        return [];
    }

    getTotal() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getItemCount() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    setTableId(tableId) {
        localStorage.setItem(this.TABLE_KEY, tableId);
    }

    getTableId() {
        return localStorage.getItem(this.TABLE_KEY);
    }

    clearTable() {
        localStorage.removeItem(this.TABLE_KEY);
    }
}

const cartService = new CartService();
export default cartService;