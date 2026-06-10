# Aziende Google senza sito

Tool interno per cercare aziende tramite Google Places API New e mostrare solo le schede in cui `websiteUri` e assente, nullo o vuoto.

## Setup `.env`

```bash
GOOGLE_PLACES_API_KEY=la_tua_api_key
GOOGLE_PLACES_MONTHLY_CAP=1000
```

`GOOGLE_PLACES_MONTHLY_CAP` e il limite interno usato dall'app per fermare le ricerche prima di superare la soglia gratuita stimata. Se non configurato, il default e `1000`.

## Come ottenere API key

1. Vai su Google Cloud Console.
2. Crea o seleziona un progetto.
3. Abilita Places API.
4. Attiva il billing sul progetto.
5. Crea una API key da Credentials.
6. Restringi la key alla Places API e, se possibile, all'ambiente server in uso.

## Limiti e costi Places API

Il tool usa `places:searchText` con campi come `websiteUri`, `nationalPhoneNumber`, `rating` e `userRatingCount`. Questi campi rientrano nello SKU Google Places API Text Search Enterprise.

Google dichiara una soglia gratuita mensile per SKU e prezzi pay-as-you-go oltre soglia. Verifica sempre la pagina prezzi ufficiale Google Maps Platform prima di aumentare il limite interno o usare il tool in modo intensivo.

Ogni pagina richiesta a Google conta come chiamata API. Indicativamente:

- max 20 risultati = fino a 1 chiamata
- max 40 risultati = fino a 2 chiamate
- max 60 risultati = fino a 3 chiamate

Il numero di aziende mostrate puo essere inferiore ai risultati analizzati perche vengono filtrate solo le schede senza `websiteUri`.

## Nota importante

Assenza di `websiteUri` nella scheda Google non garantisce che l'azienda non abbia un sito.
