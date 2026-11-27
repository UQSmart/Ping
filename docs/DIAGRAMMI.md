# Ping! — Diagrammi

Tutti i diagrammi sono in [Mermaid](https://mermaid.js.org/): si vedono già renderizzati su GitHub e in VS Code con l'estensione **Markdown Preview Mermaid Support** (`bierner.markdown-mermaid`), aprendo l'anteprima con `Ctrl+Shift+V`.

---

## 1. Architettura: niente server applicativo, niente database

```mermaid
flowchart LR
    subgraph A["📱 Telefono di Natalie"]
        A1[App Ping!<br/>React Native + Expo]
        A2[(GUN in memoria<br/>+ SecureStore / AsyncStorage)]
        A1 --- A2
    end

    subgraph B["📱 Telefono di Josh"]
        B1[App Ping!]
        B2[(GUN in memoria<br/>+ SecureStore / AsyncStorage)]
        B1 --- B2
    end

    R(("🔁 Relay GUN<br/>(nodo standard,<br/>nessuna logica)"))

    A2 <-- "WebSocket<br/>dati firmati e cifrati" --> R
    B2 <-- "WebSocket<br/>dati firmati e cifrati" --> R

    P["☁️ Expo Push<br/>(facoltativo)"]
    W["💬 WhatsApp<br/>(invito a chi non ha l'app)"]
    A1 -. "notifica ad app chiusa" .-> P -.-> B1
    A1 -. "link wa.me" .-> W
```

- Il **grafo GUN** è il "database": un grande oggetto JSON replicato fra telefoni e relay.
- Il **relay** è solo un ponte/cache: è il programma GUN standard (`relay/server.js`), non ha API né tabelle, e vede **solo testo cifrato**.
- Nessun backend scritto da te: tutta la logica (login, cifratura, invio) gira **sul telefono**.

---

## 2. Casi d'uso

```mermaid
flowchart LR
    U(("👤 Utente"))
    N(("👤 Amico<br/>senza Ping!"))

    subgraph APP["Ping!"]
        UC1([Registrarsi])
        UC2([Accedere])
        UC3([Recuperare la password<br/>con il codice di recupero])
        UC4([Inviare un ping<br/>testo ≤ 50 car. + link social])
        UC5([Vedere chi mi ha pingato])
        UC6([Aprire un ping<br/>→ animazione + suono])
        UC7([Rispondere con un ping])
        UC8([Scartare un ping con swipe])
        UC9([Salvare un ping])
        UC10([Modificare il profilo])
        UC11([Impostazioni: suoni,<br/>notifiche, utenti bloccati])
        UC12([Invitare via WhatsApp])
    end

    U --> UC1 & UC2 & UC3 & UC4 & UC5 & UC10 & UC11
    UC5 --> UC6 & UC8
    UC6 --> UC7 & UC9
    UC4 --> UC12
    UC12 --> N
```

---

## 3. Navigazione fra le schermate (riferimenti alle slide)

```mermaid
flowchart TD
    S0["1. Opening screen<br/><i>index.tsx</i>"] -->|sessione salvata| HOME
    S0 -->|nessuna sessione| LOGIN

    LOGIN["2.1 Log-in<br/><i>login.tsx</i>"] -->|Log In ok| HOME
    LOGIN -->|errore| ERR1{{"Pop-up<br/>Unable to log in"}} --> LOGIN
    LOGIN -->|Create a new account| SIGNUP["3.1 Create account<br/><i>signup.tsx</i>"]
    LOGIN -->|Forgotten Password| RR["4.1 Reset – codice<br/><i>reset-request.tsx</i>"]

    SIGNUP --> REC["Codice di recupero<br/><i>recovery-code.tsx</i>"] --> HOME
    RR -->|codice valido| RP["4.2 Nuova password<br/><i>reset-password.tsx</i>"] --> HOME

    HOME["5.1 Main screen – Who pinged me?<br/><i>home.tsx</i>"]
    HOME -->|tocca 'P'| COMPOSE["6.1 User card<br/><i>compose.tsx</i>"]
    HOME -->|tocca mittente| VIEW["7.1 Ping ricevuto<br/><i>ping/[id].tsx</i>"]
    HOME -->|freccia ↩P| COMPOSE
    HOME -->|swipe ←| DEL(("🗑 eliminato"))
    HOME -->|avatar in alto| SET["9.1 Settings<br/><i>settings.tsx</i>"]

    COMPOSE -->|Next| CONTACTS["6.2 Lista contatti<br/><i>contacts.tsx</i>"]
    CONTACTS -->|slide 'Ping! »'| HOME
    CONTACTS -->|Invite| WA(("WhatsApp"))

    VIEW -->|Ping back| COMPOSE
    VIEW -->|Close| HOME

    SET --> PROF["8.1 Profilo<br/><i>profile.tsx</i>"]
    SET --> CPW["Password and security<br/><i>change-password.tsx</i>"]
    SET --> PREF["Preferenze e notifiche<br/><i>preferences.tsx</i>"]
    SET --> SAVED["Ping salvati<br/><i>saved.tsx</i>"]
    SET -->|Log out| LOGIN

    NOTIF["10.1 Notifica"] -->|tocco| VIEW
```

---

## 4. Registrazione e login (GUN SEA)

```mermaid
sequenceDiagram
    autonumber
    actor U as Utente
    participant App as App Ping!
    participant SEA as GUN SEA<br/>(crittografia sul telefono)
    participant G as Grafo GUN<br/>(relay)

    Note over U,G: Registrazione
    U->>App: nome, data di nascita, numero, password, foto
    App->>G: esiste già l'alias "ping-app-v1:+39…"?
    G-->>App: no
    App->>SEA: genera coppia di chiavi (pub/priv, epub/epriv)
    SEA->>G: pubblica ~pub + chiave privata CIFRATA con la password
    App->>SEA: cifra data di nascita (con la mia chiave)
    App->>G: ~pub/profile = {nome, numero, foto, dob cifrata}
    App->>SEA: cifra copia chiavi con CODICE DI RECUPERO
    App->>G: ~pub/recovery = blob cifrato
    App->>App: salva le chiavi in SecureStore
    App-->>U: mostra il codice di recupero (da annotare)

    Note over U,G: Login (anche su un altro telefono)
    U->>App: numero + password
    App->>G: leggi ~@alias → ~pub → blocco "auth" cifrato
    App->>SEA: prova a decifrare con la password
    alt password giusta
        SEA-->>App: chiavi private ✔
        App->>App: salva sessione in SecureStore → Main screen
    else password sbagliata
        SEA-->>App: impossibile decifrare
        App-->>U: pop-up "Unable to log in"
    end
```

---

## 5. Invio e ricezione di un ping (cifrato end-to-end)

```mermaid
sequenceDiagram
    autonumber
    actor N as Natalie (mittente)
    participant AN as App di Natalie
    participant G as Grafo GUN / relay
    participant AJ as App di Josh
    actor J as Josh (destinatario)

    N->>AN: testo "Check my new post!" + link Instagram
    N->>AN: sceglie Josh e fa scorrere "Ping! »"
    AN->>G: leggi ~pubJosh → epub (chiave pubblica di cifratura)
    AN->>AN: segreto = ECDH(epriv Natalie, epub Josh)
    AN->>AN: box = AES(segreto, {nome, testo, link, ts})
    AN->>G: ping-app-v1/inbox/pubJosh/idPing = {from, box, ts}
    opt Josh ha un token push
        AN-->>J: notifica "Natalie West pinged you!" (Expo Push)
    end

    G-->>AJ: aggiornamento in tempo reale (.map().on)
    AJ->>G: leggi ~pubNatalie → epub
    AJ->>AJ: segreto = ECDH(epriv Josh, epub Natalie)
    AJ->>AJ: decifra box ✔ (se fallisce → ping falso, scartato)
    AJ-->>J: notifica locale + riga in "Who pinged me?"
    J->>AJ: apre il ping
    AJ-->>J: avatar che rimbalza + suono "ping" + link
    J->>AJ: chiude
    AJ->>G: inbox/pubJosh/idPing = null (il ping sparisce)
```

---

## 6. Ciclo di vita di un ping

```mermaid
stateDiagram-v2
    [*] --> Inviato: slide "Ping! »"
    Inviato --> NonLetto: arriva nell'inbox (anche se Josh era offline)
    NonLetto --> Visualizzato: tocco su notifica o riga
    NonLetto --> Eliminato: swipe a sinistra
    NonLetto --> Eliminato: scade dopo 24 h (PING_TTL_HOURS)
    NonLetto --> Eliminato: mittente bloccato
    Visualizzato --> Salvato: "Save" (solo sul telefono)
    Visualizzato --> Eliminato: "Close" / esce dalla schermata
    Salvato --> Eliminato: rimosso dai salvati
    Eliminato --> [*]
```

---

## 7. Struttura dei dati nel grafo GUN

```mermaid
flowchart TD
    ROOT(("grafo GUN"))

    ROOT --> ALIAS["~@ping-app-v1:+393331234567<br/><small>indice: numero → chiave pubblica</small>"]
    ROOT --> USER["~&lt;pub&gt;<br/><small>spazio dell'utente, scrivibile SOLO da lui (firmato)</small>"]
    ROOT --> NS["ping-app-v1"]

    ALIAS -.punta a.-> USER

    USER --> AUTH["auth<br/><small>chiavi private cifrate con la password</small>"]
    USER --> PROFILE["profile"]
    USER --> RECOV["recovery<br/><small>chiavi cifrate con il codice di recupero</small>"]

    PROFILE --> P1["name · phone · avatar (jpeg base64)"]
    PROFILE --> P2["dob 🔒 cifrata"]
    PROFILE --> P3["lastSeen (Online/Offline) · pushToken"]

    NS --> INBOX["inbox"]
    INBOX --> IB["&lt;pub destinatario&gt;"]
    IB --> PING["&lt;idPing&gt; = { from, box 🔒, ts }"]
```

Dati che restano **solo sul telefono** (slide 9.2 "NA if all settings are saved locally"):

| Dove | Cosa |
|---|---|
| SecureStore (cifrato dal sistema) | la coppia di chiavi = sessione di login |
| AsyncStorage | impostazioni (suoni, notifiche, bloccati), ping salvati, contatti recenti, cache rubrica |
