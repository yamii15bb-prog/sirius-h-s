import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { v4 as uuid } from "uuid";
import Stripe from "stripe";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 8787);
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_BEFORE_PRODUCTION";
const db = new Database(process.env.DB_FILE || "sirius.db");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, plan TEXT NOT NULL DEFAULT 'free', premium_until TEXT);
CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, date TEXT, time TEXT, location TEXT, passes INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS guests (id TEXT PRIMARY KEY, event_id TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, passes INTEGER NOT NULL DEFAULT 1, qr_used INTEGER NOT NULL DEFAULT 0, confirmed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS invitations (id TEXT PRIMARY KEY, event_id TEXT NOT NULL, guest_id TEXT, data TEXT NOT NULL, created_at TEXT NOT NULL);
`);

app.use(cors());
app.use(express.json({ limit: "5mb" }));

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ error: "No autenticado" });
  try { req.user = jwt.verify(header.slice(7), JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Sesión inválida" }); }
}
function issueUser(email, name = "Usuario") {
  let user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if (!user) {
    const id = uuid();
    db.prepare("INSERT INTO users(id,email,name) VALUES(?,?,?)").run(id,email,name);
    user = db.prepare("SELECT * FROM users WHERE id=?").get(id);
  }
  const token = jwt.sign({ id:user.id, email:user.email }, JWT_SECRET, { expiresIn:"30d" });
  return { token, user };
}

app.get("/api/health", (_, res) => res.json({ ok:true, app:"Sirius H&S", version:"2.0.0" }));
app.post("/api/auth/demo", (req,res)=>{
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({error:"Email requerido"});
  res.json(issueUser(email, name));
});
app.get("/api/me", auth, (req,res)=>res.json(db.prepare("SELECT id,email,name,plan,premium_until FROM users WHERE id=?").get(req.user.id)));

app.get("/api/events", auth, (req,res)=>res.json(db.prepare("SELECT * FROM events WHERE user_id=? ORDER BY created_at DESC").all(req.user.id)));
app.post("/api/events", auth, (req,res)=>{
  const {name,date,time,location,passes=1}=req.body||{};
  if(!name||!date||!location) return res.status(400).json({error:"Nombre, fecha y lugar son obligatorios"});
  const id=uuid(); db.prepare("INSERT INTO events(id,user_id,name,date,time,location,passes,created_at) VALUES(?,?,?,?,?,?,?,?)").run(id,req.user.id,name,date,time||"",location,Number(passes)||1,new Date().toISOString());
  res.status(201).json(db.prepare("SELECT * FROM events WHERE id=?").get(id));
});
app.put("/api/events/:id", auth, (req,res)=>{
  const e=db.prepare("SELECT * FROM events WHERE id=? AND user_id=?").get(req.params.id,req.user.id); if(!e) return res.status(404).json({error:"Evento no encontrado"});
  const {name,date,time,location,passes=1}=req.body||{}; db.prepare("UPDATE events SET name=?,date=?,time=?,location=?,passes=? WHERE id=?").run(name,date,time||"",location,Number(passes)||1,e.id); res.json(db.prepare("SELECT * FROM events WHERE id=?").get(e.id));
});
app.delete("/api/events/:id", auth, (req,res)=>{db.prepare("DELETE FROM guests WHERE event_id=?").run(req.params.id);db.prepare("DELETE FROM invitations WHERE event_id=?").run(req.params.id);const r=db.prepare("DELETE FROM events WHERE id=? AND user_id=?").run(req.params.id,req.user.id);res.json({deleted:r.changes>0});});

app.get("/api/events/:eventId/guests", auth, (req,res)=>res.json(db.prepare("SELECT g.* FROM guests g JOIN events e ON e.id=g.event_id WHERE g.event_id=? AND e.user_id=? ORDER BY g.created_at DESC").all(req.params.eventId,req.user.id)));
app.post("/api/events/:eventId/guests", auth, (req,res)=>{
  const e=db.prepare("SELECT * FROM events WHERE id=? AND user_id=?").get(req.params.eventId,req.user.id); if(!e) return res.status(404).json({error:"Evento no encontrado"});
  const {name,phone,passes=1}=req.body||{}; if(!name) return res.status(400).json({error:"Nombre requerido"});
  const id=uuid();db.prepare("INSERT INTO guests(id,event_id,name,phone,passes,created_at) VALUES(?,?,?,?,?,?)").run(id,e.id,name,phone||"",Number(passes)||1,new Date().toISOString());res.status(201).json(db.prepare("SELECT * FROM guests WHERE id=?").get(id));
});
app.get("/api/guests/:id/qr", auth, async (req,res)=>{
  const g=db.prepare("SELECT g.*,e.name event_name,e.user_id FROM guests g JOIN events e ON e.id=g.event_id WHERE g.id=? AND e.user_id=?").get(req.params.id,req.user.id); if(!g) return res.status(404).json({error:"Invitado no encontrado"});
  const payload=JSON.stringify({app:"SiriusHS",guestId:g.id,eventId:g.event_id,guest:g.name,event:g.event_name,passes:g.passes});
  res.json({data:payload,dataUrl:await QRCode.toDataURL(payload,{width:600,margin:2})});
});
app.post("/api/scan", auth, (req,res)=>{
  let data;try{data=JSON.parse(req.body.decodedText)}catch{return res.status(400).json({valid:false,message:"QR inválido"})}
  if(data?.app!=="SiriusHS") return res.status(400).json({valid:false,message:"Este QR no pertenece a Sirius H&S"});
  const g=db.prepare("SELECT g.*,e.name event_name,e.user_id FROM guests g JOIN events e ON e.id=g.event_id WHERE g.id=? AND e.user_id=?").get(String(data.guestId),req.user.id);
  if(!g)return res.status(404).json({valid:false,message:"Invitado no encontrado"}); if(g.qr_used)return res.status(409).json({valid:false,message:"Pase utilizado",guest:g});
  db.prepare("UPDATE guests SET qr_used=1,confirmed=1 WHERE id=?").run(g.id);res.json({valid:true,message:"Pase válido",guest:{...g,qr_used:1,confirmed:1}});
});

app.post("/api/invitations", auth, (req,res)=>{
  const {eventId,guestId,data}=req.body||{}; const e=db.prepare("SELECT * FROM events WHERE id=? AND user_id=?").get(eventId,req.user.id); if(!e)return res.status(404).json({error:"Evento no encontrado"});
  const id=uuid();db.prepare("INSERT INTO invitations(id,event_id,guest_id,data,created_at) VALUES(?,?,?,?,?)").run(id,eventId,guestId||null,JSON.stringify(data||{}),new Date().toISOString());res.status(201).json({id});
});
app.get("/api/invitations/:id", (req,res)=>{const row=db.prepare("SELECT i.*,e.name event_name,e.date,e.time,e.location,g.name guest_name FROM invitations i JOIN events e ON e.id=i.event_id LEFT JOIN guests g ON g.id=i.guest_id WHERE i.id=?").get(req.params.id);if(!row)return res.status(404).json({error:"Invitación no encontrada"});res.json({...row,data:JSON.parse(row.data)});});

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
app.post("/api/billing/checkout", auth, async (req,res)=>{
  if(!stripe)return res.status(503).json({error:"Stripe no configurado. Agrega STRIPE_SECRET_KEY y STRIPE_PRICE_ID."});
  const priceId=process.env.STRIPE_PRICE_ID; if(!priceId)return res.status(503).json({error:"STRIPE_PRICE_ID no configurado"});
  const session=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:priceId,quantity:1}],success_url:(process.env.APP_URL||"http://localhost:5173")+"?premium=success",cancel_url:(process.env.APP_URL||"http://localhost:5173")+"?premium=cancel",client_reference_id:req.user.id,customer_email:req.user.email});res.json({url:session.url});
});
app.post("/api/billing/webhook", express.raw({type:"application/json"}), (req,res)=>{ if(!stripe)return res.status(503).end(); try{const sig=req.headers["stripe-signature"]; const event=stripe.webhooks.constructEvent(req.body,sig,process.env.STRIPE_WEBHOOK_SECRET); if(event.type==="checkout.session.completed"){const s=event.data.object; if(s.client_reference_id)db.prepare("UPDATE users SET plan='premium' WHERE id=?").run(s.client_reference_id);} res.json({received:true});}catch(e){res.status(400).send(`Webhook Error: ${e.message}`)} });

const __dirname=path.dirname(fileURLToPath(import.meta.url)); const dist=path.join(__dirname,"..","dist");
if(process.env.NODE_ENV==="production"){app.use(express.static(dist));app.get("*",(_,res)=>res.sendFile(path.join(dist,"index.html")));}
app.listen(port,()=>console.log(`Sirius H&S API: http://localhost:${port}`));
