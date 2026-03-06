# Deployments

Nel file deployment.yaml possiamo dichiarare come sono fatti i Pods e i ReplicaSets. Si noti che in kubernetes creiamo oggetti. Quando crei un oggetto (un Pod, un Service, un Deployment), stai dicendo a Kubernetes: "Voglio che questa cosa esista e sia fatta così".
L'API Server scrive questo desiderio nel database (etcd) e da quel momento Kubernetes lavorerà instancabilmente per far sì che la realtà corrisponda al tuo oggetto.

Ogni singolo oggetto in Kubernetes ha due campi fondamentali che devi sempre immaginare nella tua testa:

Spec (Specifica): È quello che scrivi tu nel file YAML. Rappresenta lo stato desiderato (es. "voglio 3 repliche di questo container").

Status (Stato attuale): È quello che scrive Kubernetes. Rappresenta la realtà (es. "al momento ci sono solo 2 repliche attive perché una sta crashando").

L'obiettivo di Kubernetes è far sì che Status = Spec.

# Pods

L'unità minima di deployment in Kubernetes è il Pod. Ogni Pod avrà il suo proprio indirizzo IP e tutti i pod potranno comunicare con gli altri come se appartenessere alla medesima rete flat. In ogni pod possono girare uno o più container. Solitamente vi sarà un solo container ma in quei casi dove è plausibile avere più container nel medesimo pod, avremo il pattern sidecar.
Quando facciamo il deploy di applicazioni con tanti pods il numero di pods aumenta come pure aumenta la necessità di dare categorie a questi pods. Per esempio esisteranno più copie del medesimo componente e più versioni ( releases ) del medesimo componente.

Per esempio:

```bash
    kubectl get pods
```

NAME READY STATUS RESTARTS AGE
welcome-frontend-696b5d8f8-abc12 1/1 Running 0 5m
welcome-frontend-696b5d8f8-xyz34 1/1 Running 0 5m
welcome-frontend-7b4c9e1a2-dfg56 1/1 Running 0 2m
welcome-backend-55d4c8f74-pqr78 2/2 Running 0 10m
welcome-backend-55d4c8f74-lmn90 2/2 Running 0 10m
db-postgresql-0 1/1 Running 0 1d

per esempio qui vediamo i primi due pod:

welcome-frontend-696b5d8f8-abc12
welcome-frontend-696b5d8f8-xyz34

Repliche dello stesso componente (Scaling): la prima parte del nome è identica. Il Deployment ha creato un ReplicaSet (identificato dal suffisso 696b5d8f8) che ha generato due "operai" identici. L'ultima stringa (abc12, xyz34) è un hash casuale per garantire che ogni Pod abbia un nome univoco e il suo IP nella rete flat.

il terzo pod:

welcome-frontend-7b4c9e1a2-dfg56

Questo ha un hash centrale diverso (7b4c9e1a2). Probabilmente hai appena fatto un aggiornamento (es. passato dalla v1 alla v2). Kubernetes sta facendo girare la nuova versione accanto alla vecchia per testarne la stabilità prima di spegnere quelle precedenti.

Poi vediamo Il Pattern Sidecar (Più container nel Pod)
Guardiamo i Pod del backend:

welcome-backend-... -> READY 2/2 Qui vedi 2/2. Significa che dentro quel singolo Pod "abitano" due container.

Il primo è la tua app Node.js/Python (il Main Container).

Il secondo è, ad esempio, un Cloud SQL Proxy o un raccoglitore di log (il Sidecar).
Entrambi condividono lo stesso indirizzo IP e possono parlarsi tramite localhost.

Come Kubernetes organizza questo caos? qui entrano all'opera le labels.

Per Release: kubectl get pods -l release=v2.0 -> Vedresti solo il terzo Pod.

Per Componente: kubectl get pods -l app=welcome-frontend -> Vedresti i primi tre Pod.

Per Ambiente: kubectl get pods -l env=prod -> Vedresti tutto ciò che è produzione.

Esempio:

```yaml
# Deployment descrive un oggetto di tipo Deplyment che di serve a definire Pods e ReplicaSet
# qualcosa del tipo: voglio un N repliche di questa app
# Consideriamo sempre il comando:
# Esempio per l'ambiente dev

# helm install welcome-frontend ./charts/adhr-enterprise-suite \
# -n dev-namespace \
# --create-namespace \
# -f env/dev/welcome-frontend.yaml

apiVersion: apps/v1
kind: Deployment

metadata:
    # Ogni oggetto creato in kubernetes ha dei metadata . Per esempio name indica il nome
    # di questo oggetto di tipo Deplyment e deve essere univoco all'interno di un namespace.
    # Si noti che il namespace non lo dichiareremo qui nello yaml perchè non è un best practice
    # ma lo passeremo alla linea di comando.
    # lo si potrebbe rendere parametrico:
    # namespace: {{ .Release.Namespace }} # Prende il valore passato col flag -n
    # Questo nome univoco è utilizzato ad esempio con il comando:
    # kubectl get deployment <name> -o yaml
    # che ci serve per ottenere la descrizione yaml di quest'oggetto di tipo deployment.
    name: { { .Release.Name } } # <== welcome-frontend

    # Le etichette che mettiamo qui servono a me che leggo il file e ad altri strumenti per
    # organizzare oggetti nel cluster. Per esempio se ho 1000 deployment posso dire:
    # "Fammi vedere tutti i Deployment che hanno questa label"
    # In labels mettiamo quindi semplicemente una lista di (chiave,valore)
    # di nostra invenzione. Per esempio:

    labels:
        app: { { .Release.Name } } # Il componente specifico (es. welcome-frontend)
        part-of: adhr-enterprise-suite # La suite di appartenenza
        env: { { .Values.env | default "dev" } } # L'ambiente (preso dal file in /env)
        version: { { .Values.image.tag | quote } } # La release specifica
        managed-by: { { .Release.Service } } # Indica che è gestito da Helm

spec:
    replicas: { { .Values.replicaCount } }

    # qui dico: Io ( deplyment ) sono responsabile di tutti i PODS che hanno questa etichetta.
    # Usiamo solo la label più specifica per legare Deployment e Pod
    selector:
        matchLabels:
            app: { { .Release.Name } } # <== welcome-frontend

    template:
        metadata:
            # Qui mettiamo labels più specifiche per identificare i pods
            labels:
                app: { { .Release.Name } }
                env: { { .Values.env | default "dev" } }
                version: { { .Values.image.tag | quote } }

        # Specifiche tecniche del POD. Se vuoi sidecar pattern aggiungi sotto containers.
        spec:
            containers:
                - name: { { .Release.Name } } # <== Ho rimosso adhr-enterprise-suite. {{ .Chart.Name }}
                  image: '{{ .Values.image.repository }}:{{ .Values.image.tag }}'
                  imagePullPolicy: IfNotPresent
                  ports:
                      - containerPort: { { .Values.service.port } }
                  resources:
                      # {{- toYaml .Values.resources | nindent 12 }}

# Con le labels organizzate in questo modo possiamo dare i seguenti comandi per esempio:

# 1. kubectl get all -l part-of=adhr-enterprise-suite
# dammi tutti gli oggetto cha fanno parte di questa suite

# 2. kubectl get pods -l env=prod
# Dammi tutti gli oggetti di tipo pods  di produzione

# 3. kubectl get pods -l version=1.2.0
# dammi tutti gli oggetti di tipo pods con versione 1.2.0

# 4. kubectl delete svc -l env=dev
# cancella tutti i servizi di tipo ebv

# in particola quesst'ultima linea l'ho messa per un best practice:

# Il Service non si collega al Deployment, ma direttamente ai Pod tramite il selector.

# Se nel tuo deployment.yaml hai messo:

# template:
#   metadata:
#     labels:
#       app: welcome-frontend
#       env: dev

# Il tuo service.yaml dovrà avere un selettore corrispondente per sapere a chi inviare il traffico:

# spec:
#   selector:
#     app: welcome-frontend # Cerca i Pod con questa label
#     env: dev                 # E che siano in ambiente dev
```

# CANARY RELEASE

A canary release is when you deploy a new version of an applica-
tion next to the stable version, and only let a small fraction of users hit the
new version to see how it behaves before rolling it out to all users. This pre-
vents bad releases from being exposed to too many users.
