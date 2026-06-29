"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardList,
  Download,
  FileText,
  ListTodo,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Truck,
  Upload,
  Users,
  X
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { calculateCommercialLine, calculateDocumentTotals } from "@/lib/hoon-lab/calculations";

const emptyLine = {
  product: "",
  quantity: 1,
  unitPrice: "",
  discountType: "none",
  discountValue: 0,
  notes: ""
};

const NO_SECOND_PRICE_LIST = "__none__";
const DEFAULT_HOON_LAB_SETTINGS = {
  companyName: "Hoon Srl",
  companyHeader: "Hoon Srl\nVia Buon Pastore 9 d\n01100 Viterbo (VT)\nTel. 3760361046 / Fax\nwww.hoonlab.it / info@hoonlab.it\nP.IVA 02338800564 - Cod. Fiscale 02338800564",
  quoteNoteTitle: "NOTA PREVENTIVO",
  quoteNote: "Per l’avvio dell’ordine è richiesto un acconto pari al 50% dell’importo totale. Il restante 50% dovrà essere saldato prima della consegna della merce"
};

function currency(value) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("it-IT").format(new Date(value)) : "-";
}

function formatDateTime(value) {
  return value ? new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value)) : "-";
}

function monthLabel(value) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(date);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function currentWeekRange() {
  const today = startOfDay(new Date());
  const day = today.getDay() || 7;
  const start = new Date(today);
  start.setDate(today.getDate() - day + 1);
  const end = endOfDay(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function currentMonthRange() {
  const today = new Date();
  return {
    start: new Date(today.getFullYear(), today.getMonth(), 1),
    end: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  };
}

function isDateInRange(value, range) {
  if (!value) return false;
  const date = new Date(value);
  return date >= range.start && date <= range.end;
}

export default function HoonLabClient() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_HOON_LAB_SETTINGS);
  const [message, setMessage] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerCreateOpen, setCustomerCreateOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productSuggestionsOpen, setProductSuggestionsOpen] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteBoardTab, setQuoteBoardTab] = useState("da-inviare");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderBoardTab, setOrderBoardTab] = useState("ddt-da-generare");
  const [settingsTab, setSettingsTab] = useState("statistiche");
  const [customerListSearch, setCustomerListSearch] = useState("");
  const [productListSearch, setProductListSearch] = useState("");
  const [ddtSearch, setDdtSearch] = useState("");
  const [selectedPriceListView, setSelectedPriceListView] = useState("");
  const [priceListProductSearch, setPriceListProductSearch] = useState("");
  const [lineError, setLineError] = useState("");
  const [importingProducts, setImportingProducts] = useState(false);
  const [todoView, setTodoView] = useState("tutte");
  const [todoForm, setTodoForm] = useState({ note: "", dueDate: "", status: "da_fare" });
  const [settingsForm, setSettingsForm] = useState(DEFAULT_HOON_LAB_SETTINGS);

  const [customerForm, setCustomerForm] = useState({
    type: "privato",
    firstName: "",
    lastName: "",
    name: "",
    vatNumber: "",
    taxCode: "",
    billingAddress: { address: "" }
  });
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    priceListOneId: "",
    priceListOnePrice: "",
    priceListTwoId: "",
    priceListTwoPrice: "",
    unit: "pz",
    description: ""
  });
  const [priceListForm, setPriceListForm] = useState({ name: "", customerType: "privato" });
  const [priceItemForm, setPriceItemForm] = useState({ priceList: "", product: "", price: "" });

  const [quoteForm, setQuoteForm] = useState({
    customer: "",
    priceList: "",
    status: "bozza",
    issueDate: todayISO(),
    validUntil: "",
    quoteDiscountType: "none",
    quoteDiscountValue: 0,
    notes: "",
    lines: []
  });
  const [lineDraft, setLineDraft] = useState(emptyLine);

  async function loadData() {
    setLoading(true);
    try {
      const [customersRes, productsRes, priceListsRes, quotesRes, ordersRes, ddtRes, statsRes, todosRes, settingsRes] = await Promise.all([
        fetch("/api/hoon-lab/customers"),
        fetch("/api/hoon-lab/products"),
        fetch("/api/hoon-lab/price-lists?items=true"),
        fetch("/api/hoon-lab/quotes"),
        fetch("/api/hoon-lab/orders"),
        fetch("/api/hoon-lab/ddt"),
        fetch("/api/hoon-lab/stats"),
        fetch("/api/hoon-lab/todos"),
        fetch("/api/hoon-lab/settings")
      ]);

      setCustomers(await customersRes.json());
      setProducts(await productsRes.json());
      setPriceLists(await priceListsRes.json());
      setQuotes(await quotesRes.json());
      setOrders(await ordersRes.json());
      setDeliveryNotes(await ddtRes.json());
      setStats(await statsRes.json());
      setTodos(await todosRes.json());
      const loadedSettings = await settingsRes.json();
      const nextSettings = { ...DEFAULT_HOON_LAB_SETTINGS, ...loadedSettings };
      setSettings(nextSettings);
      setSettingsForm(nextSettings);
    } catch (error) {
      console.error("Errore caricamento Hoon Lab:", error);
      setMessage("Errore caricamento dati Hoon Lab");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer._id === quoteForm.customer),
    [customers, quoteForm.customer]
  );

  const suggestedPriceList = useMemo(() => {
    if (!selectedCustomer) return null;
    if (selectedCustomer.defaultPriceList?._id) {
      return priceLists.find((list) => list._id === selectedCustomer.defaultPriceList._id);
    }
    return priceLists.find((list) => list.customerType === selectedCustomer.type);
  }, [priceLists, selectedCustomer]);

  const selectedPriceList = useMemo(() => {
    if (quoteForm.priceList) {
      return priceLists.find((list) => list._id === quoteForm.priceList) || null;
    }

    return suggestedPriceList;
  }, [priceLists, quoteForm.priceList, suggestedPriceList]);

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter((customer) => {
      return [
        customer.name,
        customer.type,
        customer.email,
        customer.phone,
        customer.vatNumber,
        customer.taxCode
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products.slice(0, 8);

    return products.filter((product) => {
      return [
        product.name,
        product.sku,
        product.category,
        product.description
      ].some((value) => String(value || "").toLowerCase().includes(term));
    }).slice(0, 10);
  }, [productSearch, products]);

  function selectQuoteCustomer(customerId) {
    setQuoteForm((current) => ({ ...current, customer: customerId }));
    setCustomerSearch("");
    setCustomerPickerOpen(false);
  }

  function getProductPrice(productId) {
    const item = selectedPriceList?.items?.find((price) => price.product?._id === productId);
    return item?.price ?? "";
  }

  function getPriceListProductPrice(productId, priceListId) {
    const list = priceLists.find((priceList) => priceList._id === priceListId);
    const item = list?.items?.find((price) => price.product?._id === productId);
    return item?.price ?? null;
  }

  function updateLineProduct(productId) {
    const product = products.find((item) => item._id === productId);
    const price = getProductPrice(productId);
    setLineDraft((current) => ({
      ...current,
      product: productId,
      unitPrice: price,
      description: product?.name || ""
    }));
    setLineError(price === "" ? `Manca il prezzo nel listino selezionato per ${product?.name || "questo prodotto"}` : "");
    setProductSearch(product?.name || "");
    setProductSuggestionsOpen(false);
  }

  async function parseApiResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    return {
      error: response.ok
        ? ""
        : `Errore server ${response.status}: ${text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)}`
    };
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await parseApiResponse(response);
    if (!response.ok) throw new Error(data.error || "Operazione non riuscita");
    return data;
  }

  async function patchJson(url, payload) {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await parseApiResponse(response);
    if (!response.ok) throw new Error(data.error || "Operazione non riuscita");
    return data;
  }

  async function deleteJson(url) {
    const response = await fetch(url, { method: "DELETE" });
    const data = await parseApiResponse(response);
    if (!response.ok) throw new Error(data.error || "Eliminazione non riuscita");
    return data;
  }

  async function handleCreateCustomer(event, options = {}) {
    event.preventDefault();
    try {
      const customerName = customerForm.type === "privato"
        ? `${customerForm.firstName} ${customerForm.lastName}`.trim()
        : customerForm.name.trim();

      const createdCustomer = await postJson("/api/hoon-lab/customers", {
        ...customerForm,
        name: customerName,
        vatNumber: customerForm.type === "privato" ? "" : customerForm.vatNumber,
        taxCode: customerForm.type === "privato" ? customerForm.taxCode : ""
      });
      setCustomerForm({
        type: "privato",
        firstName: "",
        lastName: "",
        name: "",
        vatNumber: "",
        taxCode: "",
        billingAddress: { address: "" }
      });
      setMessage("Cliente creato");
      await loadData();
      if (options.selectAfterCreate) {
        setQuoteForm((current) => ({ ...current, customer: createdCustomer._id }));
        setCustomerSearch("");
      }
      if (options.closeModal) setCustomerCreateOpen(false);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function cancelCustomerCreate() {
    const confirmed = window.confirm("Sicuro di annullare la creazione del cliente?");
    if (!confirmed) return;
    setCustomerCreateOpen(false);
  }

  async function handleCreateTodo(event) {
    event.preventDefault();
    try {
      if (!todoForm.note.trim()) {
        setMessage("Scrivi la nota dell'attivita");
        return;
      }

      await postJson("/api/hoon-lab/todos", todoForm);
      setTodoForm({ note: "", dueDate: "", status: "da_fare" });
      setMessage("Attivita creata");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function changeTodoStatus(todo, status) {
    try {
      await patchJson(`/api/hoon-lab/todos/${todo._id}`, { status });
      setMessage("Stato attivita aggiornato");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteTodo(todo) {
    const confirmed = window.confirm("Eliminare questa attivita?");
    if (!confirmed) return;

    try {
      await deleteJson(`/api/hoon-lab/todos/${todo._id}`);
      setMessage("Attivita eliminata");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault();
    try {
      const savedSettings = await patchJson("/api/hoon-lab/settings", settingsForm);
      const nextSettings = { ...DEFAULT_HOON_LAB_SETTINGS, ...savedSettings };
      setSettings(nextSettings);
      setSettingsForm(nextSettings);
      setMessage("Impostazioni documenti salvate");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    try {
      const defaultFirstList = priceLists[0]?._id || "";
      const selectedSecondListId = productFormSecondPriceList?._id || "";

      await postJson("/api/hoon-lab/products", {
        ...productForm,
        priceListOneId: productForm.priceListOneId || defaultFirstList,
        priceListTwoId: selectedSecondListId,
        priceListTwoPrice: selectedSecondListId ? productForm.priceListTwoPrice : ""
      });
      setProductForm({
        sku: "",
        name: "",
        category: "",
        priceListOneId: "",
        priceListOnePrice: "",
        priceListTwoId: "",
        priceListTwoPrice: "",
        unit: "pz",
        description: ""
      });
      setMessage("Prodotto creato");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleImportProducts() {
    setImportingProducts(true);
    try {
      const result = await postJson("/api/hoon-lab/products/import", {});
      setMessage(`Import completato: ${result.products} prodotti, ${result.prices} prezzi aggiornati`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setImportingProducts(false);
    }
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(`Eliminare il prodotto "${product.name}"? Non comparira piu nei nuovi preventivi.`);
    if (!confirmed) return;

    try {
      await deleteJson(`/api/hoon-lab/products/${product._id}`);
      setMessage(`Prodotto "${product.name}" eliminato`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeletePriceList(priceList) {
    const confirmed = window.confirm(`Eliminare il listino "${priceList.name}"? I preventivi gia creati resteranno invariati.`);
    if (!confirmed) return;

    try {
      await deleteJson(`/api/hoon-lab/price-lists/${priceList._id}`);
      setSelectedPriceListView("");
      setPriceItemForm({ priceList: "", product: "", price: "" });
      setMessage(`Listino "${priceList.name}" eliminato`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCreatePriceList(event) {
    event.preventDefault();
    try {
      if (!priceListForm.name.trim()) {
        setMessage("Inserisci il nome del listino");
        return;
      }

      await postJson("/api/hoon-lab/price-lists", priceListForm);
      setPriceListForm({ name: "", customerType: "privato" });
      setMessage("Listino creato");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleAddPrice(event) {
    event.preventDefault();
    try {
      const activePriceListId = priceItemForm.priceList || selectedListView?._id;

      if (!activePriceListId || !priceItemForm.product || priceItemForm.price === "") {
        setMessage("Seleziona listino, prodotto e prezzo prima di salvare");
        return;
      }

      await postJson(`/api/hoon-lab/price-lists/${activePriceListId}/items`, {
        product: priceItemForm.product,
        price: priceItemForm.price
      });
      setPriceItemForm({ priceList: activePriceListId, product: "", price: "" });
      setMessage("Prezzo listino aggiornato con storico");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function addLine() {
    if (!lineDraft.product) {
      const error = "Seleziona un prodotto per aggiungere la riga";
      setLineError(error);
      setMessage(error);
      return;
    }

    if (lineDraft.unitPrice === "" || lineDraft.unitPrice === null || lineDraft.unitPrice === undefined) {
      const product = products.find((item) => item._id === lineDraft.product);
      const error = `Manca il prezzo nel listino selezionato per ${product?.name || "questo prodotto"}`;
      setLineError(error);
      setMessage(error);
      return;
    }

    setQuoteForm((current) => ({ ...current, lines: [...current.lines, lineDraft] }));
    setLineDraft(emptyLine);
    setLineError("");
    setProductSearch("");
    setProductSuggestionsOpen(false);
  }

  function removeQuoteLine(indexToRemove) {
    setQuoteForm((current) => ({
      ...current,
      lines: current.lines.filter((_, index) => index !== indexToRemove)
    }));
  }

  async function handleCreateQuote(event) {
    event.preventDefault();
    try {
      if (!quoteForm.customer || quoteForm.lines.length === 0) {
        setMessage("Cliente e almeno una riga sono obbligatori");
        return;
      }
      await postJson("/api/hoon-lab/quotes", {
        ...quoteForm,
        priceList: selectedPriceList?._id || null
      });
      setQuoteForm({
        customer: "",
        priceList: "",
        status: "bozza",
        issueDate: todayISO(),
        validUntil: "",
        quoteDiscountType: "none",
        quoteDiscountValue: 0,
        notes: "",
        lines: []
      });
      setMessage("Preventivo creato");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function changeQuoteStatus(quote, status, payload = {}) {
    try {
      await patchJson(`/api/hoon-lab/quotes/${quote._id}`, { status, ...payload });
      setMessage(status === "inviato"
        ? `Preventivo ${quote.number} segnato come inviato`
        : `Preventivo ${quote.number} aggiornato`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function convertQuote(quote) {
    try {
      await postJson(`/api/hoon-lab/quotes/${quote._id}/convert`, {});
      setMessage(`Preventivo ${quote.number} accettato e convertito in conferma d'ordine`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function generateDdt(order) {
    try {
      await postJson(`/api/hoon-lab/orders/${order._id}/ddt`, {});
      setMessage(`DDT generato da ${order.number}`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const todoStatuses = useMemo(() => [
    { id: "da_fare", label: "Da fare", icon: ListTodo, tone: "slate" },
    { id: "in_lavorazione", label: "In lavorazione", icon: CircleDot, tone: "blue" },
    { id: "fatta", label: "Fatta", icon: CheckCircle2, tone: "green" }
  ], []);

  const openTodos = useMemo(() => todos.filter((todo) => todo.status !== "fatta"), [todos]);

  const todoViewOptions = useMemo(() => {
    const weekRange = currentWeekRange();
    const monthRange = currentMonthRange();

    return [
      { id: "tutte", label: "Tutte", count: openTodos.length },
      {
        id: "settimana",
        label: "Questa settimana",
        count: openTodos.filter((todo) => isDateInRange(todo.dueDate, weekRange)).length
      },
      {
        id: "mese",
        label: "Questo mese",
        count: openTodos.filter((todo) => isDateInRange(todo.dueDate, monthRange)).length
      }
    ];
  }, [openTodos]);

  const visibleTodos = useMemo(() => {
    if (todoView === "settimana") {
      const range = currentWeekRange();
      return openTodos.filter((todo) => isDateInRange(todo.dueDate, range));
    }

    if (todoView === "mese") {
      const range = currentMonthRange();
      return openTodos.filter((todo) => isDateInRange(todo.dueDate, range));
    }

    return todos;
  }, [openTodos, todoView, todos]);

  const visibleTodoStatuses = useMemo(() => (
    todoView === "tutte" ? todoStatuses : todoStatuses.filter((status) => status.id !== "fatta")
  ), [todoStatuses, todoView]);

  const todoBoard = useMemo(() => {
    const sorted = [...visibleTodos].sort((a, b) => {
      if (a.status === "fatta" && b.status !== "fatta") return 1;
      if (a.status !== "fatta" && b.status === "fatta") return -1;
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate || new Date(b.createdAt) - new Date(a.createdAt);
    });

    return visibleTodoStatuses.map((status) => ({
      ...status,
      todos: sorted.filter((todo) => todo.status === status.id)
    }));
  }, [visibleTodoStatuses, visibleTodos]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "crea-preventivo", label: "Crea preventivo", icon: ClipboardList },
    { id: "lista-preventivi", label: "Lista preventivi", icon: FileText },
    { id: "ordini", label: "Lista conferme d'ordine", icon: ClipboardList },
    { id: "ddt", label: "Lista DDT", icon: Truck },
    { id: "clienti", label: "Clienti", icon: Users },
    { id: "prodotti", label: "Prodotti", icon: PackagePlus },
    { id: "listini", label: "Listini", icon: Boxes }
  ];

  const currentLinePreview = useMemo(() => {
    if (!lineDraft.product) return null;
    return calculateCommercialLine(lineDraft);
  }, [lineDraft]);

  const quoteDiscountOptions = useMemo(() => ({
    quoteDiscountType: quoteForm.quoteDiscountType,
    quoteDiscountValue: quoteForm.quoteDiscountValue
  }), [quoteForm.quoteDiscountType, quoteForm.quoteDiscountValue]);

  const quoteTotals = useMemo(
    () => calculateDocumentTotals(quoteForm.lines, quoteDiscountOptions),
    [quoteDiscountOptions, quoteForm.lines]
  );

  const quoteTotalsWithDraft = useMemo(() => {
    const lines = currentLinePreview ? [...quoteForm.lines, lineDraft] : quoteForm.lines;
    return calculateDocumentTotals(lines, quoteDiscountOptions);
  }, [currentLinePreview, lineDraft, quoteDiscountOptions, quoteForm.lines]);

  const searchedQuotes = useMemo(() => {
    const term = quoteSearch.trim().toLowerCase();
    const sorted = [...quotes].sort((a, b) => new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt));

    if (!term) return sorted;

    return sorted.filter((quote) => {
      const productsText = (quote.lines || []).map((line) => [
        line.description,
        line.productSnapshot?.name,
        line.productSnapshot?.sku
      ].join(" ")).join(" ");

      return [
        quote.number,
        quote.status,
        quote.rejectionReason,
        quote.customerSnapshot?.name,
        quote.customerSnapshot?.type,
        productsText
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [quoteSearch, quotes]);

  const quoteBoardTabs = useMemo(() => [
    {
      id: "da-inviare",
      label: "Da inviare",
      statuses: ["bozza"],
      tone: "slate"
    },
    {
      id: "inviati",
      label: "Inviati",
      statuses: ["inviato"],
      tone: "blue"
    },
    {
      id: "confermati",
      label: "Confermati",
      statuses: ["convertito", "accettato"],
      tone: "green"
    },
    {
      id: "rifiutati",
      label: "Rifiutati",
      statuses: ["rifiutato"],
      tone: "red"
    }
  ], []);

  const quoteBoardData = useMemo(() => {
    return quoteBoardTabs.map((tab) => {
      const tabQuotes = searchedQuotes.filter((quote) => tab.statuses.includes(quote.status));
      const months = tabQuotes.reduce((groups, quote) => {
        const key = monthLabel(quote.issueDate || quote.createdAt);
        if (!groups[key]) groups[key] = [];
        groups[key].push(quote);
        return groups;
      }, {});

      return {
        ...tab,
        quotes: tabQuotes,
        months
      };
    });
  }, [quoteBoardTabs, searchedQuotes]);

  const selectedQuoteBoard = useMemo(() => (
    quoteBoardData.find((tab) => tab.id === quoteBoardTab) || quoteBoardData[0]
  ), [quoteBoardData, quoteBoardTab]);

  const filteredQuotes = selectedQuoteBoard?.quotes || [];

  const searchedOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();
    const sorted = [...orders].sort((a, b) => new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt));

    if (!term) return sorted;

    return sorted.filter((order) => {
      const productsText = (order.lines || []).map((line) => [
        line.description,
        line.productSnapshot?.name,
        line.productSnapshot?.sku
      ].join(" ")).join(" ");

      return [
        order.number,
        order.status,
        order.customerSnapshot?.name,
        order.customerSnapshot?.type,
        order.quote?.number,
        productsText
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [orderSearch, orders]);

  const orderBoardTabs = useMemo(() => [
    {
      id: "ddt-da-generare",
      label: "DDT da generare",
      statuses: ["bozza", "confermato"],
      tone: "blue"
    },
    {
      id: "ddt-generato",
      label: "DDT generato",
      statuses: ["ddt_generato"],
      tone: "green"
    }
  ], []);

  const orderBoardData = useMemo(() => {
    return orderBoardTabs.map((tab) => {
      const tabOrders = searchedOrders.filter((order) => tab.statuses.includes(order.status));
      const months = tabOrders.reduce((groups, order) => {
        const key = monthLabel(order.issueDate || order.createdAt);
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
        return groups;
      }, {});

      return {
        ...tab,
        orders: tabOrders,
        months
      };
    });
  }, [orderBoardTabs, searchedOrders]);

  const selectedOrderBoard = useMemo(() => (
    orderBoardData.find((tab) => tab.id === orderBoardTab) || orderBoardData[0]
  ), [orderBoardData, orderBoardTab]);

  const filteredOrders = selectedOrderBoard?.orders || [];

  const customerList = useMemo(() => {
    const term = customerListSearch.trim().toLowerCase();
    const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));
    if (!term) return sorted;

    return sorted.filter((customer) => [
      customer.name,
      customer.type,
      customer.email,
      customer.phone,
      customer.vatNumber,
      customer.taxCode,
      customer.billingAddress?.address,
      customer.defaultPriceList?.name
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [customerListSearch, customers]);

  const productList = useMemo(() => {
    const term = productListSearch.trim().toLowerCase();
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (!term) return sorted;

    return sorted.filter((product) => [
      product.name,
      product.sku,
      product.category,
      product.description,
      product.unit
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [productListSearch, products]);

  const productFormFirstPriceList = useMemo(() => {
    if (productForm.priceListOneId) {
      return priceLists.find((list) => list._id === productForm.priceListOneId) || null;
    }

    return priceLists.find((list) => list.customerType === "privato") || priceLists[0] || null;
  }, [priceLists, productForm.priceListOneId]);

  const productFormSecondPriceList = useMemo(() => {
    if (productForm.priceListTwoId === NO_SECOND_PRICE_LIST) return null;

    if (productForm.priceListTwoId) {
      if (productForm.priceListTwoId === productFormFirstPriceList?._id) return null;
      return priceLists.find((list) => list._id === productForm.priceListTwoId) || null;
    }

    return priceLists.find((list) => (
      list._id !== productFormFirstPriceList?._id
      && (list.customerType === "team" || list.name?.toLowerCase() === "team")
    )) || null;
  }, [priceLists, productForm.priceListTwoId, productFormFirstPriceList]);

  const visibleProductPriceLists = useMemo(() => priceLists.slice(0, 2), [priceLists]);

  const ddtList = useMemo(() => {
    const term = ddtSearch.trim().toLowerCase();
    const sorted = [...deliveryNotes].sort((a, b) => new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt));
    if (!term) return sorted;

    return sorted.filter((note) => {
      const productsText = (note.lines || []).map((line) => [
        line.description,
        line.productSnapshot?.name,
        line.productSnapshot?.sku
      ].join(" ")).join(" ");

      return [
        note.number,
        note.status,
        note.reason,
        note.customerSnapshot?.name,
        note.customerSnapshot?.type,
        productsText
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [ddtSearch, deliveryNotes]);

  const selectedListView = useMemo(() => {
    if (selectedPriceListView) {
      return priceLists.find((list) => list._id === selectedPriceListView) || null;
    }

    return priceLists[0] || null;
  }, [priceLists, selectedPriceListView]);

  const priceListProducts = useMemo(() => {
    const term = priceListProductSearch.trim().toLowerCase();
    const items = selectedListView?.items || [];

    return [...products]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((product) => {
        const listItem = items.find((item) => item.product?._id === product._id);
        return {
          product,
          listItem,
          listPrice: listItem?.price ?? null,
          effectivePrice: listItem?.price ?? null
        };
      })
      .filter(({ product }) => {
        if (!term) return true;
        return [
          product.name,
          product.sku,
          product.category,
          product.description,
          product.unit
        ].some((value) => String(value || "").toLowerCase().includes(term));
      });
  }, [priceListProductSearch, products, selectedListView]);

  function handlePriceListChange(priceListId) {
    const nextPriceList = priceLists.find((list) => list._id === priceListId) || suggestedPriceList;

    setQuoteForm((current) => ({
      ...current,
      priceList: priceListId,
      lines: current.lines.map((line) => {
        const item = nextPriceList?.items?.find((price) => price.product?._id === line.product);
        return {
          ...line,
          unitPrice: item?.price ?? "",
          manualUnitPrice: false
        };
      })
    }));

    if (lineDraft.product) {
      const item = nextPriceList?.items?.find((price) => price.product?._id === lineDraft.product);
      setLineDraft((current) => ({
        ...current,
        unitPrice: item?.price ?? "",
        manualUnitPrice: false
      }));
      setLineError(item?.price === undefined || item?.price === null ? "Manca il prezzo nel listino selezionato per il prodotto in riga" : "");
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl overflow-x-hidden bg-slate-50">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Gestionale commerciale</p>
          <h1 className="text-3xl font-bold text-slate-900">Hoon Lab</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("impostazioni")}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition ${
              activeTab === "impostazioni"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Boxes className="h-4 w-4" />
            Impostazioni
          </button>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
            Aggiorna
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">Caricamento Hoon Lab...</div>
      ) : (
        <>
          {activeTab === "dashboard" && (
            <section className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Dashboard operativa</p>
                    <h2 className="text-xl font-bold text-slate-900">To do list</h2>
                  </div>
                  <div className="text-sm font-semibold text-slate-500">
                    {openTodos.length} attivita aperte
                  </div>
                </div>

                <form onSubmit={handleCreateTodo} className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Nota</span>
                    <input
                      value={todoForm.note}
                      onChange={(event) => setTodoForm((current) => ({ ...current, note: event.target.value }))}
                      className="field"
                      placeholder="Scrivi cosa c'e da fare..."
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Entro quando</span>
                    <input
                      type="date"
                      value={todoForm.dueDate}
                      onChange={(event) => setTodoForm((current) => ({ ...current, dueDate: event.target.value }))}
                      className="field"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Stato</span>
                    <select
                      value={todoForm.status}
                      onChange={(event) => setTodoForm((current) => ({ ...current, status: event.target.value }))}
                      className="field"
                    >
                      {todoStatuses.map((status) => (
                        <option key={status.id} value={status.id}>{status.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
                      <Plus className="h-4 w-4" />
                      Aggiungi
                    </button>
                  </div>
                </form>

                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {todoViewOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTodoView(option.id)}
                      className={`inline-flex min-w-[150px] items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                        todoView === option.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        todoView === option.id ? "bg-white/20 text-white" : "bg-white text-slate-600"
                      }`}>
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`grid gap-4 ${todoView === "tutte" ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
                {todoBoard.map((column) => (
                  <TodoColumn
                    key={column.id}
                    column={column}
                    statuses={todoStatuses}
                    onChangeStatus={changeTodoStatus}
                    onDelete={deleteTodo}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === "crea-preventivo" && (
              <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-700" />
                  <h2 className="text-xl font-bold text-slate-900">Nuovo preventivo</h2>
                </div>

                <form onSubmit={handleCreateQuote} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1 text-sm font-semibold text-slate-700">
                      <span>Cliente</span>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            value={customerSearch}
                            onChange={(event) => {
                              setCustomerSearch(event.target.value);
                              setCustomerPickerOpen(true);
                            }}
                            onFocus={() => setCustomerPickerOpen(true)}
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 font-normal"
                            placeholder={selectedCustomer ? selectedCustomer.name : "Cerca cliente..."}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomerPickerOpen(true)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Lista
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerPickerOpen(false);
                            setCustomerCreateOpen(true);
                          }}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                          Crea cliente
                        </button>
                      </div>
                      {selectedCustomer && (
                        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
                          <span>
                            <strong>{selectedCustomer.name}</strong> · {selectedCustomer.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteForm((current) => ({ ...current, customer: "" }));
                              setCustomerSearch("");
                            }}
                            className="font-bold text-blue-700 hover:text-blue-900"
                          >
                            Cambia
                          </button>
                        </div>
                      )}
                    </div>
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      Data
                      <input
                        type="date"
                        value={quoteForm.issueDate}
                        onChange={(event) => setQuoteForm((current) => ({ ...current, issueDate: event.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      Valido fino al
                      <input
                        type="date"
                        value={quoteForm.validUntil}
                        onChange={(event) => setQuoteForm((current) => ({ ...current, validUntil: event.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      Listino da usare
                      <select
                        value={quoteForm.priceList}
                        onChange={(event) => handlePriceListChange(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                      >
                        <option value="">Automatico: {suggestedPriceList?.name || "nessun listino"}</option>
                        {priceLists.map((list) => (
                          <option key={list._id} value={list._id}>
                            {list.name} ({list.customerType})
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                      <span className="block text-xs font-bold uppercase text-slate-500">Listino effettivo</span>
                      <strong>{selectedPriceList?.name || "nessun listino configurato"}</strong>
                      {selectedPriceList && suggestedPriceList && selectedPriceList._id !== suggestedPriceList._id && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">
                          diverso dal suggerito
                        </span>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Suggerito dal cliente: {suggestedPriceList?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Righe</h3>
                    <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.7fr)_80px_110px_130px_110px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          value={productSearch}
                          onChange={(event) => {
                            setProductSearch(event.target.value);
                            setProductSuggestionsOpen(true);
                            setLineDraft((current) => ({ ...current, product: "", unitPrice: "" }));
                          }}
                          onFocus={() => setProductSuggestionsOpen(true)}
                          onBlur={() => window.setTimeout(() => setProductSuggestionsOpen(false), 120)}
                          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3"
                          placeholder="Cerca prodotto..."
                        />
                        {productSuggestionsOpen && (
                          <div className="absolute left-0 right-0 top-11 z-30 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                            {filteredProducts.map((product) => (
                              <button
                                key={product._id}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => updateLineProduct(product._id)}
                                className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-3 text-left hover:bg-blue-50"
                              >
                                <span>
                                  <span className="block font-semibold text-slate-900">{product.name}</span>
                                  <span className="block text-xs text-slate-500">
                                    {[product.sku, product.category].filter(Boolean).join(" · ") || "Prodotto"}
                                  </span>
                                </span>
                                <span className={`shrink-0 text-sm font-bold ${getProductPrice(product._id) === "" ? "text-amber-700" : "text-slate-800"}`}>
                                  {getProductPrice(product._id) === "" ? "Prezzo mancante" : currency(getProductPrice(product._id))}
                                </span>
                              </button>
                            ))}
                            {filteredProducts.length === 0 && (
                              <div className="px-3 py-4 text-sm text-slate-500">Nessun prodotto trovato.</div>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={lineDraft.quantity}
                        onChange={(event) => setLineDraft((current) => ({ ...current, quantity: event.target.value }))}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Qta"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lineDraft.unitPrice}
                        onChange={(event) => {
                          setLineDraft((current) => ({ ...current, unitPrice: event.target.value, manualUnitPrice: true }));
                          if (event.target.value !== "") setLineError("");
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Prezzo"
                      />
                      <select
                        value={lineDraft.discountType}
                        onChange={(event) => setLineDraft((current) => ({
                          ...current,
                          discountType: event.target.value,
                          discountValue: event.target.value === "none" ? 0 : current.discountValue
                        }))}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      >
                        <option value="none">Sconto</option>
                        <option value="percent">Sconto %</option>
                        <option value="fixed">Sconto EUR</option>
                      </select>
                      {lineDraft.discountType !== "none" && (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={lineDraft.discountValue}
                          onChange={(event) => setLineDraft((current) => ({ ...current, discountValue: event.target.value }))}
                          className="rounded-lg border border-slate-300 px-3 py-2"
                          placeholder={lineDraft.discountType === "percent" ? "Percentuale" : "Importo"}
                        />
                      )}
                    </div>
                    {lineError && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                        {lineError}
                      </div>
                    )}
                    <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_160px_auto]">
                      <input
                        value={lineDraft.notes}
                        onChange={(event) => setLineDraft((current) => ({ ...current, notes: event.target.value }))}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Note riga"
                      />
                      <div className="rounded-lg bg-slate-100 px-3 py-2 text-right text-sm">
                        <span className="block text-xs font-semibold text-slate-500">Totale riga</span>
                        <strong className="text-slate-900">{currency(currentLinePreview?.lineTotal || 0)}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={addLine}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                      >
                        <Plus className="h-4 w-4" />
                        Riga
                      </button>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-[minmax(0,1fr)_56px_86px_82px_92px_76px] gap-2 rounded-t-lg bg-slate-100 px-3 py-2 text-xs font-bold uppercase text-slate-600">
                        <span>Prodotto</span>
                        <span className="text-right">Qta</span>
                        <span className="text-right">Prezzo</span>
                        <span className="text-right">Sconto</span>
                        <span className="text-right">Totale</span>
                        <span></span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {quoteForm.lines.map((line, index) => {
                          const product = products.find((item) => item._id === line.product);
                          const calculatedLine = calculateCommercialLine(line);
                          return (
                            <div key={`${line.product}-${index}`} className="px-3 py-3">
                              <div className="grid grid-cols-[minmax(0,1fr)_56px_86px_82px_92px_76px] items-center gap-2 text-sm">
                                <span className="min-w-0 truncate font-semibold text-slate-900">{product?.name || line.description}</span>
                                <span className="text-right text-slate-700">{line.quantity}</span>
                                <span className="text-right text-slate-700">{currency(line.unitPrice)}</span>
                                <span className="text-right text-slate-700">{line.discountType === "none" ? "-" : `${line.discountValue}${line.discountType === "percent" ? "%" : " EUR"}`}</span>
                                <span className="text-right font-bold text-slate-900">{currency(calculatedLine.lineTotal)}</span>
                                <button type="button" onClick={() => removeQuoteLine(index)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                                  Rimuovi
                                </button>
                              </div>
                              {line.notes && (
                                <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  <span className="font-bold uppercase text-slate-500">Note: </span>{line.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {quoteForm.lines.length === 0 && (
                          <p className="px-3 py-4 text-sm text-slate-500">Nessuna riga aggiunta.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Sconto generale</h3>
                    <div className="grid gap-3 md:grid-cols-[220px_160px_1fr]">
                      <select
                        value={quoteForm.quoteDiscountType}
                        onChange={(event) => setQuoteForm((current) => ({
                          ...current,
                          quoteDiscountType: event.target.value,
                          quoteDiscountValue: event.target.value === "none" ? 0 : current.quoteDiscountValue
                        }))}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="none">Nessuno sconto generale</option>
                        <option value="percent">Sconto generale %</option>
                        <option value="fixed">Sconto generale EUR</option>
                      </select>
                      {quoteForm.quoteDiscountType !== "none" && (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={quoteForm.quoteDiscountValue}
                          onChange={(event) => setQuoteForm((current) => ({ ...current, quoteDiscountValue: event.target.value }))}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                          placeholder={quoteForm.quoteDiscountType === "percent" ? "Percentuale" : "Importo"}
                        />
                      )}
                      <div className="rounded-lg bg-white px-4 py-2 text-sm text-slate-700">
                        <span className="block text-xs font-semibold uppercase text-slate-500">Sconto totale calcolato</span>
                        <strong>{currency(quoteTotalsWithDraft.discountTotal)}</strong>
                      </div>
                    </div>
                  </div>

                  <LiveTotals
                    title="Totale preventivo"
                    totals={quoteTotals}
                    previewTotals={quoteTotalsWithDraft}
                    hasDraft={Boolean(currentLinePreview)}
                  />

                  <textarea
                    value={quoteForm.notes}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Note generali del preventivo"
                  />

                  <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
                    <Send className="h-4 w-4" />
                    Salva preventivo
                  </button>
                </form>
              </section>
          )}

          {activeTab === "lista-preventivi" && (
              <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-700" />
                    <h2 className="text-xl font-bold text-slate-900">Lista preventivi</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">{searchedQuotes.length}</span>
                </div>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      value={quoteSearch}
                      onChange={(event) => setQuoteSearch(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                      placeholder="Cerca cliente, prodotto o motivo..."
                    />
                  </div>
                </div>

                <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                  {quoteBoardData.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setQuoteBoardTab(tab.id)}
                      className={`min-w-[180px] flex-1 rounded-lg border px-4 py-3 text-left transition ${
                        quoteBoardTab === tab.id
                          ? quoteBoardTabClass(tab.tone, true)
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <span className="block text-sm font-bold">{tab.label}</span>
                      <span className="mt-1 block text-2xl font-bold">{tab.quotes.length}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {Object.entries(selectedQuoteBoard?.months || {}).map(([month, monthQuotes], index) => (
                    <QuoteMonthAccordion
                      key={month}
                      month={month}
                      quotes={monthQuotes}
                      defaultOpen={index === 0}
                      onChangeStatus={changeQuoteStatus}
                      onConvert={convertQuote}
                    />
                  ))}
                  {filteredQuotes.length === 0 && (
                    <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Nessun preventivo in questa scheda.</p>
                  )}
                </div>
              </section>
          )}

          {activeTab === "impostazioni" && (
            <div className="space-y-6">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-blue-700" />
                  <h2 className="text-xl font-bold text-slate-900">Impostazioni</h2>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "statistiche", label: "Statistiche", icon: BarChart3 },
                    { id: "setup", label: "Setup", icon: Boxes },
                    { id: "export", label: "Export", icon: Download }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSettingsTab(item.id)}
                        className={`inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                          settingsTab === item.id
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {settingsTab === "statistiche" && stats && <StatsDashboard stats={stats} />}

              {settingsTab === "export" && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-slate-900">Export Excel</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["quotes", "Elenco preventivi"],
                    ["quote-lines", "Righe preventivo"],
                    ["orders", "Conferme ordine"],
                    ["ddt", "DDT"],
                    ["sold-products", "Prodotti venduti"],
                    ["customers-report", "Report clienti"]
                  ].map(([type, label]) => (
                    <Link key={type} href={`/api/hoon-lab/export/${type}`} className="inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                      {label}
                      <Download className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </section>
              )}

              {settingsTab === "setup" && (
              <>
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1">
                  <h2 className="text-xl font-bold text-slate-900">Impostazioni documenti</h2>
                  <p className="text-sm text-slate-500">Intestazione e nota usate nei PDF di preventivi, conferme e DDT.</p>
                </div>
                <form onSubmit={handleSaveSettings} className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                    Nome azienda
                    <input
                      value={settingsForm.companyName}
                      onChange={(event) => setSettingsForm((current) => ({ ...current, companyName: event.target.value }))}
                      className="field font-normal"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                    Titolo nota preventivo
                    <input
                      value={settingsForm.quoteNoteTitle}
                      onChange={(event) => setSettingsForm((current) => ({ ...current, quoteNoteTitle: event.target.value }))}
                      className="field font-normal"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                    Intestazione azienda
                    <textarea
                      value={settingsForm.companyHeader}
                      onChange={(event) => setSettingsForm((current) => ({ ...current, companyHeader: event.target.value }))}
                      className="field min-h-40 font-normal"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                    Nota sempre visibile sui preventivi
                    <textarea
                      value={settingsForm.quoteNote}
                      onChange={(event) => setSettingsForm((current) => ({ ...current, quoteNote: event.target.value }))}
                      className="field min-h-40 font-normal"
                    />
                  </label>
                  <div className="lg:col-span-2">
                    <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                      Salva impostazioni documenti
                    </button>
                  </div>
                </form>
              </section>
              <div className="grid gap-6 xl:grid-cols-3">
              <SetupPanel title="Clienti" icon={Users} onSubmit={handleCreateCustomer} submitLabel="Crea cliente">
                <CustomerFormFields customerForm={customerForm} setCustomerForm={setCustomerForm} />
              </SetupPanel>

              <SetupPanel title="Prodotti" icon={PackagePlus} onSubmit={handleCreateProduct} submitLabel="Crea prodotto">
                <input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="Nome prodotto" />
                <input value={productForm.sku} onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))} className="field" placeholder="SKU" />
                <p className="text-xs font-semibold text-slate-500">Prezzi iniziali sui listini</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_130px]">
                  <select
                    value={productForm.priceListOneId || productFormFirstPriceList?._id || ""}
                    onChange={(event) => setProductForm((current) => ({
                      ...current,
                      priceListOneId: event.target.value,
                      priceListTwoId: current.priceListTwoId === event.target.value ? "" : current.priceListTwoId,
                      priceListTwoPrice: current.priceListTwoId === event.target.value ? "" : current.priceListTwoPrice
                    }))}
                    className="field"
                  >
                    {priceLists.map((list) => <option key={list._id} value={list._id}>{list.name}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" value={productForm.priceListOnePrice} onChange={(event) => setProductForm((current) => ({ ...current, priceListOnePrice: event.target.value }))} className="field" placeholder={`Prezzo ${productFormFirstPriceList?.name || "listino"}`} />
                </div>
                <div className={`grid gap-2 ${productFormSecondPriceList ? "sm:grid-cols-[1fr_130px]" : ""}`}>
                  <select
                    value={productFormSecondPriceList?._id || NO_SECOND_PRICE_LIST}
                    onChange={(event) => setProductForm((current) => ({
                      ...current,
                      priceListTwoId: event.target.value,
                      priceListTwoPrice: event.target.value === NO_SECOND_PRICE_LIST ? "" : current.priceListTwoPrice
                    }))}
                    className="field"
                  >
                    <option value={NO_SECOND_PRICE_LIST}>Nessun secondo listino</option>
                    {priceLists
                      .filter((list) => list._id !== productFormFirstPriceList?._id)
                      .map((list) => <option key={list._id} value={list._id}>{list.name}</option>)}
                  </select>
                  {productFormSecondPriceList && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.priceListTwoPrice}
                      onChange={(event) => setProductForm((current) => ({ ...current, priceListTwoPrice: event.target.value }))}
                      className="field"
                      placeholder={`Prezzo ${productFormSecondPriceList.name}`}
                    />
                  )}
                </div>
                <input value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} className="field" placeholder="Categoria" />
                <input value={productForm.unit} onChange={(event) => setProductForm((current) => ({ ...current, unit: event.target.value }))} className="field" placeholder="Unita" />
              </SetupPanel>

              <SetupPanel title="Crea listino" icon={Boxes} onSubmit={handleCreatePriceList} submitLabel="Crea listino">
                <input value={priceListForm.name} onChange={(event) => setPriceListForm((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="Nome listino" />
                <p className="text-xs font-semibold text-slate-500">Tipo cliente collegato: serve solo per proporre automaticamente questo listino quando scegli un cliente.</p>
                <select value={priceListForm.customerType} onChange={(event) => setPriceListForm((current) => ({ ...current, customerType: event.target.value }))} className="field">
                  <option value="privato">Clienti privati</option>
                  <option value="team">Team</option>
                  <option value="azienda">Aziende</option>
                  <option value="custom">Manuale / personalizzato</option>
                </select>
              </SetupPanel>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">Lista clienti</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">{customers.length} clienti</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Ragione sociale</th>
                        <th className="px-3 py-2">Via</th>
                        <th className="px-3 py-2">Partita IVA</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Listino default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer._id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{customer.name}</td>
                          <td className="px-3 py-3 text-slate-700">{customer.billingAddress?.address || "-"}</td>
                          <td className="px-3 py-3 text-slate-700">{customer.vatNumber || "-"}</td>
                          <td className="px-3 py-3 capitalize text-slate-700">{customer.type}</td>
                          <td className="px-3 py-3 text-slate-700">{customer.defaultPriceList?.name || "-"}</td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr>
                          <td className="px-3 py-4 text-slate-500" colSpan={5}>Nessun cliente inserito.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
              </div>
              </>
              )}
            </div>
          )}

          {activeTab === "clienti" && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Lista clienti</h2>
                  <p className="text-sm text-slate-500">{customerList.length} clienti trovati</p>
                </div>
                <div className="relative w-full md:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={customerListSearch}
                    onChange={(event) => setCustomerListSearch(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                    placeholder="Cerca cliente..."
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Ragione sociale</th>
                      <th className="px-3 py-2">Via</th>
                      <th className="px-3 py-2">Partita IVA</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Listino default</th>
                      <th className="px-3 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerList.map((customer) => (
                      <tr key={customer._id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-semibold text-slate-900">{customer.name}</td>
                        <td className="px-3 py-3 text-slate-700">{customer.billingAddress?.address || "-"}</td>
                        <td className="px-3 py-3 text-slate-700">{customer.vatNumber || "-"}</td>
                        <td className="px-3 py-3 capitalize text-slate-700">{customer.type}</td>
                        <td className="px-3 py-3 text-slate-700">{customer.defaultPriceList?.name || "-"}</td>
                        <td className="px-3 py-3 text-slate-500">{customer.notes || "-"}</td>
                      </tr>
                    ))}
                    {customerList.length === 0 && (
                      <tr>
                        <td className="px-3 py-5 text-slate-500" colSpan={6}>Nessun cliente trovato.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "prodotti" && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Lista prodotti</h2>
                  <p className="text-sm text-slate-500">{productList.length} prodotti trovati</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                  <button
                    type="button"
                    onClick={handleImportProducts}
                    disabled={importingProducts}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {importingProducts ? "Import..." : "Importa XLSX"}
                  </button>
                  <div className="relative w-full md:w-80">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      value={productListSearch}
                      onChange={(event) => setProductListSearch(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                      placeholder="Cerca prodotto..."
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Prodotto</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Categoria</th>
                      <th className="px-3 py-2">Unita</th>
                      <th className="px-3 py-2 text-right">{visibleProductPriceLists[0]?.name || "Listino principale"}</th>
                      <th className="px-3 py-2 text-right">{visibleProductPriceLists[1]?.name || "Secondo listino"}</th>
                      <th className="px-3 py-2">Descrizione</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productList.map((product) => {
                      const firstListPrice = visibleProductPriceLists[0]
                        ? getPriceListProductPrice(product._id, visibleProductPriceLists[0]._id)
                        : null;
                      const secondListPrice = visibleProductPriceLists[1]
                        ? getPriceListProductPrice(product._id, visibleProductPriceLists[1]._id)
                        : null;

                      return (
                        <tr key={product._id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{product.name}</td>
                          <td className="px-3 py-3 text-slate-700">{product.sku || "-"}</td>
                          <td className="px-3 py-3 text-slate-700">{product.category || "-"}</td>
                          <td className="px-3 py-3 text-slate-700">{product.unit || "pz"}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900">
                            {firstListPrice === null ? "-" : currency(firstListPrice)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900">
                            {secondListPrice === null ? "-" : currency(secondListPrice)}
                          </td>
                          <td className="px-3 py-3 text-slate-500">{product.description || "-"}</td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Elimina
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {productList.length === 0 && (
                      <tr>
                        <td className="px-3 py-5 text-slate-500" colSpan={8}>Nessun prodotto trovato.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "listini" && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 rounded-lg bg-slate-50 p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.4fr)] xl:items-end">
                  <div>
                    <p className="text-sm font-semibold uppercase text-blue-700">Gestione prezzi</p>
                    <h2 className="text-2xl font-bold text-slate-900">Vista listino</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedListView ? `${priceListProducts.length} prodotti in vista` : "Nessun listino disponibile"}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[260px_1fr_auto] md:items-end">
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      Listino
                      <select
                        value={selectedListView?._id || ""}
                        onChange={(event) => {
                          setSelectedPriceListView(event.target.value);
                          setPriceItemForm({ priceList: event.target.value, product: "", price: "" });
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                      >
                        {priceLists.map((list) => (
                          <option key={list._id} value={list._id}>
                            {list.name} ({list.customerType})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                      Cerca prodotto
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          value={priceListProductSearch}
                          onChange={(event) => setPriceListProductSearch(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 font-normal"
                          placeholder="Nome, SKU o categoria..."
                        />
                      </div>
                    </label>
                    {selectedListView && (
                      <button
                        type="button"
                        onClick={() => handleDeletePriceList(selectedListView)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Elimina listino
                      </button>
                    )}
                  </div>
                </div>

                {selectedListView && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <CompactMetric label="Listino" value={selectedListView.name} />
                    <CompactMetric label="Tipo" value={selectedListView.customerType} />
                    <CompactMetric label="Prezzi impostati" value={(selectedListView.items || []).length} />
                    <CompactMetric label="Prodotti totali" value={products.length} />
                  </div>
                )}
              </div>

              {selectedListView && (
                <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Aggiungi o modifica prezzo</h3>
                  <form onSubmit={handleAddPrice} className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                    <select
                      value={priceItemForm.product}
                      onChange={(event) => {
                        const productId = event.target.value;
                        const existing = selectedListView.items?.find((item) => item.product?._id === productId);
                        setPriceItemForm({
                          priceList: selectedListView._id,
                          product: productId,
                          price: existing?.price ?? ""
                        });
                      }}
                      className="field bg-white"
                    >
                      <option value="">Seleziona prodotto</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>{product.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceItemForm.price}
                      onChange={(event) => setPriceItemForm((current) => ({ ...current, priceList: selectedListView._id, price: event.target.value }))}
                      className="field bg-white"
                      placeholder="Prezzo"
                    />
                    <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
                      Salva prezzo
                    </button>
                  </form>
                </section>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Prodotto</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Categoria</th>
                      <th className="px-3 py-2 text-right">Prezzo listino</th>
                      <th className="px-3 py-2">Stato</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceListProducts.map(({ product, listItem, listPrice }) => (
                      <tr key={product._id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-semibold text-slate-900">{product.name}</td>
                        <td className="px-3 py-3 text-slate-700">{product.sku || "-"}</td>
                        <td className="px-3 py-3 text-slate-700">{product.category || "-"}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-900">
                          {listPrice === null ? "-" : currency(listPrice)}
                        </td>
                        <td className="px-3 py-3">
                          {listItem ? (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Prezzo listino</span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Manca prezzo</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setPriceItemForm({
                              priceList: selectedListView._id,
                              product: product._id,
                              price: listPrice ?? ""
                            })}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Modifica
                          </button>
                        </td>
                      </tr>
                    ))}
                    {priceListProducts.length === 0 && (
                      <tr>
                        <td className="px-3 py-5 text-slate-500" colSpan={6}>Nessun prodotto trovato per questo listino.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "ordini" && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-700" />
                  <h2 className="text-xl font-bold text-slate-900">Conferme ordine</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">{searchedOrders.length}</span>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                    placeholder="Cerca conferma, cliente o prodotto..."
                  />
                </div>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                {orderBoardData.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderBoardTab(tab.id)}
                    className={`min-w-[210px] flex-1 rounded-lg border px-4 py-3 text-left transition ${
                      orderBoardTab === tab.id
                        ? quoteBoardTabClass(tab.tone, true)
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                    }`}
                  >
                    <span className="block text-sm font-bold">{tab.label}</span>
                    <span className="mt-1 block text-2xl font-bold">{tab.orders.length}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {Object.entries(selectedOrderBoard?.months || {}).map(([month, monthOrders], index) => (
                  <OrderMonthAccordion
                    key={month}
                    month={month}
                    orders={monthOrders}
                    defaultOpen={index === 0}
                    onGenerateDdt={generateDdt}
                  />
                ))}
                {filteredOrders.length === 0 && (
                  <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Nessuna conferma ordine in questa scheda.</p>
                )}
              </div>
            </section>
          )}

          {activeTab === "ddt" && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Lista DDT</h2>
                  <p className="text-sm text-slate-500">{ddtList.length} documenti trovati</p>
                </div>
                <div className="relative w-full md:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={ddtSearch}
                    onChange={(event) => setDdtSearch(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                    placeholder="Cerca DDT, cliente o prodotto..."
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Numero</th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Stato</th>
                      <th className="px-3 py-2">Causale</th>
                      <th className="px-3 py-2 text-right">Righe</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ddtList.map((ddt) => (
                      <tr key={ddt._id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-semibold text-slate-900">{ddt.number}</td>
                        <td className="px-3 py-3 text-slate-700">{formatDate(ddt.issueDate || ddt.createdAt)}</td>
                        <td className="px-3 py-3 text-slate-700">{ddt.customerSnapshot?.name || "-"}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase text-green-700">{deliveryStatusLabel(ddt.status)}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{ddt.reason || "-"}</td>
                        <td className="px-3 py-3 text-right text-slate-700">{ddt.lines?.length || 0}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/api/hoon-lab/pdf/delivery_note/${ddt._id}`} target="_blank" className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Anteprima PDF</Link>
                            <Link href={`/api/hoon-lab/pdf/delivery_note/${ddt._id}?download=1`} download className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100">Download PDF</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {ddtList.length === 0 && (
                      <tr>
                        <td className="px-3 py-5 text-slate-500" colSpan={7}>Nessun DDT trovato.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </>
      )}

      {customerPickerOpen && (
        <CustomerPickerModal
          customers={filteredCustomers}
          selectedCustomerId={quoteForm.customer}
          search={customerSearch}
          onSearch={setCustomerSearch}
          onSelect={selectQuoteCustomer}
          onClose={() => setCustomerPickerOpen(false)}
        />
      )}

      {customerCreateOpen && (
        <CustomerCreateModal
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          onSubmit={(event) => handleCreateCustomer(event, { closeModal: true, selectAfterCreate: true })}
          onCancel={cancelCustomerCreate}
        />
      )}

      <style jsx>{`
        .field {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
        }
      `}</style>
    </div>
  );
}

function TodoColumn({ column, statuses, onChangeStatus, onDelete }) {
  const Icon = column.icon;
  const toneClasses = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700"
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${toneClasses[column.tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">{column.label}</h3>
            <p className="text-xs font-semibold text-slate-500">{column.todos.length} attivita</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {column.todos.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-medium text-slate-500">
            Nessuna attivita in questa scheda.
          </div>
        )}

        {column.todos.map((todo) => (
          <TodoCard
            key={todo._id}
            todo={todo}
            statuses={statuses}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function TodoCard({ todo, statuses, onChangeStatus, onDelete }) {
  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
  const overdue = dueDate && todo.status !== "fatta" && dueDate < new Date(new Date().toDateString());

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="min-w-0 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-900">{todo.note}</p>
        <button
          type="button"
          onClick={() => onDelete(todo)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700"
          aria-label="Elimina attivita"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 grid gap-1 text-xs font-semibold text-slate-500">
        <span className={overdue ? "text-red-700" : ""}>
          Entro: {todo.dueDate ? formatDate(todo.dueDate) : "senza scadenza"}
        </span>
        <span>Ultimo cambio stato: {formatDateTime(todo.statusChangedAt || todo.updatedAt)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {statuses.map((status) => {
          const active = todo.status === status.id;
          return (
            <button
              key={status.id}
              type="button"
              onClick={() => onChangeStatus(todo, status.id)}
              disabled={active}
              className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
              }`}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function CustomerFormFields({ customerForm, setCustomerForm, stacked = false }) {
  const wrapField = (label, field) => {
    if (!stacked) return <div key={label}>{field}</div>;

    return (
      <label key={label} className="grid gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        {field}
      </label>
    );
  };

  const fields = [
    wrapField("Tipo cliente", (
      <select value={customerForm.type} onChange={(event) => setCustomerForm((current) => ({ ...current, type: event.target.value }))} className="field">
        <option value="privato">Privato</option>
        <option value="team">Team</option>
        <option value="azienda">Azienda</option>
      </select>
    ))
  ];

  if (customerForm.type === "privato") {
    fields.push(
      wrapField("Nome", <input value={customerForm.firstName} onChange={(event) => setCustomerForm((current) => ({ ...current, firstName: event.target.value }))} className="field" placeholder="Nome" />),
      wrapField("Cognome", <input value={customerForm.lastName} onChange={(event) => setCustomerForm((current) => ({ ...current, lastName: event.target.value }))} className="field" placeholder="Cognome" />),
      wrapField("Via", (
        <input
            value={customerForm.billingAddress.address}
            onChange={(event) => setCustomerForm((current) => ({
              ...current,
              billingAddress: {
                ...current.billingAddress,
                address: event.target.value
              }
            }))}
            className="field"
            placeholder="Via"
          />
      )),
      wrapField("Codice fiscale", <input value={customerForm.taxCode} onChange={(event) => setCustomerForm((current) => ({ ...current, taxCode: event.target.value }))} className="field" placeholder="Codice fiscale" />)
    );
  }

  if (customerForm.type === "azienda") {
    fields.push(
      wrapField("Ragione sociale", <input value={customerForm.name} onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="Ragione sociale" />),
      wrapField("Via", (
        <input
            value={customerForm.billingAddress.address}
            onChange={(event) => setCustomerForm((current) => ({
              ...current,
              billingAddress: {
                ...current.billingAddress,
                address: event.target.value
              }
            }))}
            className="field"
            placeholder="Via"
          />
      )),
      wrapField("Partita IVA", <input value={customerForm.vatNumber} onChange={(event) => setCustomerForm((current) => ({ ...current, vatNumber: event.target.value }))} className="field" placeholder="Partita IVA" />)
    );
  }

  if (customerForm.type === "team") {
    fields.push(
      wrapField("Nome team", <input value={customerForm.name} onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="Nome team" />),
      wrapField("Partita IVA", <input value={customerForm.vatNumber} onChange={(event) => setCustomerForm((current) => ({ ...current, vatNumber: event.target.value }))} className="field" placeholder="Partita IVA" />)
    );
  }

  return stacked ? <div className="grid gap-3">{fields}</div> : <>{fields}</>;
}

function CustomerCreateModal({ customerForm, setCustomerForm, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Crea cliente</h2>
            <p className="text-sm text-slate-500">Il cliente verra selezionato nel preventivo dopo il salvataggio.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            aria-label="Annulla creazione cliente"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <CustomerFormFields customerForm={customerForm} setCustomerForm={setCustomerForm} stacked />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Annulla
            </button>
            <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
              Salva cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerPickerModal({ customers, selectedCustomerId, search, onSearch, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="flex max-h-[86vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Seleziona cliente</h2>
            <p className="text-sm text-slate-500">{customers.length} risultati</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            aria-label="Chiudi selezione clienti"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm"
              placeholder="Cerca per nome, tipo, email, telefono, P.IVA o codice fiscale"
            />
          </div>
        </div>

        <div className="overflow-auto p-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Telefono</th>
                <th className="px-3 py-2">Listino</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const selected = selectedCustomerId === customer._id;
                return (
                  <tr key={customer._id} className={`border-b border-slate-100 ${selected ? "bg-blue-50" : ""}`}>
                    <td className="px-3 py-3 font-semibold text-slate-900">{customer.name}</td>
                    <td className="px-3 py-3 capitalize text-slate-700">{customer.type}</td>
                    <td className="px-3 py-3 text-slate-700">{customer.email || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{customer.phone || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{customer.defaultPriceList?.name || "-"}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(customer._id)}
                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                          selected
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {selected ? "Selezionato" : "Scegli"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>
                    Nessun cliente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SetupPanel({ title, icon: Icon, onSubmit, submitLabel, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-700" />
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        {children}
        <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">{submitLabel}</button>
      </form>
    </section>
  );
}

function DocumentList({ title, items, renderActions }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{item.number}</p>
                <p className="text-sm text-slate-600">{item.customerSnapshot?.name}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{item.status}</span>
            </div>
            {item.total !== undefined && <p className="mt-3 text-xl font-bold text-slate-900">{currency(item.total)}</p>}
            <div className="mt-3 flex flex-wrap gap-2">{renderActions(item)}</div>
          </div>
        ))}
        {items.length === 0 && <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Nessun documento presente.</p>}
      </div>
    </section>
  );
}

function quoteBoardTabClass(tone, active) {
  if (!active) return "";

  const classes = {
    slate: "border-slate-300 bg-slate-900 text-white shadow-sm",
    blue: "border-blue-200 bg-blue-50 text-blue-800 shadow-sm",
    green: "border-green-200 bg-green-50 text-green-800 shadow-sm",
    red: "border-red-200 bg-red-50 text-red-800 shadow-sm"
  };

  return classes[tone] || classes.slate;
}

function QuoteMonthAccordion({ month, quotes, defaultOpen, onChangeStatus, onConvert }) {
  const [open, setOpen] = useState(defaultOpen);
  const total = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
      >
        <div>
          <h3 className="text-sm font-bold capitalize text-slate-900">{month}</h3>
          <p className="text-xs font-semibold text-slate-500">
            {quotes.length} preventivi · {currency(total)}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 p-3">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote._id}
              quote={quote}
              onChangeStatus={onChangeStatus}
              onConvert={onConvert}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderMonthAccordion({ month, orders, defaultOpen, onGenerateDdt }) {
  const [open, setOpen] = useState(defaultOpen);
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
      >
        <div>
          <h3 className="text-sm font-bold capitalize text-slate-900">{month}</h3>
          <p className="text-xs font-semibold text-slate-500">
            {orders.length} conferme · {currency(total)}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 p-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onGenerateDdt={onGenerateDdt} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onGenerateDdt }) {
  const ddtGenerated = order.status === "ddt_generato";
  const products = (order.lines || [])
    .map((line) => line.productSnapshot?.name || line.description)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">{order.number}</p>
          <p className="truncate text-sm text-slate-600">{order.customerSnapshot?.name || "-"}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(order.issueDate || order.createdAt)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${
          ddtGenerated ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
        }`}>
          {ddtGenerated ? "DDT generato" : "DDT da generare"}
        </span>
      </div>
      {products.length > 0 && (
        <p className="mt-3 line-clamp-2 text-xs text-slate-500">{products.join(" · ")}</p>
      )}
      <p className="mt-3 text-2xl font-bold text-slate-900">{currency(order.total)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/api/hoon-lab/pdf/order_confirmation/${order._id}`} target="_blank" className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Anteprima PDF</Link>
        <Link href={`/api/hoon-lab/pdf/order_confirmation/${order._id}?download=1`} download className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100">Download PDF</Link>
        {ddtGenerated ? (
          <span className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">DDT generato</span>
        ) : (
          <button onClick={() => onGenerateDdt(order)} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800">Genera DDT</button>
        )}
      </div>
    </div>
  );
}

function deliveryStatusLabel(status) {
  if (status === "bozza" || status === "emesso") return "Emesso";
  if (status === "annullato") return "Annullato";
  return status || "Emesso";
}

function QuoteCard({ quote, onChangeStatus, onConvert }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(quote.rejectionReason || "");
  const products = (quote.lines || [])
    .map((line) => line.productSnapshot?.name || line.description)
    .filter(Boolean)
    .slice(0, 3);
  const statusClass = {
    bozza: "bg-slate-100 text-slate-700",
    inviato: "bg-blue-50 text-blue-700",
    accettato: "bg-green-50 text-green-700",
    rifiutato: "bg-red-50 text-red-700",
    scaduto: "bg-amber-50 text-amber-700",
    convertito: "bg-violet-50 text-violet-700"
  }[quote.status] || "bg-slate-100 text-slate-700";

  function submitReject() {
    const reason = rejectReason.trim();
    if (!reason) return;
    onChangeStatus(quote, "rifiutato", { rejectionReason: reason });
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">{quote.number}</p>
          <p className="truncate text-sm text-slate-600">{quote.customerSnapshot?.name || "-"}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(quote.issueDate || quote.createdAt)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${statusClass}`}>{quote.status}</span>
      </div>
      {products.length > 0 && (
        <p className="mt-3 line-clamp-2 text-xs text-slate-500">{products.join(" · ")}</p>
      )}
      {quote.rejectionReason && (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
          <span className="font-bold">Motivo rifiuto:</span> {quote.rejectionReason}
        </div>
      )}
      <p className="mt-3 text-2xl font-bold text-slate-900">{currency(quote.total)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/api/hoon-lab/pdf/quote/${quote._id}`} target="_blank" className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Anteprima PDF</Link>
        <Link href={`/api/hoon-lab/pdf/quote/${quote._id}?download=1`} download className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Download PDF</Link>
        {quote.status === "bozza" && (
          <button onClick={() => onChangeStatus(quote, "inviato")} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Conferma invio</button>
        )}
        {quote.status === "inviato" && (
          <button onClick={() => onConvert(quote)} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50">Accettato</button>
        )}
        {quote.status === "inviato" && (
          <button onClick={() => setRejectOpen((current) => !current)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Rifiutato</button>
        )}
        {quote.status === "accettato" && (
          <button onClick={() => onConvert(quote)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Completa conferma d'ordine</button>
        )}
      </div>
      {rejectOpen && (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="min-h-20 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
            placeholder="Scrivi perche il preventivo e stato rifiutato"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setRejectOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Annulla</button>
            <button
              type="button"
              onClick={submitReject}
              disabled={!rejectReason.trim()}
              className="rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              Salva rifiuto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function CompactMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatsDashboard({ stats }) {
  const acceptedShare = stats.quotesTotalValue
    ? Math.min(100, Math.round((stats.acceptedQuotesValue / stats.quotesTotalValue) * 100))
    : 0;
  const monthly = stats.analytics?.monthly || [];
  const annual = stats.analytics?.annual || [];
  const comparisons = stats.analytics?.comparisons || {};

  const kpis = [
    ["Preventivi", stats.quotesCreated],
    ["Valore preventivi", currency(stats.quotesTotalValue)],
    ["Valore accettato", currency(stats.acceptedQuotesValue)],
    ["Conversione", percent(stats.conversionRate)],
    ["Media preventivo", currency(stats.averageQuoteValue)],
    ["Sconti totali", currency(stats.totalDiscounts)]
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ComparisonCard
          label="Mese vs precedente"
          current={comparisons.currentMonth?.acceptedValue}
          previous={comparisons.previousMonth?.acceptedValue}
          currentLabel={comparisons.currentMonth?.label}
          previousLabel={comparisons.previousMonth?.label}
        />
        <ComparisonCard
          label="Anno vs precedente"
          current={comparisons.currentYear?.acceptedValue}
          previous={comparisons.previousYear?.acceptedValue}
          currentLabel={comparisons.currentYear?.label}
          previousLabel={comparisons.previousYear?.label}
        />
        <ComparisonCard
          label="Preventivi mese"
          current={comparisons.currentMonth?.quotes}
          previous={comparisons.previousMonth?.quotes}
          currentLabel={comparisons.currentMonth?.label}
          previousLabel={comparisons.previousMonth?.label}
          asCurrency={false}
        />
        <ComparisonCard
          label="Conversione anno"
          current={comparisons.currentYear?.conversionRate}
          previous={comparisons.previousYear?.conversionRate}
          currentLabel={comparisons.currentYear?.label}
          previousLabel={comparisons.previousYear?.label}
          asPercent
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Andamento mensile</h2>
            <p className="text-sm text-slate-500">Ultimi 12 mesi con confronto sullo stesso mese dell'anno precedente.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip formatter={(value, name) => [currency(value), name]} />
                <Legend />
                <Line type="monotone" dataKey="quoteValue" name="Preventivi" stroke="#2563eb" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="acceptedValue" name="Accettato" stroke="#16a34a" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="previousAcceptedValue" name="Accettato anno prima" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Preventivi per mese</h2>
            <p className="text-sm text-slate-500">Creati, confermati e rifiutati.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="quotes" name="Creati" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="accepted" name="Confermati" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rifiutati" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Confronto annuale</h2>
          <p className="text-sm text-slate-500">Valori confermati, preventivi e tasso conversione per anno.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annual} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip formatter={(value, name) => [name === "Conversione" ? percent(value) : currency(value), name]} />
                <Legend />
                <Bar dataKey="quoteValue" name="Preventivi" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="acceptedValue" name="Confermato" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Anno</th>
                  <th className="px-3 py-2 text-right">Preventivi</th>
                  <th className="px-3 py-2 text-right">Confermato</th>
                  <th className="px-3 py-2 text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {annual.map((year) => (
                  <tr key={year.key} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-bold text-slate-900">{year.label}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{year.quotes}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{currency(year.acceptedValue)}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{percent(year.conversionRate)}</td>
                  </tr>
                ))}
                {annual.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-slate-500">Nessun dato annuale disponibile.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Andamento commerciale</h2>
          <div className="mt-5 space-y-5">
            <ProgressMetric label="Tasso conversione" value={Math.round(Number(stats.conversionRate || 0) * 100)} suffix="%" />
            <ProgressMetric label="Valore accettato su totale" value={acceptedShare} suffix="%" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Preventivi aperti</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{stats.quotesCreated}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Valore medio</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{currency(stats.averageQuoteValue)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Valori economici</h2>
          <div className="mt-5 space-y-4">
            <ValueBar label="Totale preventivi" value={stats.quotesTotalValue} max={Math.max(stats.quotesTotalValue, stats.acceptedQuotesValue, 1)} />
            <ValueBar label="Accettati" value={stats.acceptedQuotesValue} max={Math.max(stats.quotesTotalValue, stats.acceptedQuotesValue, 1)} />
            <ValueBar label="Sconti" value={stats.totalDiscounts} max={Math.max(stats.quotesTotalValue, stats.totalDiscounts, 1)} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarRank title="Prodotti piu venduti" rows={stats.topProducts} valueKey="total" secondaryKey="quantity" />
        <BarRank title="Clienti migliori" rows={stats.topCustomers} valueKey="total" />
      </div>
    </div>
  );
}

function ComparisonCard({ label, current, previous, currentLabel, previousLabel, asCurrency = true, asPercent = false }) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  const delta = previousValue ? (currentValue - previousValue) / previousValue : null;
  const positive = Number(delta || 0) >= 0;
  const formatter = (value) => {
    if (asPercent) return percent(value);
    if (asCurrency) return currency(value);
    return Number(value || 0).toLocaleString("it-IT");
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{formatter(currentValue)}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="text-slate-500">{currentLabel || "Periodo corrente"} vs {previousLabel || "precedente"}</span>
        <span className={`rounded-full px-2 py-1 ${positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {delta === null ? "n.d." : `${positive ? "+" : ""}${Math.round(delta * 100)}%`}
        </span>
      </div>
    </section>
  );
}

function ProgressMetric({ label, value, suffix = "" }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{safeValue}{suffix}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function ValueBar({ label, value, max }) {
  const width = Math.max(3, Math.min(100, (Number(value || 0) / Number(max || 1)) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{currency(value)}</span>
      </div>
      <div className="h-9 overflow-hidden rounded-lg bg-slate-100">
        <div className="flex h-full items-center rounded-lg bg-slate-900 px-3 text-xs font-bold text-white" style={{ width: `${width}%` }}>
          {Math.round(width)}%
        </div>
      </div>
    </div>
  );
}

function BarRank({ title, rows, valueKey, secondaryKey }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>
      <div className="space-y-4">
        {rows.map((row) => {
          const width = Math.max(4, Math.min(100, (Number(row[valueKey] || 0) / max) * 100));
          return (
            <div key={row.name}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-slate-800">{row.name}</span>
                <span className="shrink-0 text-right font-bold text-slate-900">
                  {currency(row[valueKey])}
                  {secondaryKey && <small className="ml-2 font-medium text-slate-500">qta {row[secondaryKey]}</small>}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Dati non ancora disponibili.</p>}
      </div>
    </section>
  );
}

function LiveTotals({ title, totals, previewTotals, hasDraft }) {
  const rows = [
    ["Subtotale", totals.subtotal, previewTotals.subtotal],
    ["Sconti", totals.discountTotal, previewTotals.discountTotal],
    ["Totale", totals.total, previewTotals.total]
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {hasDraft && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">anteprima riga corrente</span>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {rows.map(([label, savedValue, previewValue]) => {
          const changed = hasDraft && Number(savedValue || 0) !== Number(previewValue || 0);
          return (
            <div key={label} className="min-w-0 rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-1 truncate text-xl font-bold text-slate-900">{currency(previewValue)}</p>
              {changed && <p className="mt-1 text-xs font-semibold text-blue-700">salvato: {currency(savedValue)}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RankTable({ title, rows, valueKey, secondaryKey }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-800">{row.name}</span>
            <span className="text-right font-bold text-slate-900">
              {currency(row[valueKey])}
              {secondaryKey && <small className="ml-2 font-medium text-slate-500">qta {row[secondaryKey]}</small>}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Dati non ancora disponibili.</p>}
      </div>
    </section>
  );
}
