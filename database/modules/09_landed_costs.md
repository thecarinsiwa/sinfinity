# Module 9 — Coût Rendu en RDC (Landed Costs)

Calcul du coût complet d'importation jusqu'à l'entrepôt / client en RDC.

## Tables

### `landed_costs`

Coût rendu global pour une commande / expédition.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `reference` | VARCHAR | Référence calcul |
| `purchase_order_id` | FK → purchase_orders NULL | BC |
| `shipment_id` | FK → shipments NULL | Expédition |
| `currency_id` | FK → currencies | Devise de calcul |
| `goods_cost` | DECIMAL | Coût marchandises |
| `total_additional_costs` | DECIMAL | Frais annexes |
| `total_landed_cost` | DECIMAL | Coût rendu total |
| `status` | ENUM | draft / calculated / posted |
| `calculated_at` | TIMESTAMP | Date calcul |
| `calculated_by` | FK → users | Auteur |

---

### `landed_cost_items`

Détail des coûts (par produit) — répartition du coût rendu.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `landed_cost_id` | FK → landed_costs | Calcul |
| `product_id` | FK → products | Produit |
| `purchase_order_item_id` | FK NULL | Ligne BC |
| `quantity` | DECIMAL | Quantité |
| `goods_cost` | DECIMAL | Coût marchandise |
| `allocated_costs` | DECIMAL | Frais alloués |
| `unit_landed_cost` | DECIMAL | Coût unitaire rendu |
| `total_landed_cost` | DECIMAL | Total ligne |

---

### `shipping_costs`

Coûts de transport (maritime, aérien).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `landed_cost_id` | FK → landed_costs | Calcul |
| `shipment_id` | FK → shipments NULL | Expédition |
| `shipping_method_id` | FK → shipping_methods | Mode |
| `carrier_id` | FK → carriers | Transporteur |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `description` | TEXT | Détail |

---

### `customs_costs`

Frais de douane et droits d'importation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `landed_cost_id` | FK → landed_costs | Calcul |
| `customs_declaration_id` | FK NULL | Déclaration |
| `duties_amount` | DECIMAL | Droits |
| `vat_amount` | DECIMAL | TVA import |
| `other_fees` | DECIMAL | Autres frais |
| `currency_id` | FK → currencies | Devise |
| `description` | TEXT | Détail |

---

### `local_transport_costs`

Transport local (port → entrepôt, entrepôt → client).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `landed_cost_id` | FK → landed_costs | Calcul |
| `from_location` | VARCHAR | Origine |
| `to_location` | VARCHAR | Destination |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `provider` | VARCHAR | Prestataire |
| `description` | TEXT | Détail |

---

### `inspection_costs`

Contrôle qualité en Chine ou à l'arrivée.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `landed_cost_id` | FK → landed_costs | Calcul |
| `inspection_place` | ENUM | origin / destination / transit |
| `inspector` | VARCHAR | Organisme / personne |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `inspected_at` | DATE | Date |
| `report_document_id` | FK → documents NULL | Rapport |

---

### `handling_costs`

Frais de manutention (chargement / déchargement).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `landed_cost_id` | FK → landed_costs | Calcul |
| `location` | VARCHAR | Lieu |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `description` | TEXT | Détail |

---

### `other_procurement_costs`

Autres coûts (assurance, courtage, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `landed_cost_id` | FK → landed_costs | Calcul |
| `cost_type` | VARCHAR | insurance / brokerage / banking / other |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `description` | TEXT | Détail |

## Formule indicative

```text
total_landed_cost =
  goods_cost
  + shipping_costs
  + customs_costs
  + local_transport_costs
  + inspection_costs
  + handling_costs
  + other_procurement_costs
```

La répartition vers `landed_cost_items` peut se faire au prorata valeur, poids ou volume.
