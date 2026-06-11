import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import BASE_URL from "Base/api";
import { ProjectNo } from "Base/catelogue";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useLoggedUserCompanyLetterhead from "@/hooks/useLoggedUserCompanyLetterhead";

const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch (error) {
    return "-";
  }
};

const formatQty = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "0";
  }

  return Number.isInteger(numericValue)
    ? numericValue.toString()
    : numericValue.toFixed(2);
};

const formatAmount = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "0.00";
  }

  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const FIRST_PAGE_ROW_LIMIT = 4;
const NEXT_PAGE_ROW_LIMIT = 10;

export default function PurchaseOrderPrintPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const purchaseOrderId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(true);
  const [sidebarLogo, setSidebarLogo] = useState("");

  const { companyData } = useLoggedUserCompanyLetterhead();

  useEffect(() => {
    if (!router.isReady || !purchaseOrderId) {
      return;
    }

    const fetchPurchaseOrder = async () => {
      try {
        setLoadingPurchaseOrder(true);

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(
          `${BASE_URL}/GoodReceivedNote/GetPurchaseOrderById?id=${purchaseOrderId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (response.ok && data?.statusCode === 200) {
          setPurchaseOrderData(data.result);
        } else {
          toast.error(data?.message || "Failed to load purchase order.");
        }
      } catch (error) {
        console.error("Error fetching purchase order:", error);
        toast.error("Failed to load purchase order.");
      } finally {
        setLoadingPurchaseOrder(false);
      }
    };

    fetchPurchaseOrder();
  }, [purchaseOrderId, router.isReady]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouseId =
      localStorage.getItem("warehouse") || purchaseOrderData?.warehouseId;
    const token = localStorage.getItem("token");

    if (!warehouseId || !token) {
      return;
    }

    const fetchWarehouse = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Warehouse/GetWarehouseById?Id=${warehouseId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (response.ok && data?.statusCode === 200) {
          setWarehouseData(data.result);
        }
      } catch (error) {
        console.error("Error fetching warehouse details:", error);
      }
    };

    fetchWarehouse();
  }, [purchaseOrderData?.warehouseId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouse =
      localStorage.getItem("warehouse") || purchaseOrderData?.warehouseId;
    const token = localStorage.getItem("token");

    if (!warehouse || !token) {
      return;
    }

    const fetchSidebarLogo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouse}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch company logo");
        }

        const data = await response.json();
        setSidebarLogo(data.logoUrl || "");
      } catch (error) {
        console.error("Error fetching sidebar logo:", error);
        setSidebarLogo("");
      }
    };

    fetchSidebarLogo();
  }, [purchaseOrderData?.warehouseId]);

  const lineItems = purchaseOrderData?.goodReceivedNoteLineDetails ?? [];
  /**
   * Field semantics (open PO): see getQtyForLineAmount — line cost/discount qty matches
   * Purchase Order Edit (Local: `qty`; Import: `receivedQty`). Order display still uses `getOrderQty`.
   */
  const poType = purchaseOrderData?.type ?? purchaseOrderData?.purchasingOrderType;
  const isLocalPO = poType == 1;

  const getOrderQty = (item) =>
    Number(item.poQty ?? item.orderedQty ?? item.qty ?? 0);

  const getReceivedQty = (item) => {
    if (isLocalPO) {
      return item.isAllReceived ? Number(item.qty ?? 0) : 0;
    }
    return Number(item.receivedQty ?? 0);
  };

  /** Qty for line cost & discount — matches Purchase Order Edit (Local: line qty; Import: received qty). */
  const getQtyForLineAmount = (item) => {
    if (isLocalPO) {
      return Number(item.qty ?? 0);
    }
    return Number(item.receivedQty ?? 0);
  };

  /** Line amount before discount (shown in Total Cost column). */
  const getLineGross = (item) =>
    Number(item.costPrice ?? 0) * getQtyForLineAmount(item);

  const getLineDiscount = (item) => {
    const rate = Number(item.discountRate ?? 0);
    const amount = Number(item.discountAmount ?? 0);
    if (rate > 0) {
      return (getLineGross(item) * rate) / 100;
    }
    return amount > 0 ? amount : 0;
  };

  /** Line amount after discount (Grand Total sums this). */
  const getLineTotal = (item) => {
    const fromDb =
      item.lineTotal && Number(item.lineTotal) > 0 ? Number(item.lineTotal) : null;
    if (fromDb != null && !Number.isNaN(fromDb)) {
      return fromDb;
    }
    return Math.max(getLineGross(item) - getLineDiscount(item), 0);
  };

  const totalQty = useMemo(
    () => lineItems.reduce((sum, item) => sum + getOrderQty(item), 0),
    [lineItems]
  );
  const totalDiscount = useMemo(
    () => lineItems.reduce((sum, item) => sum + getLineDiscount(item), 0),
    [lineItems, isLocalPO]
  );
  const totalCost = useMemo(
    () => lineItems.reduce((sum, item) => sum + getLineTotal(item), 0),
    [lineItems, isLocalPO]
  );

  const companyAddressLines = useMemo(
    () =>
      [
        warehouseData?.addressLine1,
        warehouseData?.addressLine2,
        warehouseData?.addressLine3,
      ].filter(Boolean),
    [warehouseData]
  );

  const companyContactLines = useMemo(() => {
    const lines = [];
    const phoneNumbers = [
      warehouseData?.contactNumber,
      warehouseData?.contactNumber2,
      warehouseData?.contactNumber3,
      companyData?.contactNumber,
    ].filter((value, index, arr) => value && arr.indexOf(value) === index);

    if (phoneNumbers.length > 0) {
      lines.push(phoneNumbers.join(" / "));
    }

    if (warehouseData?.email1) {
      lines.push(`Email: ${warehouseData.email1}`);
    }

    return lines;
  }, [companyData?.contactNumber, warehouseData]);

  const companyLogoSrc =
    sidebarLogo || (ProjectNo === 1 ? "/images/cbass.png" : "/images/db-logo.png");

  const paginatedLineItems = useMemo(() => {
    if (lineItems.length === 0) {
      return [[]];
    }

    const pages = [];
    let startIndex = 0;

    pages.push(lineItems.slice(startIndex, startIndex + FIRST_PAGE_ROW_LIMIT));
    startIndex += FIRST_PAGE_ROW_LIMIT;

    while (startIndex < lineItems.length) {
      pages.push(lineItems.slice(startIndex, startIndex + NEXT_PAGE_ROW_LIMIT));
      startIndex += NEXT_PAGE_ROW_LIMIT;
    }

    return pages;
  }, [lineItems]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) {
      return;
    }

    try {
      const pageElements = contentRef.current.querySelectorAll(
        '[data-po-pdf-page="true"]'
      );

      if (pageElements.length === 0) {
        toast.error("No printable pages found.");
        return;
      }

      const images = contentRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
          });
        })
      );

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      for (let index = 0; index < pageElements.length; index += 1) {
        const canvas = await html2canvas(pageElements[index], {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      pdf.save(
        `Purchase_Order_${
          purchaseOrderData?.purchaseOrderNo || documentNumber || "document"
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const currentDate = format(new Date(), "dd-MMM-yyyy");

  const colFlex = {
    product: 1.35,
    batch: 0.85,
    exp: 0.95,
    orderQty: 0.68,
    recvQty: 0.75,
    cost: 0.8,
    selling: 0.8,
    discountPct: 0.65,
    discountAmt: 0.85,
    total: 1.0,
  };

  const headerSx = {
    fontSize: { xs: "0.5rem", sm: "0.78rem" },
  };
  const cellSx = {
    fontSize: { xs: "0.5rem", sm: "0.76rem" },
  };

  const renderTable = (items, isLastPage) => (
    <Box sx={{ mb: { xs: 2, sm: 3 }, borderTop: "2px solid #333", borderBottom: "2px solid #333" }}>
      <Box
        sx={{
          display: "flex",
          padding: { xs: "6px 4px", sm: "10px 6px" },
          fontWeight: 600,
          borderBottom: "1px solid #333",
          color: "black",
        }}
      >
        <Box sx={{ flex: colFlex.product, ...headerSx }}>Product</Box>
        <Box sx={{ flex: colFlex.batch, ...headerSx }}>Batch</Box>
        <Box sx={{ flex: colFlex.exp, ...headerSx }}>Exp Date</Box>
        <Box sx={{ flex: colFlex.orderQty, textAlign: "right", ...headerSx }}>
          Order Qty
        </Box>
        <Box sx={{ flex: 1, textAlign: "right", fontSize: { xs: "0.52rem", sm: "0.82rem" } }}>
          Cost Price
        </Box>
        <Box sx={{ flex: colFlex.discountPct, textAlign: "right", ...headerSx }}>
          Dis%
        </Box>
        <Box sx={{ flex: colFlex.discountAmt, textAlign: "right", ...headerSx }}>
          Dis Amt
        </Box>
        <Box sx={{ flex: colFlex.total, textAlign: "right", ...headerSx }}>
          Total Cost
        </Box>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ padding: "16px" }}>
          <Typography sx={{ textAlign: "center", fontSize: { xs: "0.58rem", sm: "0.82rem" } }}>
            No items available
          </Typography>
        </Box>
      ) : (
        items.map((item, index) => {
          const free = Number(item.free ?? 0);
          const status = item.status && item.status !== "Approval" ? item.status : "";
          const hasSubLine = free > 0 || status;

          return (
            <Box
              key={item.id || `${item.productCode}-${index}`}
              sx={{
                padding: { xs: "5px 4px", sm: "6px 6px" },
                borderBottom: index === items.length - 1 ? "none" : "1px solid #cfcfcf",
              }}
            >
              <Box sx={{ display: "flex" }}>
                <Box sx={{ flex: colFlex.product, ...cellSx }}>
                  {item.productName || item.productCode || "-"}
                </Box>
                <Box sx={{ flex: colFlex.batch, ...cellSx }}>{item.batch || "-"}</Box>
                <Box sx={{ flex: colFlex.exp, ...cellSx }}>
                  {item.expDate ? formatDisplayDate(item.expDate) : "-"}
                </Box>
                <Box sx={{ flex: colFlex.orderQty, textAlign: "right", ...cellSx }}>
                  {formatQty(getOrderQty(item))}
                </Box>
                <Box sx={{ flex: colFlex.cost, textAlign: "right", ...cellSx }}>
                  {formatAmount(item.costPrice)}
                </Box>
                <Box sx={{ flex: colFlex.discountPct, textAlign: "right", ...cellSx }}>
                  {formatAmount(Number(item.discountRate ?? 0))}
                </Box>
                <Box sx={{ flex: colFlex.discountAmt, textAlign: "right", ...cellSx }}>
                  {formatAmount(getLineDiscount(item))}
                </Box>
                <Box
                  sx={{
                    flex: colFlex.total,
                    textAlign: "right",
                    ...cellSx,
                    fontWeight: 600,
                  }}
                >
                  {formatAmount(getLineGross(item))}
                </Box>
              </Box>

              {hasSubLine && (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: { xs: 1, sm: 2 },
                    mt: 0.4,
                    pl: 0.5,
                    color: "#555",
                    fontSize: { xs: "0.46rem", sm: "0.68rem" },
                    fontStyle: "italic",
                  }}
                >
                  {free > 0 && <span>Free: {formatQty(free)}</span>}
                  {status && <span>Status: {status}</span>}
                </Box>
              )}
            </Box>
          );
        })
      )}

      {isLastPage && items.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            padding: { xs: "6px 4px", sm: "8px 6px" },
            borderTop: "1px solid #333",
            gap: 0.4,
          }}
        >
          {totalDiscount > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                fontSize: { xs: "0.54rem", sm: "0.8rem" },
              }}
            >
              <Box sx={{ fontWeight: 600 }}>Total Discount:</Box>
              <Box sx={{ minWidth: "80px", textAlign: "right" }}>
                {formatAmount(totalDiscount)}
              </Box>
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              fontSize: { xs: "0.56rem", sm: "0.86rem" },
              fontWeight: 700,
            }}
          >
            <Box>Grand Total:</Box>
            <Box sx={{ minWidth: "80px", textAlign: "right" }}>
              {formatAmount(totalCost)}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderPageContent = (items, pageIndex, isLastPage) => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          gap: { xs: 1.5, sm: 3 },
          mb: { xs: 2, sm: 3 },
          borderBottom: "1px solid #d9d9d9",
          pb: 2,
        }}
      >
        <Box sx={{ width: { xs: "135px", sm: "220px" }, flexShrink: 0 }}>
          <img
            src={companyLogoSrc}
            alt="Company logo"
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
          />
        </Box>
        <Box sx={{ flex: 1, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.25rem" },
              lineHeight: 1.2,
            }}
          >
            {companyData?.name || warehouseData?.name || "Company"}
          </Typography>
          {companyAddressLines.map((line) => (
            <Typography
              key={line}
              sx={{
                fontSize: { xs: "0.62rem", sm: "0.82rem" },
                lineHeight: 1.3,
              }}
            >
              {line}
            </Typography>
          ))}
          {companyContactLines.map((line) => (
            <Typography
              key={line}
              sx={{
                fontSize: { xs: "0.62rem", sm: "0.82rem" },
                lineHeight: 1.3,
                fontWeight: 600,
              }}
            >
              {line}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ borderTop: "2px solid #333", borderBottom: "2px solid #333", py: 1, mb: 2 }}>
        <Typography
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            fontSize: { xs: "1rem", sm: "1.5rem" },
            lineHeight: 1.2,
          }}
        >
          {pageIndex === 0 ? "PURCHASE ORDER" : "PURCHASE ORDER (CONT.)"}
        </Typography>
      </Box>

      {pageIndex === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: { xs: 2, sm: 2.5 },
            flexDirection: { xs: "column", sm: "row" },
            gap: 4,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {[
              ["Supplier", purchaseOrderData?.supplierName || "-"],
              ["Warehouse", purchaseOrderData?.warehouseName || warehouseData?.name || "-"],
              [
                "Purchase Order Type",
                purchaseOrderData?.purchasingOrderType === 2 ? "Import" : "Local",
              ],
              [
                "Payment",
                purchaseOrderData?.isCredit ? "Credit" : "Cash",
              ],
            ].map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "120px 12px 1fr", sm: "170px 16px 1fr" },
                  alignItems: "start",
                  mb: 1,
                  columnGap: 1,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>
                  {label}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>
                  :
                </Typography>
                <Typography sx={{ fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ flex: 1 }}>
            {[
              ["Date", formatDisplayDate(purchaseOrderData?.poDate) || currentDate],
              [
                "Document No",
                purchaseOrderData?.purchaseOrderNo ||
                  purchaseOrderData?.documentNo ||
                  documentNumber ||
                  "-",
              ],
              ["Reference No", purchaseOrderData?.referanceNo || "-"],
              [
                "GRN Date",
                formatDisplayDate(
                  purchaseOrderData?.grnDate ?? purchaseOrderData?.poDate
                ),
              ],
            ].map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "120px 12px 1fr", sm: "130px 16px 1fr" },
                  alignItems: "start",
                  mb: 1,
                  columnGap: 1,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>
                  {label}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>
                  :
                </Typography>
                <Typography sx={{ fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {renderTable(items, isLastPage)}

      {isLastPage && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            columnGap: 2,
            rowGap: 0.4,
            fontSize: { xs: "0.62rem", sm: "0.84rem" },
          }}
        >
          <Typography sx={{ fontSize: "inherit" }}>
            <strong>Total Products:</strong> {lineItems.length}
          </Typography>
          <Typography sx={{ fontSize: "inherit" }}>
            <strong>Total Qty:</strong> {formatQty(totalQty)}
          </Typography>
          {totalDiscount > 0 && (
            <Typography sx={{ fontSize: "inherit" }}>
              <strong>Total Discount:</strong> {formatAmount(totalDiscount)}
            </Typography>
          )}
          <Typography sx={{ fontSize: "inherit" }}>
            <strong>Grand Total:</strong> {formatAmount(totalCost)}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        "@media print": {
          padding: 0,
          backgroundColor: "#fff",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          paddingX: 2,
          display: "flex",
          flexDirection: "column",
          "@media print": {
            maxWidth: "100%",
            borderRadius: 0,
            boxShadow: "none",
            paddingX: 0,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginBottom: 1,
            paddingBottom: 1,
            borderBottom: "2px solid #e0e0e0",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
            "@media print": {
              display: "none",
            },
          }}
          mt={5}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "stretch", sm: "flex-end" },
              gap: 1,
            }}
          >
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ textTransform: "none" }}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleDownloadPDF}
                sx={{ textTransform: "none" }}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
        </Box>

        <Box mb={5} ref={contentRef}>
          {loadingPurchaseOrder ? (
            <Box
              sx={{
                width: { xs: "100%", sm: "210mm" },
                minHeight: { xs: "auto", sm: "297mm" },
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading purchase order...
              </Typography>
            </Box>
          ) : purchaseOrderData ? (
            paginatedLineItems.map((items, pageIndex) => {
              const isLastPage = pageIndex === paginatedLineItems.length - 1;

              return (
                <Box
                  key={`po-page-${pageIndex}`}
                  data-po-pdf-page="true"
                  sx={{
                    width: { xs: "100%", sm: "210mm" },
                    minHeight: { xs: "auto", sm: "297mm" },
                    maxWidth: "100%",
                    margin: "0 auto",
                    marginBottom: { xs: 2, sm: isLastPage ? 0 : 4 },
                    position: "relative",
                    backgroundColor: "white",
                    padding: "0.5in",
                    boxSizing: "border-box",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    pageBreakAfter: isLastPage ? "auto" : "always",
                    breakAfter: isLastPage ? "auto" : "page",
                    "@media print": {
                      margin: 0,
                      marginBottom: 0,
                      boxShadow: "none",
                      padding: "0.5in",
                      boxSizing: "border-box",
                      pageBreakAfter: isLastPage ? "auto" : "always",
                      breakAfter: isLastPage ? "auto" : "page",
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      mx: "auto",
                      boxSizing: "border-box",
                      backgroundColor: "transparent",
                      flex: 1,
                    }}
                  >
                    {renderPageContent(items, pageIndex, isLastPage)}
                  </Box>
                  <Typography
                    sx={{
                      mt: 2,
                      pt: 1,
                      borderTop: "1px solid #d9d9d9",
                      textAlign: "center",
                      fontSize: { xs: "0.62rem", sm: "0.8rem" },
                      fontWeight: 600,
                    }}
                  >
                    Powered By : CBASS-AI
                  </Typography>
                </Box>
              );
            })
          ) : (
            <Box
              sx={{
                width: { xs: "100%", sm: "210mm" },
                minHeight: { xs: "auto", sm: "297mm" },
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="body2" color="error">
                Failed to load purchase order
              </Typography>
            </Box>
          )}
        </Box>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Box>
    </Box>
  );
}
