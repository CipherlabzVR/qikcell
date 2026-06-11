import React, { useEffect, useState, useMemo } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  TablePagination,
  FormControlLabel,
  Switch,
  Checkbox,
  FormGroup,
  Divider,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

/** Matches website `PREMIUM_SUBSCRIPTION_LKR` (subscription.ts). */
const PREMIUM_SUBSCRIPTION_LKR = 1990;

/** System defaults shown on the public site — listed for reference; not stored in DB. */
const getSystemDefaultRows = () => {
  const freeFeatures = [
    { key: "create_profile", label: "Create Profile" },
    { key: "add_photos", label: "Add Photos" },
    { key: "search_profiles", label: "Search Profiles" },
    { key: "send_interest", label: "Send Interest" },
    { key: "daily_profile_views_10", label: "View 10 Profiles / Day" },
  ];
  const premiumFeatures = [
    { key: "create_profile", label: "Create Profile" },
    { key: "add_photos", label: "Add Photos" },
    { key: "search_profiles", label: "Search Profiles" },
    { key: "send_interest", label: "Send Interest" },
    { key: "unlimited_profile_views", label: "Unlimited Profile Views" },
    { key: "view_contact_info", label: "View Contact Info" },
    { key: "direct_chat", label: "Direct Chat" },
    { key: "priority_support", label: "Priority Support" },
  ];
  const toFeatures = (items) =>
    items.map(({ key, label }) => ({
      key,
      Key: key,
      label,
      Label: label,
    }));

  return [
    {
      _isSystemDefault: true,
      _systemKey: "free",
      id: "system-free",
      Id: "system-free",
      name: "Free",
      Name: "Free",
      description: "Always on the pricing page (LKR 0). Not editable here.",
      Description: "Always on the pricing page (LKR 0). Not editable here.",
      price: 0,
      Price: 0,
      pricePeriodLabel: "/mo",
      PricePeriodLabel: "/mo",
      sortOrder: -2,
      SortOrder: -2,
      isActive: true,
      IsActive: true,
      isPopular: false,
      IsPopular: false,
      features: toFeatures(freeFeatures),
      Features: toFeatures(freeFeatures),
    },
    {
      _isSystemDefault: true,
      _systemKey: "premium-default",
      id: "system-premium-default",
      Id: "system-premium-default",
      name: "Premium (default)",
      Name: "Premium (default)",
      description:
        "Fallback paid plan when no admin packages exist; hidden once you add paid packages.",
      Description:
        "Fallback paid plan when no admin packages exist; hidden once you add paid packages.",
      price: PREMIUM_SUBSCRIPTION_LKR,
      Price: PREMIUM_SUBSCRIPTION_LKR,
      pricePeriodLabel: "/mo",
      PricePeriodLabel: "/mo",
      sortOrder: -1,
      SortOrder: -1,
      isActive: true,
      IsActive: true,
      isPopular: true,
      IsPopular: true,
      features: toFeatures(premiumFeatures),
      Features: toFeatures(premiumFeatures),
    },
  ];
};

const emptyForm = () => ({
  name: "",
  description: "",
  price: "",
  pricePeriodLabel: "/mo",
  sortOrder: 0,
  isActive: true,
  isPopular: false,
  featureKeys: [],
});

export default function MatrimonialPackages() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const [packages, setPackages] = useState([]);
  const [predefinedFeatures, setPredefinedFeatures] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const systemDefaultRows = useMemo(() => getSystemDefaultRows(), []);

  const fetchPredefined = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Matrimonial/GetPredefinedPackageFeatures`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data = await response.json();
      setPredefinedFeatures(data.result || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Matrimonial/GetAllPackages`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setPackages(data.result || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem("category", "170");
    fetchPredefined();
    fetchPackages();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const tableRows = useMemo(
    () => [...systemDefaultRows, ...packages],
    [systemDefaultRows, packages]
  );

  const filteredData = tableRows.filter((item) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const name = item.name || item.Name || "";
    const desc = item.description || item.Description || "";
    return (
      name.toLowerCase().includes(s) ||
      String(desc)
        .toLowerCase()
        .includes(s)
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), sortOrder: packages.length });
    setDialogOpen(true);
  };

  const openEdit = (pkg) => {
    const id = pkg.id ?? pkg.Id;
    const keys = (pkg.features || pkg.Features || []).map((f) => f.key || f.Key).filter(Boolean);
    setEditing(pkg);
    setForm({
      name: pkg.name ?? pkg.Name ?? "",
      description: pkg.description ?? pkg.Description ?? "",
      price: String(pkg.price ?? pkg.Price ?? ""),
      pricePeriodLabel: pkg.pricePeriodLabel ?? pkg.PricePeriodLabel ?? "/mo",
      sortOrder: pkg.sortOrder ?? pkg.SortOrder ?? 0,
      isActive: pkg.isActive ?? pkg.IsActive ?? true,
      isPopular: pkg.isPopular ?? pkg.IsPopular ?? false,
      featureKeys: keys.length ? keys : [],
    });
    setDialogOpen(true);
  };

  const toggleFeature = (key) => {
    setForm((f) => {
      const set = new Set(f.featureKeys);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { ...f, featureKeys: Array.from(set) };
    });
  };

  const savePackage = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Valid price is required");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        id: editing ? (editing.id ?? editing.Id) : null,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: priceNum,
        pricePeriodLabel: form.pricePeriodLabel?.trim() || "/mo",
        featureKeys: form.featureKeys,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        isPopular: form.isPopular,
      };
      const url = editing ? `${BASE_URL}/Matrimonial/UpdatePackage` : `${BASE_URL}/Matrimonial/CreatePackage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === 1) {
        toast.success(data.message || "Saved");
        setDialogOpen(false);
        fetchPackages();
      } else {
        toast.error(data.message || "Save failed");
      }
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const id = toDelete.id ?? toDelete.Id;
      const response = await fetch(`${BASE_URL}/Matrimonial/DeletePackage?id=${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === 1) {
        toast.success(data.message || "Deleted");
        setDeleteDialogOpen(false);
        setToDelete(null);
        fetchPackages();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} width="100%">
          <Box>
            <h1>Membership Packages</h1>
            <ul>
              <li>
                <Link href="/matrimonial/packages/">Packages</Link>
              </li>
            </ul>
          </Box>
          {create && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
              Add package
            </Button>
          )}
        </Box>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by package name or description..."
              value={searchTerm}
              onChange={handleSearchChange}
              inputProps={{ "aria-label": "search" }}
            />
          </Search>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table className="dark-table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price (LKR)</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="center">Features</TableCell>
                  <TableCell align="center">Order</TableCell>
                  <TableCell align="center">Active</TableCell>
                  <TableCell align="center">Popular</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">
                        {searchTerm ? "No matching packages." : "No packages yet. Add one to show on the website."}
                      </Typography>
                      {create && !searchTerm && (
                        <Button sx={{ mt: 1 }} variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>
                          Add package
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, idx) => {
                    const feats = row.features || row.Features || [];
                    const isSystem = row._isSystemDefault;
                    return (
                      <TableRow key={isSystem ? row._systemKey : row.id ?? row.Id}>
                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography fontWeight={600}>{row.name ?? row.Name}</Typography>
                            {isSystem && (
                              <Chip size="small" label="System default" color="info" variant="outlined" />
                            )}
                          </Box>
                          {(row.description ?? row.Description) && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {row.description ?? row.Description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {Number(row.price ?? row.Price).toLocaleString("en-LK", { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell>{row.pricePeriodLabel ?? row.PricePeriodLabel}</TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={`${feats.length} selected`} />
                        </TableCell>
                        <TableCell align="center">{row.sortOrder ?? row.SortOrder}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={(row.isActive ?? row.IsActive) ? "Yes" : "No"}
                            color={(row.isActive ?? row.IsActive) ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {(row.isPopular ?? row.IsPopular) ? <Chip size="small" label="Yes" color="primary" /> : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {isSystem ? (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          ) : (
                            <>
                              {update && (
                                <Tooltip title="Edit">
                                  <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {remove && (
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setToDelete(row);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>{editing ? "Edit package" : "Add package"}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Only predefined features below can be selected (same list as the public site catalog).
          </Typography>
          <TextField
            fullWidth
            label="Package name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            margin="dense"
            required
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            margin="dense"
            multiline
            minRows={2}
          />
          <Box display="flex" gap={1} mt={1}>
            <TextField
              label="Price (LKR)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              margin="dense"
              fullWidth
            />
            <TextField
              label="Period label"
              value={form.pricePeriodLabel}
              onChange={(e) => setForm((f) => ({ ...f, pricePeriodLabel: e.target.value }))}
              margin="dense"
              placeholder="/mo"
              fullWidth
            />
          </Box>
          <TextField
            fullWidth
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            margin="dense"
          />
          <FormGroup row sx={{ mt: 1 }}>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />}
              label="Active (show on website)"
            />
            <FormControlLabel
              control={<Switch checked={form.isPopular} onChange={(e) => setForm((f) => ({ ...f, isPopular: e.target.checked }))} />}
              label="Mark as popular"
            />
          </FormGroup>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Features included
          </Typography>
          <FormGroup>
            {predefinedFeatures.map((pf) => {
              const key = pf.key ?? pf.Key;
              const label = pf.label ?? pf.Label;
              return (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={form.featureKeys.includes(key)}
                      onChange={() => toggleFeature(key)}
                    />
                  }
                  label={label}
                />
              );
            })}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePackage} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete package?</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{toDelete?.name ?? toDelete?.Name}</strong>? It will no longer appear on the website.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
