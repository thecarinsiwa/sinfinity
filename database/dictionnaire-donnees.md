# Dictionnaire des données – Phase de conception

Index consolidé de toutes les tables du modèle Sinfinity. Pour le détail des colonnes et relations, voir le dossier [`modules/`](./modules/).

---

## 1. Organisation et Sécurité (Modules transversaux)

| Table | Rôle |
|-------|------|
| `organizations` | Entreprise / organisation propriétaire du système |
| `branches` | Agences, bureaux ou points de stockage |
| `users` | Utilisateurs du système |
| `roles` | Rôles : Admin, Commercial, Procurement, Logistique, Technique, Finance |
| `permissions` | Permissions système (CRUD sur chaque module) |
| `role_permissions` | Association rôles ↔ permissions |
| `user_roles` | Association utilisateurs ↔ rôles |
| `user_sessions` | Historique des sessions actives |
| `audit_logs` | Historique complet des actions (qui a fait quoi et quand) |
| `login_logs` | Suivi des connexions (IP, date, succès/échec) |
| `system_settings` | Paramètres généraux (nom société, devise par défaut, etc.) |

---

## 2. CRM et Gestion des Clients

| Table | Rôle |
|-------|------|
| `customers` | Clients particuliers ou organisations (institutions, ONG, entreprises) |
| `customer_contacts` | Personnes de contact chez les clients |
| `customer_addresses` | Adresses de facturation/livraison |
| `customer_categories` | Catégories : Université, ONG, Entreprise, Particulier, etc. |
| `customer_notes` | Notes et informations complémentaires |
| `leads` | Prospects (source : LinkedIn, site web, prospection directe) |
| `lead_sources` | Référentiel des sources de prospects |
| `sales_activities` | Appels, e-mails, réunions, visites effectuées |
| `activity_types` | Types d'activités (Appel, Email, Réunion, Visite) |
| `opportunities` | Opportunités commerciales |
| `opportunity_items` | Produits/services liés à une opportunité |

---

## 3. Catalogue Produits et Services

| Table | Rôle |
|-------|------|
| `products` | Produits (référence, nom, description, prix de base) |
| `product_categories` | Catégories principales (Informatique, Réseaux, Énergie) |
| `product_subcategories` | Sous-catégories (Ordinateurs, Switches, UPS) |
| `product_brands` | Marques (HP, Dell, Cisco, APC) |
| `product_models` | Modèles / références constructeur |
| `product_specifications` | Caractéristiques techniques dynamiques (clé/valeur) |
| `product_images` | Images des produits |
| `product_units` | Unités de vente (Pièce, Carton, Kg, Mètre) |
| `services` | Services (Installation, Maintenance, Configuration) |
| `service_categories` | Catégories de services |
| `product_services` | Association des services aux produits (ex. : un switch nécessite une installation) |

---

## 4. Fournisseurs et Sourcing

| Table | Rôle |
|-------|------|
| `suppliers` | Fournisseurs (Chine, Dubaï, Europe, locaux) |
| `supplier_contacts` | Personnes de contact chez les fournisseurs |
| `supplier_addresses` | Adresses des fournisseurs |
| `supplier_categories` | Catégories de fournisseurs (électronique, câblage, etc.) |
| `supplier_products` | Produits proposés par chaque fournisseur (avec prix et délai) |
| `supplier_quotes` | Offres reçues des fournisseurs |
| `supplier_quote_items` | Détails des offres fournisseurs (produit, prix, quantité) |
| `supplier_evaluations` | Évaluation des fournisseurs (qualité, délai, prix) |
| `supplier_documents` | Documents fournisseurs (certificats, catalogues) |
| `supplier_payment_terms` | Conditions de paiement par fournisseur |
| `supplier_histories` | Historique des transactions avec chaque fournisseur |

---

## 5. Demandes de Sourcing (Procurement Requests)

| Table | Rôle |
|-------|------|
| `procurement_requests` | Demande de sourcing créée par un commercial |
| `procurement_request_items` | Produits recherchés dans une demande |
| `procurement_quotes` | Réponses des fournisseurs à une demande |
| `procurement_quote_items` | Détails des offres reçues |
| `procurement_comparisons` | Comparaison des offres fournisseurs (tableau comparatif) |
| `procurement_approvals` | Validation interne de l'achat (par le responsable) |

---

## 6. Devis Commerciaux (Quotations)

| Table | Rôle |
|-------|------|
| `quotations` | Devis clients |
| `quotation_items` | Lignes de produits/services du devis |
| `quotation_versions` | Historique des versions du devis (modifications successives) |
| `quotation_terms` | Conditions commerciales (paiement, livraison, garantie) |
| `quotation_approvals` | Validations internes du devis |
| `quotation_statuses` | Référentiel des statuts (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED) |

---

## 7. Commandes Clients (Sales Orders)

| Table | Rôle |
|-------|------|
| `sales_orders` | Commandes clients |
| `sales_order_items` | Produits/services commandés |
| `sales_order_status_history` | Historique des statuts (En attente, En cours, Livré, etc.) |
| `sales_order_payments` | Paiements liés à la commande (acompte, solde) |
| `sales_order_documents` | Documents associés (BC client, contrat) |

---

## 8. Achats Fournisseurs (Purchase Orders)

| Table | Rôle |
|-------|------|
| `purchase_orders` | Commandes passées aux fournisseurs |
| `purchase_order_items` | Produits achetés |
| `purchase_order_payments` | Paiements effectués aux fournisseurs |
| `purchase_order_status_history` | Historique des statuts |
| `purchase_receipts` | Réceptions de marchandises (bons de réception) |

---

## 9. Coût Rendu en RDC (Landed Costs)

| Table | Rôle |
|-------|------|
| `landed_costs` | Coût rendu global pour une commande / expédition |
| `landed_cost_items` | Détail des coûts (par produit) |
| `shipping_costs` | Coûts de transport (maritime, aérien) |
| `customs_costs` | Frais de douane et droits d'importation |
| `local_transport_costs` | Transport local (port → entrepôt, entrepôt → client) |
| `inspection_costs` | Contrôle qualité en Chine ou à l'arrivée |
| `handling_costs` | Frais de manutention (chargement/déchargement) |
| `other_procurement_costs` | Autres coûts (assurance, courtage, etc.) |

---

## 10. Logistique et Importation

| Table | Rôle |
|-------|------|
| `shipments` | Expéditions (conteneurs, colis) |
| `shipment_items` | Produits expédiés dans une expédition |
| `shipping_methods` | Modes de transport (Mer, Air, Route) |
| `carriers` | Transporteurs (MSC, DHL, Maersk, etc.) |
| `shipment_tracking` | Suivi étape par étape (dates, localisations) |
| `customs_declarations` | Déclarations douanières |
| `customs_documents` | Documents douaniers (DDU, DDP, etc.) |
| `import_documents` | Documents d'importation (BL, certificat d'origine) |
| `delivery_addresses` | Destinations de livraison (adresses temporaires) |

---

## 11. Entrepôts et Gestion de Stock

| Table | Rôle |
|-------|------|
| `warehouses` | Entrepôts (physiques) |
| `warehouse_locations` | Emplacements (allée, rangée, étagère) |
| `inventory` | Stock actuel (quantité disponible par produit/emplacement) |
| `inventory_movements` | Entrées et sorties de stock (traçabilité complète) |
| `stock_transfers` | Transferts entre entrepôts |
| `stock_adjustments` | Corrections de stock (pertes, cassures, inventaire) |
| `stock_reservations` | Stock réservé pour des commandes en cours |
| `inventory_batches` | Gestion par lots (date de fabrication, péremption) |
| `serial_numbers` | Numéros de série (suivi individuel des équipements) |

---

## 12. Livraison (Delivery)

| Table | Rôle |
|-------|------|
| `deliveries` | Livraisons vers les clients |
| `delivery_items` | Produits livrés |
| `delivery_tracking` | Suivi des livraisons (position GPS, statut) |
| `delivery_confirmations` | Confirmation de réception par le client |
| `proof_of_delivery` | Preuve de livraison (signature, photo) |

---

## 13. Projets, Installation et Déploiement

| Table | Rôle |
|-------|------|
| `projects` | Projets techniques (ex. : Déploiement réseau Université X) |
| `project_items` | Produits/services inclus dans le projet |
| `installations` | Installations réalisées |
| `installation_items` | Équipements installés (liés à des numéros de série) |
| `installation_tasks` | Tâches techniques à réaliser |
| `technicians` | Techniciens affectés aux tâches |
| `installation_reports` | Rapports d'installation (photos, commentaires) |
| `commissioning_tests` | Tests et mise en service (checklist, résultats) |

---

## 14. Maintenance et Support

| Table | Rôle |
|-------|------|
| `support_tickets` | Tickets de support client |
| `maintenance_contracts` | Contrats de maintenance |
| `maintenance_contract_items` | Équipements couverts par le contrat |
| `maintenance_schedules` | Planning des maintenances préventives |
| `maintenance_interventions` | Interventions réalisées |
| `maintenance_reports` | Rapports d'intervention |
| `service_requests` | Demandes de service client |
| `warranties` | Garanties des produits |
| `warranty_claims` | Réclamations au titre de la garantie |

---

## 15. Facturation et Finances

| Table | Rôle |
|-------|------|
| `invoices` | Factures client |
| `invoice_items` | Lignes de facture |
| `payments` | Paiements reçus des clients |
| `payment_methods` | Modes de paiement (Cash, Banque, Mobile Money, Virement) |
| `expenses` | Dépenses (frais généraux, douane, transport) |
| `expense_categories` | Catégories de dépenses |
| `refunds` | Remboursements (avoir) |
| `accounts_receivable` | Créances clients (suivi des impayés) |
| `accounts_payable` | Dettes fournisseurs (suivi des paiements) |

---

## 16. Gestion Documentaire

| Table | Rôle |
|-------|------|
| `documents` | Documents génériques (fichiers stockés) |
| `document_types` | Types de documents (Devis, Facture, BL, Contrat, etc.) |
| `document_versions` | Versions des documents |
| `document_links` | Liaison entre un document et une entité (client, commande, fournisseur) |
| `contracts` | Contrats cadres |
| `contract_items` | Détails des contrats (produits, services, prix) |

---

## 17. Communication et Tâches

| Table | Rôle |
|-------|------|
| `activities` | Activités commerciales |
| `appointments` | Rendez-vous (physiques ou en ligne) |
| `tasks` | Tâches internes (à faire) |
| `notifications` | Notifications système (email, in-app) |
| `comments` | Commentaires sur n'importe quelle entité (commande, ticket, etc.) |

---

## 18. Paramétrage global (Settings)

| Table | Rôle |
|-------|------|
| `currencies` | Devises (USD, CDF, CNY, EUR) |
| `exchange_rates` | Taux de change historiques |
| `taxes` | Taxes (TVA, droits de douane) |
| `units` | Unités de mesure (pièce, kg, carton) |
| `countries` | Pays |
| `cities` | Villes |
| `payment_terms` | Conditions de paiement (30 jours, 60 jours, à la livraison) |
| `shipping_terms` | Conditions logistiques (FOB, CIF, EXW) |
