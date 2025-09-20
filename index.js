import fs from "fs";
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { createAuthenticatedClient, isFinalizedGrant } from "@interledger/open-payments";
import { type } from "os";
import { start } from "repl";

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

app.get("/results", (req, res) => {
    res.render("results");
});

app.get("/donations", (req, res) => {
    res.render("donations");
});

app.get("/transferences", (req, res) => {
    res.render("transferences");
});

app.get("/menu", (req, res) => {
    res.render("menu");
});

app.get("/receive-money", (req, res) => {
    res.render("receive-money");
});

app.get("/receipts", (req, res) => {
    res.render("receipts");
});

app.get("/pay-services", (req, res) => {
    res.render("pay-services");
});

app.post("/api/create-payment", async (req, res) => {
    try {
        const { walletName, amount } = req.body;

        console.log("Received request to create payment: " + walletName + " for amount: " + amount);

        const privateKey = fs.readFileSync("private.key", "utf-8");
        const client = await createAuthenticatedClient({
            walletAddressUrl: "https://ilp.interledger-test.dev/platziclientava",
            privateKey,
            keyId: "d39cef22-7b90-4c20-b704-b239e95952e3",
        });
        const url = "https://ilp.interledger-test.dev/" + walletName.toLowerCase();
        const receivingWallet = await client.walletAddress.get({ url })

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const grant = await client.grant.request(
            {
                url: receivingWallet.authServer
            },
            {
                access_token: {
                    access: [
                        {
                            type: "incoming-payment",
                            actions: ["create"]
                        }
                    ]
                }
            }
        )

        if (!isFinalizedGrant(grant)) {
            throw new Error("Grant is not finalized");
        }
        
        const incomingPayment = await client.incomingPayment.create(
            {
                url: receivingWallet.walletAddress.resourceServer,
                accessToken: grant.access_token.value
            },
            {
                walletAddress: receivingWallet.walletAddress.id,
                incomingAmount: {
                    assetCode: receivingWallet.walletAddress.assetCode,
                    assetScale: receivingWallet.walletAddress.assetScale,
                    value: "1000"
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