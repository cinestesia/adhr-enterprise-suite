// apps/ai-backend/src/infrastructure/db/queries/corporate-analytics.query.ts

export const SQL_GET_CONTRACTS_ANALYTICS = `
   SELECT to_char(contract.contract_start_date::timestamp with time zone, 'DD-MM-YYYY'::text) AS "DATA INIZIO",
    to_char(contract.contract_end_date::timestamp with time zone, 'DD-MM-YYYY'::text) AS "DATA FINE",
    to_char(contract.trial_period_end_date::timestamp with time zone, 'DD-MM-YYYY'::text) AS "DATA FINE PERIODO DI PROVA",
    contract.trial_days AS "NUMERO GIORNI DI PROVA",
    branch.description AS "FILIALE",
    orders.num_progr AS "NUMERO ORDINE",
    orders.matriculation AS "MATRICOLA",
    cand.sesso_int AS "SESSO",
    orders.codice_dipendente AS "CODICE DIPENDENTE",
    piva.ragione_sociale AS "RAGIONE SOCIALE",
    piva.partita_iva AS "PARTITA IVA",
    piva.cod_fiscale AS "CODICE FISCALE CLIENTE",
    COALESCE(candu.surname, ''::character varying)::text AS "COGNOME LAVORATORE",
    COALESCE(candu.name, ''::character varying)::text AS "NOME LAVORATORE",
    candu.tax_code AS "CODICE FISCALE",
    candu.email AS "EMAIL",
    ((j.j -> 'nazioneCittadinanza'::text) ->> 'descrizione'::text)::character varying AS "NAZIONALITA",
    status.description AS "STATO ORDINE",
    tipo_preventivo_somm.description AS "TIPO ORDINE",
    (ccnl.code::text || ' - '::text) || ccnl.description::text AS "CCNL",
    preventivo.livello AS "LIVELLO CCNL",
    (edile.code::text || ' - '::text) || edile.description::text AS "CASSA EDILE",
    cc.code_level_1 AS "CODICE CENTRO DI COSTO",
    cc.department AS "DIPARTIMENTO CENTRO DI COSTO",
    'SOMMINISTRAZIONE'::text AS "TIPO BUSINESS",
    indu.description AS "SETTORE MARKETING",
    replace((((preventivo.preventivo::json -> 'costoDelLavoro'::text) -> 'OreSettimanali'::text) -> 0) ->> 'valore'::text, '.'::text, ','::text) AS "ORE SETTIMANALI",
    contract.perc_part_time,
    branch.id AS filialeid,
    customer.id AS clienteid,
    cand.id AS candidatoid,
    (((preventivo.preventivo::json -> 'costoDelLavoro'::text) -> 'ElementiContributivi'::text) -> 2) ->> 'posizioneInail'::text AS "POSIZIONE INAIL",
    gd.code AS "TIPO DI DOCUMENTO",
    gd.flag_firmabile AS "FIRMABILE",
    gdd.description AS "STATUS INVIO IN FIRMA",
    sp.description AS "STATUS PREVENTIVO",
    customer.flag_contr_integrativo AS "CONTRATTO INTEGRATIVO",
    preventivo.num_progr::numeric AS "NUMERO DI PREVENTIVO",
    motivo.description AS "MOTIVO PERMESSO DI SOGGIORNO",
    motivo.empserv_reason_code AS "CODICE MOTIVO PERMESSO DI SOGGIORNO",
    qualifica.category AS "CATEGORIA",
    qualifica.code AS "CODICE",
    qualifica.description AS "DESCRIZIONE",
    qualifica.nonattendance_payroll_code AS "CODICE PAGHE ASSENZE",
    qualifica.payroll_code AS "CODICE PAGHE",
    qualifica.qualification_type AS "TIPO QUALIFICA",
    cand.data_nascita_int AS "DATA DI NASCITA CANDIDATO",
    (((preventivo.preventivo::json -> 'costoDelLavoro'::text) -> 'NumMensilita'::text) -> 0) ->> 'valore'::text AS "NUMERO MENSILITA",
    replace((((preventivo.preventivo::json -> 'costoDelLavoro'::text) -> 'RetLordaMensile'::text) -> 0) ->> 'valore'::text, '.'::text, ','::text) AS "RETRIBUZIONE LORDA MENSILE",
    replace((((preventivo.preventivo::json -> 'costoDelLavoro'::text) -> 'RetOraria'::text) -> 0) ->> 'valUnitario'::text, '.'::text, ','::text) AS "RETRIBUZIONE LORDA ORARIA",
    sgravio.nome AS "SGRAVIO CONTRIBUTIVO",
        CASE
            WHEN cw.contratto_quadro = 0 THEN 'No'::text
            WHEN cw.contratto_quadro = 1 THEN 'Si'::text
            ELSE NULL::text
        END AS "CONTRATTO QUADRO",
    contr_type.description AS "TIPOLOGIA CONTRATTO",
    replace((((preventivo.preventivo::json -> 'costoDelLavoro'::text) -> 'DivOrarioUtil'::text) -> 0) ->> 'valore'::text, '.'::text, ','::text) AS "DIVISORE ORARIO CCNL UTILIZZATORE",
    replace((((preventivo.preventivo::json -> 'costoDelLavoro'::text) -> 'DivOrarioSomm'::text) -> 0) ->> 'valore'::text, '.'::text, ','::text) AS "DIVISORE ORARIO SOMMINISTRAZIONE"
   FROM ord_head orders
     JOIN prev_head preventivo ON orders.prev_head_id = preventivo.id
     JOIN contr_ccnl ccnl ON preventivo.ccnl_id = ccnl.id
     JOIN sys_constant status ON orders.status = status.id
     JOIN ord_head_contractdata_ext contract ON orders.id = contract.id
     JOIN ord_order_master master ON orders.order_master_id = master.id
     JOIN cand_ana cand ON orders.cand_ana_id = cand.id
     JOIN ( SELECT cand_ana.id,
            cand_ana.json_data::json AS j
           FROM cand_ana) j ON j.id = cand.id
     JOIN prf_user candu ON candu.id = cand.id
     JOIN org_customer customer ON customer.id = master.customer_id
     JOIN org_company comp ON comp.id = customer.company_id
     JOIN org_company_piva_ragsoc_history piva ON comp.id = piva.id AND piva.end_date_piva IS NULL
     JOIN org_branch branch ON branch.id = customer.actual_branch_id
     JOIN sys_constant sp ON sp.id = preventivo.status
     --JOIN org_branch_filter_v f ON f.id = branch.id
     LEFT JOIN sys_constant tipo_preventivo ON preventivo.type_prev = tipo_preventivo.id
     LEFT JOIN sys_constant tipo_preventivo_somm ON preventivo.type_prev_somm = tipo_preventivo_somm.id
     LEFT JOIN cand_worker cw ON cw.id = cand.id
     LEFT JOIN sys_constant mod_pag ON mod_pag.id = cw.type_payment
     LEFT JOIN com_questure cq ON cq.id = cw.perm_questura_id
     LEFT JOIN cand_perm_mot motivo ON motivo.id = cw.perm_mot_id
     LEFT JOIN org_centro_di_costo cc ON cc.id = contract.cost_center_id
     LEFT JOIN org_company_ext ocext ON ocext.id = comp.id
     LEFT JOIN org_industry indu ON ocext.industry_id = indu.id
     LEFT JOIN ord_generated_document gd ON gd.ord_head_id = orders.id AND gd.code::text ~~* '%_SOMM_C'::text
     LEFT JOIN sys_constant gdd ON gdd.id = gd.sent
     LEFT JOIN ord_qualification qualifica ON contract.qualification_id = qualifica.id
     LEFT JOIN ord_sgravio_contributivo sgravio ON orders.sgravio_id = sgravio.id
     LEFT JOIN sys_constant contr_type ON contr_type.id = contract.contract_type
     LEFT JOIN contr_ccnl_cassa_edile cedile ON preventivo.ccnl_cassa_edile_id = cedile.id
     LEFT JOIN contr_cassa_edile edile ON cedile.cassa_edile_id = edile.id
  WHERE (status.description::text = ANY (ARRAY['Chiuso'::character varying::text, 'Evaso'::character varying::text]))
    AND GREATEST(contract.contract_start_date, $1::date) <= LEAST(contract.contract_end_date, $2::date);
`.trim()
