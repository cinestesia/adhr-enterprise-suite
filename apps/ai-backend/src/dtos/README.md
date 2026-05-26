# DTO

In questo progetto utilizziamo un pattern di progettazione chiamato Data-Transfer-Object ovvero DTO. Si utilizza per trasportare dati tra diverse parti di un'applicaizone come ad esempio da un database verso l'interfaccia utente, o viceversa.

La caratteristica di un DTO è che contiene solo le informazioni necessarie a chi lo deve utilizzare.

# Flusso Inbound ( dal front end al database )

1.  L'utente compila un form (es. registrazione). I dati vengono impacchettati in un JSON e inviati
    tramite una richiesta POST.

2.  Binding & Deserializzazione:Controller del Server.
    Il server riceve il JSON e lo trasforma automaticamente in un oggetto DTO.
    Se il JSON contiene campi extra non previsti dal DTO, vengono ignorati.

3.  Il server controlla il DTO. È qui che verifichi se l'email è valida o se la password è
    abbastanza lunga, prima ancora di toccare il database.

4.  Se i dati sono validi, il DTO viene "mappato" (copiato) in un'Entity di dominio, che verrà poi
    salvata nel database.

Per fare un esempio, pensiamo al client front end che manda un messaggio alla chat, ad ogni messaggio viene inviato anche l'access token perchè al backend fastify lo controlla per ricavarne l'utente. Al controller arriva request.user che è una serializzazione dell'utente creata da KeyCloak. Questa deve essere trasformata in DTO utilizzabile dai casi d'uso.

# Flusso outboud
