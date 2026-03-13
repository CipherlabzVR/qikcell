import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";

const DeviceNameDialog = ({
  open,
  value,
  onChange,
  onCancel,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>New Device Detected</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter a name to remember this device for future logins.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Device Name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="My Office Laptop"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceNameDialog;
