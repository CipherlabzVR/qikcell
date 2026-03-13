import React, { useState } from "react";
import {
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import getDeviceName from "@/components/utils/getDeviceName";

const DrawerSignIn = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    Email: "",
    Password: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginNote, setLoginNote] = useState("");

  const validate = () => {
    const errors = {};
    if (!formData.Email) {
      errors.Email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
      errors.Email = "Invalid email format";
    }

    if (!formData.Password) {
      errors.Password = "Password is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (validate()) {
      setLoginNote("");

      try {
        const response = await fetch(`${BASE_URL}/User/SignIn`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            DeviceName: getDeviceName(),
          }),
        });
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || "Login failed");
        }

        const token = responseData.result.accessToken;
        const user = responseData.result.email;
        const usertype = responseData.result.userType;
        const warehouse = responseData.result.warehouseId;
        const company = responseData.result.companyId;
        localStorage.setItem("token", token);
        localStorage.setItem("user", user);
        localStorage.setItem("userid", responseData.result.id);
        localStorage.setItem("name", responseData.result.firstName);
        localStorage.setItem("type", usertype);
        localStorage.setItem("warehouse", warehouse);
        localStorage.setItem("company", company);
        localStorage.setItem("role", responseData.result.userRole);

        fetch(`${BASE_URL}/Company/CreateCompanyHostingFeeIfDue`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(() => {});

        window.location.href = "/dashboard/reservation/";
      } catch (error) {
        const message = error.message || "Login failed";

        if (message.includes("3 registered devices") || message.includes("contact admin")) {
          setLoginNote(message);
          return;
        }

        toast.error(message);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Grid container sx={{ height: '80vh' }}>
      <Grid item xs={12} display="flex" alignItems="center" justifyContent="center">
        <img src="/images/DBlogo.png" alt="Logo" className="black-logo" />
      </Grid>
      <Grid item xs={12}>
        {loginNote && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loginNote}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Email"
          name="Email"
          size="small"
          value={formData.Email}
          onChange={handleInputChange}
          error={!!formErrors.Email}
          helperText={formErrors.Email}
          margin="normal"
        />
        <TextField
          fullWidth
          size="small"
          label="Password"
          name="Password"
          type={showPassword ? "text" : "password"}
          value={formData.Password}
          onChange={handleInputChange}
          error={!!formErrors.Password}
          helperText={formErrors.Password}
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={togglePasswordVisibility}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          style={{ marginTop: "16px" }}
        >
          Sign In
        </Button>
      </Grid>

    </Grid>
  );
};

export default DrawerSignIn;
