# Plugin

In fastify possiamo suddividere il nostro lavoro in moduli riutilizzabili detti plugin. In questo modo favoriamo la modularità. Ad esempio, possiamo dividere l'app in settori (es. gestione utenti, gestione prodotti, database).

Favorisce il riutilizzo del codice. Infatti abbiamo plugin ufficiali per connettersi a MongoDB, gestire i cookie, l'autenticazione JWT, ecc.

Fastify si assicura che un plugin sia caricato completamente prima di passare al successivo (grazie al sistema di avvio asincrono).

Puoi decidere che certi decoratori o variabili siano visibili solo dentro un determinato plugin, evitando di "sporcare" il resto dell'applicazione.

Un tipico caso d'uso è quello di utilizzare dei plugin per gestire le rotte.
