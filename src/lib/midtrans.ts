import { createHash } from "node:crypto";

export function midtransAktif() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
}

export function midtransClientKey() {
  return process.env.MIDTRANS_CLIENT_KEY || "";
}

export function midtransSnapScriptUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

function snapApiUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
}

function serverKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum diisi");
  return key;
}

export function signatureMidtrans(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  key = process.env.MIDTRANS_SERVER_KEY || ""
) {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${key}`).digest("hex");
}

export function notifikasiSah(body: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  if (!body.order_id || !body.status_code || !body.gross_amount || !body.signature_key) return false;
  const expected = signatureMidtrans(body.order_id, body.status_code, body.gross_amount);
  return expected === body.signature_key;
}

export function statusMidtransLunas(transactionStatus: string, fraudStatus?: string) {
  if (transactionStatus === "settlement") return true;
  if (transactionStatus === "capture" && (fraudStatus === "accept" || !fraudStatus)) return true;
  return false;
}

export function statusMidtransGagal(transactionStatus: string) {
  return ["deny", "cancel", "expire", "failure"].includes(transactionStatus);
}

export async function buatSnapToken(params: {
  orderId: string;
  jumlah: number;
  nama: string;
  itemNama: string;
}) {
  const auth = Buffer.from(`${serverKey()}:`).toString("base64");
  const res = await fetch(snapApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.jumlah,
      },
      item_details: [
        {
          id: "langganan",
          price: params.jumlah,
          quantity: 1,
          name: params.itemNama.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: params.nama.slice(0, 50),
      },
      enabled_payments: ["gopay", "shopeepay", "other_qris", "bca_va", "bni_va", "bri_va", "permata_va", "echannel"],
    }),
  });

  const json = (await res.json()) as { token?: string; redirect_url?: string; error_messages?: string[] };
  if (!res.ok || !json.token) {
    throw new Error(json.error_messages?.join(", ") || "Gagal membuat pembayaran Midtrans");
  }
  return { token: json.token, redirectUrl: json.redirect_url ?? null };
}
