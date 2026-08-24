# ?? AeroRadar — Avionics TCAS Radar in Tempo Reale

AeroRadar è una Web App / Progressive Web App (PWA) sviluppata con React e HTML5 Canvas che riproduce l'estetica e la funzionalità di uno schermo radar avionico di bordo (**TCAS - Traffic Collision Avoidance System**). 

L'applicazione rileva la posizione GPS dell'utente e traccia in tempo reale gli aerei circostanti sfruttando la rete globale aperta ADS-B.

---

## ??? Stack Tecnico

| Componente | Tecnologia |
|---|---|
| **Core Frontend** | React 18 + Vite |
| **Rendering Grafico** | HTML5 Canvas API (60 FPS animation loop) |
| **Sorgente Dati Voli** | OpenData ADS-B API (`opendata.adsb.fi`) |
| **Geolocalizzazione** | HTML5 Geolocation API |
| **Proxy & Networking** | Vite Dev Proxy (Gestione CORS & forzatura IPv4 Node.js) |

---

## ??? Funzionalità Principali

* **Sweeper Animatato a 60 FPS**: Pennello rotante in stile radar militare/avionico con cono di dissolvenza posteriore a 60°.
* **Tracciamento Vettoriale In Tempo Reale**: Posizionamento dinamico basato sulle coordinate GPS dell'utente e calcolo della distanza in miglia nautiche ($NM$).
* **Icone Orientate**: Le sagome degli aerei sono ruotate dinamicamente in base alla rotta reale (*True Track / Heading*).
* **Codifica Colori per Quota**:
  * ?? **Ciano**: Voli di crociera ad alta quota ($> 10.000\text{ ft}$).
  * ?? **Giallo / Ambra**: Voli a bassa quota ($\le 10.000\text{ ft}$), elicotteri o velivoli in fase di decollo/atterraggio.
  * ?? **Rosso**: Posizione utente al centro del display.
* **Indicatori di Trend Verticale (TCAS)**:
  * `?` Aereo in salita ($> 128\text{ ft/min}$)
  * `?` Aereo in discesa ($< -128\text{ ft/min}$)
  * `=` Aereo a quota livellata
* **Selettore di Portata**: Cambio rapido della portata del radar (15 NM, 30 NM, 50 NM).

---

## ?? Installazione e Avvio Locale

```bash
# 1. Clona il repository
git clone [https://github.com/TUO_USERNAME/aeroradar.git](https://github.com/TUO_USERNAME/aeroradar.git)
cd aeroradar

# 2. Installa le dipendenze
npm install

# 3. Avvia il server di sviluppo
npm run dev