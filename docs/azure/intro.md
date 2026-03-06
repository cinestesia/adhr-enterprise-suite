# Azure

Per utilizzare Azure ho installato una CLI:

```bash
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```


# Azure login
Prima di poter fare login su Azure, ho fatto: 

```bash
    az login 
```

qui poi ho fatto il LOGIN ( dopo aver aggiunto il TOKEN otp su authenticator )
una volta loggato posso iniziare a dare dei comandi. In Azure tutto è dentro un contenitore logico. Il contenitore è il gruppo. 

```bash
    az group list --output table
```

Name                            Location    Status
------------------------------  ----------  ---------
Azure_Res_01                    westeurope  Succeeded
cloud-shell-storage-westeurope  westeurope  Succeeded
NetworkWatcherRG                westeurope  Succeeded
azure-servers                   westeurope  Succeeded
rg-automation-rubrica           westeurope  Succeeded
LogAnalyticsDefaultResources    westeurope  Succeeded
RustDeskRG                      italynorth  Succeeded
AzureBackupRG_italynorth_1      italynorth  Succeeded
Azure_Res_02                    italynorth  Succeeded
WebSite-ADHR                    italynorth  Succeeded
SharePoint-Automation           italynorth  Succeeded

per vedere tutte le risorse attive , come macchine virtuali , database , dischi ecc.. 

```bash
    az resource list --output table
```

se vogliamo vedere le risorse dentro un gruppo specifico, per esempio nel gruppo WebSite-ADHR :

```bash 
    az resource list --resource-group WebSite-ADHR  --output table 
```

possiamo utilizzare anche delle query a linea di comando: 

```bash
    az resource list --query "[?resourceGroup=='NomeDelTuoGruppo']" --output table
```
# Subscription

la sottoscrizione (o subscription) è l'entità fondamentale che raggruppa le risorse, gestisce i costi e definisce i limiti di accesso. Immaginala come un contenitore logico e un'unità di fatturazione.

Fatturazione: Ogni sottoscrizione riceve una fattura separata. È il livello in cui Microsoft addebita i costi per l'uso dei servizi (VM, database, ecc.).

Limiti (Quote): Azure impone limiti a livello di sottoscrizione (ad esempio, un numero massimo di core della CPU o di indirizzi IP utilizzabili).

Isolamento: Le risorse in una sottoscrizione sono separate da quelle in un'altra, il che è utile per dividere ambienti di Sviluppo, Test e Produzione.

La sottoscrizione è uno dei livelli chiave della gerarchia delle risorse di Azure. Lo IAM in Azure si basa sul sistema ***Azure RBAC (Role-Based Access Control)*** 

La gerarchia è la seguente:

1. Gruppo di gestione (Management Group)

2. Sottoscrizione (Subscription) <-- Qui si applica lo IAM su larga scala

3. Gruppo di risorse (Resource Group)

4. Risorsa (Resource)


Nello IAM, la sottoscrizione funge da ambito (scope) per l'assegnazione dei permessi.

Ereditarietà: Se assegni a un utente il ruolo di "Lettore" o "Contributore" a livello di Sottoscrizione, quell'utente erediterà automaticamente quegli stessi permessi su tutti i gruppi di risorse e su tutte le singole risorse contenute in essa.

Controllo degli accessi: È il punto ideale per gestire chi può gestire i costi o chi ha il controllo totale sull'intera infrastruttura di un dipartimento o di un progetto.

Trust Relationship: Ogni sottoscrizione è associata a un singolo tenant di Microsoft Entra ID (precedentemente Azure AD). Questo significa che la sottoscrizione "si fida" delle identità (utenti, gruppi, service principal) definite in quel tenant per concedere gli accessi tramite lo IAM.

In sintesi:
Mentre la Sottoscrizione definisce chi paga e quali sono i limiti tecnici, lo IAM definisce chi può fare cosa all'interno di quella sottoscrizione. Senza una sottoscrizione, non puoi avere risorse su cui applicare criteri di identità e accesso.

# Governance 
Il primo concetto fondamentale è la creazione di un Resource Group (RG). Confini li dentro tutte le risorse, VM, database, reti  in un unico contenitore. 

Gli altri utenti possono vedere le tue risorse solo se hanno permessi a livello di Sottoscrizione.

e decidi di eliminare tutto il tuo lavoro, ti basta cancellare il Resource Group e ogni risorsa al suo interno sparirà istantaneamente.

Ad esempio ho creato il seguente: 

```bash
    az group create --name ADHR-ENTERPRISE-SUITE --location italynorth
```

come risposta ho avuto: 

```json
{
    "id": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE",
    "location": "italynorth",
    "managedBy": null,
    "name": "ADHR-ENTERPRISE-SUITE",
    "properties": {
        "provisioningState": "Succeeded"
    },
    "tags": null,
    "type": "Microsoft.Resources/resourceGroups"
}
```

in questo modo ho creato un gruppo. Posso analizzare i dati del gruppo con ad esempio una query:

```bash
    az group show --name ADHR-ENTERPRISE-SUITE --query id --output tsv
```

L'output sarà qualcosa di simile a: /subscriptions/{sub-id}/resourceGroups/NomeMioResourceGroup

per esempio per il gruppo appena creato: 

"/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE"

Adesso possiamo verificare chi ha accesso al gruppo:

```bash
    az role assignment list --resource-group NomeMioResourceGroup --output table
```
ho visto che non c'è nessuno in effetti. Mi metto io come owner:

per ottenere il mio object id ( ma non è obbligatorio per dopo puoi uysare anche email in assignee )

```bash
    az ad user show --id admin2@adhrbo.onmicrosoft.com --query id --output tsv
    db0ca253-567b-49d9-98ca-e9c81c41f5b4
```

```bash

    az role assignment create \
        --assignee "db0ca253-567b-49d9-98ca-e9c81c41f5b4" \
        --role "Owner" \
        --scope "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE"
```
Risposta: 

```json
{
  "condition": null,
  "conditionVersion": null,
  "createdBy": null,
  "createdOn": "2026-03-06T10:22:01.629988+00:00",
  "delegatedManagedIdentityResourceId": null,
  "description": null,
  "id": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE/providers/Microsoft.Authorization/roleAssignments/9a31a332-f8ce-4026-b0b0-31cf85a2ea56",
  "name": "9a31a332-f8ce-4026-b0b0-31cf85a2ea56",
  "principalId": "db0ca253-567b-49d9-98ca-e9c81c41f5b4",
  "principalType": "User",
  "resourceGroup": "ADHR-ENTERPRISE-SUITE",
  "roleDefinitionId": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/providers/Microsoft.Authorization/roleDefinitions/8e3af657-a8ff-443c-a75c-2fe8c4bcb635",
  "scope": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE",
  "type": "Microsoft.Authorization/roleAssignments",
  "updatedBy": "db0ca253-567b-49d9-98ca-e9c81c41f5b4",
  "updatedOn": "2026-03-06T10:22:02.008992+00:00"
}

```
per verificare se sono assegnato: 

```bash
    az role assignment list --resource-group ADHR-ENTERPRISE-SUITE --output table
```
che risponde:

```bash

Principal                      Role    Scope
-----------------------------  ------  ----------------------------------------------------------------------------------------
admin2@adhrbo.onmicrosoft.com  Owner   /subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE
```

# Monitoraggio Costi e Tagging

Per vedere quanto stai spendendo in tempo reale senza confonderti con i costi degli altri, il segreto sono i Tag.

Applica un Tag: Aggiungi un'etichetta Owner: TuoNome o Project: MioLavoro a tutte le tue risorse.

Cost Analysis: Nel portale Azure, vai su Cost Management e usa il filtro "Group by: Tag" o "Filter by: Resource Group".

```bash 
    az vm create -g MioProgettoIsolato -n MiaVM --tags Progetto=TestCosti --image Ubuntu2204LTS
```

Come monitorare i costi da riga di comando?

Puoi interrogare i consumi del tuo gruppo specifico direttamente con la CLI (richiede l'estensione account o l'uso di az consumption):

```Bash
    az consumption usage list --start-date 2024-05-01 --end-date 2024-05-31 --query "[?resourceGroup=='MioProgettoIsolato'].pretaxCost" --output table
```

Il passo successivo consigliato

Il modo più sicuro per isolarsi totalmente è usare una Subscription (Sottoscrizione) dedicata solo a te, ma 

questo dipende dai permessi che hai in azienda.

Ti interessa sapere come impostare un Budget Alert che ti invii un'email o un SMS se superi, ad esempio, i 50€ di spesa nel tuo gruppo?


# VNet
In azure VNet equivale a VPC di AWS. Per listare le VNet presenti:

```bash
az network vnet list --output table

Name                 ResourceGroup    Location    NumSubnets    Prefixes     DnsServers    DDOSProtection    VMProtection
-------------------  ---------------  ----------  ------------  -----------  ------------  ----------------  --------------
azure-servers-vnet   azure-servers    westeurope  1             10.1.0.0/16                False
RustDeskUbuntu-vnet  RustDeskRG       italynorth  1             10.0.0.0/16                False

```

ho quindi creato la mia VNet : 

```bash
az network vnet create \
  --resource-group ADHR-ENTERPRISE-SUITE  \
  --name AdhrESVnet \
  --address-prefix 10.200.0.0/16 \
  --location italynorth
```
la risposta: 

```json 
{
  "newVNet": {
    "addressSpace": {
      "addressPrefixes": [
        "10.200.0.0/16"
      ]
    },
    "enableDdosProtection": false,
    "etag": "W/\"9fd492e7-55f0-402d-bb36-f4c089a7dd1e\"",
    "id": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE/providers/Microsoft.Network/virtualNetworks/AdhrESVnet",
    "location": "italynorth",
    "name": "AdhrESVnet",
    "privateEndpointVNetPolicies": "Disabled",
    "provisioningState": "Succeeded",
    "resourceGroup": "ADHR-ENTERPRISE-SUITE",
    "resourceGuid": "885aae9f-2454-4aac-9b77-1864c558ac39",
    "subnets": [],
    "type": "Microsoft.Network/virtualNetworks",
    "virtualNetworkPeerings": []
  }
}
```

la VNet è isolata, ma il NSG ( Network Security Group ) di Azure permette il traffico in uscita verso internet e la comunicazione all'interno della stessa VNet. 

Per vedere adesso le VNet dentro il mio gruppo di risorse: 

```bash 
    az network vnet list --resource-group ADHR-ENTERPRISE-SUITE --output table
```

# Kubernetes on azure
In Azure, per AKS esistono due modelli di rete principali. Ecco come impattano sulla tua strategia 
10.200.0.0/16:

1. **Modello "Kubenet"** (Il risparmio di IP) È l'opzione Standard/Low Cost.
Come funziona: AKS crea una subnet piccola per i nodi (le macchine virtuali), ma i Pod all'interno usano uno spazio IP virtuale separato che non tocca la tua VNet.
Vantaggio: Risparmi un'enormità di indirizzi IP.
Chi crea la subnet? Se non ne specifichi una, AKS ne creerà una "a sorpresa" per te, ma spesso con nomi casuali e difficili da gestire.

2. **Modello "Azure CNI"** (Prestazioni e Integrazione)

È l'opzione Enterprise.

Come funziona: Ogni singolo Pod riceve un indirizzo IP reale dalla tua VNet.

Svantaggio: Divora letteralmente i tuoi IP. Se hai 100 Pod, ti servono 100 IP della tua 10.200.x.x.

Chi crea la subnet? Qui devi quasi sempre crearla tu prima, perché AKS ha bisogno di sapere esattamente dove "atterrare".

# APPROCCIO KUBENET

1. Creare una Subnet specifica per il cluster (es. 10.200.10.0/24):

```Bash

az network vnet subnet create \
  -g ADHR-ENTERPRISE-SUITE \
  --vnet-name AdhrESVnet \
  --name adhr-enterprise-suite-aks-subnet \
  --address-prefixes 10.200.1.0/24
```
che risponde: 

```json
{
    "addressPrefix": "10.200.1.0/24",
    "delegations": [],
    "etag": "W/\"4b06ea08-b118-4716-bc8d-d96f63c17afb\"",
    "id": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE/providers/Microsoft.Network/virtualNetworks/AdhrESVnet/subnets/adhr-enterprise-suite-aks-subnet",
    "name": "adhr-enterprise-suite-aks-subnet",
    "privateEndpointNetworkPolicies": "Disabled",
    "privateLinkServiceNetworkPolicies": "Enabled",
    "provisioningState": "Succeeded",
    "resourceGroup": "ADHR-ENTERPRISE-SUITE",
    "type": "Microsoft.Network/virtualNetworks/subnets"
}
```
prima di creare il cluster aks, dobbiamo capire che la mia sottoscrizione azure non sa ancora che dovrà utilizzare il servizio AKS (che tecnicamente si chiama Microsoft.ContainerService) 
bisogna "sbloccare" i provider necessari. 

**Registra il servizio Kubernetes (AKS)**
qui sto dicendo: hey da oggi in poi mi piacerebbe avere il permesso per utilizzare i servizi kubernetes

```bash
    az provider register --namespace Microsoft.ContainerService
```

**monitoraggio e lo storage** 
```bash
    az provider register --namespace Microsoft.OperationsManagement
    az provider register --namespace Microsoft.OperationalInsights
```

Crea il cluster AKS puntando a quella subnet e specificando che vuoi risparmiare (usando macchine economiche come le Standard_B2s): 
ricorda che in modalità kubenet dobbiamo distringure due mondi: 

1. Virtuale
2. Reale 

VNET (10.200.0.0/16): Questa è la rete "reale" di Azure. Qui vivono i tuoi Nodi (le VM). Gli IP di questa rete sono visibili a livello Azure.

Service e Pod CIDR: Questi sono range puramente interni al cluster Kubernetes. Sono "reti fantasma" gestite dal kernel Linux dentro le tue macchine.

Il traffico verso 10.0.0.0/16 (i Service) e 10.244.0.0/16 (i Pod) non lascia mai il cluster. Se un'app nel cluster cerca di parlare con 10.0.0.10, il traffico viene gestito internamente. Non uscirà mai sulla VNET Azure cercando di raggiungere le altre reti che avevi visto prima (tipo la 10.0.0.0/16 del gruppo RustDeskRG).


```bash 
 az aks create \
    -g ADHR-ENTERPRISE-SUITE \
    -n adhr-es-eks-cluster \
    --node-vm-size Standard_B2s \
    --enable-cluster-autoscaler \
    --min-count 1 \
    --max-count 3 \
    --network-plugin kubenet \
    --vnet-subnet-id "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE/providers/Microsoft.Network/virtualNetworks/AdhrESVnet/subnets/adhr-enterprise-suite-aks-subnet" \
    --service-cidr 10.0.0.0/16 \
    --dns-service-ip 10.0.0.10 \
    --pod-cidr 10.244.0.0/16
```
ritorna il risultato: 

```json
{
  "aadProfile": null,
  "addonProfiles": null,
  "agentPoolProfiles": [
    {
      "availabilityZones": null,
      "capacityReservationGroupId": null,
      "count": 3,
      "creationData": null,
      "currentOrchestratorVersion": "1.33.6",
      "eTag": "25568d96-53fe-4d86-a80d-750c0e7cbc46",
      "enableAutoScaling": true,
      "enableEncryptionAtHost": false,
      "enableFips": false,
      "enableNodePublicIp": false,
      "enableUltraSsd": false,
      "gatewayProfile": null,
      "gpuInstanceProfile": null,
      "gpuProfile": null,
      "hostGroupId": null,
      "kubeletConfig": null,
      "kubeletDiskType": "OS",
      "linuxOsConfig": null,
      "localDnsProfile": null,
      "maxCount": 3,
      "maxPods": 110,
      "messageOfTheDay": null,
      "minCount": 1,
      "mode": "System",
      "name": "nodepool1",
      "networkProfile": null,
      "nodeImageVersion": "AKSUbuntu-2204gen2containerd-202602.13.5",
      "nodeLabels": null,
      "nodePublicIpPrefixId": null,
      "nodeTaints": null,
      "orchestratorVersion": "1.33",
      "osDiskSizeGb": 128,
      "osDiskType": "Managed",
      "osSku": "Ubuntu",
      "osType": "Linux",
      "podIpAllocationMode": null,
      "podSubnetId": null,
      "powerState": {
        "code": "Running"
      },
      "provisioningState": "Succeeded",
      "proximityPlacementGroupId": null,
      "scaleDownMode": "Delete",
      "scaleSetEvictionPolicy": null,
      "scaleSetPriority": null,
      "securityProfile": {
        "enableSecureBoot": false,
        "enableVtpm": false,
        "sshAccess": null
      },
      "spotMaxPrice": null,
      "status": null,
      "tags": null,
      "type": "VirtualMachineScaleSets",
      "upgradeSettings": {
        "drainTimeoutInMinutes": null,
        "maxSurge": "10%",
        "maxUnavailable": "0",
        "nodeSoakDurationInMinutes": null,
        "undrainableNodeBehavior": null
      },
      "virtualMachineNodesStatus": null,
      "virtualMachinesProfile": null,
      "vmSize": "Standard_B2s",
      "vnetSubnetId": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/ADHR-ENTERPRISE-SUITE/providers/Microsoft.Network/virtualNetworks/AdhrESVnet/subnets/adhr-enterprise-suite-aks-subnet",
      "windowsProfile": null,
      "workloadRuntime": null
    }
  ],
  "aiToolchainOperatorProfile": null,
  "apiServerAccessProfile": null,
  "autoScalerProfile": {
    "balanceSimilarNodeGroups": "false",
    "daemonsetEvictionForEmptyNodes": false,
    "daemonsetEvictionForOccupiedNodes": true,
    "expander": "random",
    "ignoreDaemonsetsUtilization": false,
    "maxEmptyBulkDelete": "10",
    "maxGracefulTerminationSec": "600",
    "maxNodeProvisionTime": "15m",
    "maxTotalUnreadyPercentage": "45",
    "newPodScaleUpDelay": "0s",
    "okTotalUnreadyCount": "3",
    "scaleDownDelayAfterAdd": "10m",
    "scaleDownDelayAfterDelete": "10s",
    "scaleDownDelayAfterFailure": "3m",
    "scaleDownUnneededTime": "10m",
    "scaleDownUnreadyTime": "20m",
    "scaleDownUtilizationThreshold": "0.5",
    "scanInterval": "10s",
    "skipNodesWithLocalStorage": "false",
    "skipNodesWithSystemPods": "true"
  },
  "autoUpgradeProfile": {
    "nodeOsUpgradeChannel": "NodeImage",
    "upgradeChannel": null
  },
  "azureMonitorProfile": null,
  "azurePortalFqdn": "adhr-es-ek-adhr-enterprise--1c33de-cmhjm79p.portal.hcp.italynorth.azmk8s.io",
  "bootstrapProfile": {
    "artifactSource": "Direct",
    "containerRegistryId": null
  },
  "currentKubernetesVersion": "1.33.6",
  "disableLocalAccounts": false,
  "diskEncryptionSetId": null,
  "dnsPrefix": "adhr-es-ek-ADHR-ENTERPRISE--1c33de",
  "eTag": "eb79fdc2-2cc0-4255-9399-c72bc2011874",
  "enableRbac": true,
  "extendedLocation": null,
  "fqdn": "adhr-es-ek-adhr-enterprise--1c33de-cmhjm79p.hcp.italynorth.azmk8s.io",
  "fqdnSubdomain": null,
  "httpProxyConfig": null,
  "id": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourcegroups/ADHR-ENTERPRISE-SUITE/providers/Microsoft.ContainerService/managedClusters/adhr-es-eks-cluster",
  "identity": {
    "delegatedResources": null,
    "principalId": "faf68df1-b58d-480f-b014-c007653f630c",
    "tenantId": "4524d66f-48b0-49e6-b845-89ba4a845e45",
    "type": "SystemAssigned",
    "userAssignedIdentities": null
  },
  "identityProfile": {
    "kubeletidentity": {
      "clientId": "257127eb-da24-4079-96f4-f03d2a92ecf2",
      "objectId": "17609294-676d-43a7-b117-62431e95d9c0",
      "resourceId": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourcegroups/MC_ADHR-ENTERPRISE-SUITE_adhr-es-eks-cluster_italynorth/providers/Microsoft.ManagedIdentity/userAssignedIdentities/adhr-es-eks-cluster-agentpool"
    }
  },
  "ingressProfile": null,
  "kind": "Base",
  "kubernetesVersion": "1.33",
  "linuxProfile": {
    "adminUsername": "azureuser",
    "ssh": {
      "publicKeys": [
        {
          "keyData": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDLF+rDKh7Kyb03si1b3EchQdgL72NlCkgEMSz25CZ9f68JWwu5cy4fYTqgUYgJZXnDKtsB4JlbDbQr9IjICPaQj4PJxP+XLfiB91qHvCn+SWeenr+x+QC70E0NQt4iH8zZ66wN5v4otci2+Wq5a/1id0T6ZZcQgdCPdCPHUFIfyOXMnpO2tmehODLXTkjSp47BNrON2ZMWWb6lEqiSM2oZBxxbXQ1cqB/FlpLV6+HxwYvfkVrik++4qpbJHkR4dGMoCKB7/NsJkMxvJL8qxYA0rjaAdH2DFJi2KOI7ljnRhvVq1soem17LgxKnAd+5aHJxaSR2QWoOVGzCjlZ6s7e115/t4Sxxfzs4CaaGN2HzQte1uFBcbpGGBpF4Vf/Ur4yMIAtGuP/n09J3oAeqhFT8MaziYN8sTb+nO4B+0YVrkjmlqAizU5/VWkmOQkyHiNxSvdDfit/Iwg8Jc5P3HWAC2X/ozVDl+uHOZqF+a+ZNFJIha1SDeZlcenUTFLKs7Dk= demiurgo@demiurgo-HP-ProBook-450-G8-Notebook-PC\n"
        }
      ]
    }
  },
  "location": "italynorth",
  "maxAgentPools": 100,
  "metricsProfile": {
    "costAnalysis": {
      "enabled": false
    }
  },
  "name": "adhr-es-eks-cluster",
  "networkProfile": {
    "advancedNetworking": null,
    "dnsServiceIp": "10.0.0.10",
    "ipFamilies": [
      "IPv4"
    ],
    "loadBalancerProfile": {
      "allocatedOutboundPorts": null,
      "backendPoolType": "nodeIPConfiguration",
      "effectiveOutboundIPs": [
        {
          "id": "/subscriptions/1c33de88-7c7f-43c9-9bbb-80f56b7fe092/resourceGroups/MC_ADHR-ENTERPRISE-SUITE_adhr-es-eks-cluster_italynorth/providers/Microsoft.Network/publicIPAddresses/86784585-8c8b-4d04-be9b-0475784f547c",
          "resourceGroup": "MC_ADHR-ENTERPRISE-SUITE_adhr-es-eks-cluster_italynorth"
        }
      ],
      "enableMultipleStandardLoadBalancers": null,
      "idleTimeoutInMinutes": null,
      "managedOutboundIPs": {
        "count": 1,
        "countIpv6": null
      },
      "outboundIPs": null,
      "outboundIpPrefixes": null
    },
    "loadBalancerSku": "standard",
    "natGatewayProfile": null,
    "networkDataplane": null,
    "networkMode": null,
    "networkPlugin": "kubenet",
    "networkPluginMode": null,
    "networkPolicy": "none",
    "outboundType": "loadBalancer",
    "podCidr": "10.244.0.0/16",
    "podCidrs": [
      "10.244.0.0/16"
    ],
    "serviceCidr": "10.0.0.0/16",
    "serviceCidrs": [
      "10.0.0.0/16"
    ],
    "staticEgressGatewayProfile": null
  },
  "nodeProvisioningProfile": {
    "defaultNodePools": "Auto",
    "mode": "Manual"
  },
  "nodeResourceGroup": "MC_ADHR-ENTERPRISE-SUITE_adhr-es-eks-cluster_italynorth",
  "nodeResourceGroupProfile": null,
  "oidcIssuerProfile": {
    "enabled": false,
    "issuerUrl": null
  },
  "podIdentityProfile": null,
  "powerState": {
    "code": "Running"
  },
  "privateFqdn": null,
  "privateLinkResources": null,
  "provisioningState": "Succeeded",
  "publicNetworkAccess": null,
  "resourceGroup": "ADHR-ENTERPRISE-SUITE",
  "resourceUid": "69aabfedf24cbb00018e3fc4",
  "securityProfile": {
    "azureKeyVaultKms": null,
    "customCaTrustCertificates": null,
    "defender": null,
    "imageCleaner": null,
    "workloadIdentity": null
  },
  "serviceMeshProfile": null,
  "servicePrincipalProfile": {
    "clientId": "msi",
    "secret": null
  },
  "sku": {
    "name": "Base",
    "tier": "Free"
  },
  "status": null,
  "storageProfile": {
    "blobCsiDriver": null,
    "diskCsiDriver": {
      "enabled": true
    },
    "fileCsiDriver": {
      "enabled": true
    },
    "snapshotController": {
      "enabled": true
    }
  },
  "supportPlan": "KubernetesOfficial",
  "systemData": null,
  "tags": null,
  "type": "Microsoft.ContainerService/ManagedClusters",
  "upgradeSettings": null,
  "windowsProfile": null,
  "workloadAutoScalerProfile": {
    "keda": null,
    "verticalPodAutoscaler": null
  }
}
```

# Infrastruttura Creata
Hai creato un cluster con Autoscaling e networking Kubenet. Ecco come appare visivamente:

1. Control Plane (Gestito da Azure): Gratuito (hai scelto lo SKU Free).

2. Node Pool (nodepool1): Attualmente ha creato 3 nodi (lo leggiamo da "count": 3 nel JSON).

3. Networking: I Pod hanno un IP interno (10.244.x.x) e comunicano con l'esterno tramite un Load Balancer standard creato automaticamente.

4. VM Size: Standard_B2s (2 vCPU, 4GB RAM). Sono macchine economiche ma non "Spot", quindi pagherai la tariffa piena oraria finché sono accese.

Sì. Stai pagando per:Le 3 VM Standard_B2s: Circa 0,04 €/ora l'una ($\approx 0,12$ €/ora totali).Il Load Balancer: Un costo fisso minimo per l'IP pubblico e le regole di inoltro.I Dischi Managed: Ogni nodo ha un disco da 128GB (SSD Premium o Standard a seconda del default).

Consiglio immediato per risparmiare:
Visto che hai messo --min-count 1, il cluster può scendere a 1 solo nodo se non c'è carico. Attualmente ne hai 3 perché non hai ancora deployato nulla che dica all'autoscaler di "sgonfiarsi".

Per passare da minikube ad Azure: 

```bash
    az aks get-credentials --resource-group ADHR-ENTERPRISE-SUITE --name adhr-es-eks-cluster
```

comandi utili aks: 

```bash 
# Opzione "Distruggi" (Radicale): Cancella tutto. Non paghi nulla, ma dovrai rifare il comando az aks create
# la prossima volta.
    az aks delete --name adhr-es-eks-cluster --resource-group ADHR-ENTERPRISE-SUITE
```

```bash
# Opzione "Pausa" (Consigliata): Spegne le VM ma mantiene la configurazione. Paghi solo pochi centesimi per
# il disco SSD.
    az aks stop --name adhr-es-eks-cluster --resource-group ADHR-ENTERPRISE-SUITE
```

```bash 
# Far ripartire il cluster
    az aks start --name adhr-es-eks-cluster --resource-group ADHR-ENTERPRISE-SUITE
```


```bash
#Vedere i nodi: 
    kubectl get nodes (dovresti vederne 3 "Ready").
```

```bash 
# Vedere i contesti: 
    kubectl config get-contexts # (vedrai sia minikube che il nuovo cluster Azure).
```
```bash
# Cambiare tra uno e l'altro: 
    kubectl config use-context adhr-es-eks-cluster.
```
```bash
# Ingress e configurazioni (Values.yaml)
# AKS non include un Ingress Controller di default (a differenza di Minikube dove basta un addon). 
# Devi installarlo tu, solitamente NGINX Ingress Controller tramite Helm.
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
``` 
Installa l'Ingress:

```Bash
helm install my-ingress ingress-nginx/ingress-nginx \
    --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz
```
Dopo qualche minuto, dando kubectl get svc, vedrai un EXTERNAL-IP. Quello è l'indirizzo pubblico del tuo cluster.

# Spegnimento" Notturno
Visto che vuoi risparmiare, la tua priorità ora è non lasciare 3 nodi accesi nel weekend o di notte.

Cosa vuoi fare come prossimo passo?

Ti aiuto a creare uno script per fermare il cluster (stop fisico delle VM, paghi solo il disco)?

Oppure preferisci installare KEDA per scalare i pod a zero in automatico dopo le 18:00?


# SPOT!
1. I "Problemi" delle Istanze Spot
Il risparmio ha un prezzo in termini di affidabilità:

Sfratto (Eviction): Azure può riprendersi la macchina in qualsiasi momento con un preavviso di soli 30 secondi. Questo accade se Azure ha bisogno di quella capacità per clienti che pagano la tariffa piena.

Interruzione del Servizio: Se hai un solo nodo spot e Azure lo riprende, il tuo sito/app va offline finché l'autoscaler non trova un'altra macchina disponibile.

Nessun supporto per il System Pool: Come accennato prima, il "System Pool" (dove gira il cuore di Kubernetes) non dovrebbe essere Spot. Se il nodo di sistema viene rimosso improvvisamente, l'intero cluster potrebbe diventare instabile.

2. La Strategia Corretta (Mix Spot + Standard)
Per non rischiare il blocco totale, la configurazione ideale per te è:

System Pool (1 nodo Standard_B2s): Sempre acceso (o spento manualmente con az aks stop). Gestisce il cluster.

User Pool (Nodi Spot): Qui girano le tue applicazioni. Se Azure li spegne, il "cervello" sul nodo standard cercherà di riavviarli altrove.

Come aggiungere un pool di nodi Spot
Visto che hai già il cluster, non devi rifarlo. Aggiungi semplicemente un nuovo pool "economico":

Bash

az aks nodepool add \
    --resource-group ADHR-ENTERPRISE-SUITE \
    --cluster-name adhr-es-eks-cluster \
    --name spotpool \
    --priority Spot \
    --eviction-policy Delete \
    --spot-max-price -1 \
    --enable-cluster-autoscaler \
    --min-count 0 \
    --max-count 3 \
    --node-vm-size Standard_B2s
--priority Spot: Dice ad Azure di usare capacità in eccesso scontata.

--spot-max-price -1: Significa "paga il prezzo corrente di mercato" (che è comunque molto basso).

--min-count 0: Fondamentale! Permette di arrivare a zero macchine se non c'è carico.

3. Come automatizzare lo "Stop" alle 19:00
Dato che vuoi spegnere tutto per non pagare nemmeno il nodo Standard la notte, ecco le due opzioni più semplici:

A. Tramite Azure CLI (Script locale)
Puoi creare un semplice file .sh (o .bat) e metterlo nelle "Operazioni pianificate" del tuo PC o di un serverino che hai sempre acceso:

Bash

# stop_aks.sh
az aks stop --name adhr-es-eks-cluster --resource-group ADHR-ENTERPRISE-SUITE
B. Tramite Azure Automation (Nativo in Cloud)
Questa è la soluzione professionale.

Cerca "Automation Accounts" sul portale Azure.

Crea un Runbook di tipo PowerShell o Python.

Incolla il comando di stop e imposta una Schedules (Pianificazione) alle 19:00 dal lunedì al venerdì.

Riepilogo costi dopo queste modifiche:
Ore di ufficio (08-19): Paghi 1 VM Standard (prezzo pieno) + le VM Spot che servono (scontatissime).

Notte e Weekend: Dai il comando az aks stop. Paghi 0€ di computazione. Paghi solo pochi centesimi per lo storage dei dischi (che restano lì pronti per ripartire).

Vuoi che ti spieghi come forzare i tuoi Pod a finire proprio sui nodi Spot (usando i "Tolerations") in modo da non occupare il nodo Standard?

# andare online
```bash 
# Cambia il contesto su Azure
kubectl config use-context adhr-es-eks-cluster

# Verifica di vedere i nodi di Azure
kubectl get nodes

```

Comandi per il Deploy su Azure
Assicurati di essere nel contesto giusto (kubectl config use-context adhr-es-eks-cluster).

1. **Step A**: Installa Nginx Ingress Controller (Se manca)

Se non lo hai ancora fatto, Azure ha bisogno del "vigile urbano":

```Bash

helm upgrade --install ingress-nginx ingress-nginx \
    --repo https://kubernetes.github.io/ingress-nginx \
    --namespace ingress-basic --create-namespace

Attendi un minuto e dai kubectl get svc -n ingress-basic. Vedrai un EXTERNAL-IP. Quello è l'IP del tuo intero cluster.

Step B: Deploy della Suite
Ora lancia i tuoi componenti:

Bash

# Deploy Backend
helm install welcome-backend ./kubernetes/adhr-enterprise-suite \
  -n adhr-dev --create-namespace \
  -f ./kubernetes/env/aks/welcome-backend.yaml

# Deploy Frontend
helm install welcome-frontend ./kubernetes/adhr-enterprise-suite \
  -n adhr-dev \
  -f ./kubernetes/env/aks/welcome-frontend.yaml
5. Come testare se non hai ancora un dominio?
Se non hai ancora comprato i domini (api.adhr-suite.it), puoi simulare tutto modificando il file hosts del tuo PC (come facevi con minikube):

Prendi l'External IP del servizio ingress-nginx-controller.

Aggiungi al tuo file /etc/hosts (o C:\Windows\System32\drivers\etc\hosts):

Plaintext

<IP_DI_AZURE>  app.adhr-suite.it
<IP_DI_AZURE>  api.adhr-suite.it
Un'ultima nota sulla "Spot Instance"
Visto che abbiamo parlato di risparmio: nel tuo deployment.yaml, se vuoi essere sicuro che i tuoi pod finiscano sulle macchine Spot (per pagare meno) e non su quella di sistema, dovresti aggiungere una nodeSelector o una toleration sotto spec.template.spec.

Vuoi che ti mostri come modificare il deployment.yaml per farlo "preferire" i nodi economici che abbiamo creato prima?


# DATABASE:

2. La Best Practice: "Isolamento Logico, Infrastruttura Condivisa"
Per partire in modo professionale ma economico, usa la tecnica del Shared Server, Separate Schemas.

Come funziona:
Compri una sola istanza di database su Azure (es. un PostgreSQL Standard).

All'interno di quel server, crei Database diversi (o Schema diversi) per ogni app.

Ogni app ha il suo utente con permessi limitati solo al suo database.

Risultato: Paghi $25 invece di $250, ma a livello di codice le app sono indipendenti. Quando un servizio diventa "pesante" e fattura tanto, puoi staccare solo quel database e spostarlo su un server dedicato senza cambiare una riga di codice (basta cambiare la DATABASE_URL nel values.yaml).


Database dentro o fuori Kubernetes?Questa è la scelta che sposta l'ago della bilancia del budget:Opzione A: Database "Managed" (Azure SQL / Postgres) - CONSIGLIATAPro: Azure fa i backup, gestisce gli aggiornamenti e la sicurezza.Contro: Costa di più (minimo ~15-20€/mese).Perché sceglierla: Anche se costa, il tempo che risparmi a non dover gestire i backup e i crash del DB vale oro.Opzione B: Database dentro AKS (StatefulSet) - SUPER ECONOMICAPro: Zero costi aggiuntivi. Usi la CPU e la RAM delle VM che stai già pagando per il cluster.Contro: Se il disco si corrompe o configuri male i volumi, perdi i dati. Gestire i database su Kubernetes è complesso.Consiglio: Usalo solo per ambienti di Sviluppo/Staging. Per la produzione, meglio il Managed.4. Evoluzione Agile del Database (Roadmap)FaseStrategiaCosto StimatoStartup (Oggi)1 Server Managed Economico + N Database Logici€20 / meseScale-up1 Server più potente (Vertical Scaling)€50 - 100 / meseEnterpriseDatabase fisicamente separati per i servizi critici€200+ / mese5. Come gestire le credenziali (Best Practice)Non scrivere mai le password del database nel file values.yaml o nel deployment.yaml.Usa i Kubernetes Secrets:Crei un segreto: kubectl create secret generic db-credentials --from-literal=password=M1aP4ssw0rd.Nel deployment.yaml, inietti la password come variabile d'ambiente leggendola dal Secret.Cosa vuoi fare lunedì?Ti aiuto a configurare un PostgreSQL/MySQL economico su Azure per collegare la tua Suite?Oppure preferisci vedere come creare un Secret per nascondere le password attuali?P.S. Ricordati di dare il comando az aks stop prima di chiudere! Buon weekend!