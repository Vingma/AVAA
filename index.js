import fs from "fs";
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { createAuthenticatedClient, isFinalizedGrant } from "@interledger/open-payments";

const app = express();
const port = 3000;


app.set("view engine", "ejs");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set("views", join(__dirname, "views"));

app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/services", (req, res) => {
    res.render("services");
});

app.get("/transferences", (req, res) => {
    res.render("transferences");
});

app.post("/api/create-payment", async (req, res) => {

    try {
        const { walletName, amount } = req.body;

        console.log("Received request to create payment:");

        const privateKey = fs.readFileSync("private.key", "utf-8");
        const client = await createAuthenticatedClient({
            walletAddressUrl: "https://ilp.interledger-test.dev/platziclientava",
            privateKey,
            keyId: "d39cef22-7b90-4c20-b704-b239e95952e3",
        });
        const url = "https://ilp.interledger-test.dev/" + walletName;
        const receivingWallet = await client.walletAddress.get({ url })

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }
        

        incomingPayment = await client.incomingPayment.create(
            {
                url: receivingWallet.url,
                accessToken: grant.access_token.value
            },
            {
                walletAddress: receivingWallet.walletAddress,
                incomingAmount: {
                    value: "1000",
                    assetCode: "USD",
                    assetScale: 2
                }
            }
        )

        res.json({ incomingPaymentUrl: incomingPayment.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log("El servidor está funcionando http://localhost:" + port)
});