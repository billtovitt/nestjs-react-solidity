import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { formatDate } from "./utils/usage";
import { serverURL } from "./config";

const columns = [
  { field: "id", headerName: "ID", width: 50 },
  {
    field: "owner",
    headerName: "Owner",
    type: "number",
    width: 350,
    editable: false,
  },
  {
    field: "amount",
    headerName: "Token Amount",
    type: "number",
    width: 300,
    editable: false,
  },
  {
    field: "type",
    headerName: "Type",
    width: 200,
    editable: false,
    valueGetter: (params) =>
      `${
        params.row.type === 1
          ? "Staking"
          : params.row.type === 2
          ? "UnStaking"
          : "Claim"
      }`,
  },
  {
    field: "time",
    headerName: "Action time",
    width: 200,
    editable: false,
    valueGetter: (params) => formatDate(params.row.time),
  },
];

export default function TransactionTable({ actioned }) {
  // Transaction data
  const [transactionData, setTransactionData] = useState([]);

  const initData = () => {
    setTimeout(async () => {
      // Fetch Data
      const baseURL = `${serverURL}transactions`;
      var response = await axios.get(baseURL);
      setTransactionData(response.data);
    }, 3000);
  };

  useEffect(() => {
    initData();
  }, [actioned]);

  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={transactionData}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  );
}
