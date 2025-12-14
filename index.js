import express from "express"
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"

// ------------------------------------------------
// EXPRESS SERVER
// ------------------------------------------------
const app = express()
const PORT = 3000

app.get("/", (req, res) => {
  res.type("text/html; charset=utf-8")
  res.status(200).send(`
    <table border="1" cellpadding="12" cellspacing="0"
     style="border-collapse: collapse; font-size: 20px; margin: 20px auto;">
      <tr><th style="background: #f2f2f2; text-align: left;">Server Status OK</th></tr>
      <tr><td>
        Server Active — Built by Vimal PK.<br>
        Running clean, strong, and perfectly healthy.
      </td></tr>
    </table>
  `)
})

app.listen(PORT, () => {
  console.log(`🚀 Express running on port ${PORT}`)
})

// ------------------------------------------------
// NEXT CHECKUP DATE (Stored as JS object)
// ------------------------------------------------
const nextCheckup = {
  year: 2026,
  month: 1,
  day: 3
}

// Convert JS date → ISO (safe from timezone shifts)
function getCheckupISO() {
  const date = new Date(nextCheckup.year, nextCheckup.month - 1, nextCheckup.day)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().split("T")[0]
}

// Compare today's date with the checkup date
function isCheckupToday() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  const todayISO = today.toISOString().split("T")[0]
  const checkupISO = getCheckupISO()

  console.log("TODAY =", todayISO)
  console.log("CHECKUP DATE =", checkupISO)

  return todayISO === checkupISO
}

// ------------------------------------------------
// RECIPIENTS (FIXED your WhatsApp domain spelling)
// ------------------------------------------------
const recipients = [
  "918838865435@s.whatsapp.net",
]

// const recipients = [
//   "918838865435@s.whatsapp.net",
//   "916381184941@s.whatsapp.net",
//   "919361571930@s.whatsapp.net",
//   "919344758284@s.whatsapp.net", 
// ]

// ------------------------------------------------
// MESSAGE BUILDER
// ------------------------------------------------
function buildMessage() {
  let caution = ""

  if (isCheckupToday()) {
    caution = `\n\n⚠️ Immediate doctor consultation recommended`
  }

  return `🩺 Prabakaran – Recent Health Report

• FBS: 157 mg/dL (Normal: 70–100 mg/dL)
• PBS: 224 mg/dL (Normal: < 140 mg/dL)
• BP: 140/80 mmHg (Normal: 120/80 mmHg)

------------------------------------------

🩺 Kanaga – Recent Health Report

• FBS: 175 mg/dL (Normal: 70–100 mg/dL)
• PBS: 261 mg/dL (Normal: < 140 mg/dL)
• BP: 160/100 mmHg (Normal: 120/80 mmHg)

Last Checkup: 13/10/2025
Next Checkup: 03/01/2026${caution}

— Vimal PK’s assistance. from server`
}

// ------------------------------------------------
// SEND MESSAGE FUNCTION
// ------------------------------------------------
function sendMessageToAll(sock) {
  const message = buildMessage()

  recipients.forEach(number => {
    sock.sendMessage(number, { text: message })
      .then(() => console.log(`✔ Message sent to ${number}`))
      .catch(err => console.error("❌ Error:", err))
  })
}

// ------------------------------------------------
// SCHEDULER — Send every 5 seconds
// ------------------------------------------------
function scheduleSender(sock) {
  setInterval(() => {
    console.log("⏳ Sending message (interval)…")
    sendMessageToAll(sock)
  }, 9000 * 2)
}

// function scheduleSender(sock) {
//   setInterval(() => {
//     const now = new Date()
//     const hours = now.getHours()
//     const minutes = now.getMinutes()

//     // Trigger only at 10:00 AM or 6:00 PM
//     if ((hours === 10 || hours === 18) && minutes === 0) {
//       console.log("⏰ Scheduled Time Reached — Sending Message…")
//       sendMessageToAll(sock)
//     }

//   }, 1000 * 60)
// }

// ------------------------------------------------
// MAIN WHATSAPP SCRIPT
// ------------------------------------------------
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const sock = makeWASocket({ auth: state })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update

    if (qr) {
      console.log("Scan QR below:")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "open") {
      console.log("CONNECTED ✔ Interval started…")
      scheduleSender(sock)
    }

    if (connection === "close") {
      console.log("Disconnected… reconnecting.")
      start()
    }
  })
}

start()
