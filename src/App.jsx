import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  DollarSign,
  FileSpreadsheet,
  Filter,
  LayoutDashboard,
  MapPin,
  Percent,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Save,
  TableProperties,
  Trash2,
  Trophy,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

const ACTIVE_PORTFOLIO_KEY = "simple-poker-active-portfolio-v1";

const seedResults = [
  {
    id: "seed-1",
    date: "2026-05-24",
    event: "WSOPC $600 NLH",
    venue: "Harrah's Cherokee",
    format: "Live",
    status: "completed",
    buyIn: 600,
    rake: 72,
    entries: 1184,
    finish: "18th",
    cash: 6100,
    finalTable: false,
    notes: "Late-regged level 5. Lost JJ into AK for chip lead pot.",
  },
  {
    id: "seed-2",
    date: "2026-05-18",
    event: "Sunday Million",
    venue: "PokerStars",
    format: "Online",
    status: "completed",
    buyIn: 109,
    rake: 9,
    entries: 9230,
    finish: "412th",
    cash: 396,
    finalTable: false,
    notes: "Online Sunday session. Laddered after losing QQ preflop.",
  },
  {
    id: "seed-3",
    date: "2026-05-12",
    event: "$1,100 MSPT Main",
    venue: "FireKeepers",
    format: "Live",
    status: "completed",
    buyIn: 1100,
    rake: 140,
    entries: 2411,
    finish: "Day 1",
    cash: 0,
    finalTable: false,
    notes: "Bricked two bullets. Table was soft but no late momentum.",
  },
  {
    id: "seed-4",
    date: "2026-05-06",
    event: "$400 Daily Deepstack",
    venue: "Aria",
    format: "Live",
    status: "completed",
    buyIn: 400,
    rake: 55,
    entries: 286,
    finish: "3rd",
    cash: 11680,
    finalTable: true,
    notes: "Final table deal declined. Key double with A5 suited blind vs blind.",
  },
  {
    id: "seed-5",
    date: "2026-04-29",
    event: "$2,500 High Roller",
    venue: "Wynn Las Vegas",
    format: "Live",
    status: "completed",
    buyIn: 2500,
    rake: 200,
    entries: 92,
    finish: "17th",
    cash: 0,
    finalTable: false,
    notes: "Short high roller field. Lost flip just outside the money.",
  },
];

const portfolios = {
  drew: {
    defaultResults: [],
    initials: "DM",
    name: "Drew Martel",
    subtitle: "ACR Terrorist",
    storageKey: "simple-poker-results-drew-v1",
  },
  sample: {
    defaultResults: seedResults,
    initials: "SP",
    name: "Sample",
    subtitle: "Demo Portfolio",
    storageKey: "simple-poker-results-sample-v1",
  },
};

const portfolioOptions = Object.entries(portfolios).map(([id, portfolio]) => ({
  id,
  ...portfolio,
}));

const emptyForm = {
  date: toDateInputValue(new Date()),
  event: "",
  venue: "",
  format: "Live",
  status: "pending",
  buyIn: "",
  rake: "",
  entries: "",
  finish: "",
  cash: "",
  finalTable: false,
  notes: "",
};

const createEventValue = "__create_event__";
const createVenueValue = "__create_venue__";

const screens = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "schedule", label: "My Schedule", icon: CalendarDays },
  { id: "ledger", label: "Past Results", icon: TableProperties },
  { id: "events", label: "Manage Events", icon: ReceiptText },
  { id: "venues", label: "Manage Venues", icon: MapPin },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const dashboardRangeOptions = [
  ["all", "All Time"],
  ["today", "Today"],
  ["week", "This Week"],
  ["month", "This Month"],
  ["year", "This Year"],
  ["90", "Last 90 Days"],
];

const ledgerDateRangeOptions = [
  ["all", "All"],
  ["30", "Last 30 Days"],
  ["90", "Last 90 Days"],
  ["year", "This Year"],
  ["month", "This Month"],
];

function App() {
  const [screen, setScreen] = useState("dashboard");
  const [portfolioId, setPortfolioId] = useState(() => {
    try {
      const storedPortfolio = localStorage.getItem(ACTIVE_PORTFOLIO_KEY);
      return portfolios[storedPortfolio] ? storedPortfolio : "drew";
    } catch {
      return "drew";
    }
  });
  const activePortfolio = portfolios[portfolioId] ?? portfolios.drew;
  const defaultEventOptions = useMemo(
    () => buildEventOptions(activePortfolio.defaultResults),
    [activePortfolio],
  );
  const defaultVenueOptions = useMemo(
    () => activePortfolio.defaultResults.map((result) => result.venue),
    [activePortfolio],
  );
  const [results, setResults] = usePersistentResults(portfolioId);
  const [eventOptions, setEventOptions] = usePersistentOptions(
    portfolioId,
    "events",
    defaultEventOptions,
  );
  const [venueOptions, setVenueOptions] = usePersistentOptions(
    portfolioId,
    "venues",
    defaultVenueOptions,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [editingResult, setEditingResult] = useState(null);
  const [dashboardRange, setDashboardRange] = useState("all");
  const [isSharingSnapshot, setIsSharingSnapshot] = useState(false);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const dashboardResults = useMemo(
    () => filterResultsByDashboardRange(results, dashboardRange),
    [dashboardRange, results],
  );
  const totals = useMemo(() => summarizeResults(dashboardResults), [dashboardResults]);
  const scheduleGroups = useMemo(
    () => buildScheduleGroups(dashboardResults),
    [dashboardResults],
  );
  const scheduledResults = useMemo(
    () => results.filter((result) => result.status === "pending"),
    [results],
  );

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PORTFOLIO_KEY, portfolioId);
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }, [portfolioId]);

  function handlePortfolioChange(nextPortfolioId) {
    setPortfolioId(nextPortfolioId);
    setEditingResult(null);
    setSearchTerm("");
    setScreen("dashboard");
  }

  function handleSaveResult(formResult) {
    setResults((currentResults) => {
      const savedResult = normalizeResult(formResult);
      if (formResult.id) {
        return sortResults(
          currentResults.map((result) =>
            result.id === formResult.id ? savedResult : result,
          ),
        );
      }

      return sortResults([
        {
          ...savedResult,
          id: crypto.randomUUID(),
        },
        ...currentResults,
      ]);
    });
    setEditingResult(null);
    setScreen("ledger");
  }

  function handleEditResult(result) {
    setEditingResult(result);
    setScreen("entry");
  }

  function handleDeleteResult(id) {
    setResults((currentResults) =>
      currentResults.filter((result) => result.id !== id),
    );
  }

  function handleResetTracker() {
    setResults([]);
    setSearchTerm("");
  }

  function handleAddMtt() {
    setEditingResult(null);
    setScreen("entry");
  }

  async function handleShareSnapshot() {
    setIsSharingSnapshot(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(document.body, {
        backgroundColor: "#f4f6f2",
        height: window.innerHeight,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        width: window.innerWidth,
        windowHeight: document.documentElement.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        x: window.scrollX,
        y: window.scrollY,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          return;
        } catch {
          // Fall back to download in browsers that block image clipboard writes.
        }
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `simple-poker-${toDateInputValue(new Date())}.png`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } finally {
      setIsSharingSnapshot(false);
    }
  }

  function handleCreateOption(type, name) {
    const setter = type === "events" ? setEventOptions : setVenueOptions;
    setter((currentOptions) =>
      type === "events"
        ? uniqueEventOptions([...currentOptions, name])
        : uniqueSorted([...currentOptions, name]),
    );
  }

  function handleUpdateOption(type, oldName, updatedOption) {
    const setter = type === "events" ? setEventOptions : setVenueOptions;
    const field = type === "events" ? "event" : "venue";
    const newName =
      type === "events" ? normalizeEventOption(updatedOption).name : updatedOption;

    setter((currentOptions) =>
      type === "events"
        ? uniqueEventOptions(
            currentOptions.map((option) =>
              getOptionName(option) === oldName ? updatedOption : option,
            ),
          )
        : uniqueSorted(
            currentOptions.map((option) => (option === oldName ? newName : option)),
          ),
    );
    setResults((currentResults) =>
      currentResults.map((result) =>
        result[field] === oldName ? { ...result, [field]: newName } : result,
      ),
    );
  }

  function handleDeleteOption(type, name) {
    const setter = type === "events" ? setEventOptions : setVenueOptions;
    setter((currentOptions) =>
      currentOptions.filter((option) => getOptionName(option) !== name),
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SP</div>
          <div>
            <strong>Simple Poker</strong>
          </div>
        </div>

        <nav className="nav-list" aria-label="Mockup screens">
          {screens.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={screen === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => {
                  setEditingResult(null);
                  setScreen(item.id);
                }}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <label className="player-card portfolio-select">
          <div className="avatar">{activePortfolio.initials}</div>
          <div>
            <span className="portfolio-label">Portfolio</span>
            <select
              aria-label="Portfolio"
              onChange={(event) => handlePortfolioChange(event.target.value)}
              value={portfolioId}
            >
              {portfolioOptions.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
            <span>{activePortfolio.subtitle}</span>
          </div>
        </label>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className={screen === "dashboard" ? "date-heading" : ""}>
            {screen === "dashboard" ? (
              <h1>{todayLabel}</h1>
            ) : (
              <h1>{screenTitle(screen, editingResult)}</h1>
            )}
          </div>
          <div className="topbar-actions">
            {screen === "ledger" && (
              <label className="search-box">
                <Search size={17} />
                <input
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search events, venues"
                  value={searchTerm}
                />
              </label>
            )}
            {screen === "dashboard" && (
              <label className="range-select dashboard-range-select">
                <Filter size={18} />
                <span>
                  {dashboardRangeOptions.find(([range]) => range === dashboardRange)?.[1] ??
                    "All Time"}
                </span>
                <select
                  aria-label="Dashboard range"
                  onChange={(event) => setDashboardRange(event.target.value)}
                  value={dashboardRange}
                >
                  {dashboardRangeOptions.map(([range, label]) => (
                    <option key={range} value={range}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </label>
            )}
            {screen === "dashboard" && (
              <button
                className="secondary-button share-button"
                disabled={isSharingSnapshot}
                onClick={handleShareSnapshot}
                type="button"
              >
                <Copy size={18} />
                <span>{isSharingSnapshot ? "Copying..." : "Share"}</span>
              </button>
            )}
            {screen !== "entry" && (
              <button className="primary-button" onClick={handleAddMtt} type="button">
                <Plus size={18} />
                <span>Add MTT</span>
              </button>
            )}
          </div>
        </header>

        {screen === "dashboard" && (
          <Dashboard scheduleGroups={scheduleGroups} totals={totals} />
        )}
        {screen === "schedule" && (
          <Ledger
            eventOptions={eventOptions}
            onDelete={handleDeleteResult}
            onEdit={handleEditResult}
            results={scheduledResults}
            searchTerm=""
            showReset={false}
            showResultTypeFilter={false}
            title="Scheduled Tournaments"
            venueOptions={venueOptions}
          />
        )}
        {screen === "ledger" && (
          <Ledger
            eventOptions={eventOptions}
            onDelete={handleDeleteResult}
            onEdit={handleEditResult}
            onReset={handleResetTracker}
            results={results}
            searchTerm={searchTerm}
            venueOptions={venueOptions}
          />
        )}
        {screen === "entry" && (
          <EntryForm
            eventOptions={eventOptions}
            initialResult={editingResult}
            onManageEvents={() => setScreen("events")}
            onManageVenues={() => setScreen("venues")}
            onCancel={() => {
              setEditingResult(null);
              setScreen("ledger");
            }}
            onSave={handleSaveResult}
            venueOptions={venueOptions}
          />
        )}
        {screen === "events" && (
          <OptionManager
            label="Event"
            onCreate={(name) => handleCreateOption("events", name)}
            onDelete={(eventOption) =>
              handleDeleteOption("events", getOptionName(eventOption))
            }
            onUpdate={(oldName, updatedOption) =>
              handleUpdateOption("events", oldName, updatedOption)
            }
            options={eventOptions}
            resultUsage={countUsage(results, "event")}
            title="Manage Events"
          />
        )}
        {screen === "venues" && (
          <OptionManager
            label="Venue"
            onCreate={(name) => handleCreateOption("venues", name)}
            onDelete={(name) => handleDeleteOption("venues", name)}
            onUpdate={(oldName, newName) =>
              handleUpdateOption("venues", oldName, newName)
            }
            options={venueOptions}
            resultUsage={countUsage(results, "venue")}
            title="Manage Venues"
          />
        )}
      </main>
    </div>
  );
}

function screenTitle(screen, editingResult) {
  if (screen === "schedule") return "My Schedule";
  if (screen === "ledger") return "Past Results";
  if (screen === "entry") return editingResult ? "Edit MTT" : "Add MTT";
  if (screen === "events") return "Manage Events";
  if (screen === "venues") return "Manage Venues";
  return "";
}

function Dashboard({ scheduleGroups, totals }) {
  return (
    <div className="screen-stack">
      <section className="metric-grid" aria-label="Tournament summary">
        <Metric
          icon={DollarSign}
          label="Buyins"
          value={currency.format(totals.buyIns)}
          detail={`ABI: ${currency.format(totals.averageBuyIn)}`}
        />
        <Metric
          icon={Percent}
          label="Rake Paid"
          value={currency.format(totals.rake)}
          detail={`${formatPercent(totals.rakePercent)} Rake`}
        />
        <Metric
          icon={Trophy}
          label="Cashes"
          value={currency.format(totals.cashes)}
          detail={`${formatPercent(totals.itmPercent)} ITM`}
        />
        <Metric
          icon={TrendingUp}
          label="Net Result"
          value={currency.format(totals.net)}
          detail={formatAbiNet(totals)}
          valueToneClass={resultToneClass(totals.net, totals.buyIns)}
          positive
        />
        <Metric
          icon={WalletCards}
          label="ROI"
          value={`${formatOneDecimal(totals.roi)}%`}
          valueTone={toneForNumber(totals.roi)}
          detail={`${totals.cashesCount} Cashes · ${totals.finalTables} FTs`}
        />
      </section>

      <section className="schedule-section">
        <div className="schedule-grid">
          {scheduleGroups.map((group) => (
            <ScheduleColumn key={group.status} {...group} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Ledger({
  eventOptions,
  onDelete,
  onEdit,
  onReset,
  results,
  searchTerm,
  showReset = true,
  showResultTypeFilter = true,
  title = "Tournament Results",
  venueOptions,
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [dateRange, setDateRange] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [minBuyIn, setMinBuyIn] = useState("");
  const [maxBuyIn, setMaxBuyIn] = useState("");

  const eventFilterOptions = useMemo(
    () =>
      uniqueSorted([
        ...eventOptions.map(getOptionName),
        ...results.map((result) => result.event),
      ]),
    [eventOptions, results],
  );
  const venueFilterOptions = useMemo(
    () => uniqueSorted([...venueOptions, ...results.map((result) => result.venue)]),
    [results, venueOptions],
  );

  const filteredResults = useMemo(
    () =>
      filterResults(results, filter, searchTerm, dateRange, {
        eventFilter,
        maxBuyIn,
        minBuyIn,
        venueFilter,
      }),
    [dateRange, eventFilter, filter, maxBuyIn, minBuyIn, results, searchTerm, venueFilter],
  );

  return (
    <div className="screen-stack">
      <section className="ledger-toolbar">
        <button
          className="secondary-button"
          onClick={() => setIsFilterOpen(true)}
          type="button"
        >
          <Filter size={18} />
          <span>Filter</span>
        </button>
        <div className="ledger-actions">
          <button
            className="primary-button"
            onClick={() => setIsExportOpen(true)}
            type="button"
          >
            <FileSpreadsheet size={18} />
            <span>Export to Excel</span>
          </button>
          {showReset && (
            <button
              className="danger-button"
              onClick={() => setIsResetOpen(true)}
              type="button"
            >
              <Trash2 size={18} />
              <span>Reset Tracker</span>
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <PanelHeader icon={TableProperties} title={title} />
        <TournamentTable
          onDelete={onDelete}
          onEdit={onEdit}
          results={filteredResults}
        />
      </section>

      {isExportOpen && (
        <ExportModal
          onClose={() => setIsExportOpen(false)}
          results={filteredResults}
        />
      )}
      {isFilterOpen && (
        <LedgerFilterModal
          dateRange={dateRange}
          eventFilter={eventFilter}
          eventFilterOptions={eventFilterOptions}
          filter={filter}
          maxBuyIn={maxBuyIn}
          minBuyIn={minBuyIn}
          onClose={() => setIsFilterOpen(false)}
          onReset={() => {
            setFilter("All");
            setDateRange("all");
            setEventFilter("all");
            setVenueFilter("all");
            setMinBuyIn("");
            setMaxBuyIn("");
          }}
          setDateRange={setDateRange}
          setEventFilter={setEventFilter}
          setFilter={setFilter}
          setMaxBuyIn={setMaxBuyIn}
          setMinBuyIn={setMinBuyIn}
          setVenueFilter={setVenueFilter}
          showResultTypeFilter={showResultTypeFilter}
          venueFilter={venueFilter}
          venueFilterOptions={venueFilterOptions}
        />
      )}
      {isResetOpen && (
        <ResetTrackerModal
          onClose={() => setIsResetOpen(false)}
          onConfirm={() => {
            onReset();
            setIsResetOpen(false);
          }}
          resultCount={results.length}
        />
      )}
    </div>
  );
}

function EntryForm({
  eventOptions,
  initialResult,
  onCancel,
  onManageEvents,
  onManageVenues,
  onSave,
  venueOptions,
}) {
  const [form, setForm] = useState(() => resultToForm(initialResult));
  const preview = useMemo(() => normalizeResult(form), [form]);
  const previewNet = getNet(preview);

  useEffect(() => {
    setForm(resultToForm(initialResult));
  }, [initialResult]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function handleEventChange(eventName) {
    if (eventName === createEventValue) {
      onManageEvents();
      return;
    }

    const selectedEvent = eventOptions.find((option) => option.name === eventName);
    setForm((currentForm) => ({
      ...currentForm,
      event: eventName,
      buyIn: selectedEvent ? String(selectedEvent.buyIn) : currentForm.buyIn,
      rake: selectedEvent ? String(selectedEvent.rake) : currentForm.rake,
    }));
  }

  function handleVenueChange(venueName) {
    if (venueName === createVenueValue) {
      onManageVenues();
      return;
    }

    updateField("venue", venueName);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(form);
  }

  const canSave = eventOptions.length > 0 && venueOptions.length > 0;

  return (
    <form className="entry-layout" onSubmit={handleSubmit}>
      <section className="entry-panel">
        <PanelHeader icon={ReceiptText} title="Result Details" />
        <div className="form-grid">
          <label className="field">
            <span>Event</span>
            <select
              onChange={(event) => handleEventChange(event.target.value)}
              required
              value={form.event}
            >
              <option value="">Select Event</option>
              {eventOptions.map((eventOption) => (
                <option key={eventOption.name} value={eventOption.name}>
                  {eventOption.name}
                </option>
              ))}
              <option value={createEventValue}>Create New Event</option>
            </select>
          </label>
          <label className="field">
            <span>Venue</span>
            <select
              onChange={(event) => handleVenueChange(event.target.value)}
              required
              value={form.venue}
            >
              <option value="">Select Venue</option>
              {venueOptions.map((venueOption) => (
                <option key={venueOption} value={venueOption}>
                  {venueOption}
                </option>
              ))}
              <option value={createVenueValue}>Create New Venue</option>
            </select>
          </label>
          <Field
            label="Date"
            onChange={(value) => updateField("date", value)}
            required
            type="date"
            value={form.date}
          />
          <label className="field">
            <span>Format</span>
            <select
              onChange={(event) => updateField("format", event.target.value)}
              value={form.format}
            >
              <option>Live</option>
              <option>Online</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              onChange={(event) => updateField("status", event.target.value)}
              value={form.status}
            >
              <option value="pending">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <Field
            label="Buyin"
            min="0"
            onChange={(value) => updateField("buyIn", value)}
            required
            step="0.01"
            type="number"
            value={form.buyIn}
          />
          <Field
            label="Rake"
            min="0"
            onChange={(value) => updateField("rake", value)}
            step="0.01"
            type="number"
            value={form.rake}
          />
          <Field
            label="Entries"
            min="0"
            onChange={(value) => updateField("entries", value)}
            type="number"
            value={form.entries}
          />
          <Field
            label="Finish"
            onChange={(value) => updateField("finish", value)}
            value={form.finish}
          />
          <Field
            label="Cash Won"
            min="0"
            onChange={(value) => updateField("cash", value)}
            type="number"
            value={form.cash}
          />
          <label className="form-check">
            <input
              checked={form.finalTable}
              onChange={(event) => updateField("finalTable", event.target.checked)}
              type="checkbox"
            />
            <span>Final Table</span>
          </label>
        </div>
        <label className="notes-field">
          <span>Notes</span>
          <textarea
            onChange={(event) => updateField("notes", event.target.value)}
            value={form.notes}
          />
        </label>
        {!canSave && (
          <p className="form-hint">
            Create at least one event and one venue before saving an MTT.
          </p>
        )}
        <div className="form-actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="primary-button" disabled={!canSave} type="submit">
            <Save size={18} />
            <span>{form.id ? "Save Changes" : "Save Result"}</span>
          </button>
        </div>
      </section>

      <aside className="result-preview">
        <p className="eyebrow">Projected Entry</p>
        <h2 className={resultToneClass(previewNet, preview.buyIn)}>
          {currency.format(previewNet)}
        </h2>
        <div className="preview-row">
          <span>Buyin</span>
          <strong>{currency.format(preview.buyIn)}</strong>
        </div>
        <div className="preview-row">
          <span>Rake</span>
          <strong>{currency.format(preview.rake)}</strong>
        </div>
        <div className="preview-row">
          <span>Cash Won</span>
          <strong>{currency.format(preview.cash)}</strong>
        </div>
        <div className="preview-row total">
          <span>Net Result</span>
          <strong className={resultToneClass(previewNet, preview.buyIn)}>
            {currency.format(previewNet)}
          </strong>
        </div>
      </aside>
    </form>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  positive = false,
  valueTone,
  valueToneClass,
}) {
  return (
    <article className={positive ? "metric positive" : "metric"}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong className={valueToneClass ?? toneClass(valueTone)}>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function PanelHeader({ icon: Icon, title, actionLabel }) {
  return (
    <div className="panel-header">
      <div className="panel-title">
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      {actionLabel && (
        <button className="text-button" type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function TournamentTable({ onDelete, onEdit, results }) {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <strong>No Results Found</strong>
        <span>Add an MTT or adjust the current search/filter.</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Status</th>
            <th>Buyin</th>
            <th>Rake</th>
            <th>Finish</th>
            <th>Cash</th>
            <th>FT</th>
            <th>Net</th>
            <th>ROI</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item) => {
            const net = getNet(item);
            const roi = getRoi(item);
            return (
              <tr key={item.id}>
                <td>{formatShortDate(item.date)}</td>
                <td>
                  <div className="event-cell">
                    <strong>{item.event}</strong>
                    <span>
                      {item.venue} · {item.format}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${item.status}`}>
                    {formatStatus(item.status)}
                  </span>
                </td>
                <td>{currency.format(item.buyIn)}</td>
                <td>{currency.format(item.rake)}</td>
                <td>{item.finish || "-"}</td>
                <td>{currency.format(item.cash)}</td>
                <td>{item.finalTable ? "Yes" : "No"}</td>
                <td className={resultToneClass(net, item.buyIn)}>{currency.format(net)}</td>
                <td className={toneClass(roi)}>{formatOneDecimal(roi)}%</td>
                <td>
                  <p className="table-note">{item.notes || "No notes yet."}</p>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="table-action"
                      onClick={() => onEdit(item)}
                      type="button"
                    >
                      <Pencil size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      className="table-action danger"
                      onClick={() => onDelete(item.id)}
                      type="button"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OptionManager({
  label,
  onCreate,
  onDelete,
  onUpdate,
  options,
  resultUsage,
  title,
}) {
  const [newName, setNewName] = useState("");
  const [newBuyIn, setNewBuyIn] = useState("");
  const [newRake, setNewRake] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingValue, setEditingValue] = useState({
    buyIn: "",
    name: "",
    rake: "",
  });
  const isEventManager = label === "Event";

  function handleCreate(event) {
    event.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName || options.some((option) => getOptionName(option) === trimmedName)) {
      return;
    }
    onCreate(
      isEventManager
        ? { buyIn: toNumber(newBuyIn), name: trimmedName, rake: toNumber(newRake) }
        : trimmedName,
    );
    setNewName("");
    setNewBuyIn("");
    setNewRake("");
  }

  function startEdit(option) {
    const normalizedOption = isEventManager
      ? normalizeEventOption(option)
      : { buyIn: "", name: option, rake: "" };
    setEditingName(normalizedOption.name);
    setEditingValue({
      buyIn: String(normalizedOption.buyIn),
      name: normalizedOption.name,
      rake: String(normalizedOption.rake),
    });
  }

  function saveEdit(event) {
    event.preventDefault();
    const trimmedName = editingValue.name.trim();
    if (!trimmedName) return;
    onUpdate(
      editingName,
      isEventManager
        ? {
            buyIn: toNumber(editingValue.buyIn),
            name: trimmedName,
            rake: toNumber(editingValue.rake),
          }
        : trimmedName,
    );
    setEditingName("");
    setEditingValue({ buyIn: "", name: "", rake: "" });
  }

  return (
    <div className="screen-stack">
      <section className="panel">
        <form
          className={
            isEventManager ? "option-create event-options" : "option-create"
          }
          onSubmit={handleCreate}
        >
          <label className="field">
            <input
              onChange={(event) => setNewName(event.target.value)}
              placeholder={`Add ${label}`}
              value={newName}
            />
          </label>
          {isEventManager && (
            <>
              <label className="field">
                <input
                  min="0"
                  onChange={(event) => setNewBuyIn(event.target.value)}
                  placeholder="Buyin"
                  step="0.01"
                  type="number"
                  value={newBuyIn}
                />
              </label>
              <label className="field">
                <input
                  min="0"
                  onChange={(event) => setNewRake(event.target.value)}
                  placeholder="Rake"
                  step="0.01"
                  type="number"
                  value={newRake}
                />
              </label>
            </>
          )}
          <button className="primary-button" type="submit">
            <Plus size={18} />
            <span>Add {label}</span>
          </button>
        </form>

        {options.length === 0 ? (
          <div className="empty-state">
            <strong>No {label}s Yet</strong>
            <span>Create one here before adding MTTs.</span>
          </div>
        ) : (
          <div className="option-list">
            {options.map((option) => {
              const optionName = getOptionName(option);
              const normalizedEvent = isEventManager ? normalizeEventOption(option) : null;
              const usageCount = resultUsage[optionName] || 0;
              const isEditing = editingName === optionName;
              return (
                <div className="option-row" key={optionName}>
                  {isEditing ? (
                    <form
                      className={
                        isEventManager ? "option-edit event-options" : "option-edit"
                      }
                      onSubmit={saveEdit}
                    >
                      <input
                        onChange={(event) =>
                          setEditingValue((currentValue) => ({
                            ...currentValue,
                            name: event.target.value,
                          }))
                        }
                        value={editingValue.name}
                      />
                      {isEventManager && (
                        <>
                          <input
                            min="0"
                            onChange={(event) =>
                              setEditingValue((currentValue) => ({
                                ...currentValue,
                                buyIn: event.target.value,
                              }))
                            }
                            placeholder="Buyin"
                            step="0.01"
                            type="number"
                            value={editingValue.buyIn}
                          />
                          <input
                            min="0"
                            onChange={(event) =>
                              setEditingValue((currentValue) => ({
                                ...currentValue,
                                rake: event.target.value,
                              }))
                            }
                            placeholder="Rake"
                            step="0.01"
                            type="number"
                            value={editingValue.rake}
                          />
                        </>
                      )}
                      <button className="primary-button" type="submit">
                        Save
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => setEditingName("")}
                        type="button"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{optionName}</strong>
                        <span>
                          {isEventManager
                            ? `${currency.format(normalizedEvent.buyIn)} + ${currency.format(
                                normalizedEvent.rake,
                              )}\u00A0\u00A0|\u00A0\u00A0${usageCount} MTTs Recorded`
                            : `${usageCount} MTTs Recorded`}
                        </span>
                      </div>
                      <div className="table-actions">
                        <button
                          className="table-action"
                          onClick={() => startEdit(option)}
                          type="button"
                        >
                          <Pencil size={16} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="table-action danger"
                          disabled={usageCount > 0}
                          onClick={() => onDelete(option)}
                          type="button"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ExportModal({ onClose, results }) {
  const [range, setRange] = useState("30");
  const [startDate, setStartDate] = useState(toDateInputValue(addDays(new Date(), -30)));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date()));
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);

  const exportRows = useMemo(
    () => filterResultsByExportRange(results, range, startDate, endDate),
    [endDate, range, results, startDate],
  );

  function updateRange(nextRange) {
    setRange(nextRange);
    const today = new Date();
    if (nextRange === "30") {
      setStartDate(toDateInputValue(addDays(today, -30)));
      setEndDate(toDateInputValue(today));
    }
    if (nextRange === "90") {
      setStartDate(toDateInputValue(addDays(today, -90)));
      setEndDate(toDateInputValue(today));
    }
    if (nextRange === "year") {
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(toDateInputValue(today));
    }
  }

  function handleExport() {
    exportToExcel(exportRows, { includeFinancials, includeNotes });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="export-title"
        aria-modal="true"
        className="export-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Export Settings</p>
            <h2 id="export-title">Export to Excel</h2>
          </div>
          <button
            aria-label="Close export settings"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <div className="export-options">
          {[
            ["30", "Last 30 Days"],
            ["90", "Last 90 Days"],
            ["year", "This Year"],
            ["all", "All Results"],
          ].map(([value, label]) => (
            <label
              className={range === value ? "export-option selected" : "export-option"}
              key={value}
            >
              <input
                checked={range === value}
                name="export-range"
                onChange={() => updateRange(value)}
                type="radio"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className="export-settings">
          <label>
            <span>Start Date</span>
            <input
              disabled={range === "all"}
              onChange={(event) => {
                setRange("custom");
                setStartDate(event.target.value);
              }}
              type="date"
              value={startDate}
            />
          </label>
          <label>
            <span>End Date</span>
            <input
              disabled={range === "all"}
              onChange={(event) => {
                setRange("custom");
                setEndDate(event.target.value);
              }}
              type="date"
              value={endDate}
            />
          </label>
          <label className="checkbox-row">
            <input
              checked={includeNotes}
              onChange={(event) => setIncludeNotes(event.target.checked)}
              type="checkbox"
            />
            <span>Include Notes</span>
          </label>
          <label className="checkbox-row">
            <input
              checked={includeFinancials}
              onChange={(event) => setIncludeFinancials(event.target.checked)}
              type="checkbox"
            />
            <span>Include Rake and ROI</span>
          </label>
        </div>

        <footer className="modal-actions">
          <span className="export-count">{exportRows.length} Results Selected</span>
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="primary-button" onClick={handleExport} type="button">
            <FileSpreadsheet size={18} />
            <span>Export .xls</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function LedgerFilterModal({
  dateRange,
  eventFilter,
  eventFilterOptions,
  filter,
  maxBuyIn,
  minBuyIn,
  onClose,
  onReset,
  setDateRange,
  setEventFilter,
  setFilter,
  setMaxBuyIn,
  setMinBuyIn,
  setVenueFilter,
  showResultTypeFilter = true,
  venueFilter,
  venueFilterOptions,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="ledger-filter-title"
        aria-modal="true"
        className="export-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Past Results</p>
            <h2 id="ledger-filter-title">Filter Results</h2>
          </div>
          <button
            aria-label="Close results filter"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <div className="ledger-filter-modal">
          {showResultTypeFilter && (
            <div className="filter-group">
              <span>Result Type</span>
              <div className="segmented-control" aria-label="Ledger filters">
                {["All", "Cashed", "Live", "Online"].map((filterName) => (
                  <button
                    className={filter === filterName ? "selected" : ""}
                    key={filterName}
                    onClick={() => setFilter(filterName)}
                    type="button"
                  >
                    {filterName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="range-select filter-field">
            <CalendarDays size={17} />
            <span>Date</span>
            <select
              aria-label="Date range"
              onChange={(event) => setDateRange(event.target.value)}
              value={dateRange}
            >
              {ledgerDateRangeOptions.map(([range, label]) => (
                <option key={range} value={range}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="range-select filter-field">
            <span>Event</span>
            <select
              aria-label="Filter by event"
              onChange={(event) => setEventFilter(event.target.value)}
              value={eventFilter}
            >
              <option value="all">All Events</option>
              {eventFilterOptions.map((eventName) => (
                <option key={eventName} value={eventName}>
                  {eventName}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="range-select filter-field">
            <span>Venue</span>
            <select
              aria-label="Filter by venue"
              onChange={(event) => setVenueFilter(event.target.value)}
              value={venueFilter}
            >
              <option value="all">All Venues</option>
              {venueFilterOptions.map((venueName) => (
                <option key={venueName} value={venueName}>
                  {venueName}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>

          <div className="buyin-filter-grid">
            <label className="range-select filter-field compact-filter">
              <span>Min Buyin</span>
              <input
                aria-label="Minimum buy-in"
                min="0"
                onChange={(event) => setMinBuyIn(event.target.value)}
                placeholder="$0"
                step="0.01"
                type="number"
                value={minBuyIn}
              />
            </label>
            <label className="range-select filter-field compact-filter">
              <span>Max Buyin</span>
              <input
                aria-label="Maximum buy-in"
                min="0"
                onChange={(event) => setMaxBuyIn(event.target.value)}
                placeholder="Any"
                step="0.01"
                type="number"
                value={maxBuyIn}
              />
            </label>
          </div>
        </div>

        <footer className="modal-actions">
          <button className="secondary-button" onClick={onReset} type="button">
            Reset Filters
          </button>
          <button className="primary-button" onClick={onClose} type="button">
            Apply
          </button>
        </footer>
      </section>
    </div>
  );
}

function ResetTrackerModal({ onClose, onConfirm, resultCount }) {
  const [confirmationText, setConfirmationText] = useState("");
  const canReset = confirmationText === "RESET";

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="reset-title"
        aria-modal="true"
        className="export-modal danger-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Permanent Action</p>
            <h2 id="reset-title">Reset Tracker</h2>
          </div>
          <button
            aria-label="Close reset tracker"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <div className="reset-warning">
          <strong>This will delete {resultCount} saved results.</strong>
          <span>
            This clears the tracker in local storage for this browser. Type RESET
            to enable the reset button.
          </span>
        </div>

        <label className="field">
          <span>Confirmation</span>
          <input
            autoComplete="off"
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder="Type RESET"
            value={confirmationText}
          />
        </label>

        <footer className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="danger-button"
            disabled={!canReset}
            onClick={onConfirm}
            type="button"
          >
            <Trash2 size={18} />
            <span>Reset Tracker</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function ScheduleColumn({ emptyText, label, results, status }) {
  return (
    <article className={`schedule-column ${status}`}>
      <header>
        <div>
          <h3>{label}</h3>
          <span>{results.length} MTTs</span>
        </div>
        <span className={`status-dot ${status}`} />
      </header>
      {results.length === 0 ? (
        <p className="schedule-empty">{emptyText}</p>
      ) : (
        <div className="schedule-list">
          {results.slice(0, 5).map((result) => {
            const net = getNet(result);
            return (
              <div className="schedule-item" key={result.id}>
                <div>
                  <strong>{result.event}</strong>
                  <span>
                    {formatShortDate(result.date)} · {result.venue}
                  </span>
                </div>
                <div className="schedule-meta">
                  <span>{currency.format(result.buyIn)}</span>
                  {result.status === "completed" && (
                    <strong className={resultToneClass(net, result.buyIn)}>
                      {currency.format(net)}
                    </strong>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function Field({ label, onChange, value, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  );
}

function usePersistentResults(portfolioId) {
  const portfolio = portfolios[portfolioId] ?? portfolios.drew;
  const [state, setState] = useState(() => {
    const results = readStoredResults(portfolio.storageKey) ?? portfolio.defaultResults;
    return { results, storageKey: portfolio.storageKey };
  });

  useEffect(() => {
    const results = readStoredResults(portfolio.storageKey) ?? portfolio.defaultResults;
    setState({ results, storageKey: portfolio.storageKey });
  }, [portfolio.defaultResults, portfolio.storageKey]);

  useEffect(() => {
    if (state.storageKey !== portfolio.storageKey) return;
    try {
      localStorage.setItem(
        state.storageKey,
        JSON.stringify({
          results: state.results,
          updatedAt: new Date().toISOString(),
          version: 2,
        }),
      );
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }, [portfolio.storageKey, state]);

  function setResults(update) {
    setState((currentState) => ({
      ...currentState,
      results:
        typeof update === "function" ? update(currentState.results) : update,
    }));
  }

  return [state.results, setResults];
}

function usePersistentOptions(portfolioId, type, defaultOptions) {
  const portfolio = portfolios[portfolioId] ?? portfolios.drew;
  const storageKey = `${portfolio.storageKey}-${type}`;
  const [state, setState] = useState(() => {
    const options =
      readStoredOptions(storageKey, type) ?? normalizeOptions(type, defaultOptions);
    return { options, storageKey };
  });

  useEffect(() => {
    const options =
      readStoredOptions(storageKey, type) ?? normalizeOptions(type, defaultOptions);
    setState({ options, storageKey });
  }, [defaultOptions, storageKey, type]);

  useEffect(() => {
    if (state.storageKey !== storageKey) return;
    try {
      localStorage.setItem(
        state.storageKey,
        JSON.stringify({
          options: state.options,
          updatedAt: new Date().toISOString(),
          version: 1,
        }),
      );
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }, [state, storageKey]);

  function setOptions(update) {
    setState((currentState) => ({
      ...currentState,
      options:
        typeof update === "function" ? update(currentState.options) : update,
    }));
  }

  return [state.options, setOptions];
}

function readStoredResults(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.results)) return null;
    const shouldMigrateSeedMetadata = Number(parsed.version || 0) < 2;
    return sortResults(
      parsed.results.map((result) =>
        normalizeResult(result, { shouldMigrateSeedMetadata }),
      ),
    );
  } catch {
    return null;
  }
}

function readStoredOptions(storageKey, type) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.options)) return null;
    return normalizeOptions(type, parsed.options);
  } catch {
    return null;
  }
}

function resultToForm(result) {
  if (!result) return emptyForm;
  return {
    ...result,
    buyIn: String(result.buyIn ?? ""),
    cash: String(result.cash ?? ""),
    entries: String(result.entries ?? ""),
    finalTable: inferFinalTable(result),
    rake: String(result.rake ?? ""),
    status: normalizeStatus(result.status || "completed"),
  };
}

function normalizeResult(result, options = {}) {
  return {
    id: result.id,
    date: result.date || toDateInputValue(new Date()),
    event: result.event?.trim() || "Untitled MTT",
    venue: result.venue?.trim() || "Unknown",
    format: result.format || "Live",
    status: normalizeStatus(result.status),
    buyIn: toNumber(result.buyIn),
    rake: toNumber(result.rake),
    entries: toNumber(result.entries),
    finish: result.finish?.trim() || "",
    cash: toNumber(result.cash),
    finalTable: inferFinalTable(result, options.shouldMigrateSeedMetadata),
    notes: result.notes?.trim() || "",
  };
}

function normalizeStatus(status) {
  if (status === "active") return "live";
  if (status === "live" || status === "completed" || status === "pending") {
    return status;
  }
  return "completed";
}

function inferFinalTable(result, shouldMigrateSeedMetadata = false) {
  if (shouldMigrateSeedMetadata) {
    const seededValue = seedResults.find(
      (seedResult) => seedResult.id === result.id,
    )?.finalTable;
    if (typeof seededValue === "boolean") return seededValue;
  }
  if (typeof result.finalTable === "boolean") return result.finalTable;
  return seedResults.find((seedResult) => seedResult.id === result.id)?.finalTable ?? false;
}

function formatStatus(status) {
  if (status === "active" || status === "live") return "Live";
  if (status === "completed") return "Completed";
  return "Scheduled";
}

function formatAbiNet(totals) {
  if (totals.averageBuyIn === 0) return "0";
  const value = totals.net / totals.averageBuyIn;
  return `${formatSignedNumber(value)} ABIs`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatSignedNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  const formatted = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  if (rounded > 0) return `+${formatted}`;
  if (rounded < 0) return formatted;
  return "0";
}

function summarizeResults(results) {
  const buyIns = results.reduce((sum, item) => sum + item.buyIn, 0);
  const rake = results.reduce((sum, item) => sum + item.rake, 0);
  const cashes = results.reduce((sum, item) => sum + item.cash, 0);
  const entries = results.length;
  const net = cashes - buyIns;
  const roi = buyIns > 0 ? roundToOneDecimal((net / buyIns) * 100) : 0;
  const rakePercent = buyIns > 0 ? (rake / buyIns) * 100 : 0;
  const cashesCount = results.filter((item) => item.cash > 0).length;
  const finalTables = results.filter((item) => item.finalTable).length;
  const completedResults = results.filter((item) => item.status === "completed");
  const scheduledCount = results.filter((item) => item.status === "pending").length;
  const liveCount = results.filter((item) => item.status === "live").length;
  const completedCount = results.filter((item) => item.status === "completed").length;
  const averageBuyIn = entries > 0 ? buyIns / entries : 0;
  const itmPercent =
    completedResults.length > 0
      ? (completedResults.filter((item) => item.cash > 0).length /
          completedResults.length) *
        100
      : 0;

  return {
    averageBuyIn,
    buyIns,
    cashes,
    cashesCount,
    completedCount,
    entries,
    finalTables,
    itmPercent,
    liveCount,
    net,
    rake,
    rakePercent,
    roi,
    scheduledCount,
  };
}

function buildScheduleGroups(results) {
  return [
    {
      emptyText: "No scheduled MTTs",
      label: "Scheduled Tournaments",
      results: results.filter((result) => result.status === "pending"),
      status: "pending",
    },
    {
      emptyText: "No live MTTs",
      label: "Live Tournaments",
      results: results.filter((result) => result.status === "live"),
      status: "live",
    },
    {
      emptyText: "No finished MTTs",
      label: "Finished Tournaments",
      results: results.filter((result) => result.status === "completed"),
      status: "completed",
    },
  ];
}

function filterByDays(results, days) {
  const today = startOfDay(new Date());
  const start = addDays(today, -days);
  return results.filter((result) => {
    const resultDate = parseDate(result.date);
    return resultDate >= start && resultDate <= today;
  });
}

function filterByCurrentMonth(results) {
  const today = new Date();
  return results.filter((result) => {
    const resultDate = parseDate(result.date);
    return (
      resultDate.getFullYear() === today.getFullYear() &&
      resultDate.getMonth() === today.getMonth()
    );
  });
}

function filterResults(
  results,
  filter,
  searchTerm,
  dateRange = "all",
  advancedFilters = {},
) {
  const {
    eventFilter = "all",
    maxBuyIn = "",
    minBuyIn = "",
    venueFilter = "all",
  } = advancedFilters;
  const query = searchTerm.trim().toLowerCase();
  const parsedMinimumBuyIn = Number(minBuyIn);
  const parsedMaximumBuyIn = Number(maxBuyIn);
  const minimumBuyIn =
    minBuyIn === "" || !Number.isFinite(parsedMinimumBuyIn)
      ? null
      : parsedMinimumBuyIn;
  const maximumBuyIn =
    maxBuyIn === "" || !Number.isFinite(parsedMaximumBuyIn)
      ? null
      : parsedMaximumBuyIn;
  return sortResults(
    results.filter((result) => {
      const matchesDateRange = filterResultByDateRange(result, dateRange);
      const matchesFilter =
        filter === "All" ||
        (filter === "Cashed" && result.cash > 0) ||
        result.format === filter;
      const matchesSearch =
        query.length === 0 ||
        [result.event, result.venue, result.finish, result.notes, result.format]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesEvent = eventFilter === "all" || result.event === eventFilter;
      const matchesVenue = venueFilter === "all" || result.venue === venueFilter;
      const matchesBuyIn =
        (minimumBuyIn === null || result.buyIn >= minimumBuyIn) &&
        (maximumBuyIn === null || result.buyIn <= maximumBuyIn);

      return (
        matchesDateRange &&
        matchesFilter &&
        matchesSearch &&
        matchesEvent &&
        matchesVenue &&
        matchesBuyIn
      );
    }),
  );
}

function filterResultByDateRange(result, dateRange) {
  if (dateRange === "all") return true;
  if (dateRange === "30") return filterByDays([result], 30).length > 0;
  if (dateRange === "90") return filterByDays([result], 90).length > 0;
  if (dateRange === "month") return filterByCurrentMonth([result]).length > 0;
  if (dateRange === "year") {
    const today = new Date();
    return parseDate(result.date).getFullYear() === today.getFullYear();
  }
  return true;
}

function filterResultsByExportRange(results, range, startDate, endDate) {
  if (range === "all") return sortResults(results);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  return sortResults(
    results.filter((result) => {
      const date = parseDate(result.date);
      return date >= start && date <= end;
    }),
  );
}

function filterResultsByDashboardRange(results, range) {
  if (range === "all") return results;
  if (range === "today") return filterByDays(results, 0);
  if (range === "week") return filterByDays(results, 7);
  if (range === "month") return filterByCurrentMonth(results);
  if (range === "90") return filterByDays(results, 90);
  if (range === "year") {
    const today = new Date();
    return results.filter(
      (result) => parseDate(result.date).getFullYear() === today.getFullYear(),
    );
  }
  return results;
}

function exportToExcel(results, options) {
  const columns = [
    "Date",
    "Event",
    "Venue",
    "Format",
    "Status",
    "Buyin",
    "Cash",
    "Net",
    "Final Table",
  ];
  if (options.includeFinancials) columns.push("Rake", "ROI");
  columns.push("Entries", "Finish");
  if (options.includeNotes) columns.push("Notes");

  const rows = results.map((result) => {
    const row = {
      Buyin: result.buyIn,
      Cash: result.cash,
      Date: result.date,
      Entries: result.entries,
      Event: result.event,
      Finish: result.finish,
      Format: result.format,
      "Final Table": result.finalTable ? "Yes" : "No",
      Net: getNet(result),
      Notes: result.notes,
      ROI: `${formatOneDecimal(getRoi(result))}%`,
      Rake: result.rake,
      Status: formatStatus(result.status),
      Venue: result.venue,
    };
    return columns.map((column) => escapeHtml(row[column] ?? "")).join("</td><td>");
  });

  const table = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          <thead><tr><th>${columns.join("</th><th>")}</th></tr></thead>
          <tbody><tr><td>${rows.join("</td></tr><tr><td>")}</td></tr></tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([table], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `poker-results-${toDateInputValue(new Date())}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sortResults(results) {
  return [...results].sort((a, b) => parseDate(b.date) - parseDate(a.date));
}

function getNet(result) {
  return result.cash - result.buyIn;
}

function getRoi(result) {
  return result.buyIn > 0
    ? roundToOneDecimal((getNet(result) / result.buyIn) * 100)
    : 0;
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function formatOneDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function toneForNumber(value) {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

function resultToneClass(value, buyIn) {
  const numericValue = typeof value === "number" ? value : Number(value);
  const numericBuyIn = typeof buyIn === "number" ? buyIn : Number(buyIn);
  if (!Number.isFinite(numericValue) || numericValue === 0) return "";
  if (numericValue < 0) return "money-negative";
  if (Number.isFinite(numericBuyIn) && numericBuyIn > 0 && numericValue < numericBuyIn) {
    return "money-positive-light";
  }
  return "money-positive";
}

function toneClass(value) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (numericValue > 0) return "money-positive";
  if (numericValue < 0) return "money-negative";
  return "";
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
  }).format(parseDate(value));
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function countUsage(results, field) {
  return results.reduce((usage, result) => {
    usage[result[field]] = (usage[result[field]] || 0) + 1;
    return usage;
  }, {});
}

function buildEventOptions(results) {
  return uniqueEventOptions(
    results.map((result) => ({
      buyIn: result.buyIn,
      name: result.event,
      rake: result.rake,
    })),
  );
}

function getOptionName(option) {
  return typeof option === "string" ? option : option.name;
}

function normalizeEventOption(option) {
  if (typeof option === "string") {
    const seedResult = seedResults.find((result) => result.event === option);
    return {
      buyIn: seedResult?.buyIn ?? 0,
      name: option.trim(),
      rake: seedResult?.rake ?? 0,
    };
  }

  const seedResult = seedResults.find((result) => result.event === option.name);
  return {
    buyIn: toNumber(option.buyIn ?? seedResult?.buyIn),
    name: String(option.name || "").trim(),
    rake: toNumber(option.rake ?? seedResult?.rake),
  };
}

function normalizeOptions(type, options) {
  return type === "events" ? uniqueEventOptions(options) : uniqueSorted(options);
}

function uniqueEventOptions(options) {
  const optionMap = new Map();
  options.map(normalizeEventOption).forEach((option) => {
    if (option.name) optionMap.set(option.name, option);
  });
  return [...optionMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export default App;
