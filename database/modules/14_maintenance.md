# Module 14 — Maintenance et Support

Tickets, contrats de maintenance, interventions et garanties.

## Tables

### `support_tickets`

Tickets de support client.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `ticket_number` | VARCHAR | N° ticket |
| `customer_id` | FK → customers | Client |
| `contact_id` | FK → customer_contacts NULL | Contact |
| `subject` | VARCHAR | Objet |
| `description` | TEXT | Description |
| `priority` | ENUM | low / medium / high / critical |
| `status` | ENUM | open / in_progress / waiting / resolved / closed |
| `assigned_to` | FK → users | Assigné |
| `related_serial_number_id` | FK NULL | Équipement |
| `opened_at` / `closed_at` | TIMESTAMP | Cycle de vie |

---

### `maintenance_contracts`

Contrats de maintenance.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `contract_number` | VARCHAR | N° contrat |
| `customer_id` | FK → customers | Client |
| `start_date` / `end_date` | DATE | Période |
| `sla_hours` | INTEGER | SLA réponse |
| `status` | ENUM | draft / active / expired / cancelled |
| `amount` | DECIMAL | Montant contrat |
| `currency_id` | FK → currencies | Devise |

---

### `maintenance_contract_items`

Équipements couverts par le contrat.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `maintenance_contract_id` | FK | Contrat |
| `product_id` | FK → products | Produit |
| `serial_number_id` | FK → serial_numbers NULL | N° série |
| `coverage_level` | VARCHAR | Niveau couverture |
| `notes` | TEXT | Remarques |

---

### `maintenance_schedules`

Planning des maintenances préventives.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `maintenance_contract_id` | FK | Contrat |
| `title` | VARCHAR | Titre |
| `frequency` | ENUM | monthly / quarterly / yearly / custom |
| `next_due_at` | DATE | Prochaine échéance |
| `technician_id` | FK → technicians NULL | Technicien prévu |
| `is_active` | BOOLEAN | Actif |

---

### `maintenance_interventions`

Interventions réalisées.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `ticket_id` | FK → support_tickets NULL | Ticket |
| `schedule_id` | FK → maintenance_schedules NULL | Planning |
| `contract_id` | FK → maintenance_contracts NULL | Contrat |
| `customer_id` | FK → customers | Client |
| `technician_id` | FK → technicians | Technicien |
| `started_at` / `ended_at` | TIMESTAMP | Durée |
| `intervention_type` | ENUM | preventive / corrective / inspection |
| `status` | ENUM | planned / done / cancelled |

---

### `maintenance_reports`

Rapports d'intervention.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `intervention_id` | FK → maintenance_interventions | Intervention |
| `summary` | TEXT | Résumé |
| `actions_taken` | TEXT | Actions |
| `parts_used` | JSONB | Pièces utilisées |
| `document_ids` | JSONB | Pièces jointes |
| `reported_at` | TIMESTAMP | Date |

---

### `service_requests`

Demandes de service client.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `customer_id` | FK → customers | Client |
| `request_type` | VARCHAR | Type demande |
| `description` | TEXT | Description |
| `status` | ENUM | new / assigned / completed / cancelled |
| `converted_ticket_id` | FK → support_tickets NULL | Ticket créé |
| `requested_at` | TIMESTAMP | Date |

---

### `warranties`

Garanties des produits.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `product_id` | FK → products | Produit |
| `serial_number_id` | FK → serial_numbers NULL | N° série |
| `customer_id` | FK → customers | Client |
| `sales_order_id` | FK → sales_orders NULL | Commande |
| `start_date` / `end_date` | DATE | Période |
| `warranty_type` | ENUM | manufacturer / seller / extended |
| `terms` | TEXT | Conditions |
| `status` | ENUM | active / expired / void |

---

### `warranty_claims`

Réclamations au titre de la garantie.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `warranty_id` | FK → warranties | Garantie |
| `ticket_id` | FK → support_tickets NULL | Ticket |
| `claim_number` | VARCHAR | N° réclamation |
| `description` | TEXT | Problème |
| `status` | ENUM | submitted / approved / rejected / fulfilled |
| `resolution` | TEXT | Résolution |
| `claimed_at` | TIMESTAMP | Date |

## Flux

```text
installation → warranty
service_request → support_ticket → maintenance_intervention → maintenance_report
maintenance_contract → maintenance_schedules → interventions préventives
```
