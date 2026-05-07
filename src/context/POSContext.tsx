import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { MenuItem, CartItem, Order, User, AuditLog } from '../types';
import { MENU_ITEMS } from '../constants';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export type Tab = 'order' | 'admin' | 'kitchen' | 'history' | 'menu';

interface POSContextType {
  // Auth
  currentUser: User | null;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  authError: string;
  setAuthError: (err: string) => void;

  // Navigation
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // Menu
  menuItems: MenuItem[];
  filteredMenuItems: MenuItem[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;

  // Cart & Orders
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  resetOrder: () => void;
  cartTotal: number;
  cashPaid: string;
  setCashPaid: (val: string) => void;
  changeDue: number;
  submitOrder: () => Promise<void>;
  orders: Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  
  // Parked Orders
  parkedOrders: CartItem[][];
  parkOrder: () => void;
  retrieveParkedOrder: (index: number) => void;

  // UI States
  showPaymentModal: boolean;
  setShowPaymentModal: (show: boolean) => void;
  showSuccessToast: boolean;
  setShowSuccessToast: (show: boolean) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  showItemDetail: MenuItem | null;
  setShowItemDetail: (item: MenuItem | null) => void;
  showMenuModal: boolean;
  setShowMenuModal: (show: boolean) => void;
  menuForm: MenuItem | null;
  setMenuForm: (item: MenuItem | null) => void;
  resetMenuForm: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  // Stats & Logs
  auditLogs: AuditLog[];
  dailyStats: { revenue: number, cost: number, profit: number, count: number };
  notifications: { id: string, message: string }[];
  removeNotification: (id: string) => void;
  addNotification: (msg: string) => void;
  orderError: string;
  setOrderError: (err: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>('order');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashPaid, setCashPaid] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showItemDetail, setShowItemDetail] = useState<MenuItem | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuItem | null>(null);
  const resetMenuForm = () => setMenuForm(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, message: string }[]>([]);
  const [parkedOrders, setParkedOrders] = useState<CartItem[][]>([]);
  const [orderError, setOrderError] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUser(userSnap.data() as User);
        } else {
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: 'customer'
          };
          setCurrentUser(userData);
        }
        setShowAuthModal(false);
      } else {
        setCurrentUser(null);
        setShowAuthModal(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as MenuItem);
      if (items.length > 0) {
        setMenuItems(items);
      } else if (currentUser.role === 'admin' || currentUser.role === 'staff') {
        MENU_ITEMS.forEach(async (item) => {
          try {
            await setDoc(doc(db, 'menu', item.id), { ...item, isAvailable: true });
          } catch (e) {
            console.error("Error seeding menu:", e);
          }
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'menu'));

    const ordersQuery = currentUser.role === 'customer'
      ? query(collection(db, 'orders'), where('userId', '==', currentUser.id), orderBy('timestamp', 'desc'), limit(50))
      : query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(100));

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => doc.data() as Order));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

    let unsubscribeAudit = () => { };
    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      const auditQuery = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
      unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
        setAuditLogs(snapshot.docs.map(doc => doc.data() as AuditLog));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'auditLogs'));
    }

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
      unsubscribeAudit();
    };
  }, [currentUser]);

  useEffect(() => {
    const savedParkOrder = localStorage.getItem('witbank_parked_orders');
    if (savedParkOrder) setParkedOrders(JSON.parse(savedParkOrder));
  }, []);

  useEffect(() => {
    setIsCartOpen(false);
  }, [activeTab]);

  const login = async (email: string, pass: string) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      setAuthError(error.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: name });
      const role = email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'customer';
      const userData: User = {
        id: firebaseUser.uid,
        email,
        name,
        role: role as any
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      setCurrentUser(userData);
      setShowAuthModal(false);
    } catch (error: any) {
      setAuthError(error.message || 'Signup failed');
      throw error;
    }
  };

  const logout = () => {
    signOut(auth);
    setActiveTab('order');
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isAvailable = currentUser?.role !== 'customer' ? true : item.isAvailable;
      return matchesCategory && matchesSearch && isAvailable;
    });
  }, [activeCategory, searchTerm, menuItems, currentUser]);

  const auditLogAction = async (action: AuditLog['action'], item: MenuItem, changes: string) => {
    if (!currentUser) return;
    const logId = `LOG-${Date.now()}`;
    const log: AuditLog = {
      id: logId,
      timestamp: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      itemName: item.name,
      changes
    };
    try {
      await setDoc(doc(db, 'auditLogs', logId), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `auditLogs/${logId}`);
    }
  };

  const updateMenuItem = async (updatedItem: MenuItem) => {
    const original = menuItems.find(i => i.id === updatedItem.id);
    if (!original) return;
    let changes = [];
    if (original.price !== updatedItem.price) changes.push(`Price: ${original.price} -> ${updatedItem.price}`);
    if (original.isAvailable !== updatedItem.isAvailable) changes.push(`Availability: ${original.isAvailable} -> ${updatedItem.isAvailable}`);
    if (original.name !== updatedItem.name) changes.push(`Name: ${original.name} -> ${updatedItem.name}`);

    try {
      await setDoc(doc(db, 'menu', updatedItem.id), { ...updatedItem, updatedAt: Date.now(), updatedBy: currentUser?.id });
      auditLogAction('update', updatedItem, changes.join(', ') || 'No visual changes');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menu/${updatedItem.id}`);
    }
  };

  const toggleAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, isAvailable: !item.isAvailable };
    try {
      await updateDoc(doc(db, 'menu', id), { isAvailable: updated.isAvailable, updatedAt: Date.now(), updatedBy: currentUser?.id });
      auditLogAction('update', updated, `Availability toggled to ${updated.isAvailable}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menu/${id}`);
    }
  };

  const deleteMenuItem = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    try {
      await deleteDoc(doc(db, 'menu', id));
      auditLogAction('delete', item, 'Item removed from menu');
      addNotification(`${item.name} removed from menu.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `menu/${id}`);
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    try {
      await setDoc(doc(db, 'menu', item.id), { ...item, isAvailable: true, updatedAt: Date.now(), updatedBy: currentUser?.id });
      auditLogAction('create', item, 'New item added to menu');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `menu/${item.id}`);
    }
  };

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);
  const changeDue = useMemo(() => Math.max(0, (parseFloat(cashPaid) || 0) - cartTotal), [cashPaid, cartTotal]);

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      addNotification(`Sorry, ${item.name} is currently sold out! 🍖`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const resetOrder = () => { setCart([]); setCashPaid(''); setShowPaymentModal(false); };

  const submitOrder = async () => {
    if (!currentUser) return;
    setOrderError('');
    const orderTotal = cartTotal;
    const orderCost = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const paid = parseFloat(cashPaid) || orderTotal;
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: orderId,
      items: cart.map(item => ({ ...item })),
      total: orderTotal,
      totalCost: orderCost,
      cashPaid: paid,
      change: Math.max(0, paid - orderTotal),
      timestamp: Date.now(),
      status: 'pending',
      userId: currentUser.id,
      customerEmail: currentUser.email
    };
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
      resetOrder();
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error: any) {
      console.error("Order submission error:", error);
      setOrderError(error.message || 'Failed to submit order. Please check your connection or permissions.');
      handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      if (status === 'ready') addNotification(`Order ${orderId} is READY for collection! 🍟`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const parkOrder = () => {
    if (cart.length === 0) return;
    const newParked = [...parkedOrders, [...cart]];
    setParkedOrders(newParked);
    localStorage.setItem('witbank_parked_orders', JSON.stringify(newParked));
    setCart([]);
    addNotification("Order parked successfully.");
  };

  const retrieveParkedOrder = (index: number) => {
    setCart(parkedOrders[index]);
    const remaining = parkedOrders.filter((_, i) => i !== index);
    setParkedOrders(remaining);
    localStorage.setItem('witbank_parked_orders', JSON.stringify(remaining));
    addNotification("Parked order retrieved.");
  };

  const addNotification = (message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message }]);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Witbank Express Grill", { body: message });
    }
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const dailyStats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayOrders = orders.filter(o => new Date(o.timestamp).toLocaleDateString() === today && o.status !== 'cancelled');
    return {
      revenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
      cost: todayOrders.reduce((sum, o) => sum + o.totalCost, 0),
      profit: todayOrders.reduce((sum, o) => sum + (o.total - o.totalCost), 0),
      count: todayOrders.length
    };
  }, [orders]);

  return (
    <POSContext.Provider value={{
      currentUser, authMode, setAuthMode, showAuthModal, setShowAuthModal, login, signup, logout, authError, setAuthError,
      activeTab, setActiveTab, menuItems, filteredMenuItems, activeCategory, setActiveCategory, searchTerm, setSearchTerm,
      updateMenuItem, toggleAvailability, deleteMenuItem, addMenuItem, cart, addToCart, updateQuantity, removeFromCart,
      resetOrder, cartTotal, cashPaid, setCashPaid, changeDue, submitOrder, orders, updateOrderStatus, parkedOrders,
      parkOrder, retrieveParkedOrder, showPaymentModal, setShowPaymentModal, showSuccessToast, setShowSuccessToast,
      selectedOrder, setSelectedOrder, showItemDetail, setShowItemDetail, showMenuModal, setShowMenuModal,
      menuForm, setMenuForm, resetMenuForm, isCartOpen,
      setIsCartOpen, auditLogs, dailyStats, notifications, removeNotification, addNotification,
      orderError, setOrderError
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) throw new Error('usePOS must be used within a POSProvider');
  return context;
}
