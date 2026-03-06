# minikube
Minikube è l'implementazione locale di un cluster kubernetes. Per costruire il cluster locale: 

```bash
    minikube delete
    minikube start --driver=docker  
        😄  minikube v1.38.1 on Ubuntu 24.04
        ✨  Using the docker driver based on user configuration
        ❗  Starting v1.39.0, minikube will default to "containerd" container runtime. See #21973 for more info.
        📌  Using Docker driver with root privileges
        👍  Starting "minikube" primary control-plane node in "minikube" cluster
        🚜  Pulling base image v0.0.50 ...
        🔥  Creating docker container (CPUs=2, Memory=3800MB) ...
        🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
        🔗  Configuring bridge CNI (Container Networking Interface) ...
        🔎  Verifying Kubernetes components...
            ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
        🌟  Enabled addons: storage-provisioner, default-storageclass
        🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```
minikube costruisce un container docker speciale nella macchina host, che simula un nodo linux e li dentro crea tutti i componenti necessari a kubernetes come ad esempio il control plane, lo scheduler ecc.. I pod sono lanciati dentro questo container. 

Immagini: Il Docker della tua macchina e il Docker dentro Minikube sono separati. Se buildi un'immagine sul tuo PC, Minikube non la vede a meno che non la "spingi" dentro (usando minikube image load) o non punti il tuo terminale al demone Docker interno con eval $(minikube docker-env).

ho poi dato il seguente comando:

```bash
    eval $(minikube docker-env)
```
oppure se vuoi manualmente: 

```bash 
    minikube image load welcome-backend:dev-latest
```
in questo modo invece che caricare le immagini in un registro esterno utilizzo il registro locale. 

Per fare delle prove ho creato due immagini:

REPOSITORY                    TAG                  IMAGE ID       CREATED          SIZE
welcome-frontend           development-latest    2c41d6830c4b   6 seconds ago    190MB
welcome-backend            development-latest   0caffab5e149   48 minutes ago   219MB


e poi le ho inserite in minikube. 


# kubectl 
Per gestire il cluster locale, utilizzeremo kubectl. Per esempio:

```bash 
    kubectl create namespace development # CREA NAMESPACE
```
questo crea un namespace 'development' dentro il cluster creato con minikube 

per vedere i namespace dentro un cluster; 

```bash 
    kubectl get namespaces # LISTA DEI NAMESPACES
```

```bash
    # Tutte le labels associate a questo deployment
    kubectl get deployment welcome-frontend --show-labels
```

```bash
    # Visualizzare tutte le etichette
    kubectl get deployments -n development --show-labels

    # filtrare: dammi tutti i deployments in development con app=welcome-backend
    kubectl get deployments -n development -l app=welcome-backend

    # filtrare: dammi tutti i deployments in development che hanno labels env=dev 
    kubectl get deployments -n development -l env=dev

    # filtrare: dammi tutti i deployments in development che hanno le seguenti labels:  
    kubectl get all -n development -l part-of=adhr-enterprise-suite,env=dev

    # LEGGE I LOG DEL POD
    kubectl logs welcome-backend-5cbb787bbd-nfs58 -n development
```


# helm
Possiamo utilizzare ***helm*** come fosse un installatore delle nostre applicazioni. Per esempio per installare welcome-backend: 

```bash
    # INSTALLARE UN APP NEL CLUSTER
    helm install welcome-backend ./kubernetes/charts/adhr-enterprise-suite  -n development -f ./kubernetes/env/local/welcome-backend.yaml

    # Comando inverso: disinstallare APP :
    helm uninstall welcome-backend -n development
```

questo installa l'app welcome-backend dalla suite adhr-enterprise-suite ( che è dove si trova Chart.yaml ). 

helm genera lo yaml. Fa operazioni di sostituzione, trova e sostituisci. Ad esempio dentro deployment avremo da qualche parte: 

```yaml
    image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```
quando lanciamo helm con il file specifico come sopra, Helm carica i valori di default (se presenti in un file values.yaml dentro la cartella della chart ) . Poi:

1. Helm applica i valori dal file welcome-backend.yaml. 
Se lì abbiamo tag: "dev-latest", questo valore vince su tutto il resto.

2. Helm "inietta" questi valori finali nei segnaposto {{ ... }} che trova dentro deployment.yaml.

Helm segue un ordine di precedenza molto rigido. L'ultimo comando o file citato "vince" sulle chiavi con lo stesso nome:

1. Values.yaml della Chart: (Base minima) - Il file che sta dentro charts/adhr-enterprise-suite/values.yaml.

2. File passati con -f: (Il tuo caso) - Se passi env/local/welcome-backend.yaml, i valori qui dentro sovrascrivono quelli di default.

3. Parametri passati con --set: (Massima priorità) - Se scrivi --set image.tag=v99, questo vincerà anche su quello che hai scritto nel file in env/local/.

helm lascia una firma sugli oggetti che crea:.

```bash 
    kubectl describe pod <nome-pod> -n development | grep helm.sh/chart
```



# Versioning dell'applicazione 

**appVersion** (L'Applicazione): Rappresenta il tuo codice sorgente.

Quando cambia? Ogni volta che fai un merge su main o crei un nuovo tag Git 
dell'app (es. v1.2.3).

Esempio: Passi da un backend in Node.js v1 a v2.

**version** (La Chart/Infrastruttura): Rappresenta il "come" installi l'app.

Quando cambia? Se modifichi i file YAML (es. aggiungi un Ingress, cambi una variabile di memoria, aggiungi un database).

Esempio: L'app resta la v1.2.3, ma hai aggiunto il supporto HTTPS nell'Ingress. La version della chart passa da 0.1.0 a 0.1.1.

Un altro esempio: alla prima installazione del backend mi ero dimenticato di una variabile ambientale. L'ho creata 
e inserita in deployment e ho aumentato manualmente version dentro chart.yaml:

```yaml
    version: 0.1.0 => 0.1.1
```

ho poi dato il comando: 

```bash
    helm upgrade welcome-backend ./kubernetes/charts/adhr-enterprise-suite  -n development -f ./kubernetes/env/local/welcome-backend.yaml
```

questo crea una revisione della app: 

```bash
    helm history welcome-backend -n development
```

che ritorna: 

```bash

REVISION	UPDATED                 	STATUS    	CHART                      	APP VERSION	DESCRIPTION     
1       	Thu Mar  5 11:44:03 2026	superseded	adhr-enterprise-suite-0.1.0	0.0.1      	Install complete
2       	Thu Mar  5 12:08:35 2026	deployed  	adhr-enterprise-suite-0.1.1	0.0.1      	Upgrade complete

```

possiamo fare una rollback verso una versione precedente: 

```bash 
    helm rollback welcome-frontend 1 -n dev-namespace
```



# Versioning e sviluppo fase 1:

1. Sviluppo (Feature Branch)
Git: Lavori su feature/welcome-fix.

2. Docker: La CI (GitHub Actions/GitLab CI) builda un'immagine temporanea: welcome-backend:sha-abcdef.

3. Helm: Installi in un namespace di test usando --set image.tag=sha-abcdef. Qui non tocchi il Chart.yaml.


# Versioning e release fase 2 (Develop -> Main) :
| Step | Azione | Cosa cambia nel Chart.yaml | Tag Git |
| :--- | :--- | :--- | :--- |
| **1** | **Bumping** | Aumenti `appVersion` (es. 1.0.0) e `version` (es. 0.2.0). | Tag `v1.0.0` sul repo. |
| **2** | **Build** | Buildi l'immagine definitiva: `welcome-backend:1.0.0`. | - |
| **3** | **Package** | Helm crea il pacchetto `.tgz` e lo salva in un Chart Museum (es. Harbor o AWS ECR). | - |
| **4** | **Deploy** | Usi `helm upgrade --version 0.2.0` per aggiornare il cluster di produzione. | - |


la regola d'oro per i nuovi progetti è partire dalla 0.1.0.

Ecco perché non si parte dalla 1.0.0 e come si evolvono i numeri seguendo lo schema

MAJOR.MINOR.PATCH

1.  Il punto di partenza: 0.1.0  
    
    0. (Major): 
        Indica che il progetto è ancora in fase di sviluppo iniziale (Initial Development). L'API non è stabile e tutto può cambiare. 
    
    1. (Minor): 
        Indica la prima "raccolta" di funzionalità che iniziano a girare.
    
    0. (Patch): 
        Non hai ancora fatto correzioni a questa versione.
        Regola pratica: Finché il primo numero è 0, sei "giustificato" 
        se rompi la compatibilità tra una versione e l'altra. È il periodo dei grandi esperimenti.

2.  Quando scatta la 1.0.0? La versione 1.0.0 è una dichiarazione di maturità. 
    La raggiungi quando:L'applicazione è usata in Produzione. Hai un'API o una struttura stabile (se cambi qualcosa, sai che i "clienti" dovranno adeguarsi).
    Hai una documentazione chiara. 
    
3.  Scaletta delle modifiche: 
    Una volta che sei in ballo, ecco come decidi quale numero incrementare:

    Incremento      | Esempio Pratico nel tuo Backend       | Nome
    0.1.0 -> 0.1.1  | Hai corretto piccolo bug nel codice   | PATCH
    0.1.1 -> 0.2.0  | Hai aggiunto la rotta /login o nuova  | MINOR
    1.0.0 -> 2.0.0  | Express to fastify (cambio radicale). | MAJOR
    
4. Applicato al tuo Chart.yamlIn un ambiente professionale con Helm, il flusso ideale è questo:

Inizio Progetto:
    version: 0.1.0 (La Chart)
    appVersion: 0.1.0 (Il Codice)

Modifichi solo un'etichetta nello YAML (Infrastruttura):
    version: 0.1.1 (Aumenti la Patch della Chart)
    appVersion: 0.1.0 (Il codice è rimasto uguale)

Rilasci una nuova Feature nel codice: version: 0.2.0 (Nuova release della Chart)
appVersion: 0.2.0 (Nuova versione dell'App)

Il consiglio per il tuo Team (Gitflow)Ogni volta che un Merge Request viene approvato su develop, la CI dovrebbe incrementare la Patch automaticamente.Ogni volta che create una Release Candidate, aumentate la Minor.Riservate la Major solo per i grandi cambiamenti di architettura (es. passare da Monolito a Microservizi).

# La Scaletta "Agile" per un Team

Immagine DEV: Usa sempre il commit SHA o un tag incrementale della CI. Mai usare latest in produzione perché non è tracciabile.

Immagine PROD: Deve corrispondere esattamente alla appVersion nel Chart.yaml.

Ambienti (Local, Dev, Prod):

Local: Usi i file in env/local/*.yaml per puntare a imagePullPolicy: IfNotPresent e tag locali (come hai fatto ora).

Prod: Usi env/prod-aws/*.yaml dove specifichi risorse (CPU/RAM) più alte e l'URL del registro Docker ufficiale.

Automazione: Il file Chart.yaml dovrebbe essere l'unica fonte di verità. Se un domani devi sapere cosa gira in produzione, ti basta guardare la version della chart installata.

Adesso abbiamo welcome-backend.yaml e welcome-frontend.yaml separati. Se entrambi appartengono alla stessa chart adhr-enterprise-suite, la best practice è:
Usare un unico file di valori per ambiente (es. env/local/values.yaml) che contenga le configurazioni di entrambi, organizzate sotto chiavi diverse.

```YAML
backend:
  image: ...
frontend:
  image: ...
```

# Interagire con il cluster 

adesso indaghiamo cosa è stato costruito dentro il cluster :

```bash
    # MOSTRA TUTTI GLI OGGETTI COSTRUITI DENTRO IL CLUSTER
    kubectl get all -n development
```
questo mi ritorna la lista degli oggetti che helm ha creato e installato dentro il cluster.  Per esempio la prima cosa che si nota è:

```bash 
NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/welcome-backend   1/1     1            1           24h
```

questo è un oggetto di tipo Deployment. Serve per controllare il cluster. Si tratta di un oggetto creato in etcd di tipo dichiarativo. Contratto Intelligente o un Manuale di Istruzioni Vivo. Quest'oggetto è controllato da Kube-Controller-Manager, nei suoi controlli, per mantenere coerente il cluster. Se nel deployment c'è scritto voglio che ci siano sempre 5 repliche del POD X il controller farà in modo che vi siano sempre 5 repliche di tale POD. Se ad esempio volessimo essere più precisi e volessimo analizzare solo il POD potremmo dare il seguente comando:

```bash
    # MOSTRA I PODS CREATI NEL CLUSTER
    kubectl get pods -n development
```

questo mi ha dato inizialmente un errore del tipo : 

```bash
NAME                                  READY   STATUS             RESTARTS   AGE
welcome-backend-665d448594-mqbqv   0/1     ImagePullBackOff   0          4m2s

```

ImagePull: Tentativo fallito di scaricare l'immagine.

BackOff: Kubernetes ha fallito, aspetta un momento e riproverà più tardi (e poi ancora, con attese sempre più lunghe).

questo è tipico: kubernetes ha fallito a scaricare l'immagine perchè ad esempio non l'abbiamo creata o non l'abbiamo messa dentro minikube ( come descritto sopra )
Per indagare meglio la situazione:

```bash 
    # CARTELLA CLINICA COMPLETA DEL POD
    kubectl describe pod welcome-backend-665d448594-mqbqv -n development
```
analizzando la cartella clinica del pod vedo che ha fallito con il caricamento dell'immagine. La creo e la spingo dentro minikube

```bash 
    docker build -t welcome-backend:dev-latest -f apps/welcome-backend/Dockerfile .
```
inizialmente ho scelto di fare una mia build nella mia macchina e poi di metterla dentro minikube. 

```bash 
    minikube image load welcome-backend:dev-latest
```

per magia appena inseriamo l'immagine nel cluster kubernetes la carica subito. Infatti il pod era in pending,  in attesa. 


```bash
# LISTA PODS NEL NAMESPACE DEVELOPMENT
kubectl get pods -n development                                        

NAME                                  READY   STATUS    RESTARTS   AGE
welcome-backend-665d448594-mqbqv   1/1     Running   0          23m

```

adesso il modo più veloce per testare se dentro il pod risponde un'applicazione alla porta 3001 è quello di create un **tunnel temporaneo** tra il nostro PC e il pod dentro minikube. 

```bash 
    # TUNNEL TEMPORANEO: Collega la porta 8080 del tuo PC alla porta 3001 del Pod.
    kubectl port-forward pod/welcome-backend-665d448594-mqbqv 8080:3001 -n development
``` 
questo collega il PC alla porta 8080 del pod. Ok tutto a posto. Adesso devo capire se il relativo servizio è up and running. Come lo faremo? facile. Come prima cosa andiamo ad analizzare il nome esatto del servizio. 

```bash 
    # LISTA DEI SERVICE DENTRO IL CLUTEST NAMESPACE DEVELOPMENT
    kubectl get svc -n development
```
che mi da il seguente risultato: 

```bash 
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
welcome-backend   ClusterIP   10.102.83.129   <none>        80/TCP    35m
```

andiamo ad analizzarlo: 

1. ClusterIP: Il tipo di servizio di default. gli altri pods possono riferirsi a questo servizio tramite 10.102.83.129. L' IP è privato di minikube. 

2. EXTERNAL-IP: <none>: giusto! essendo un cluster IP non ha external ip di default. 

3. PORT(S) : 80 è la porta del Service (il punto di ingresso).

Se un altro Pod nel cluster vuole parlare con il tuo backend, deve bussare alla porta 80.

la nostra app risponde sulla 3001. Il Service deve quindi fare da "traduttore": prende il traffico sulla 80 e lo gira alla 3001 del Pod. Dobbiamo allora verificare il traduttore. Per fare questo, come dicevamo prima, è utile analizzare il servizio. 

```bash
    # CARTELLA CLINICA COMPLETA DEL SERVICE
    kubectl describe svc welcome-backend -n development
```


```bash
Name:                     welcome-backend
Namespace:                development
Labels:                   app=welcome-backend
                          app.kubernetes.io/managed-by=Helm
                          env=dev
                          part-of=adhr-enterprise-suite
Annotations:              meta.helm.sh/release-name: welcome-backend
                          meta.helm.sh/release-namespace: development
Selector:                 app=welcome-backend
Type:                     ClusterIP
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.102.83.129
IPs:                      10.102.83.129
Port:                     http  80/TCP # <== porta esterna
TargetPort:               http/TCP
Endpoints:                10.244.0.4:3001 # <== indirizzo reale del pod
Session Affinity:         None
Internal Traffic Policy:  Cluster
Events:                   <none>
```
poichè il service è progettato per essere utilizzato dagli altri pods e da un ingress per testarlo, devo fare come prima. Devo creare un tunnel di tipo port-forward tra localhost:8080 e il service alla porta 80:

```bash 
    kubectl port-forward svc/welcome-backend 8080:80 -n development
```

l'ultimo pezzo della matrioska è l'ingress. Di default in minikube non è attivo. L'ingress è costituito da due parti:

1. Controller ( es. nginx )

2. Regola ( oggetto ingress )

per vedere se è attivo il controller: 

```bash 
    minikube addons list | grep ingress
```

che mi ha dato il seguente risultato: 

```bash 
│ ingress      │ minikube │ disabled   │  Kubernetes   │
│ ingress-dns  │ minikube │ disabled   │ minikube      │
```

lo devo quindi abilitare: 


```bash 
# ABILITA INGRESS IN MINIKUBE CHE DI DEFAULT E' SPENTO
minikube addons enable ingress
```

```bash 
# LISTA DEGLI INGRESS PRESENTI ATTIVI
kubectl get ingress -n development
```

```bash 
NAME                         CLASS   HOSTS                  ADDRESS   PORTS   AGE
welcome-backend-ingress   nginx   api.welcome.local             80      60m
```
dopo un po diventa:

```bash
NAME                        CLASS   HOSTS                  ADDRESS        PORTS 
welcome-backend-ingress   nginx   api.welcome.local   192.168.49.2   80 
```
cioè dopo un po l'ingress riceveun ip address dal cluster minikube. Per analizzare l'ingress:

```bash
# CARTELLA CLINICA COMPLETA INGRESS
kubectl describe ingress  welcome-backend-ingress -n development
Name:             welcome-backend-ingress
Labels:           app.kubernetes.io/managed-by=Helm
Namespace:        development
Address:          192.168.49.2
Ingress Class:    nginx
Default backend:  <default>
Rules:
  Host                  Path  Backends
  ----                  ----  --------
  api.welcome.local  
                        /   welcome-backend:3001 ()
Annotations:            meta.helm.sh/release-name: welcome-backend
                        meta.helm.sh/release-namespace: development
                        nginx.ingress.kubernetes.io/rewrite-target: /
Events:
  Type    Reason  Age                    From                      Message
  ----    ------  ----                   ----                      -------
  Normal  Sync    5m10s (x2 over 6m10s)  nginx-ingress-controller  Scheduled for sync
```
qui c'è un inghippo. l'ingress sta facendo il forwrwarding al service welcome-backend:3001 () ma questo è sbagliato! il service risponde alla porta 80 per come l'abbiamo definito. 

# ESEMPIO SERVICE:

```yaml
apiVersion: v1
kind: Service
metadata:
  # Il nome del service deve essere prevedibile (es. welcome-backend)
  name: {{ .Release.Name }}
  labels:
    app: {{ .Release.Name }}
    part-of: adhr-enterprise-suite
    env: {{ .Values.env | default "dev" }}
spec:
  # ClusterIP. È lo standard perché rende l'app raggiungibile solo dentro il cluster. 
  # Sarà poi l'Ingress ad aprirla al mondo esterno. 
  type: ClusterIP
  ports:
    
    # questa è la porta che vedono gli altri Pod che vogliono connettersi con questo service. 
    - port: 80          # La porta "virtuale" del Service dentro il cluster
      
      # si tratta della porta interna, quella che il service usa per accedere al container nel pod 
      targetPort: http  # Punta al nome della porta definita nel Deployment (o direttamente al numero)
                        # per esempio in env/local/welcome-backend 

      protocol: TCP
      name: http
  selector:
    # Fondamentale: deve matchare ESATTAMENTE le labels del template dei Pod nel Deployment
    app: {{ .Release.Name }}
```


Supponiamo che il tuo Frontend debba fare una chiamata API al Backend.

Il Frontend chiama: http://onboarding-backend:80/api/users

Perché 80? Perché è la porta standard del web e rende l'URL pulito. Non devi scrivere 3001 nel codice del frontend.

Il Service onboarding-backend riceve sulla 80:

Lui guarda la sua tabella di configurazione e vede: "Ok, tutto quello che arriva sulla 80, mandalo ai miei Pod sulla porta chiamata http".

Il Service "traduce" la chiamata:

Inoltra il traffico verso il Pod sulla porta 3001.

# COME MODIFICARE IL CLUSTER
Per aggiornare la tua applicazione con Helm e riflettere le modifiche allo YAML (che sia l'Ingress, il Service o il Deployment), il comando magico è helm upgrade.

Ecco la procedura esatta per farlo "al volo":

```bash
helm upgrade nome-release ./path-alla-tua-chart -n development
``` 

il nome della release è quella che vedi con helm list. 

per esempio per correggere il problema qui sopra, si corregge la parte dello yaml coinvolta ( ingress.yaml ) :

```yaml
spec:
  ingressClassName: nginx
  rules:
    - host: {{ .Values.ingress.host | quote }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}
                port:
                  number: 80 # Deve corrispondere a service.port
```

poi ho dato:

```bash 

helm upgrade welcome-backend ./kubernetes/charts/adhr-enterprise-suite  -n development -f ./kubernetes/env/local/welcome-backend.yaml

```

# PULIZIA

Per prima cosa, rimuovi tutto ciò che Helm ha creato (Pod, Service, Ingress, Secret).

```bash
    helm uninstall welcome-backend -n development
```

Cosa succede: Helm elimina tutti gli oggetti associati a quella release nel namespace development.

Verifica: Se dai kubectl get all -n development, dovresti vedere la lista svuotarsi (i Pod potrebbero metterci qualche secondo a sparire del tutto, passando per lo stato Terminating).

rimozione totale del namespace. 


```bash
    kubectl delete namespace development
    minikube image rm welcome-backend:dev-latest
``` 



----------------------------------


1. Come eseguire l'aggiornamento (Helm Upgrade)
Il comando principale per aggiornare una release esistente è helm upgrade. Riprendendo il comando che avevi nei commenti del tuo file, dovresti eseguire:

Bash

helm upgrade welcome-frontend ./charts/adhr-enterprise-suite \
  -n dev-namespace \
  -f env/dev/welcome-frontend.yaml \
  --set image.tag=1.2.1 # Opzionale: se vuoi cambiare anche la versione dell'immagine
Cosa succede quando lanci questo comando?

Helm confronta lo stato attuale nel cluster con i nuovi file .yaml.

Vede che il deployment.yaml ha una nuova variabile d'ambiente (DATABASE_URL).

Kubernetes avvia un Rolling Update: crea nuovi Pod con la nuova configurazione e, solo quando sono pronti (passano i probe), spegne quelli vecchi.

2. Devo tracciare la versione del Chart? (Best Practice)
La risposta è sì, assolutamente. Ci sono due versioni da distinguere nel file Chart.yaml della tua cartella charts/adhr-enterprise-suite:

version (Chart Version): È la versione del "pacchetto" Helm. Ogni volta che modifichi un file .yaml (come il deployment.yaml per aggiungere il database), dovresti incrementare questa versione (es. da 0.1.0 a 0.1.1).

appVersion (Application Version): È la versione del tuo codice sorgente (es. la versione della tua immagine Docker).

Perché è importante tracciare la versione del Chart?

Rollback: Se l'aggiornamento fallisce, puoi tornare indietro con helm rollback welcome-frontend <revision>.

Tracciabilità: Saprai esattamente quale versione della configurazione è installata in quale ambiente.

CD (Continuous Delivery): Gli strumenti come ArgoCD o Jenkins usano la versione del chart per capire se c'è qualcosa di nuovo da deployare.

3. Trucco per forzare il riavvio (Restart)
A volte Kubernetes non riavvia i Pod se cambi solo un valore esterno (come un Secret o una ConfigMap esterna) che Helm non traccia direttamente. Per essere sicuro che i Pod ripartano sempre dopo un upgrade, si usa spesso questa annotazione nel template del deployment.yaml:

YAML

spec:
  template:
    metadata:
      annotations:
        # Questo forza il riavvio dei pod ad ogni upgrade di helm
        rollme: {{ randAlphaNum 5 | quote }}
      labels:
        app: {{ .Release.Name }}
4. Verifica post-update
Dopo aver lanciato l'upgrade, controlla che tutto sia andato a buon fine:

Vedi lo stato della release:

Bash

helm list -n dev-namespace
Controlla i log del nuovo Pod per vedere se Fastify è partito:

Bash

kubectl logs -l app=welcome-frontend -n dev-namespace
Verifica che la variabile sia effettivamente dentro il Pod:

Bash

kubectl exec -it <nome-del-pod> -n dev-namespace -- printenv | grep DATABASE_URL
Nota finale sul file .env:
Per eliminare l'errore Failed to load /app/.env.development, assicurati che nel tuo codice Fastify, quando inizializzi il plugin delle env, la ricerca dei file .env sia condizionale:

TypeScript

// Esempio nel codice Node.js
const options = {
  schema: EnvSchema,
  // Carica .env SOLO se non siamo in produzione/kubernetes
  dotenv: process.env.NODE_ENV === 'development' ? { path: '.env.development' } : false 
};
Hai già configurato il values.yaml o il file in env/dev/ con il valore reale della stringa di connessione?


# INGRESS
L'ingress non si aggancia a qualcosa ma agisce più come un vigile urbano. Legge l'url e decide dove mandare il traffico. La parte interessata è: 

```yaml
spec:
  ingressClassName: nginx
  rules:
    - host: {{ .Values.ingress.host | quote }}
``` 

per esempio in /env/local/welcome-backend.yaml abbiamo:

```yaml

ingress:
  host: "api.welcome.local"

```


. Come decide dove mandare il traffico?
Sì, il browser manda un header specifico chiamato Host.

Quando scrivi http://welcome.local nel browser:

Il browser risolve il nome (tramite il tuo file /etc/hosts) nell'IP 192.168.49.2.

Il browser apre una connessione TCP verso 192.168.49.2.

All'interno della richiesta HTTP, il browser scrive:

Nginx riceve la richiesta, legge Host: welcome.local, guarda i tuoi file ingress.yaml e dice: "Ok, questo deve andare al Service del Frontend".

Se invece scrivi http://api.welcome.local, l'header sarà Host: api.welcome.local e Nginx ti dirotterà verso il Backend.

2. È un routing normale? È una Best Practice?
Sì, assolutamente. Questo metodo si chiama Name-based Virtual Hosting ed è lo standard industriale.

Perché si usa? Permette di risparmiare IP pubblici. In Cloud (AWS, Azure, Google), un IP statico costa. Con un solo Ingress (e quindi un solo IP e un solo Load Balancer), puoi ospitare centinaia di microservizi diversi (es. auth.ditta.it, app.ditta.it, api.ditta.it).

Best Practice: È la pratica consigliata per gestire microservizi. Invece di esporre ogni servizio con un IP diverso, esponi un unico "punto di ingresso" (l'Ingress) che centralizza la sicurezza (SSL/TLS), i log e il routing.

3. I vantaggi di questo approccio
Certificati SSL centralizzati: Gestisci il certificato HTTPS in un unico punto (l'Ingress) invece di configurarlo in ogni singolo container.

Disaccoppiamento: Puoi cambiare il backend o spostare i servizi da un nodo all'altro senza che l'utente debba cambiare URL o IP.

Sicurezza: Il tuo backend non è esposto direttamente su internet, ma è protetto "dietro" il controller che può fare da firewall, rate-limiting, ecc.

Cosa succede se non metti l'header?
Se provi a fare curl http://192.168.49.2, l'header Host sarà l'IP stesso. Nginx cercherà una regola per l'host 192.168.49.2, non la troverà, e ti restituirà il famoso 404 Not Found.


---------------


Spostare un database è l'operazione più "delicata" in un'architettura a microservizi, ma se segui le best practice agili fin dal primo giorno, diventa un'operazione quasi indolore.

Il segreto non è nello spostamento fisico dei dati, ma in come le tue app si collegano al database.

1. Il segreto: L'astrazione della Stringa di Connessione
Se nel tuo codice (o nei tuoi file values.yaml) non scrivi mai un IP fisso, ma usi variabili d'ambiente, spostare il DB richiede 5 minuti.

Esempio di evoluzione Agile:

Fase 1 (Oggi): Il tuo backend punta a db-shared.postgres.database.azure.com/db_welcome.

Fase 2 (Domani): Il servizio cresce. Crei un nuovo server dedicato. Copi i dati (dump/restore).

Fase 3 (Il passaggio): Cambi solo la variabile DATABASE_URL nel tuo values.yaml in db-dedicato-frontend.postgres.database.azure.com/db_welcome e fai un helm upgrade.

Kubernetes riavvia i Pod, che si collegano istantaneamente al nuovo server. Tempo di downtime: quasi zero.

2. Come si spostano "fisicamente" i dati?
Esistono tre modi professionali per farlo, a seconda di quanto budget e quanto "tempo di stop" puoi permetterti:

A. Metodo "Manuale" (Gratis - Per piccoli DB)
Metti l'app in manutenzione (o spegni i Pod).

Fai un pg_dump (esportazione) del database dal server vecchio.

Fai un pg_restore (importazione) sul server nuovo.

Cambi la stringa di connessione su AKS e riparti.
Tempo richiesto: 10-30 minuti.

B. Azure Database Migration Service (Professionale)
Azure ha uno strumento che replica i dati dal vecchio al nuovo server in tempo reale. Quando i due sono sincronizzati, fai lo "switch" (cambi l'indirizzo nelle app).
Tempo richiesto: Pochi secondi di disservizio.

3. La sfida: Lo "State" (I Dati)
Ricorda questa regola d'oro: I container sono effimeri (muoiono e rinascono), i database sono persistenti.

Se tieni il database dentro Kubernetes (come pod), spostarlo è più difficile perché devi gestire i "Persistent Volumes" (i dischi fisici di Azure). Se lo tieni fuori (come servizio PaaS di Azure), spostarlo o scalarlo è solo una questione di click o di cambio di stringa.

4. Consigli per "Scalare senza dolore"
Usa i DNS, non gli IP: Non collegarti mai a 10.0.0.5, usa sempre il nome host fornito da Azure.

Micro-Database logici: Anche se sono sullo stesso server fisico, tieni i database separati (es. db_auth, db_orders, db_catalog). Così potrai spostarne uno alla volta senza toccare gli altri.

Connection Pooling: Quando scalerai a molti Pod (es. 20 repliche del frontend), ognuno proverà ad aprire una connessione al DB. Usa strumenti come PgBouncer (per Postgres) per evitare di mandare il database in crash per troppe connessioni.

Cosa faremo lunedì?
Adesso che hai il cluster spento e sai come gestire i DB, lunedì potremmo:

Configurare il tuo primo Azure Database for PostgreSQL (o MySQL) in modalità "Burstable" (la più economica, che costa circa 12€/mese).

Configurare i Secrets su Kubernetes per gestire queste connessioni in sicurezza.

Goditi il weekend, il cluster è al sicuro (e spento)! 👋