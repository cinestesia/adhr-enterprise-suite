# Partiamo direttamente dall'immagine di produzione — niente multi-stage
FROM quay.io/keycloak/keycloak:26.5.5

# Copiamo il tema
COPY --chown=1000:0 themes/adhr/ /opt/keycloak/themes/adhr/

# Settiamo le variabili che devono essere "cotte" dentro la build ottimizzata
# (devono corrispondere a quelle che userai a runtime via env nel pod)
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres
ENV KC_HTTP_ENABLED=true
ENV KC_PROXY_HEADERS=xforwarded
ENV KC_HOSTNAME_STRICT=false
ENV KC_DB=postgres
# Eseguiamo la build ottimizzata — questo è l'unico step che trasforma l'immagine
RUN /opt/keycloak/bin/kc.sh build

# L'ENTRYPOINT è già definito dall'immagine base di Keycloak, non serve ridefinirlo.
# Gli "args" del tuo StatefulSet YAML ("start") vengono passati direttamente a kc.sh.
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]