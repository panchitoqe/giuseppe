"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowDownToLine, ChevronDown, CircleCheck, ClipboardList, CreditCard, MapPin, Package, Plus, Search, Send, Settings2, Sparkles, Truck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase";

type DeliveryStatus = "Pendiente" | "Entregado";
type PaymentStatus = "Pendiente" | "Pagado";
type Order = { id: string; customer: string; product: string; quantity: number; total: number; deliveryStatus: DeliveryStatus; paymentStatus: PaymentStatus; destination: string; date: string };
const initialOrders: Order[] = [
  { id: "#GP-1048", customer: "Mariana Salazar", product: "Set Aurora", quantity: 2, total: 118, deliveryStatus: "Entregado", paymentStatus: "Pagado", destination: "Arequipa", date: "Hoy, 10:32" },
  { id: "#GP-1047", customer: "Diego Ramos", product: "Agenda 2025", quantity: 1, total: 42, deliveryStatus: "Pendiente", paymentStatus: "Pendiente", destination: "Lima", date: "Hoy, 09:18" },
  { id: "#GP-1046", customer: "Lucía Paredes", product: "Box personalizado", quantity: 3, total: 156, deliveryStatus: "Pendiente", paymentStatus: "Pagado", destination: "Arequipa", date: "Ayer, 18:44" },
];
const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default function Home() {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [productMode, setProductMode] = useState<"catalog" | "custom">("catalog");
  const [destination, setDestination] = useState<"arequipa" | "province">("arequipa");
  const [delivery, setDelivery] = useState("Delivery");
  const [notice, setNotice] = useState("");
  const filteredOrders = useMemo(() => orders.filter((order) => `${order.customer} ${order.product} ${order.id}`.toLowerCase().includes(search.toLowerCase())), [orders, search]);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "Cliente nuevo");
    const dni = String(form.get("dni") || "");
    const product = String(form.get("product") || "Producto sin nombre");
    const quantity = Number(form.get("quantity") || 1);
    const price = Number(form.get("price") || 0);
    const newOrder: Order = { id: `#GP-${1050 + orders.length}`, customer: name, product, quantity, total: quantity * price, deliveryStatus: "Pendiente", paymentStatus: "Pendiente", destination: destination === "arequipa" ? "Arequipa" : "Provincia", date: "Ahora" };
    setOrders((current) => [newOrder, ...current]);
    setNotice("Pedido guardado correctamente");
    event.currentTarget.reset();
    window.setTimeout(() => setNotice(""), 3500);
    const supabase = createClient();
    if (supabase) await supabase.from("orders").insert({ order_code: newOrder.id, customer_name: name, dni, product_name: product, quantity, unit_price: price, total: newOrder.total, destination: newOrder.destination, delivery_method: destination === "arequipa" ? delivery : "Envío a provincia", is_custom: productMode === "custom", status: "pending", delivery_status: "pending", payment_status: "pending" });
  };
  const updateOrderStatus = async (orderId: string, kind: "deliveryStatus" | "paymentStatus", value: DeliveryStatus | PaymentStatus) => {
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, [kind]: value } : order));
    const supabase = createClient();
    if (supabase) await supabase.from("orders").update({ [kind === "deliveryStatus" ? "delivery_status" : "payment_status"]: value === "Entregado" || value === "Pagado" ? (kind === "deliveryStatus" ? "delivered" : "paid") : "pending" }).eq("order_code", orderId);
  };
  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><span className="brand-mark">g</span><span>giuseppe</span></div><div className="workspace-label">GESTIÓN DE VENTAS</div><nav className="nav-list" aria-label="Navegación principal"><a className="nav-item active" href="#resumen"><ClipboardList size={18} />Resumen</a><a className="nav-item" href="#pedidos"><Package size={18} />Pedidos <span className="nav-count">{orders.length}</span></a><a className="nav-item" href="#clientes"><UserRound size={18} />Clientes</a><a className="nav-item" href="#configuracion"><Settings2 size={18} />Configuración</a></nav><div className="sidebar-bottom"><div className="sync-dot" /><div><strong>Base de datos conectada</strong><span>Supabase · Actualizado</span></div></div></aside>
      <section className="content-area">
        <header className="topbar"><div><span className="eyebrow">VIERNES, 25 DE SEPTIEMBRE</span><h1 id="resumen">Hola, Giuseppe <span>✦</span></h1></div><div className="top-actions"><button className="icon-button" aria-label="Buscar"><Search size={19} /></button><div className="avatar">G</div></div></header>
        <div className="page-grid"><section className="main-column">
          <div className="stats-grid"><article className="stat-card highlight"><div className="stat-icon"><CreditCard size={18} /></div><span>Ventas del mes</span><strong>{money.format(1824)}</strong><small><b>+12.5%</b> vs. mes anterior</small></article><article className="stat-card"><div className="stat-icon soft"><ClipboardList size={18} /></div><span>Pedidos registrados</span><strong>{orders.length + 34}</strong><small><b className="ink">+8</b> esta semana</small></article><article className="stat-card"><div className="stat-icon pale"><Truck size={18} /></div><span>Por entregar</span><strong>12</strong><small><b className="orange">3</b> requieren atención</small></article></div>
          <div className="section-heading"><div><span className="eyebrow">REGISTRO RÁPIDO</span><h2>Nuevo pedido</h2></div><span className="required-note">* Campos obligatorios</span></div>
          <form className="order-form" onSubmit={handleSubmit}>
            <div className="form-section"><div className="section-number">01</div><div className="form-section-content"><div className="form-title"><h3>Datos del cliente</h3><span>Identifica a quién pertenece este pedido</span></div><div className="field-grid"><label>Nombre y apellido <input name="name" placeholder="Ej. Valeria Mendoza" required /></label><label>DNI <input name="dni" inputMode="numeric" placeholder="00000000" maxLength={8} required /></label></div></div></div>
            <div className="form-section"><div className="section-number">02</div><div className="form-section-content"><div className="form-title"><h3>Producto y cantidad</h3><span>Elige del catálogo o crea una línea especial</span></div><div className="segmented"><button type="button" className={productMode === "catalog" ? "selected" : ""} onClick={() => setProductMode("catalog")}><Package size={15} />Del catálogo</button><button type="button" className={productMode === "custom" ? "selected custom-selected" : ""} onClick={() => setProductMode("custom")}><Sparkles size={15} />Personalizado</button></div><div className="field-grid product-fields"><label>Nombre del producto <input name="product" placeholder={productMode === "custom" ? "Ej. Box de bienvenida" : "Ej. Set Aurora"} required /></label><label className="small-field">Cantidad <input name="quantity" type="number" min="1" defaultValue="1" required /></label><label className="small-field">Precio unitario <div className="input-prefix"><span>S/</span><input name="price" type="number" min="0" step="0.01" placeholder="0.00" required /></div></label></div>{productMode === "custom" && <div className="custom-hint"><Sparkles size={15} /> Producto personalizado: este precio no modificará tu catálogo.</div>}</div></div>
            <div className="form-section"><div className="section-number">03</div><div className="form-section-content"><div className="form-title"><h3>Entrega</h3><span>Define el destino y la forma de envío</span></div><div className="segmented destination"><button type="button" className={destination === "arequipa" ? "selected" : ""} onClick={() => setDestination("arequipa")}><MapPin size={15} />Arequipa</button><button type="button" className={destination === "province" ? "selected" : ""} onClick={() => setDestination("province")}><Send size={15} />Envío a provincia</button></div>{destination === "arequipa" ? <label className="delivery-select">Forma de entrega<div className="select-wrap"><select value={delivery} onChange={(event) => setDelivery(event.target.value)}><option>Delivery</option><option>Recojo en tienda</option><option>Entrega coordinada</option></select><ChevronDown size={16} /></div></label> : <div className="province-note"><Truck size={17} /><div><strong>Envío a provincia</strong><span>Coordinaremos la agencia y el costo con el cliente.</span></div></div>}</div></div>
            <div className="form-footer"><span><CircleCheck size={16} />Se guardará como pedido pendiente</span><button className="primary-button" type="submit"><Plus size={17} />Guardar pedido</button></div>
          </form>
          <div className="section-heading orders-heading" id="pedidos"><div><span className="eyebrow">HISTORIAL</span><h2>Pedidos recientes</h2></div><button className="export-button"><ArrowDownToLine size={16} />Exportar</button></div>
          <div className="orders-panel"><div className="table-toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedido o cliente" /></div><button className="filter-button">Todos los estados <ChevronDown size={15} /></button></div><div className="table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Entrega</th><th>Pago</th><th>Fecha</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id}><td className="order-code">{order.id}</td><td><strong>{order.customer}</strong><span className="table-subtitle">{order.destination}</span></td><td>{order.product} <span className="quantity">× {order.quantity}</span></td><td className="total-cell">{money.format(order.total)}</td><td><select className={`status-select ${order.deliveryStatus === "Entregado" ? "paid" : "pending"}`} value={order.deliveryStatus} onChange={(event) => updateOrderStatus(order.id, "deliveryStatus", event.target.value as DeliveryStatus)} aria-label={`Estado de entrega de ${order.id}`}><option>Pendiente</option><option>Entregado</option></select></td><td><select className={`status-select ${order.paymentStatus === "Pagado" ? "paid" : "pending"}`} value={order.paymentStatus} onChange={(event) => updateOrderStatus(order.id, "paymentStatus", event.target.value as PaymentStatus)} aria-label={`Estado de pago de ${order.id}`}><option>Pendiente</option><option>Pagado</option></select></td><td className="date-cell">{order.date}</td></tr>)}</tbody></table></div></div>
        </section><aside className="right-rail"><div className="rail-header"><span className="eyebrow">ESTE MES</span><h2>Resumen de pagos</h2></div><div className="donut-wrap"><div className="donut"><div className="donut-center"><strong>76%</strong><span>cobrado</span></div></div></div><div className="payment-legend"><div><span className="legend-dot paid-dot" /><span>Pagado</span><strong>S/ 1,384</strong></div><div><span className="legend-dot pending-dot" /><span>Pendiente</span><strong>S/ 440</strong></div></div><div className="rail-divider" /><div className="tip"><div className="tip-icon"><Sparkles size={17} /></div><div><strong>Un buen comienzo</strong><p>Ya tienes 38 pedidos este mes. Sigue así, Giuseppe.</p></div></div></aside></div>
        {notice && <div className="toast"><CircleCheck size={17} />{notice}</div>}
      </section>
    </main>
  );
}
