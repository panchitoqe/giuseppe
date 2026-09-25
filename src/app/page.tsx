"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ChevronDown, CircleCheck, ClipboardList, CreditCard, LogOut, MapPin, Package, Plus, Search, Send, Settings2, Sparkles, Truck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase";

type DeliveryStatus = "Pendiente" | "Entregado";
type PaymentStatus = "Pendiente" | "Pagado";
type Order = { id: string; customer: string; product: string; quantity: number; total: number; deliveryStatus: DeliveryStatus; paymentStatus: PaymentStatus; deliveryCost: number; deliveryPaymentStatus: PaymentStatus; destination: string; date: string };
type SupabaseOrder = { order_code: string; customer_name: string; product_name: string; quantity: number; total: number; delivery_status: "pending" | "delivered"; payment_status: "pending" | "paid"; delivery_cost: number; delivery_payment_status: "pending" | "paid"; destination: string; created_at: string };
const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const formatOrderDate = (date: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));

export default function Home() {
  const [supabase] = useState(createClient);
  const [sessionReady, setSessionReady] = useState(() => !supabase);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("giuseppe@gmail.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [productMode, setProductMode] = useState<"catalog" | "custom">("catalog");
  const [destination, setDestination] = useState<"arequipa" | "province">("arequipa");
  const [delivery, setDelivery] = useState("Delivery");
  const [deliveryPaymentStatus, setDeliveryPaymentStatus] = useState<PaymentStatus>("Pendiente");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data, error }) => {
      setAuthenticated(Boolean(data.session));
      if (error) setLoginError("No se pudo conectar con Supabase. Revisa la URL y la clave pública.");
      setSessionReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
      setSessionReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => {
    if (!supabase || !authenticated) return;
    supabase.from("orders").select("order_code, customer_name, product_name, quantity, total, delivery_status, payment_status, delivery_cost, delivery_payment_status, destination, created_at").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error || !data) return;
      setOrders((data as SupabaseOrder[]).map((order) => ({ id: order.order_code, customer: order.customer_name, product: order.product_name, quantity: order.quantity, total: Number(order.total), deliveryStatus: order.delivery_status === "delivered" ? "Entregado" : "Pendiente", paymentStatus: order.payment_status === "paid" ? "Pagado" : "Pendiente", deliveryCost: Number(order.delivery_cost), deliveryPaymentStatus: order.delivery_payment_status === "paid" ? "Pagado" : "Pendiente", destination: order.destination, date: formatOrderDate(order.created_at) })));
    });
  }, [authenticated, supabase]);
  const filteredOrders = useMemo(() => orders.filter((order) => `${order.customer} ${order.product} ${order.id}`.toLowerCase().includes(search.toLowerCase())), [orders, search]);
  const paidTotal = orders.filter((order) => order.paymentStatus === "Pagado").reduce((sum, order) => sum + order.total, 0);
  const pendingTotal = orders.filter((order) => order.paymentStatus === "Pendiente").reduce((sum, order) => sum + order.total, 0);
  const pendingDeliveryCount = orders.filter((order) => order.deliveryStatus === "Pendiente").length;
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "Cliente nuevo");
    const dni = String(form.get("dni") || "");
    const phone = String(form.get("phone") || "");
    const product = String(form.get("product") || "Producto sin nombre");
    const quantity = Number(form.get("quantity") || 1);
    const price = Number(form.get("price") || 0);
    const deliveryCost = Number(form.get("deliveryCost") || 0);
    const hasDeliveryCharge = destination === "province" || delivery === "Delivery";
    const newOrder: Order = { id: `#GP-${1050 + orders.length}`, customer: name, product, quantity, total: quantity * price, deliveryStatus: "Pendiente", paymentStatus: "Pendiente", deliveryCost: hasDeliveryCharge ? deliveryCost : 0, deliveryPaymentStatus: hasDeliveryCharge ? deliveryPaymentStatus : "Pendiente", destination: destination === "arequipa" ? "Arequipa" : "Provincia", date: "Ahora" };
    setOrders((current) => [newOrder, ...current]);
    setNotice("Pedido guardado correctamente");
    event.currentTarget.reset();
    window.setTimeout(() => setNotice(""), 3500);
    if (supabase) await supabase.from("orders").insert({ order_code: newOrder.id, customer_name: name, dni, phone, product_name: product, quantity, unit_price: price, total: newOrder.total, destination: newOrder.destination, delivery_method: destination === "arequipa" ? delivery : "Envío a provincia", delivery_cost: newOrder.deliveryCost, delivery_payment_status: newOrder.deliveryPaymentStatus === "Pagado" ? "paid" : "pending", is_custom: productMode === "custom", status: "pending", delivery_status: "pending", payment_status: "pending" });
  };
  const updateOrderStatus = async (orderId: string, kind: "deliveryStatus" | "paymentStatus" | "deliveryPaymentStatus", value: DeliveryStatus | PaymentStatus) => {
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, [kind]: value } : order));
    const field = kind === "deliveryStatus" ? "delivery_status" : kind === "paymentStatus" ? "payment_status" : "delivery_payment_status";
    const statusValue = value === "Entregado" ? "delivered" : value === "Pagado" ? "paid" : "pending";
    if (supabase) {
      const { error } = await supabase.from("orders").update({ [field]: statusValue }).eq("order_code", orderId);
      if (error) setNotice("No se pudo actualizar el estado. Revisa las políticas de Supabase.");
    }
  };
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    if (!supabase) {
      setLoginError("Configura las variables de Supabase para iniciar sesión.");
      return;
    }
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("api key")) setLoginError("La clave pública de Supabase no es válida para este proyecto.");
      else if (error.message.toLowerCase().includes("confirmed")) setLoginError("Confirma el correo del usuario en Supabase Auth antes de ingresar.");
      else setLoginError("Correo o contraseña incorrectos.");
    }
    setLoggingIn(false);
  };
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };
  if (!sessionReady) return <div className="auth-loading">Cargando...</div>;
  if (!authenticated) return <main className="auth-shell"><section className="auth-panel"><div className="brand auth-brand"><span className="brand-mark">g</span><span>giuseppe</span></div><span className="eyebrow">GESTIÓN DE VENTAS</span><h1>Bienvenido de nuevo</h1><p>Ingresa a tu cuenta para controlar tus pedidos y pagos.</p><form className="auth-form" onSubmit={handleLogin}><label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{loginError && <div className="auth-error" role="alert">{loginError}</div>}<button className="primary-button auth-submit" type="submit" disabled={loggingIn}>{loggingIn ? "Ingresando..." : "Iniciar sesión"}</button></form></section><div className="auth-accent"><span>g</span><p>Pedidos claros.<br />Decisiones precisas.</p></div></main>;
  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><span className="brand-mark">g</span><span>giuseppe</span></div><div className="workspace-label">GESTIÓN DE VENTAS</div><nav className="nav-list" aria-label="Navegación principal"><a className="nav-item active" href="#resumen"><ClipboardList size={18} />Resumen</a><a className="nav-item" href="#pedidos"><Package size={18} />Pedidos <span className="nav-count">{orders.length}</span></a><a className="nav-item" href="#clientes"><UserRound size={18} />Clientes</a><a className="nav-item" href="#configuracion"><Settings2 size={18} />Configuración</a></nav><div className="sidebar-bottom"><div className="sync-dot" /><div><strong>Base de datos conectada</strong><span>Supabase · Actualizado</span></div></div></aside>
      <section className="content-area">
        <header className="topbar"><div><span className="eyebrow">VIERNES, 25 DE SEPTIEMBRE</span><h1 id="resumen">Hola, Giuseppe <span>✦</span></h1></div><div className="top-actions"><button className="icon-button" aria-label="Buscar"><Search size={19} /></button><button className="icon-button" aria-label="Cerrar sesión" onClick={handleLogout}><LogOut size={17} /></button><div className="avatar">G</div></div></header>
        <div className="page-grid"><section className="main-column">
          <div className="stats-grid"><article className="stat-card highlight"><div className="stat-icon"><CreditCard size={18} /></div><span>Ventas registradas</span><strong>{money.format(paidTotal + pendingTotal)}</strong><small><b>{money.format(paidTotal)}</b> cobrado</small></article><article className="stat-card"><div className="stat-icon soft"><ClipboardList size={18} /></div><span>Pedidos registrados</span><strong>{orders.length}</strong><small><b className="ink">{orders.length}</b> en total</small></article><article className="stat-card"><div className="stat-icon pale"><Truck size={18} /></div><span>Por entregar</span><strong>{pendingDeliveryCount}</strong><small><b className="orange">{pendingDeliveryCount}</b> pendientes</small></article></div>
          <div className="section-heading"><div><span className="eyebrow">REGISTRO RÁPIDO</span><h2>Nuevo pedido</h2></div><span className="required-note">* Campos obligatorios</span></div>
          <form className="order-form" onSubmit={handleSubmit}>
            <div className="form-section"><div className="section-number">01</div><div className="form-section-content"><div className="form-title"><h3>Datos del cliente</h3><span>Identifica a quién pertenece este pedido</span></div><div className="field-grid"><label>Nombre y apellido <input name="name" placeholder="Ej. Valeria Mendoza" required /></label><label>DNI <input name="dni" inputMode="numeric" placeholder="00000000" maxLength={8} required /></label><label>Celular <input name="phone" type="tel" inputMode="tel" placeholder="999 999 999" maxLength={15} required /></label></div></div></div>
            <div className="form-section"><div className="section-number">02</div><div className="form-section-content"><div className="form-title"><h3>Producto y cantidad</h3><span>Elige del catálogo o crea una línea especial</span></div><div className="segmented"><button type="button" className={productMode === "catalog" ? "selected" : ""} onClick={() => setProductMode("catalog")}><Package size={15} />Del catálogo</button><button type="button" className={productMode === "custom" ? "selected custom-selected" : ""} onClick={() => setProductMode("custom")}><Sparkles size={15} />Personalizado</button></div><div className="field-grid product-fields"><label>Nombre del producto <input name="product" placeholder={productMode === "custom" ? "Ej. Box de bienvenida" : "Ej. Set Aurora"} required /></label><label className="small-field">Cantidad <input name="quantity" type="number" min="1" defaultValue="1" required /></label><label className="small-field">Precio unitario <div className="input-prefix"><span>S/</span><input name="price" type="number" min="0" step="0.01" placeholder="0.00" required /></div></label></div>{productMode === "custom" && <div className="custom-hint"><Sparkles size={15} /> Producto personalizado: este precio no modificará tu catálogo.</div>}</div></div>
            <div className="form-section"><div className="section-number">03</div><div className="form-section-content"><div className="form-title"><h3>Entrega</h3><span>Define el destino y la forma de envío</span></div><div className="segmented destination"><button type="button" className={destination === "arequipa" ? "selected" : ""} onClick={() => setDestination("arequipa")}><MapPin size={15} />Arequipa</button><button type="button" className={destination === "province" ? "selected" : ""} onClick={() => setDestination("province")}><Send size={15} />Envío a provincia</button></div>{destination === "arequipa" ? <label className="delivery-select">Forma de entrega<div className="select-wrap"><select value={delivery} onChange={(event) => setDelivery(event.target.value)}><option>Delivery</option><option>Entrega coordinada</option></select><ChevronDown size={16} /></div></label> : <div className="province-note"><Truck size={17} /><div><strong>Envío a provincia</strong><span>Coordinaremos la agencia y el costo con el cliente.</span></div></div>}{(destination === "province" || delivery === "Delivery") && <div className="field-grid delivery-payment-fields"><label>Costo de entrega <div className="input-prefix"><span>S/</span><input name="deliveryCost" type="number" min="0" step="0.01" placeholder="0.00" required /></div></label><label>Estado del pago de entrega<div className="select-wrap"><select value={deliveryPaymentStatus} onChange={(event) => setDeliveryPaymentStatus(event.target.value as PaymentStatus)}><option>Pendiente</option><option>Pagado</option></select><ChevronDown size={16} /></div></label></div>}</div></div>
            <div className="form-footer"><span><CircleCheck size={16} />Se guardará como pedido pendiente</span><button className="primary-button" type="submit"><Plus size={17} />Guardar pedido</button></div>
          </form>
          <div className="section-heading orders-heading" id="pedidos"><div><span className="eyebrow">HISTORIAL</span><h2>Pedidos recientes</h2></div><button className="export-button"><ArrowDownToLine size={16} />Exportar</button></div>
          <div className="orders-panel"><div className="table-toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedido o cliente" /></div><button className="filter-button">Todos los estados <ChevronDown size={15} /></button></div><div className="table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Entrega</th><th>Pago</th><th>Fecha</th></tr></thead><tbody>{filteredOrders.length > 0 ? filteredOrders.map((order) => <tr key={order.id}><td className="order-code">{order.id}</td><td><strong>{order.customer}</strong><span className="table-subtitle">{order.destination}</span></td><td>{order.product} <span className="quantity">× {order.quantity}</span></td><td className="total-cell">{money.format(order.total)}</td><td><select className={`status-select ${order.deliveryStatus === "Entregado" ? "paid" : "pending"}`} value={order.deliveryStatus} onChange={(event) => updateOrderStatus(order.id, "deliveryStatus", event.target.value as DeliveryStatus)} aria-label={`Estado de entrega de ${order.id}`}><option>Pendiente</option><option>Entregado</option></select></td><td><select className={`status-select ${order.paymentStatus === "Pagado" ? "paid" : "pending"}`} value={order.paymentStatus} onChange={(event) => updateOrderStatus(order.id, "paymentStatus", event.target.value as PaymentStatus)} aria-label={`Estado de pago de ${order.id}`}><option>Pendiente</option><option>Pagado</option></select></td><td className="date-cell">{order.date}</td></tr>) : <tr><td className="empty-state" colSpan={7}>Aún no hay pedidos registrados.</td></tr>}</tbody></table></div></div>
        </section><aside className="right-rail"><div className="rail-header"><span className="eyebrow">ESTE MES</span><h2>Resumen de pagos</h2></div><div className="donut-wrap"><div className="donut"><div className="donut-center"><strong>{paidTotal + pendingTotal > 0 ? Math.round((paidTotal / (paidTotal + pendingTotal)) * 100) : 0}%</strong><span>cobrado</span></div></div></div><div className="payment-legend"><div><span className="legend-dot paid-dot" /><span>Pagado</span><strong>{money.format(paidTotal)}</strong></div><div><span className="legend-dot pending-dot" /><span>Pendiente</span><strong>{money.format(pendingTotal)}</strong></div></div><div className="rail-divider" /><div className="tip"><div className="tip-icon"><Sparkles size={17} /></div><div><strong>Espacio listo</strong><p>Registra tu primer pedido para comenzar.</p></div></div></aside></div>
        {notice && <div className="toast"><CircleCheck size={17} />{notice}</div>}
      </section>
    </main>
  );
}
