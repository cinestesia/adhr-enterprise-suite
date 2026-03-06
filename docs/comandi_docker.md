# COMANDI  

1.  Ferma tutti i container attivi:
    docker stop $(docker ps -aq)

2.  Rimuovi tutti i container:
    docker rm $(docker ps -aq)

3.  Rimuovi tutte le immagini:
    docker rmi $(docker images -q) -f

4.  Rimuovi tutti i volumi:
    docker volume rm $(docker volume ls -q)

5.  Rimuovi tutte le reti custom:
    docker network prune -f

6.  docker build -t welcome-backend:dev -f apps/welcome-backend/Dockerfile .
    Questo comando crea l'immagine del nostro container.

7.  docker run -d -p 3000:3000 --name welcome-app welcome-backend:dev 
    
    Ecco cosa fa questo comando:

    -d (Detached): Fa girare il container in background. Senza questo, il terminale rimarrebbe "appeso" ai log del server e, se chiudi il terminale, si spegne il container.

    -p 3000:3000 (Publish): Questo è il ponte tra il tuo computer e il container.

    Il primo 3000 è la porta sul tuo computer (localhost).

    Il secondo 3000 è la porta su cui Fastify sta ascoltando dentro il container.

    Nota: Se nel tuo codice Fastify usa una porta diversa (es. 8080), dovrai scrivere -p 3000:8080.

    --name welcome-app: Dà un nome mnemonico al container che sta girando. Così, per stopparlo, potrai scrivere docker stop welcome-app invece di cercare l'ID alfanumerico.

8.  Creare immagine ( build ) :
    docker compose --env-file apps/welcome-frontend/.env.development build --no-cache welcome-frontend

9.  Running : 
    docker compose --env-file apps/welcome-frontend/.env.production up -d welcome-frontend  


10. Creare immagine + running 
    docker compose --env-file apps/welcome-backend/.env.development up -d --build welcome-backend
    