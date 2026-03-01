# Nodo

Il concetto fondamentale di Kubernetes è quello di nodo. Un nodo è una macchina fisica o virtuale dove vengono distribuiti e girano i PODS. In particolare nella configurazione minima avremo:

1. Nodo master

2. N nodi workers

nel nodo master gira il **control plane** che è una vera e proprio console di controllo. Nel control polane girano i seguenti componenti:

1. kube-apiserver: è il cuore di kubernetes sono le API che vengono invocate da tutti i componenti per sincronizzare il lavoro di gestione del cluster.

2. Scheduler: Cerca Pods non ancora legati ad un nodo e li assegna ad un nodo.

3. kube-controller-manager: Si tratta di un controllore che si assicura che quanto stabilito nel file yaml venga rispettato nel cluster. Se abbiamo detto voglio 2 istanze del POD 1 e 3 del POD b farà di tutto per rispettare questa configurazione

4. cloud-controller-manager : per integrarsi con il cloud provider

5. etcd : highly-available key value store for all API server data.

# Flusso di base

In generale kube-controller-manager tramite API SERVER legge da etcd la configurazione del cluster. Poi ad esempio chiede, sempre tramite API SERVER: " il pod x ha dato segni di vita negli ultimi 40 secondi?" Le API SERVER leggono questa info da etcd che è manenuto informato sullo stato del POD tramite **_kubelet_** un agente che gira nel node worker. Il kubelet si occupe del nodo locale.

# Separazione logica del lavoro
In un ambiente professionale, l'immagine Docker è il tuo "pacchetto". Non cambia tra locale e cloud, cambia solo dove la "parcheggi" (il Registry).

Ambiente            | Esempio Tag Professionale | Perché si usa
Sviluppo (Dev)      | dev-a1b2c3d (hash Git)    | quale commit stai testando.
Sviluppo (Rapido)   | dev-latest (test locali)  | sconsigliato per la produzione 
Produzione (Prod)   | v1.2.0 (SemVer)           | MAJOR.MINOR.PATCH

Regola d'oro: Non sovrascrivere mai i tag in produzione. Se fai una modifica, crei la v1.2.1.

Per essere indipendente dal cloud provider, devi distinguere tra "Cosa gira" (l'app) e "Dove gira" (il cluster).

Ecco come strutturerei i tuoi file per gestire i due Namespace:

├── env
│   ├── local                  <-- Per Minikube
│   │   ├── onboarding-frontend.yaml
│   │   └── onboarding-backend.yaml
│   ├── dev-aws                <-- Per AWS EKS (Ambiente Dev)
│   │   ├── onboarding-frontend.yaml
│   │   └── onboarding-backend.yaml
│   └── prod-aws               <-- Per AWS EKS (Ambiente Prod)
│       ├── onboarding-frontend.yaml
│       └── onboarding-backend.yaml


con questa struttura potremo dare i comandi: 

```bash

# Esempio: Installa il Frontend in LOCALE (Minikube)
    helm install onboarding-frontend ./charts/adhr-enterprise-suite \
    -n dev \
    -f env/local/onboarding-frontend.yaml

# Esempio: Installa il Backend in AWS (Produzione)
    helm install onboarding-backend ./charts/adhr-enterprise-suite \
    -n prod \
    -f env/prod-aws/onboarding-backend.yaml

``` 

ecco un esempio. In env/dev-aws ho messo:

```yaml 
# env/local.yaml
    image:
    repository: 725494707422.dkr.ecr.eu-central-1.amazonaws.com/onboarding-backend
    tag: dev-a1b2c3d # (il tag specifico del commit)
    pullPolicy: IfNotPresent 

    service:
    port: 3001
``` 
Il tag viene passato "al volo" senza toccare il file. Possiamo anche impostare manualmente
un default in caso non passiamo il tag a volo. 

```bash
helm upgrade onboarding-frontend ./charts/adhr-enterprise-suite \
  -f env/local/onboarding-frontend.yaml \
  --set image.tag=v1.2.3
```

Fase C: Automazione Totale (CI/CD)
In un'azienda, quando fai un "Push" su GitHub, succede questo:

Uno script (GitHub Actions/GitLab CI) vede il codice.

Crea l'immagine Docker e le dà un tag (es. l'hash del commit a1b2c3d).

Lo script lancia il comando Helm usando --set image.tag=a1b2c3d.
Nessun essere umano tocca i file YAML per cambiare i tag.


# Namespace 
il namespace di kubernetes non è solo un'etichetta, è un muro logico.
Isolamento: Le app nel namespace dev non vedono (di default) quelle in prod.

DNS Interno: Questa è la parte fondamentale. Dentro il cluster, il backend sarà raggiungibile all'indirizzo:

1. onboarding-backend.dev.svc.cluster.local (nel namespace dev)
2. onboarding-backend.prod.svc.cluster.local (nel namespace prod)

Questo ti permette di avere lo stesso identico codice frontend che punta semplicemente a http://onboarding-backend, e Kubernetes risolverà l'indirizzo nel namespace corretto.


# Service
Come sappiamo i pod vengono continuamente creati, interrotti, spostati ecc.. vuol dire che cambiano il loro indirizzo IP. Per fare in modo che siano esposti come servizi raggiungibili dall'esterno del cluster e per fare in modo che possano comunicare tra di loro senza dover sapere quale ip devono utilizzare, si creano i ***SERVICE*** . Un service di kubernetes è 
essenzialmente una risorsa che serve a creare un punto di ingresso per un cluster di pods che forniscono il meesimo servizio. Ogni servizio ha sempre lo stesso IP Address, e la stessa porta che non cambiano mai finchè essite il service. I client possono aprire connessioni con il service e queste connessioni sono poi dirottate ai pods sottostanti.

Quando crei un Service chiamato onboarding-backend, Kubernetes crea automaticamente un record DNS interno. Qualsiasi altro Pod nello stesso namespace può raggiungere il backend semplicemente usando l'hostname:
http://onboarding-backend


Se i pod fossero in namespace diversi (es. il frontend deve parlare a un database in un namespace shared), l'indirizzo sarebbe:
http://onboarding-backend.nome-namespace.svc.cluster.local


Il codice (es. React, Vue, Node.js) non deve avere l'URL "scritto nel codice" (hardcoded). Deve leggerlo da una Variabile d'Ambiente.

Dobbiamo dire a Kubernetes di "iniettare" queste variabili nel container. Aggiungi la sezione env sotto containers:

```yaml
# ... dentro spec.template.spec.containers
- name: {{ .Release.Name }}
  image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
  env:
    - name: BACKEND_URL
      value: {{ .Values.config.backendUrl | quote }}
    - name: NODE_ENV
      value: {{ .Values.env | default "dev" | quote }}
``` 

# La trappola del "Browser vs Server" (Importante!)
Qui molti sbagliano. Devi distinguere dove gira il codice:

Server-Side (Node.js/Python/Go): Se il tuo frontend è un server che interroga il backend, l'indirizzo http://onboarding-backend (DNS interno) funziona perfettamente.

Client-Side (React/Angular/Vue nel browser): Se il codice gira nel browser dell'utente (fuori dal cluster), il browser non sa cosa sia http://onboarding-backend. In quel caso, il frontend deve puntare all'URL pubblico gestito dall'Ingress.

# minikube 

```bash
  minikube start --driver=docker
  minikube addons enable ingress # ingress di minikube
```
