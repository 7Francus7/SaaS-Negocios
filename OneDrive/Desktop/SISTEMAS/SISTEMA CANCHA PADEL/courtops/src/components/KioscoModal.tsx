'use client'

import React, { useState, useEffect } from 'react'
import { getProducts, processSale } from '@/actions/kiosco'

type Product = {
       id: number
       name: string
       price: number
       stock: number
       category: string
}

type CartItem = Product & { quantity: number }

type Props = {
       isOpen: boolean
       onClose: () => void
}

export default function KioscoModal({ isOpen, onClose }: Props) {
       const [products, setProducts] = useState<Product[]>([])
       const [cart, setCart] = useState<CartItem[]>([])
       const [loading, setLoading] = useState(true)
       const [processing, setProcessing] = useState(false)
       const [filter, setFilter] = useState('Todos')

       useEffect(() => {
              if (isOpen) {
                     getProducts().then(data => {
                            setProducts(data)
                            setLoading(false)
                     })
              }
       }, [isOpen])

       const addToCart = (product: Product) => {
              setCart(prev => {
                     const existing = prev.find(p => p.id === product.id)
                     if (existing) {
                            // Check stock
                            if (existing.quantity + 1 > product.stock) return prev;
                            return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
                     }
                     return [...prev, { ...product, quantity: 1 }]
              })
       }

       const removeFromCart = (id: number) => {
              setCart(prev => prev.filter(p => p.id !== id))
       }

       const handleCheckout = async (method: 'CASH' | 'TRANSFER') => {
              setProcessing(true)
              try {
                     await processSale(
                            cart.map(i => ({ productId: i.id, quantity: i.quantity })),
                            method
                     )
                     onClose()
                     setCart([])
                     // Ideally trigger a toast success
              } catch (error) {
                     alert("Error al procesar venta: " + error)
              } finally {
                     setProcessing(false)
              }
       }

       const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
       const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))]
       const filteredProducts = filter === 'Todos' ? products : products.filter(p => p.category === filter)

       if (!isOpen) return null

       return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                     <div className="bg-bg-dark border border-white/10 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-200">

                            {/* --- Left: Product Grid --- */}
                            <div className="flex-1 flex flex-col border-r border-white/5">
                                   {/* Header Filters */}
                                   <div className="p-6 border-b border-white/5 flex gap-2 overflow-x-auto">
                                          {categories.map(cat => (
                                                 <button
                                                        key={cat}
                                                        onClick={() => setFilter(cat)}
                                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filter === cat ? 'bg-brand-blue text-white' : 'bg-bg-surface text-text-grey hover:bg-white/5'}`}
                                                 >
                                                        {cat}
                                                 </button>
                                          ))}
                                   </div>

                                   {/* Grid */}
                                   <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-bg-surface/30">
                                          {loading ? <p className="text-white">Cargando...</p> : filteredProducts.map(p => (
                                                 <div
                                                        key={p.id}
                                                        onClick={() => addToCart(p)}
                                                        className={`bg-bg-card border border-white/5 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:border-brand-green/30 active:scale-95 group ${p.stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                                                 >
                                                        <div className="aspect-square bg-bg-surface rounded-xl mb-3 flex items-center justify-center text-4xl group-hover:bg-brand-blue/10 transition-colors">
                                                               {/* Placeholder Icon */}
                                                               {p.category === 'Bebidas' ? '🥤' : '🎾'}
                                                        </div>
                                                        <h3 className="text-white font-bold text-sm leading-tight">{p.name}</h3>
                                                        <p className="text-brand-green font-mono font-bold mt-1">$ {p.price}</p>
                                                        <p className="text-text-grey text-xs mt-1">Stock: {p.stock}</p>
                                                 </div>
                                          ))}
                                   </div>
                            </div>

                            {/* --- Right: Cart / POS --- */}
                            <div className="w-96 bg-bg-card flex flex-col">
                                   <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                          <h2 className="text-xl font-bold text-white">Carrito</h2>
                                          <button onClick={onClose} className="text-text-grey hover:text-white">✕</button>
                                   </div>

                                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                          {cart.length === 0 ? (
                                                 <div className="text-center text-text-grey mt-10 opacity-50">
                                                        <span className="text-4xl block mb-2">🛒</span>
                                                        Carrito vacío
                                                 </div>
                                          ) : cart.map(item => (
                                                 <div key={item.id} className="flex justify-between items-center bg-bg-surface p-3 rounded-xl border border-white/5">
                                                        <div className="flex gap-3 items-center">
                                                               <div className="w-8 h-8 rounded-full bg-brand-blue/20 flex items-center justify-center text-xs font-bold text-brand-blue">
                                                                      {item.quantity}
                                                               </div>
                                                               <div>
                                                                      <p className="text-white text-sm font-medium">{item.name}</p>
                                                                      <p className="text-text-grey text-xs">$ {item.price * item.quantity}</p>
                                                               </div>
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-text-grey hover:text-red-400">🗑</button>
                                                 </div>
                                          ))}
                                   </div>

                                   <div className="p-6 bg-bg-surface border-t border-white/5">
                                          <div className="flex justify-between items-end mb-6">
                                                 <span className="text-text-grey">Total a Cobrar</span>
                                                 <span className="text-3xl font-bold text-white">$ {total.toLocaleString('es-AR')}</span>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                                 <button
                                                        onClick={() => handleCheckout('CASH')}
                                                        disabled={cart.length === 0 || processing}
                                                        className="bg-brand-green text-bg-dark py-4 rounded-xl font-bold hover:bg-brand-green-variant disabled:opacity-50 transition-colors"
                                                 >
                                                        {processing ? '...' : 'Efectivo'}
                                                 </button>
                                                 <button
                                                        onClick={() => handleCheckout('TRANSFER')}
                                                        disabled={cart.length === 0 || processing}
                                                        className="bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-brand-blue-secondary disabled:opacity-50 transition-colors"
                                                 >
                                                        {processing ? '...' : 'Transferencia'}
                                                 </button>
                                          </div>
                                   </div>
                            </div>

                     </div>
              </div>
       )
}
