Markdown
# ?? AeroRadar — Real-Time Avionics Flight Tracker (MFD / TCAS)

AeroRadar è una Progressive Web App (PWA) ad alte prestazioni sviluppata in React e HTML5 Canvas 2D, progettata per simulare un display radar tattico da cabina di pilotaggio (Multi-Function Display / TCAS) per il tracciamento dei voli ADS-B in tempo reale.

---

## ??? Architettura Tecnologica & Edge Computing

L'applicazione sfrutta un'architettura **Serverless Edge Proxy** disaccoppiata per aggirare le restrizioni CORS dei browser, superare i blocchi IP/WAF delle API pubbliche e ottimizzare l'uso della banda.

[ Client Browser / PWA (GitHub Pages) ]
¦
+- (Polling 8s + Cache-Buster _t=Timestamp)
?
[ Cloudflare Edge Worker Proxy ]
¦
+-? [ Edge Cache CDN ] (Risposta condivisa salvata < 8s)
¦
+-? [ Multi-Source Fallback System ]
+-- 1. ADSB.lol API
+-- 2. Airplanes.live API
+-- 3. AllOrigins WAF Proxy (Bypass Cloudflare WAF)
+-- 4. OpenData ADSB.fi API


---

## ? Caratteristiche Tecniche & Algoritmi

* **Dead Reckoning Motion Engine (60 FPS)**: Movimento vettoriale continuo a 60 frame al secondo calcolato sul client. Tra un aggiornamento di rete e l'altro (8 secondi), il radar estrapola la posizione esatta in tempo reale tramite cinematica vettoriale basata su velocità al suolo (`velocityKts`) e prua (`heading`).
* **High Availability Multi-Source**: Il proxy interroga fino a 4 sorgenti ADS-B distinte in sequenza. Se un server è in timeout o bloccato, il sistema commuta istantaneamente sulla sorgente successiva in modo trasparente.
* **Edge Caching Distribuito**: La memoria CDN globale di Cloudflare memorizza temporaneamente lo snapshot per zona geografica. Se più utenti utilizzano l'app contemporaneamente nella stessa area, le chiamate API esterne vengono ridotte di oltre l'80%.
* **Zero-Flicker State Buffer**: Buffer di persistenza dati implementato via `useRef` React, che impedisce la scomparsa dei bersagli aerei anche durante micro-interruzioni di rete.
* **Rendering Canvas Avionico**:
  * Spazzamento radar dinamico con gradiente conico a dissolvenza (*Conic Sweep Trail*).
  * Anelli di portata regolabili (*Range Rings*) a 15 NM, 30 NM e 50 NM.
  * Iconografia aerea vettoriale rotante con Call-Sign, altitudine in piedi e indicatore di frequenza verticale ($\uparrow \downarrow =$).

---

## ??? Guida all'Installazione Locale

```bash
# Clona il repository
git clone [https://github.com/danieleantoniazzi1-star/aeroradar.git](https://github.com/danieleantoniazzi1-star/aeroradar.git)
cd aeroradar

# Installa le dipendenze
npm install

# Avvia il server di sviluppo locale
npm run dev