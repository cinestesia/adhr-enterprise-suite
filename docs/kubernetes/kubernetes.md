# minikube
Minikube è l'implementazione locale di un cluster kubernetes. Per costruire il cluster locale: 

```bash
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

in questo modo invece che caricare le immagini in un registro esterno utilizzo il registro locale. 

# kubectl 
Per gestire il cluster locale, utilizzeremo kubectl. Per esempio:

```bash 
    kubectl create namespace development # CREA NAMESPACE
```
questo crea un namespace 'development' dentro il cluster creato con minikube- 

per vedere i namespace dentro un cluster; 

```bash 
    kubectl get namespaces # LISTA DEI NAMESPACES
```
# helm
Possiamo utilizzare ***helm*** come fosse un installatore delle nostre applicazioni. Per esempio per installare onboarding-backend: 

```bash
    # INSTALLARE UN APP NEL CLUSTER
    helm install onboarding-backend ./kubernetes/charts/adhr-enterprise-suite  -n development -f ./kubernetes/env/local/onboarding-backend.yaml
```

questo installa l'app onboarding-backend dalla suite adhr-enterprise-suite ( che è dove si trova Chart.yaml ). 

helm genera lo yaml. Fa operazioni di sostituzione, trova e sostituisci. Ad esempio dentro deployment avremo da qualche parte: 

```yaml
    image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```
quando lanciamo helm con il file specifico come sopra, Helm carica i valori di default (se presenti in un file values.yaml dentro la cartella della chart ) . Poi:

1. Helm applica i valori dal file onboarding-backend.yaml. 
Se lì abbiamo tag: "dev-latest", questo valore vince su tutto il resto.

2. Helm "inietta" questi valori finali nei segnaposto {{ ... }} che trova dentro deployment.yaml.

Helm segue un ordine di precedenza molto rigido. L'ultimo comando o file citato "vince" sulle chiavi con lo stesso nome:

1. Values.yaml della Chart: (Base minima) - Il file che sta dentro charts/adhr-enterprise-suite/values.yaml.

2. File passati con -f: (Il tuo caso) - Se passi env/local/onboarding-backend.yaml, i valori qui dentro sovrascrivono quelli di default.

3. Parametri passati con --set: (Massima priorità) - Se scrivi --set image.tag=v99, questo vincerà anche su quello che hai scritto nel file in env/local/.

helm lascia una firma sugli oggetti che crea:.

```bash 
    kubectl describe pod <nome-pod> -n development | grep helm.sh/chart
```
# Versioning 

**appVersion** (L'Applicazione): Rappresenta il tuo codice sorgente.

Quando cambia? Ogni volta che fai un merge su main o crei un nuovo tag Git 
dell'app (es. v1.2.3).

Esempio: Passi da un backend in Node.js v1 a v2.

**version** (La Chart/Infrastruttura): Rappresenta il "come" installi l'app.

Quando cambia? Se modifichi i file YAML (es. aggiungi un Ingress, cambi una variabile di memoria, aggiungi un database).

Esempio: L'app resta la v1.2.3, ma hai aggiunto il supporto HTTPS nell'Ingress. La version della chart passa da 0.1.0 a 0.1.1.

# Versioning e sviluppo fase 1:

1. Sviluppo (Feature Branch)
Git: Lavori su feature/onboarding-fix.

2. Docker: La CI (GitHub Actions/GitLab CI) builda un'immagine temporanea: onboarding-backend:sha-abcdef.

3. Helm: Installi in un namespace di test usando --set image.tag=sha-abcdef. Qui non tocchi il Chart.yaml.


# Versioning e release fase 2 (Develop -> Main) :
| Step | Azione | Cosa cambia nel Chart.yaml | Tag Git |
| :--- | :--- | :--- | :--- |
| **1** | **Bumping** | Aumenti `appVersion` (es. 1.0.0) e `version` (es. 0.2.0). | Tag `v1.0.0` sul repo. |
| **2** | **Build** | Buildi l'immagine definitiva: `onboarding-backend:1.0.0`. | - |
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

Adesso abbiamo onboarding-backend.yaml e onboarding-frontend.yaml separati. Se entrambi appartengono alla stessa chart adhr-enterprise-suite, la best practice è:
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
deployment.apps/onboarding-backend   1/1     1            1           24h
```

questo è un oggetto di tipo Deployment. Serve per controllare il cluster. Si tratta di un oggetto creato in etcd di tipo dichiarativo. Contratto Intelligente o un Manuale di Istruzioni Vivo. Quest'oggetto è controllato da Kube-Controller-Manager, nei suoi controlli, per mantenere coerente il cluster. Se nel deployment c'è scritto voglio che ci siano sempre 5 repliche del POD X il controller farà in modo che vi siano sempre 5 repliche di tale POD. Se ad esempio volessimo essere più precisi e volessimo analizzare solo il POD potremmo dare il seguente comando:

```bash
    # MOSTRA I PODS CREATI NEL CLUSTER
    kubectl get pods -n development
```

questo mi ha dato inizialmente un errore del tipo : 

```bash
NAME                                  READY   STATUS             RESTARTS   AGE
onboarding-backend-665d448594-mqbqv   0/1     ImagePullBackOff   0          4m2s

```

ImagePull: Tentativo fallito di scaricare l'immagine.

BackOff: Kubernetes ha fallito, aspetta un momento e riproverà più tardi (e poi ancora, con attese sempre più lunghe).

questo è tipico: kubernetes ha fallito a scaricare l'immagine perchè ad esempio non l'abbiamo creata o non l'abbiamo messa dentro minikube ( come descritto sopra )
Per indagare meglio la situazione:

```bash 
    # CARTELLA CLINICA COMPLETA DEL POD
    kubectl describe pod onboarding-backend-665d448594-mqbqv -n development
```
analizzando la cartella clinica del pod vedo che ha fallito con il caricamento dell'immagine. La creo e la spingo dentro minikube

```bash 
    docker build -t onboarding-backend:dev-latest -f apps/onboarding-backend/Dockerfile .
```
inizialmente ho scelto di fare una mia build nella mia macchina e poi di metterla dentro minikube. 

```bash 
    minikube image load onboarding-backend:dev-latest
```

per magia appena inseriamo l'immagine nel cluster kubernetes la carica subito. Infatti il pod era in pending,  in attesa. 


```bash
# LISTA PODS NEL NAMESPACE DEVELOPMENT
kubectl get pods -n development                                        

NAME                                  READY   STATUS    RESTARTS   AGE
onboarding-backend-665d448594-mqbqv   1/1     Running   0          23m

```

adesso il modo più veloce per testare se dentro il pod risponde un'applicazione alla porta 3001 è quello di create un **tunnel temporaneo** tra il nostro PC e il pod dentro minikube. 

```bash 
    # TUNNEL TEMPORANEO: Collega la porta 8080 del tuo PC alla porta 3001 del Pod.
    kubectl port-forward pod/onboarding-backend-665d448594-mqbqv 8080:3001 -n development
``` 
questo collega il PC alla porta 8080 del pod. Ok tutto a posto. Adesso devo capire se il relativo servizio è up and running. Come lo faremo? facile. Come prima cosa andiamo ad analizzare il nome esatto del servizio. 

```bash 
    # LISTA DEI SERVICE DENTRO IL CLUTEST NAMESPACE DEVELOPMENT
    kubectl get svc -n development
```
che mi da il seguente risultato: 

```bash 
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
onboarding-backend   ClusterIP   10.102.83.129   <none>        80/TCP    35m
```

andiamo ad analizzarlo: 

1. ClusterIP: Il tipo di servizio di default. gli altri pods possono riferirsi a questo servizio tramite 10.102.83.129. L' IP è privato di minikube. 

2. EXTERNAL-IP: <none>: giusto! essendo un cluster IP non ha external ip di default. 

3. PORT(S) : 80 è la porta del Service (il punto di ingresso).

Se un altro Pod nel cluster vuole parlare con il tuo backend, deve bussare alla porta 80.

la nostra app risponde sulla 3001. Il Service deve quindi fare da "traduttore": prende il traffico sulla 80 e lo gira alla 3001 del Pod. Dobbiamo allora verificare il traduttore. Per fare questo, come dicevamo prima, è utile analizzare il servizio. 

```bash
    # CARTELLA CLINICA COMPLETA DEL SERVICE
    kubectl describe svc onboarding-backend -n development
```


```bash
Name:                     onboarding-backend
Namespace:                development
Labels:                   app=onboarding-backend
                          app.kubernetes.io/managed-by=Helm
                          env=dev
                          part-of=adhr-enterprise-suite
Annotations:              meta.helm.sh/release-name: onboarding-backend
                          meta.helm.sh/release-namespace: development
Selector:                 app=onboarding-backend
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
    kubectl port-forward svc/onboarding-backend 8080:80 -n development
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
onboarding-backend-ingress   nginx   api.onboarding.local             80      60m
```
dopo un po diventa:

```bash
NAME                        CLASS   HOSTS                  ADDRESS        PORTS 
onboarding-backend-ingress   nginx   api.onboarding.local   192.168.49.2   80 
```
cioè dopo un po l'ingress riceveun ip address dal cluster minikube. Per analizzare l'ingress:

```bash
# CARTELLA CLINICA COMPLETA INGRESS
kubectl describe ingress  onboarding-backend-ingress -n development
Name:             onboarding-backend-ingress
Labels:           app.kubernetes.io/managed-by=Helm
Namespace:        development
Address:          192.168.49.2
Ingress Class:    nginx
Default backend:  <default>
Rules:
  Host                  Path  Backends
  ----                  ----  --------
  api.onboarding.local  
                        /   onboarding-backend:3001 ()
Annotations:            meta.helm.sh/release-name: onboarding-backend
                        meta.helm.sh/release-namespace: development
                        nginx.ingress.kubernetes.io/rewrite-target: /
Events:
  Type    Reason  Age                    From                      Message
  ----    ------  ----                   ----                      -------
  Normal  Sync    5m10s (x2 over 6m10s)  nginx-ingress-controller  Scheduled for sync
```
qui c'è un inghippo. l'ingress sta facendo il forwrwarding al service onboarding-backend:3001 () ma questo è sbagliato! il service risponde alla porta 80 per come l'abbiamo definito. 

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

helm upgrade onboarding-backend ./kubernetes/charts/adhr-enterprise-suite  -n development -f ./kubernetes/env/local/onboarding-backend.yaml

```

# PULIZIA

Per prima cosa, rimuovi tutto ciò che Helm ha creato (Pod, Service, Ingress, Secret).

```bash
    helm uninstall onboarding-backend -n development
```

Cosa succede: Helm elimina tutti gli oggetti associati a quella release nel namespace development.

Verifica: Se dai kubectl get all -n development, dovresti vedere la lista svuotarsi (i Pod potrebbero metterci qualche secondo a sparire del tutto, passando per lo stato Terminating).

rimozione totale del namespace. 


```bash
    kubectl delete namespace development
    minikube image rm onboarding-backend:dev-latest
``` 

