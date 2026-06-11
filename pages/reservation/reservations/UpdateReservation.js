import React, { useEffect, useState } from "react";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  AppBar,
  Checkbox,
  Grid,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Form, Formik } from "formik";
import PropTypes from "prop-types";
import { formatDate } from "@/components/utils/formatHelper";
import { getAppointment } from "@/components/types/types";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "min(96vw, 520px)", sm: "min(92vw, 720px)", lg: "min(96vw, 980px)" },
  maxHeight: "92vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: { xs: 2, sm: 3 },
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
  outline: "none",
};

const tabPanelStyle = {
  flex: 1,
  minHeight: 0,
  maxHeight: { xs: "min(62vh, 520px)", sm: "min(65vh, 560px)", lg: "min(62vh, 580px)" },
  overflowY: "auto",
  px: { xs: 0.5, sm: 0 },
};

const FUNCTION_TYPE_LABELS = {
  1: "Wedding",
  2: "Home Coming",
  3: "Wedding & Home Coming",
  4: "Normal Dressing",
  5: "Photo Shoot",
  6: "Outfit Only",
  7: "Engagement",
};
const PREFERRED_TIME_LABELS = { 1: "Morning", 2: "Evening" };
const BRIDAL_LABELS = {
  1: "Kandyan",
  2: "Indian",
  3: "Western",
  4: "Hindu",
};
const LOCATION_LABELS = { 1: "Studio", 2: "Away", 3: "Overseas" };

function DetailLine({ label, children }) {
  const empty =
    children === undefined ||
    children === null ||
    (typeof children === "string" && children.trim() === "");
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
        {empty ? "—" : children}
      </Typography>
    </Grid>
  );
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 1 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function UpdateReservation({ reservation, fetchItems, approve1 }) {
  const [open, setOpen] = useState(false);
  const [isGoingAway, setIsGoingAway] = useState(
    reservation.reservationDetails.isGoingAway
  );
  const [isHomeComing, setIsHomeComing] = useState(
    reservation.reservationDetails.isHomeComing
  );

  const handleOpen = () => setOpen(true);
  const theme = useTheme();
  const [homeComingBridalTypeValue, setHomeComingBridalTypeValue] = useState(1);
  const [homeComingLocationValue, setHomeComingLocationValue] = useState(1);
  const [homeComingPreferedTimeValue, setHomeComingPreferedTimeValue] = useState();
  const [paymentCode, setPaymentCode] = useState(reservation?.paymentCode || "");
  const [initialPaymentDate, setInitialPaymentDate] = useState(
    reservation?.initialPaymentDate ? formatDate(reservation.initialPaymentDate) : ""
  );


  const [value, setValue] = useState(0);
  const [dressingRows, setDressingRows] = useState(() => {
    const initialRows = [
      {
        DressingType: 1,
        label: "Bride",
        StartTime: "",
        EndTime: "",
        Remark: "",
      },
      {
        DressingType: 2,
        label: "Maids",
        StartTime: "",
        EndTime: "",
        Remark: "",
      },
      { DressingType: 3, label: "Touch Up", StartTime: "", EndTime: "", Remark: "" },
      {
        DressingType: 4,
        label: "Touch Up 2",
        StartTime: "",
        EndTime: "",
        Remark: "",
      },
      {
        DressingType: 5,
        label: "Going Away",
        StartTime: "",
        EndTime: "",
        Remark: "",
      },
      {
        DressingType: 6,
        label: "Home Coming",
        StartTime: "",
        EndTime: "",
        Remark: "",
      },
    ];

    if (reservation?.reservationDressingTime) {
      return initialRows.map((row) => {
        const matchingReservation = reservation.reservationDressingTime.find(
          (res) => res.dressingType === row.DressingType
        );

        if (matchingReservation) {
          return {
            ...row,
            StartTime: matchingReservation.startTime,
            EndTime: matchingReservation.endTime,
            Remark: matchingReservation.remark,
          };
        }

        return row;
      });
    }

    return initialRows;
  });
  const [nextAppointment, setNextAppointment] = useState(1);
  const [appointments, setAppointments] = useState(() => {
    const initialAppointments = [
      {
        AppointmentType: 1,
        label: "First",
        StartDate: "",
        EndDate: "",
        IsAppointmentTypeChecked: false,
        Remark: "",
        isDisabled: false,
      },
      {
        AppointmentType: 2,
        label: "Show Saree",
        StartDate: "",
        EndDate: "",
        IsAppointmentTypeChecked: false,
        Remark: "",
        isDisabled: true,
      },
      {
        AppointmentType: 3,
        label: "Fabric & Design",
        StartDate: "",
        EndDate: "",
        IsAppointmentTypeChecked: false,
        Remark: "",
        isDisabled: true,
      },
      {
        AppointmentType: 4,
        label: "Measurement",
        StartDate: "",
        EndDate: "",
        IsAppointmentTypeChecked: false,
        Remark: "",
        isDisabled: true,
      },
      {
        AppointmentType: 5,
        label: "Fiton",
        StartDate: "",
        EndDate: "",
        IsAppointmentTypeChecked: false,
        Remark: "",
        isDisabled: true,
      },
      {
        AppointmentType: 6,
        label: "Trail",
        StartDate: "",
        EndDate: "",
        IsAppointmentTypeChecked: false,
        Remark: "",
        isDisabled: true,
      },
    ];

    if (reservation?.reservationAppointment) {
      return initialAppointments.map((appointment) => {
        const matchingAppointment = reservation.reservationAppointment.find(
          (res) => res.appointmentType === appointment.AppointmentType
        );

        if (matchingAppointment) {
          return {
            ...appointment,
            StartDate: formatDate(matchingAppointment.startDate),
            EndDate: formatDate(matchingAppointment.endDate),
            Remark: matchingAppointment.remark,
            IsAppointmentTypeChecked:
              matchingAppointment.isAppointmentTypeChecked,
            isDisabled: matchingAppointment.isAppointmentTypeChecked,
          };
        }

        return appointment;
      });
    }

    return initialAppointments;
  });

  const handleInputChange = (index, field, value) => {
    const updatedRows = dressingRows.map((row, i) => {
      if (i === index || (index === 0 && i === 1)) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setDressingRows(updatedRows);
  };

  const handleAppointmentChange = async (index, field, value) => {
    const updatedRows = appointments.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }

      setNextAppointment(index + 1);
      return row;
    });

    await setAppointments(updatedRows);
  };

  const handleSubmit = async (values) => {
    const uncheckedLabelsInMiddle = [];
    let foundUnchecked = false;

    for (let i = 0; i < appointments.length; i++) {
      if (!appointments[i].IsAppointmentTypeChecked) {
        foundUnchecked = true;
        uncheckedLabelsInMiddle.push(appointments[i].AppointmentType);
      } else if (foundUnchecked) {
        const readableLabels = uncheckedLabelsInMiddle.map(getAppointment).join(", ");
        toast.warning(`Please select ${readableLabels} appointment(s) to continue.`);
        return;
      }
    }
    const postData = {
      Id: reservation.id,
      DocumentNo: reservation.documentNo,
      ReservationFunctionType: values.ReservationFunctionType,
      ReservationDate: values.ReservationDate,
      CustomerName: values.CustomerName,
      GroomName: values.GroomName,
      Description: reservation.description,
      MobileNo: values.MobileNo.toString(),
      NIC: values.NIC.toString(),
      EmergencyContactNo: values.EmergencyContactNo.toString(),
      PreferdTime: values.PreferedTime,
      BridleType: values.BridalType,
      Location: values.Location,
      Type: reservation.type,
      IsExpire: reservation.isExpire,
      ExpireProcessDate: null,
      NextAppointmentType: nextAppointment,
      PaymentCode: paymentCode || "",
      InitialPaymentDate: initialPaymentDate || null,
      HomeComingDate: isHomeComing ? values.ReservationDetails.HomeComingDate : null,
      HomeComingBridleType: isHomeComing ? values.HomeComingBridleType : null,
      HomeComingLocation: isHomeComing ? values.HomeComingLocation : null,
      HomeComingPreferredTime: isHomeComing ? values.HomeComingPreferredTime : null,
      ReservationDetails: {
        WeddingVenue: values.ReservationDetails.WeddingVenue || null,
        DressingVenue: values.ReservationDetails.DressingVenue || null,
        AddressLine1: values.ReservationDetails.AddressLine1 || null,
        AddressLine2: values.ReservationDetails.AddressLine2 || null,
        AddressLine3: values.ReservationDetails.AddressLine3 || null,
        WeddingDayContactPerson:
          values.ReservationDetails.WeddingDayContactPerson,
        WeddingDayContactPersonNo:
          values.ReservationDetails.WeddingDayContactPersonNo.toString(),
        Remark: values.ReservationDetails.Remark || null,
        IsGoingAway: isGoingAway,
        IsHomeComing: isHomeComing,
        GoingAwayOutfit: values.ReservationDetails.GoingAwayOutfit || null,
        GoingAwayOutfitBy: values.ReservationDetails.GoingAwayOutfitBy || null,
        HomeComingDate: values.ReservationDetails.HomeComingDate || null,
        HomeComingOutfit: values.ReservationDetails.HomeComingOutfit || null,
        HomeComingOutfitBy: values.ReservationDetails.HomeComingOutfitBy || null,
        HomeComingVenue: values.ReservationDetails.HomeComingVenue || null,
        GoingAwayDressingVenue:
          values.ReservationDetails.GoingAwayDressingVenue || null,
        GroomsOutfit: values.ReservationDetails.GroomsOutfit || null,
        GroomsOutfitBy: values.ReservationDetails.GroomsOutfitBy || null,
        MaidsOutfitBy: values.ReservationDetails.MaidsOutfitBy || null,
        GAOutfitBy: values.ReservationDetails.GAOutfitBy || null,
        BouquetsBy: values.ReservationDetails.BouquetsBy || null,
        WedOutfitBy: values.ReservationDetails.WedOutfitBy || null,
        FGOutfitBy: values.ReservationDetails.FGOutfitBy || null,
        FGOutfit: values.ReservationDetails.FGOutfit || null,
        HCOutfitBy: values.ReservationDetails.HCOutfitBy || null,
        Photographer: values.ReservationDetails.Photographer || null,
        Maids: values.ReservationDetails.Maids || null,
        LittleMaids: values.ReservationDetails.LittleMaids || null,
        FlowerGirls: values.ReservationDetails.FlowerGirls || null,
        PupilMaids: values.ReservationDetails.PupilMaids || null,
      },
      ReservationAppointment: appointments.map((appointment) => ({
        IsAppointmentTypeChecked: appointment.IsAppointmentTypeChecked,
        AppointmentType: appointment.AppointmentType,
        StartDate: appointment.StartDate ? appointment.StartDate : null,
        EndDate: appointment.EndDate ? appointment.EndDate : null,
        Remark: appointment.Remark,
      })),
      ReservationDressingTime: dressingRows.map((dressing) => ({
        DressingType: dressing.DressingType,
        StartTime: dressing.StartTime ? dressing.StartTime : null,
        EndTime: dressing.EndTime ? dressing.EndTime : null,
        Remark: dressing.Remark,
      })),
    };

    try {
      const response = await fetch(
        `${BASE_URL}/Reservation/UpdateReservation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      const responseData = await response.json();

      if (responseData.statusCode === 200) {
        toast.success(responseData.message || responseData.result?.message || "Success");
        setOpen(false);
        fetchItems();
      } else {
        toast.error(responseData.message || responseData.result?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("An error occurred while processing the request");
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    const isHomecoming = reservation.reservationFunctionType === 3;
    setIsHomeComing(isHomecoming);
    const bridal = reservation.homeComingBridleType ? reservation.homeComingBridleType : 1;
    const location = reservation.homeComingLocation ? reservation.homeComingLocation : 1;
    const pref = reservation.homeComingPreferredTime ? reservation.homeComingPreferredTime : 1;
    setHomeComingBridalTypeValue(bridal);
    setHomeComingLocationValue(location);
    setHomeComingPreferedTimeValue(pref);
  }, [reservation]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip sx={{ width: '30px', height: '30px' }} title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, flexShrink: 0 }}>
            Edit reservation
          </Typography>
          <Formik
            initialValues={{
              Id: reservation?.id || "",
              ReservationFunctionType:
                reservation.reservationFunctionType || null,
              ReservationDate: reservation?.reservationDate || "",
              CustomerName: reservation?.customerName || "",
              GroomName: reservation?.groomName || "",
              Description: reservation?.description || "",
              MobileNo: reservation?.mobileNo || "",
              EmergencyContactNo: reservation?.emergencyContactNo || "",
              NIC: reservation?.nic || "",
              PreferedTime: reservation?.preferdTime || 1,
              BridalType: reservation?.bridleType || 1,
              Location: reservation?.location || 1,
              Type: reservation?.type || "",
              IsExpire: false,
              HomeComingBridleType: reservation?.homeComingBridleType || 1,
              HomeComingPreferredTime: reservation?.homeComingPreferredTime || 1,
              HomeComingLocation: reservation?.homeComingLocation || 1,
              ExpireProcessDate: reservation?.expireProcessDate || "",
              NextAppointmentType: reservation?.nextAppointmentType || "",
              ReservationDetails: {
                WeddingVenue: reservation.reservationDetails.weddingVenue || "",
                DressingVenue:
                  reservation?.reservationDetails?.dressingVenue || "",
                AddressLine1:
                  reservation?.reservationDetails?.addressLine1 || "",
                AddressLine2:
                  reservation?.reservationDetails?.addressLine2 || "",
                AddressLine3:
                  reservation?.reservationDetails?.addressLine3 || "",
                WeddingDayContactPerson:
                  reservation?.reservationDetails?.weddingDayContactPerson ||
                  "",
                WeddingDayContactPersonNo:
                  reservation?.reservationDetails?.weddingDayContactPersonNo ||
                  "",
                Remark: reservation?.reservationDetails?.remark || "",
                IsGoingAway: false,
                IsHomeComing: false,
                HomeComingDate:
                  reservation?.reservationDetails?.homeComingDate || "",
                HomeComingVenue:
                  reservation?.reservationDetails?.homeComingVenue || "",
                HomeComingOutfit:
                  reservation?.reservationDetails?.homeComingOutfit || "",
                HomeComingOutfitBy:
                  reservation?.reservationDetails?.homeComingOutfitBy || "",
                GoingAwayDressingVenue:
                  reservation?.reservationDetails?.goingAwayDressingVenue || "",
                GoingAwayOutfit:
                  reservation?.reservationDetails?.goingAwayOutfit || "",
                GoingAwayOutfitBy:
                  reservation?.reservationDetails?.goingAwayOutfitBy || "",
                GroomsOutfit:
                  reservation?.reservationDetails?.groomsOutfit || "",
                GroomsOutfitBy:
                  reservation?.reservationDetails?.groomsOutfitBy || "",
                MaidsOutfitBy:
                  reservation?.reservationDetails?.maidsOutfitBy || "",
                GAOutfitBy: reservation?.reservationDetails?.gaOutfitBy || "",
                BouquetsBy: reservation?.reservationDetails?.bouquetsBy || "",
                WedOutfitBy: reservation?.reservationDetails?.wedOutfitBy || "",
                FGOutfitBy: reservation?.reservationDetails?.fgOutfitBy || "",
                FGOutfit: reservation?.reservationDetails?.fgOutfit || "",
                HCOutfitBy: reservation?.reservationDetails?.hcOutfitBy || "",
                Photographer:
                  reservation?.reservationDetails?.photographer || "",
                Maids: reservation?.reservationDetails?.maids || "",
                LittleMaids: reservation?.reservationDetails?.littleMaids || "",
                FlowerGirls: reservation?.reservationDetails?.flowerGirls || "",
                PupilMaids: reservation?.reservationDetails?.pupilMaids || "",
              },
            }}
            onSubmit={(values, { resetForm }) => {
              handleSubmit(values);
              resetForm();
            }}
          >
            {({ values }) => {
              const canEditPayment = !!approve1;
              return (
              <Form>
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <AppBar
                    position="static"
                    elevation={0}
                    sx={{ bgcolor: "transparent", color: "text.primary" }}
                  >
                    <Tabs
                      value={value}
                      onChange={handleChange}
                      indicatorColor="primary"
                      variant="scrollable"
                      scrollButtons="auto"
                      allowScrollButtonsMobile
                      sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44 } }}
                      aria-label="Reservation tabs"
                    >
                      <Tab
                        label="General"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(0)}
                      />
                      <Tab
                        label="Outfit/Accessories & Retinue"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(1)}
                      />
                      <Tab
                        label="Dressing Time"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(2)}
                      />
                      <Tab
                        label="Appointments"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(3)}
                      />
                    </Tabs>
                  </AppBar>
                  <Box sx={tabPanelStyle}>
                    <TabPanel value={value} index={0} dir={theme.direction}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                        Customer details
                      </Typography>
                      <Grid container spacing={2} rowSpacing={1.75}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Payment code
                          </Typography>
                          <TextField
                            variant="standard"
                            value={paymentCode}
                            disabled={!canEditPayment}
                            onChange={(e) => setPaymentCode(e.target.value)}
                            fullWidth
                            size="small"
                          />
                          {!canEditPayment && (
                            <Typography variant="caption" color="text.secondary">
                              Edit permission required
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Initial payment date
                          </Typography>
                          <TextField
                            variant="standard"
                            type="date"
                            value={initialPaymentDate}
                            disabled={!canEditPayment}
                            onChange={(e) => setInitialPaymentDate(e.target.value)}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>

                        <DetailLine label="Wedding date">{formatDate(values.ReservationDate) || "—"}</DetailLine>
                        <DetailLine label="Event type">
                          {FUNCTION_TYPE_LABELS[values.ReservationFunctionType] ?? "—"}
                        </DetailLine>
                        <DetailLine label="Name of bride">{values.CustomerName}</DetailLine>
                        <DetailLine label="Name of groom">{values.GroomName}</DetailLine>
                        <DetailLine label="NIC / passport">{values.NIC}</DetailLine>
                        <DetailLine label="Contact no.">{values.MobileNo}</DetailLine>
                        <DetailLine label="Emergency contact">{values.EmergencyContactNo}</DetailLine>
                        <DetailLine label="Wedding venue">{values.ReservationDetails.WeddingVenue}</DetailLine>
                        <DetailLine label="Dressing venue">{values.ReservationDetails.DressingVenue}</DetailLine>
                        <DetailLine label="Preferred time">
                          {PREFERRED_TIME_LABELS[values.PreferedTime] ?? "—"}
                        </DetailLine>
                        <DetailLine label="Bridal type">
                          {BRIDAL_LABELS[values.BridalType] ?? "—"}
                        </DetailLine>
                        <DetailLine label="Location">
                          {LOCATION_LABELS[values.Location] ?? "—"}
                        </DetailLine>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                            Address
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "pre-line" }}>
                            {[values.ReservationDetails.AddressLine1, values.ReservationDetails.AddressLine2, values.ReservationDetails.AddressLine3]
                              .filter(Boolean)
                              .join("\n") || "—"}
                          </Typography>
                        </Grid>
                        <DetailLine label="Wedding day contact">{values.ReservationDetails.WeddingDayContactPerson}</DetailLine>
                        <DetailLine label="Wedding day contact no.">
                          {values.ReservationDetails.WeddingDayContactPersonNo}
                        </DetailLine>
                        <DetailLine label="Going away">{isGoingAway ? "Yes" : "No"}</DetailLine>
                        <DetailLine label="Home coming">{isHomeComing ? "Yes" : "No"}</DetailLine>
                        {isHomeComing ? (
                          <>
                            <DetailLine label="Home coming date">
                              {formatDate(values.ReservationDetails.HomeComingDate) || "—"}
                            </DetailLine>
                            <DetailLine label="Home coming venue">
                              {values.ReservationDetails.HomeComingVenue}
                            </DetailLine>
                            <DetailLine label="Home coming outfit">
                              {values.ReservationDetails.HomeComingOutfit}
                            </DetailLine>
                            <DetailLine label="Home coming outfit by">
                              {values.ReservationDetails.HomeComingOutfitBy}
                            </DetailLine>
                            <DetailLine label="Home coming preferred time">
                              {PREFERRED_TIME_LABELS[homeComingPreferedTimeValue] ?? "—"}
                            </DetailLine>
                            <DetailLine label="Home coming bridal type">
                              {BRIDAL_LABELS[homeComingBridalTypeValue] ?? "—"}
                            </DetailLine>
                            <DetailLine label="Home coming dressing location">
                              {LOCATION_LABELS[homeComingLocationValue] ?? "—"}
                            </DetailLine>
                          </>
                        ) : null}
                        {isGoingAway ? (
                          <>
                            <DetailLine label="Going away dressing venue">
                              {values.ReservationDetails.GoingAwayDressingVenue}
                            </DetailLine>
                            <DetailLine label="Going away outfit">
                              {values.ReservationDetails.GoingAwayOutfit}
                            </DetailLine>
                            <DetailLine label="Going away outfit by">
                              {values.ReservationDetails.GoingAwayOutfitBy}
                            </DetailLine>
                          </>
                        ) : null}
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                            Remark
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                            {values.ReservationDetails.Remark?.trim() ? values.ReservationDetails.Remark : "—"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={1} dir={theme.direction}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                        Outfit, accessories &amp; retinue
                      </Typography>
                      <Grid container spacing={2} rowSpacing={1.75}>
                        <DetailLine label="Groom&apos;s outfit">{values.ReservationDetails.GroomsOutfit}</DetailLine>
                        <DetailLine label="Groom&apos;s outfit by">{values.ReservationDetails.GroomsOutfitBy}</DetailLine>
                        <DetailLine label="Wed outfit by">{values.ReservationDetails.WedOutfitBy}</DetailLine>
                        <DetailLine label="F/G outfit">{values.ReservationDetails.FGOutfit}</DetailLine>
                        <DetailLine label="F/G outfit by">{values.ReservationDetails.FGOutfitBy}</DetailLine>
                        <DetailLine label="Maids outfit by">{values.ReservationDetails.MaidsOutfitBy}</DetailLine>
                        <DetailLine label="G/A outfit by">{values.ReservationDetails.GAOutfitBy}</DetailLine>
                        <DetailLine label="H/C outfit by">{values.ReservationDetails.HCOutfitBy}</DetailLine>
                        <DetailLine label="Bouquets by">{values.ReservationDetails.BouquetsBy}</DetailLine>
                        <DetailLine label="Photographer">{values.ReservationDetails.Photographer}</DetailLine>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ mt: 0.5, mb: 0 }}>
                            Retinue
                          </Typography>
                        </Grid>
                        <DetailLine label="Maids">{values.ReservationDetails.Maids}</DetailLine>
                        <DetailLine label="Flower girls">{values.ReservationDetails.FlowerGirls}</DetailLine>
                        <DetailLine label="Little maids">{values.ReservationDetails.LittleMaids}</DetailLine>
                        <DetailLine label="Pupil maids">{values.ReservationDetails.PupilMaids}</DetailLine>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={2} dir={theme.direction}>
                      <Grid container>
                        <Grid item xs={12}>
                          <TableContainer>
                            <Table fullWidth aria-label="simple table">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Dressing</TableCell>
                                  <TableCell>Start Time</TableCell>
                                  <TableCell>End Time</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {dressingRows.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="datetime-local"
                                        fullWidth
                                        value={row.StartTime}
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "StartTime",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="datetime-local"
                                        fullWidth
                                        value={row.EndTime}
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "EndTime",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={3} dir={theme.direction}>
                      <Grid container>
                        <Grid item xs={12}>
                          <TableContainer>
                            <Table fullWidth aria-label="simple table">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Completed</TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell>First Reserve Date</TableCell>
                                  <TableCell>Second Reserve Date</TableCell>
                                  <TableCell>Remark</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {appointments.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Checkbox
                                        checked={row.IsAppointmentTypeChecked}
                                        disabled={row.isDisabled}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "IsAppointmentTypeChecked",
                                            e.target.checked
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="date"
                                        fullWidth
                                        value={row.StartDate}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "StartDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="date"
                                        fullWidth
                                        value={row.EndDate}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "EndDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="text"
                                        fullWidth
                                        value={row.Remark}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "Remark",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </TabPanel>
                  </Box>
                </Box>
                <Box
                  sx={{
                    mt: "auto",
                    pt: 2,
                    flexShrink: 0,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                  display="flex"
                  justifyContent="space-between"
                >
                  <Button
                    variant="contained"
                    onClick={handleClose}
                    color="error"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
                    Save
                  </Button>
                </Box>
              </Form>
              );
            }}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
