import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Stack,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { masterCategoryContainedButtonSx } from "@/styles/masterCategoryButtons";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

/* ──────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

const isOk = (res) => res?.statusCode === 200 || res?.statusCode === 1;

const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const TABS = [
  { key: "experiences",  label: "Experiences"   },
  { key: "travelerTypes", label: "Traveler Types" },
  { key: "travelStyles", label: "Travel Styles"  },
];

/* ──────────────────────────────────────────────────────────────────────── */
/*  API per resource                                                        */
/* ──────────────────────────────────────────────────────────────────────── */

const RESOURCES = {
  experiences: {
    listUrl:   `${BASE_URL}/TravelExperiences/GetAllExperiences`,
    createUrl: `${BASE_URL}/TravelExperiences/CreateExperience`,
    updateUrl: `${BASE_URL}/TravelExperiences/UpdateExperience`,
    deleteUrl: (id) => `${BASE_URL}/TravelExperiences/DeleteExperience?id=${id}`,
  },
  travelerTypes: {
    listUrl:   `${BASE_URL}/TravelTravelerTypes/GetAllTravelerTypes`,
    createUrl: `${BASE_URL}/TravelTravelerTypes/CreateTravelerType`,
    updateUrl: `${BASE_URL}/TravelTravelerTypes/UpdateTravelerType`,
    deleteUrl: (id) => `${BASE_URL}/TravelTravelerTypes/DeleteTravelerType?id=${id}`,
  },
  travelStyles: {
    listUrl:   `${BASE_URL}/TravelTravelStyles/GetAllTravelStyles`,
    createUrl: `${BASE_URL}/TravelTravelStyles/CreateTravelStyle`,
    updateUrl: `${BASE_URL}/TravelTravelStyles/UpdateTravelStyle`,
    deleteUrl: (id) => `${BASE_URL}/TravelTravelStyles/DeleteTravelStyle?id=${id}`,
  },
};

/* ──────────────────────────────────────────────────────────────────────── */
/*  Empty form factories                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

const emptyForm = {
  experiences:   { name: "", icon: "", description: "", destinationIds: [], price: 0, displayOrder: 0, isActive: true },
  travelerTypes: { label: "", subtitle: "", icon: "", displayOrder: 0, isActive: true },
  travelStyles:  { label: "", subtitle: "", icon: "", displayOrder: 0, isActive: true },
};

/* ──────────────────────────────────────────────────────────────────────── */
/*  Main page                                                               */
/* ──────────────────────────────────────────────────────────────────────── */

export default function TravelPackages() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const [tab, setTab] = useState("experiences");
  const [rows, setRows] = useState({ experiences: [], travelerTypes: [], travelStyles: [] });
  const [loading, setLoading] = useState(false);

  // Destinations needed only by the Experiences form's multi-select.
  const [destinations, setDestinations] = useState([]);

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm.experiences);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  /* ─── Fetchers ────────────────────────────────────────────────────── */

  const fetchTab = async (which) => {
    setLoading(true);
    try {
      const r = await fetch(RESOURCES[which].listUrl, {
        method: "GET",
        headers: authJsonHeaders(),
      });
      if (!r.ok) throw new Error("Failed to fetch");
      const data = await r.json();
      setRows((prev) => ({ ...prev, [which]: Array.isArray(data?.result) ? data.result : [] }));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const r = await fetch(`${BASE_URL}/TravelDestinations/GetAllDestinations`, {
        method: "GET",
        headers: authJsonHeaders(),
      });
      if (!r.ok) return;
      const data = await r.json();
      setDestinations(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!navigate) return;
    fetchTab("experiences");
    fetchTab("travelerTypes");
    fetchTab("travelStyles");
    fetchDestinations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /* ─── CRUD ────────────────────────────────────────────────────────── */

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm[tab]);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    if (tab === "experiences") {
      setForm({
        name: row.name || "",
        icon: row.icon || "",
        description: row.description || "",
        destinationIds: Array.isArray(row.destinationIds) ? row.destinationIds : [],
        price: row.price != null ? Number(row.price) : 0,
        displayOrder: row.displayOrder || 0,
        isActive: row.isActive !== false,
      });
    } else {
      setForm({
        label: row.label || "",
        subtitle: row.subtitle || "",
        icon: row.icon || "",
        displayOrder: row.displayOrder || 0,
        isActive: row.isActive !== false,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Basic validation per tab
      if (tab === "experiences" && !form.name?.trim()) {
        toast.error("Name is required.");
        setSaving(false);
        return;
      }
      if ((tab === "travelerTypes" || tab === "travelStyles") && !form.label?.trim()) {
        toast.error("Label is required.");
        setSaving(false);
        return;
      }

      const url = editingId ? RESOURCES[tab].updateUrl : RESOURCES[tab].createUrl;
      const body = editingId ? { id: editingId, ...form } : form;

      const r = await fetch(url, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Save failed");
      toast.success(editingId ? "Updated" : "Created");
      setDialogOpen(false);
      fetchTab(tab);
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (row) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const r = await fetch(RESOURCES[tab].deleteUrl(toDelete.id), {
        method: "POST",
        headers: authJsonHeaders(),
      });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Delete failed");
      toast.success("Deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchTab(tab);
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Filter visible rows ─────────────────────────────────────────── */

  const visibleRows = useMemo(() => {
    const list = rows[tab] || [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const text = tab === "experiences"
        ? `${row.name} ${row.description || ""} ${row.price != null ? row.price : ""}`
        : `${row.label} ${row.subtitle || ""}`;
      return text.toLowerCase().includes(q);
    });
  }, [rows, tab, searchTerm]);

  /* ─── Render ──────────────────────────────────────────────────────── */

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Packages</h1>
        <ul>
          <li><Link href="/">Dashboard</Link></li>
          <li>Travel</li>
          <li><Link href="/travel/packages/">Packages</Link></li>
        </ul>
      </div>

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setSearchTerm(""); }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} />
            ))}
          </Tabs>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchTab(tab)}
              disabled={loading}
            >
              Refresh
            </Button>
            {create && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={masterCategoryContainedButtonSx}
              >
                New
              </Button>
            )}
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {tab === "experiences" && "Activities & experiences shown in the public package planner. Link each to one or more destinations so it appears for the right trip."}
          {tab === "travelerTypes" && 'Options for the planner\'s "Who is travelling?" step (e.g. Solo, Couple, Family).'}
          {tab === "travelStyles" && 'Options for the planner\'s "Travel style" step (e.g. Budget, Luxury).'}
        </Typography>
      </Paper>

      <Grid container rowSpacing={1} columnSpacing={1}>
        <Grid item xs={12} lg={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Search>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Icon</TableCell>
                  <TableCell>{tab === "experiences" ? "Name" : "Label"}</TableCell>
                  <TableCell>{tab === "experiences" ? "Destinations" : "Subtitle"}</TableCell>
                  {tab === "experiences" && <TableCell align="right">Price</TableCell>}
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={tab === "experiences" ? 8 : 7} align="center"><Typography>Loading...</Typography></TableCell></TableRow>
                ) : visibleRows.length === 0 ? (
                  <TableRow><TableCell colSpan={tab === "experiences" ? 8 : 7} align="center"><Typography color="textSecondary">Nothing here yet.</Typography></TableCell></TableRow>
                ) : (
                  visibleRows.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><span style={{ fontSize: 22 }}>{row.icon || "—"}</span></TableCell>
                      <TableCell>{tab === "experiences" ? row.name : row.label}</TableCell>
                      <TableCell>
                        {tab === "experiences"
                          ? <DestinationChips ids={row.destinationIds || []} destinations={destinations} />
                          : (row.subtitle || "—")}
                      </TableCell>
                      {tab === "experiences" && (
                        <TableCell align="right">
                          {Number(row.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </TableCell>
                      )}
                      <TableCell>{row.displayOrder ?? 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={row.isActive ? "success" : "default"}
                          variant={row.isActive ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {update && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {remove && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDelete(row)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* ── Add / Edit dialog ────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? "Edit" : "Add"}{" "}
          {tab === "experiences" ? "Experience" : tab === "travelerTypes" ? "Traveler Type" : "Travel Style"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {tab === "experiences" ? (
              <>
                <TextField
                  label="Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  fullWidth size="small"
                />
                <TextField
                  label="Icon (emoji)"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  fullWidth size="small"
                  placeholder="e.g. 🏄"
                  helperText="One emoji is enough — shown beside the experience in the planner."
                />
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  fullWidth size="small" multiline rows={2}
                />
                <TextField
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value === "" ? 0 : Number(e.target.value) })}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                  helperText="Optional reference price for this experience (e.g. add-on or estimate)."
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Available at destinations</InputLabel>
                  <Select
                    multiple
                    value={form.destinationIds}
                    onChange={(e) => setForm({ ...form, destinationIds: e.target.value })}
                    input={<OutlinedInput label="Available at destinations" />}
                    renderValue={(selected) =>
                      destinations
                        .filter((d) => selected.includes(d.id))
                        .map((d) => d.name)
                        .join(", ") || "All destinations"
                    }
                  >
                    {destinations.length === 0 ? (
                      <MenuItem disabled>No destinations published yet.</MenuItem>
                    ) : (
                      destinations.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          <Checkbox checked={form.destinationIds.indexOf(d.id) > -1} />
                          <ListItemText primary={d.name} secondary={d.region} />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Leave empty to show this experience for every destination.
                  </Typography>
                </FormControl>
              </>
            ) : (
              <>
                <TextField
                  label="Label *"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  fullWidth size="small"
                  helperText='Shown on the card (e.g. "Couple", "Luxury").'
                />
                <TextField
                  label="Subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  fullWidth size="small"
                  helperText='Short hint (e.g. "Two of us", "Elevated & private").'
                />
                <TextField
                  label="Icon (emoji)"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  fullWidth size="small"
                />
              </>
            )}

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Display Order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
                size="small"
                sx={{ width: 160 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={masterCategoryContainedButtonSx}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete &quot;{toDelete?.name || toDelete?.label}&quot;?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}

function DestinationChips({ ids, destinations }) {
  if (!ids || ids.length === 0) return <Chip label="All destinations" size="small" variant="outlined" />;
  const map = new Map(destinations.map((d) => [d.id, d.name]));
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {ids.slice(0, 4).map((id) => (
        <Chip key={id} label={map.get(id) || `#${id}`} size="small" />
      ))}
      {ids.length > 4 && <Chip label={`+${ids.length - 4} more`} size="small" variant="outlined" />}
    </Stack>
  );
}
