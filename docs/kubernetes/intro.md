# Kubernetes

Kubernetes è un sistema orchestratore di applicazioni distribuite tramite container. Per le prove in sviluppo, abbiamo installato minikube che un laboratorio portatile di kubernetes. Se k8s è un sistema industriale per gestire migliaia di container nel cloud minikube è le versione miniaturizzata. Per questa app ho installato minikube e kubectl che è il client Kubernetes.

```bash

    # Scarica l'ultima versione stabile kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

    kubectl version --client

    # Scarica il binario di minikube
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

    # Installalo nel sistema
    sudo install minikube-linux-amd64 /usr/local/bin/minikube

    # Verifica che funzioni
    minikube version

    echo 'source <(kubectl completion bash)' >> ~/.bashrc

```

Minikube avvia un cluster di un solo nodo di default. Ma possiamo decidere quanti nodi creare. Per esempio possiamo avviare 3 nodi:

```bash
    # Avvia un cluster con 3 nodi
    minikube start --nodes 3
```

# Comandi utili minikube

1. minikube start --driver=docker => per far partire il cluster minikube
2. minikube stop => ferma il cluster
3. minikube status => status del cluster
