export interface GroupsPort {
    getGroupNamesByGroupIds(groupIds: string[]): Promise<string[]>
}

/*

Per il link :https://carm-test-azure.westeurope.cloudapp.azure.com/#/login 
non passiamo per l'autenticazione a due fattori di azure, cioè questa non è un app 
registrata su azure con app proxy ma è solo unb'applicaizone deployata su azure. 

Come si nota in questo caso l'applicazione su staging risponde in modalità passthrough cioè

access-control-allow-origin * 

questa è la differenza fondamentale. 

Nell'altro caso invece si passa per app proxy. 

Opzione A: Cambiare l'endpoint nel Frontend 

https://carm-test-azure.adhr.it/gestbe/api/login


Creare il proxy anche  per il backend. 
(es. https://gestbe-adhrbo.msappproxy.net) devi andare nel codice sorgente del frontend, 
cercare dove viene definita l'URL di base delle API e cambiarla.

Da: https://carm-test.adhr.it/gestbe/api

A: https://<il-nuovo-url-del-proxy-backend>.msappproxy.net/api

Se fai questo, l'URL cambierà nello strumento di sviluppo, il browser vedrà una chiamata da internet 
a internet ed eliminerai all'istante il blocco LocalNetworkAccessPermissionDenied.

Opzione B: Il trucco dei DNS (Se volete usare lo stesso URL)
Se l'applicazione deve obbligatoriamente chiamare https://carm-test.adhr.it/gestbe/api/login 
perché non potete o non volete ricompilare il codice del frontend:

Il sistemista deve configurare l'Application Proxy di Azure usando i Domini Personalizzati (Custom Domains), 
dicendo ad Azure che l'URL esterno dell'applicazione è proprio https://carm-test.adhr.it.

Tu, sulla tua macchina da cui stai testando (da fuori rete aziendale), devi fare in modo che il dominio 
carm-test.adhr.it non punti all'IP privato dell'azienda, ma punti all'IP pubblico di Azure Proxy.

Per testarlo subito sul tuo PC senza toccare i DNS aziendali, potresti aggiungere una riga temporanea 
nel tuo file hosts di sistema locale 
(su Ubuntu /etc/hosts, su Windows C:\Windows\System32\drivers\etc\hosts) 
mappando carm-test.adhr.it sull'IP pubblico del proxy di Azure.

*/
