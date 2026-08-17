import { relations } from "drizzle-orm/relations";
import { organizations, accounts_payable, purchase_orders, suppliers, customers, accounts_receivable, invoices, activities, users, activity_types, appointments, audit_logs, cities, branches, carriers, countries, comments, installations, commissioning_tests, technicians, contracts, contract_items, products, services, currencies, documents, customer_addresses, customer_categories, customer_contacts, customer_notes, leads, customs_costs, customs_declarations, landed_costs, shipments, customs_documents, delivery_addresses, deliveries, sales_orders, warehouses, delivery_confirmations, delivery_items, sales_order_items, delivery_tracking, document_links, document_types, document_versions, exchange_rates, expense_categories, expenses, handling_costs, import_documents, inspection_costs, installation_items, serial_numbers, installation_reports, installation_tasks, projects, inventory_batches, inventory, warehouse_locations, inventory_movements, invoice_items, taxes, landed_cost_items, purchase_order_items, lead_sources, local_transport_costs, login_logs, maintenance_contracts, maintenance_contract_items, maintenance_interventions, maintenance_schedules, support_tickets, maintenance_reports, notifications, opportunities, opportunity_items, other_procurement_costs, payment_methods, payment_terms, payments, procurement_approvals, procurement_quotes, procurement_requests, procurement_comparisons, procurement_quote_items, procurement_request_items, shipping_terms, units, product_brands, product_categories, product_images, product_models, product_services, product_specifications, product_subcategories, product_units, project_items, proof_of_delivery, purchase_order_payments, purchase_order_status_history, purchase_receipts, quotation_approvals, quotations, quotation_items, quotation_terms, quotation_versions, quotation_statuses, refunds, permissions, role_permissions, roles, sales_activities, sales_order_documents, sales_order_payments, sales_order_status_history, service_categories, service_requests, shipment_items, shipment_tracking, shipping_methods, shipping_costs, stock_adjustments, stock_reservations, stock_transfers, supplier_addresses, supplier_categories, supplier_contacts, supplier_documents, supplier_evaluations, supplier_histories, supplier_payment_terms, supplier_products, supplier_quote_items, supplier_quotes, system_settings, tasks, user_roles, user_sessions, warranties, warranty_claims } from "./schema";

export const accounts_payableRelations = relations(accounts_payable, ({one}) => ({
	organization: one(organizations, {
		fields: [accounts_payable.organization_id],
		references: [organizations.id]
	}),
	purchase_order: one(purchase_orders, {
		fields: [accounts_payable.purchase_order_id],
		references: [purchase_orders.id]
	}),
	supplier: one(suppliers, {
		fields: [accounts_payable.supplier_id],
		references: [suppliers.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({one, many}) => ({
	accounts_payables: many(accounts_payable),
	accounts_receivables: many(accounts_receivable),
	activities: many(activities),
	appointments: many(appointments),
	audit_logs: many(audit_logs),
	branches: many(branches),
	carriers: many(carriers),
	comments: many(comments),
	contracts: many(contracts),
	customer_categories: many(customer_categories),
	customers: many(customers),
	customs_declarations: many(customs_declarations),
	deliveries: many(deliveries),
	delivery_addresses: many(delivery_addresses),
	document_types: many(document_types),
	documents: many(documents),
	expense_categories: many(expense_categories),
	expenses: many(expenses),
	inventories: many(inventory),
	inventory_batches: many(inventory_batches),
	inventory_movements: many(inventory_movements),
	invoices: many(invoices),
	landed_costs: many(landed_costs),
	lead_sources: many(lead_sources),
	leads: many(leads),
	maintenance_contracts: many(maintenance_contracts),
	maintenance_interventions: many(maintenance_interventions),
	notifications: many(notifications),
	opportunities: many(opportunities),
	country: one(countries, {
		fields: [organizations.country_id],
		references: [countries.id]
	}),
	currency: one(currencies, {
		fields: [organizations.default_currency_id],
		references: [currencies.id]
	}),
	payment_methods: many(payment_methods),
	payment_terms: many(payment_terms),
	payments: many(payments),
	procurement_requests: many(procurement_requests),
	product_brands: many(product_brands),
	product_categories: many(product_categories),
	products: many(products),
	projects: many(projects),
	purchase_orders: many(purchase_orders),
	purchase_receipts: many(purchase_receipts),
	quotations: many(quotations),
	refunds: many(refunds),
	roles: many(roles),
	sales_activities: many(sales_activities),
	sales_orders: many(sales_orders),
	serial_numbers: many(serial_numbers),
	service_categories: many(service_categories),
	service_requests: many(service_requests),
	services: many(services),
	shipments: many(shipments),
	stock_adjustments: many(stock_adjustments),
	stock_transfers: many(stock_transfers),
	supplier_categories: many(supplier_categories),
	supplier_quotes: many(supplier_quotes),
	suppliers: many(suppliers),
	support_tickets: many(support_tickets),
	system_settings: many(system_settings),
	tasks: many(tasks),
	taxes: many(taxes),
	technicians: many(technicians),
	users: many(users),
	warehouses: many(warehouses),
	warranties: many(warranties),
}));

export const purchase_ordersRelations = relations(purchase_orders, ({one, many}) => ({
	accounts_payables: many(accounts_payable),
	landed_costs: many(landed_costs),
	purchase_order_items: many(purchase_order_items),
	purchase_order_payments: many(purchase_order_payments),
	purchase_order_status_histories: many(purchase_order_status_history),
	user: one(users, {
		fields: [purchase_orders.buyer_user_id],
		references: [users.id]
	}),
	currency: one(currencies, {
		fields: [purchase_orders.currency_id],
		references: [currencies.id]
	}),
	organization: one(organizations, {
		fields: [purchase_orders.organization_id],
		references: [organizations.id]
	}),
	payment_term: one(payment_terms, {
		fields: [purchase_orders.payment_term_id],
		references: [payment_terms.id]
	}),
	procurement_quote: one(procurement_quotes, {
		fields: [purchase_orders.procurement_quote_id],
		references: [procurement_quotes.id]
	}),
	procurement_request: one(procurement_requests, {
		fields: [purchase_orders.procurement_request_id],
		references: [procurement_requests.id]
	}),
	shipping_term: one(shipping_terms, {
		fields: [purchase_orders.shipping_term_id],
		references: [shipping_terms.id]
	}),
	supplier: one(suppliers, {
		fields: [purchase_orders.supplier_id],
		references: [suppliers.id]
	}),
	purchase_receipts: many(purchase_receipts),
	shipments: many(shipments),
}));

export const suppliersRelations = relations(suppliers, ({one, many}) => ({
	accounts_payables: many(accounts_payable),
	contracts: many(contracts),
	expenses: many(expenses),
	inventory_batches: many(inventory_batches),
	procurement_quotes: many(procurement_quotes),
	purchase_orders: many(purchase_orders),
	supplier_addresses: many(supplier_addresses),
	supplier_contacts: many(supplier_contacts),
	supplier_documents: many(supplier_documents),
	supplier_evaluations: many(supplier_evaluations),
	supplier_histories: many(supplier_histories),
	supplier_payment_terms: many(supplier_payment_terms),
	supplier_products: many(supplier_products),
	supplier_quotes: many(supplier_quotes),
	supplier_category: one(supplier_categories, {
		fields: [suppliers.category_id],
		references: [supplier_categories.id]
	}),
	country: one(countries, {
		fields: [suppliers.country_id],
		references: [countries.id]
	}),
	organization: one(organizations, {
		fields: [suppliers.organization_id],
		references: [organizations.id]
	}),
}));

export const accounts_receivableRelations = relations(accounts_receivable, ({one}) => ({
	customer: one(customers, {
		fields: [accounts_receivable.customer_id],
		references: [customers.id]
	}),
	invoice: one(invoices, {
		fields: [accounts_receivable.invoice_id],
		references: [invoices.id]
	}),
	organization: one(organizations, {
		fields: [accounts_receivable.organization_id],
		references: [organizations.id]
	}),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	accounts_receivables: many(accounts_receivable),
	appointments: many(appointments),
	contracts: many(contracts),
	customer_addresses: many(customer_addresses),
	customer_contacts: many(customer_contacts),
	customer_notes: many(customer_notes),
	customer_category: one(customer_categories, {
		fields: [customers.category_id],
		references: [customer_categories.id]
	}),
	lead: one(leads, {
		fields: [customers.converted_from_lead_id],
		references: [leads.id],
		relationName: "customers_converted_from_lead_id_leads_id"
	}),
	organization: one(organizations, {
		fields: [customers.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [customers.owner_user_id],
		references: [users.id]
	}),
	deliveries: many(deliveries),
	delivery_addresses: many(delivery_addresses),
	invoices: many(invoices),
	leads: many(leads, {
		relationName: "leads_converted_customer_id_customers_id"
	}),
	maintenance_contracts: many(maintenance_contracts),
	maintenance_interventions: many(maintenance_interventions),
	opportunities: many(opportunities),
	payments: many(payments),
	projects: many(projects),
	quotations: many(quotations),
	refunds: many(refunds),
	sales_orders: many(sales_orders),
	service_requests: many(service_requests),
	support_tickets: many(support_tickets),
	warranties: many(warranties),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	accounts_receivables: many(accounts_receivable),
	invoice_items: many(invoice_items),
	currency: one(currencies, {
		fields: [invoices.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [invoices.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [invoices.organization_id],
		references: [organizations.id]
	}),
	sales_order: one(sales_orders, {
		fields: [invoices.sales_order_id],
		references: [sales_orders.id]
	}),
	payments: many(payments),
	refunds: many(refunds),
}));

export const activitiesRelations = relations(activities, ({one}) => ({
	organization: one(organizations, {
		fields: [activities.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [activities.owner_user_id],
		references: [users.id]
	}),
	activity_type: one(activity_types, {
		fields: [activities.activity_type_id],
		references: [activity_types.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	activities: many(activities),
	appointments: many(appointments),
	audit_logs: many(audit_logs),
	branches: many(branches, {
		relationName: "branches_manager_user_id_users_id"
	}),
	comments: many(comments),
	customer_notes: many(customer_notes),
	customers: many(customers),
	deliveries: many(deliveries),
	document_versions: many(document_versions),
	documents: many(documents),
	expenses: many(expenses),
	installation_reports: many(installation_reports),
	inventory_movements: many(inventory_movements),
	landed_costs: many(landed_costs),
	leads: many(leads),
	login_logs: many(login_logs),
	notifications: many(notifications),
	opportunities: many(opportunities),
	procurement_approvals: many(procurement_approvals),
	procurement_comparisons: many(procurement_comparisons),
	procurement_requests: many(procurement_requests),
	projects: many(projects),
	purchase_order_status_histories: many(purchase_order_status_history),
	purchase_orders: many(purchase_orders),
	purchase_receipts: many(purchase_receipts),
	quotation_approvals: many(quotation_approvals),
	quotation_versions: many(quotation_versions),
	quotations: many(quotations),
	sales_activities: many(sales_activities),
	sales_order_status_histories: many(sales_order_status_history),
	sales_orders: many(sales_orders),
	stock_adjustments: many(stock_adjustments),
	stock_transfers_approved_by: many(stock_transfers, {
		relationName: "stock_transfers_approved_by_users_id"
	}),
	stock_transfers_requested_by: many(stock_transfers, {
		relationName: "stock_transfers_requested_by_users_id"
	}),
	supplier_evaluations: many(supplier_evaluations),
	support_tickets: many(support_tickets),
	tasks_assignee_id: many(tasks, {
		relationName: "tasks_assignee_id_users_id"
	}),
	tasks_created_by: many(tasks, {
		relationName: "tasks_created_by_users_id"
	}),
	technicians: many(technicians),
	user_roles_assigned_by: many(user_roles, {
		relationName: "user_roles_assigned_by_users_id"
	}),
	user_roles_user_id: many(user_roles, {
		relationName: "user_roles_user_id_users_id"
	}),
	user_sessions: many(user_sessions),
	branch: one(branches, {
		fields: [users.branch_id],
		references: [branches.id],
		relationName: "users_branch_id_branches_id"
	}),
	organization: one(organizations, {
		fields: [users.organization_id],
		references: [organizations.id]
	}),
	warehouses: many(warehouses),
}));

export const activity_typesRelations = relations(activity_types, ({many}) => ({
	activities: many(activities),
	sales_activities: many(sales_activities),
}));

export const appointmentsRelations = relations(appointments, ({one}) => ({
	customer: one(customers, {
		fields: [appointments.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [appointments.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [appointments.organizer_id],
		references: [users.id]
	}),
}));

export const audit_logsRelations = relations(audit_logs, ({one}) => ({
	organization: one(organizations, {
		fields: [audit_logs.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [audit_logs.user_id],
		references: [users.id]
	}),
}));

export const branchesRelations = relations(branches, ({one, many}) => ({
	city: one(cities, {
		fields: [branches.city_id],
		references: [cities.id]
	}),
	user: one(users, {
		fields: [branches.manager_user_id],
		references: [users.id],
		relationName: "branches_manager_user_id_users_id"
	}),
	organization: one(organizations, {
		fields: [branches.organization_id],
		references: [organizations.id]
	}),
	sales_orders: many(sales_orders),
	user_roles: many(user_roles),
	users: many(users, {
		relationName: "users_branch_id_branches_id"
	}),
	warehouses: many(warehouses),
}));

export const citiesRelations = relations(cities, ({one, many}) => ({
	branches: many(branches),
	country: one(countries, {
		fields: [cities.country_id],
		references: [countries.id]
	}),
	customer_addresses: many(customer_addresses),
	delivery_addresses: many(delivery_addresses),
	supplier_addresses: many(supplier_addresses),
	warehouses: many(warehouses),
}));

export const carriersRelations = relations(carriers, ({one, many}) => ({
	organization: one(organizations, {
		fields: [carriers.organization_id],
		references: [organizations.id]
	}),
	shipments: many(shipments),
	shipping_costs: many(shipping_costs),
}));

export const countriesRelations = relations(countries, ({many}) => ({
	cities: many(cities),
	customer_addresses: many(customer_addresses),
	delivery_addresses: many(delivery_addresses),
	organizations: many(organizations),
	shipments_destination_country_id: many(shipments, {
		relationName: "shipments_destination_country_id_countries_id"
	}),
	shipments_origin_country_id: many(shipments, {
		relationName: "shipments_origin_country_id_countries_id"
	}),
	supplier_addresses: many(supplier_addresses),
	suppliers: many(suppliers),
	taxes: many(taxes),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	user: one(users, {
		fields: [comments.author_id],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [comments.organization_id],
		references: [organizations.id]
	}),
	comment: one(comments, {
		fields: [comments.parent_comment_id],
		references: [comments.id],
		relationName: "comments_parent_comment_id_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parent_comment_id_comments_id"
	}),
}));

export const commissioning_testsRelations = relations(commissioning_tests, ({one}) => ({
	installation: one(installations, {
		fields: [commissioning_tests.installation_id],
		references: [installations.id]
	}),
	technician: one(technicians, {
		fields: [commissioning_tests.performed_by],
		references: [technicians.id]
	}),
}));

export const installationsRelations = relations(installations, ({one, many}) => ({
	commissioning_tests: many(commissioning_tests),
	installation_items: many(installation_items),
	installation_reports: many(installation_reports),
	installation_tasks: many(installation_tasks),
	project: one(projects, {
		fields: [installations.project_id],
		references: [projects.id]
	}),
	technician: one(technicians, {
		fields: [installations.lead_technician_id],
		references: [technicians.id]
	}),
}));

export const techniciansRelations = relations(technicians, ({one, many}) => ({
	commissioning_tests: many(commissioning_tests),
	installation_tasks: many(installation_tasks),
	installations: many(installations),
	maintenance_interventions: many(maintenance_interventions),
	maintenance_schedules: many(maintenance_schedules),
	organization: one(organizations, {
		fields: [technicians.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [technicians.user_id],
		references: [users.id]
	}),
}));

export const contract_itemsRelations = relations(contract_items, ({one}) => ({
	contract: one(contracts, {
		fields: [contract_items.contract_id],
		references: [contracts.id]
	}),
	product: one(products, {
		fields: [contract_items.product_id],
		references: [products.id]
	}),
	service: one(services, {
		fields: [contract_items.service_id],
		references: [services.id]
	}),
}));

export const contractsRelations = relations(contracts, ({one, many}) => ({
	contract_items: many(contract_items),
	currency: one(currencies, {
		fields: [contracts.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [contracts.customer_id],
		references: [customers.id]
	}),
	document: one(documents, {
		fields: [contracts.document_id],
		references: [documents.id]
	}),
	organization: one(organizations, {
		fields: [contracts.organization_id],
		references: [organizations.id]
	}),
	supplier: one(suppliers, {
		fields: [contracts.supplier_id],
		references: [suppliers.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	contract_items: many(contract_items),
	delivery_items: many(delivery_items),
	installation_items: many(installation_items),
	inventories: many(inventory),
	inventory_batches: many(inventory_batches),
	inventory_movements: many(inventory_movements),
	invoice_items: many(invoice_items),
	landed_cost_items: many(landed_cost_items),
	maintenance_contract_items: many(maintenance_contract_items),
	opportunity_items: many(opportunity_items),
	procurement_quote_items: many(procurement_quote_items),
	procurement_request_items: many(procurement_request_items),
	product_images: many(product_images),
	product_services: many(product_services),
	product_specifications: many(product_specifications),
	product_brand: one(product_brands, {
		fields: [products.brand_id],
		references: [product_brands.id]
	}),
	product_category: one(product_categories, {
		fields: [products.category_id],
		references: [product_categories.id]
	}),
	currency: one(currencies, {
		fields: [products.currency_id],
		references: [currencies.id]
	}),
	product_model: one(product_models, {
		fields: [products.model_id],
		references: [product_models.id]
	}),
	organization: one(organizations, {
		fields: [products.organization_id],
		references: [organizations.id]
	}),
	product_subcategory: one(product_subcategories, {
		fields: [products.subcategory_id],
		references: [product_subcategories.id]
	}),
	product_unit: one(product_units, {
		fields: [products.unit_id],
		references: [product_units.id]
	}),
	project_items: many(project_items),
	purchase_order_items: many(purchase_order_items),
	quotation_items: many(quotation_items),
	sales_order_items: many(sales_order_items),
	serial_numbers: many(serial_numbers),
	shipment_items: many(shipment_items),
	stock_adjustments: many(stock_adjustments),
	supplier_products: many(supplier_products),
	supplier_quote_items: many(supplier_quote_items),
	warranties: many(warranties),
}));

export const servicesRelations = relations(services, ({one, many}) => ({
	contract_items: many(contract_items),
	invoice_items: many(invoice_items),
	opportunity_items: many(opportunity_items),
	product_services: many(product_services),
	project_items: many(project_items),
	quotation_items: many(quotation_items),
	sales_order_items: many(sales_order_items),
	service_category: one(service_categories, {
		fields: [services.category_id],
		references: [service_categories.id]
	}),
	currency: one(currencies, {
		fields: [services.currency_id],
		references: [currencies.id]
	}),
	organization: one(organizations, {
		fields: [services.organization_id],
		references: [organizations.id]
	}),
}));

export const currenciesRelations = relations(currencies, ({many}) => ({
	contracts: many(contracts),
	customs_costs: many(customs_costs),
	customs_declarations: many(customs_declarations),
	exchange_rates_from_currency_id: many(exchange_rates, {
		relationName: "exchange_rates_from_currency_id_currencies_id"
	}),
	exchange_rates_to_currency_id: many(exchange_rates, {
		relationName: "exchange_rates_to_currency_id_currencies_id"
	}),
	expenses: many(expenses),
	handling_costs: many(handling_costs),
	inspection_costs: many(inspection_costs),
	invoices: many(invoices),
	landed_costs: many(landed_costs),
	leads: many(leads),
	local_transport_costs: many(local_transport_costs),
	maintenance_contracts: many(maintenance_contracts),
	opportunities: many(opportunities),
	organizations: many(organizations),
	other_procurement_costs: many(other_procurement_costs),
	payments: many(payments),
	procurement_quotes: many(procurement_quotes),
	procurement_request_items: many(procurement_request_items),
	products: many(products),
	purchase_order_payments: many(purchase_order_payments),
	purchase_orders: many(purchase_orders),
	quotations: many(quotations),
	refunds: many(refunds),
	sales_order_payments: many(sales_order_payments),
	sales_orders: many(sales_orders),
	services: many(services),
	shipping_costs: many(shipping_costs),
	supplier_histories: many(supplier_histories),
	supplier_products: many(supplier_products),
	supplier_quotes: many(supplier_quotes),
}));

export const documentsRelations = relations(documents, ({one, many}) => ({
	contracts: many(contracts),
	customs_documents: many(customs_documents),
	document_links: many(document_links),
	document_versions: many(document_versions),
	organization: one(organizations, {
		fields: [documents.organization_id],
		references: [organizations.id]
	}),
	document_type: one(document_types, {
		fields: [documents.document_type_id],
		references: [document_types.id]
	}),
	user: one(users, {
		fields: [documents.uploaded_by],
		references: [users.id]
	}),
	import_documents: many(import_documents),
	inspection_costs: many(inspection_costs),
	proof_of_deliveries: many(proof_of_delivery),
	sales_order_documents: many(sales_order_documents),
	supplier_documents: many(supplier_documents),
}));

export const customer_addressesRelations = relations(customer_addresses, ({one, many}) => ({
	city: one(cities, {
		fields: [customer_addresses.city_id],
		references: [cities.id]
	}),
	country: one(countries, {
		fields: [customer_addresses.country_id],
		references: [countries.id]
	}),
	customer: one(customers, {
		fields: [customer_addresses.customer_id],
		references: [customers.id]
	}),
	sales_orders_billing_address_id: many(sales_orders, {
		relationName: "sales_orders_billing_address_id_customer_addresses_id"
	}),
	sales_orders_shipping_address_id: many(sales_orders, {
		relationName: "sales_orders_shipping_address_id_customer_addresses_id"
	}),
}));

export const customer_categoriesRelations = relations(customer_categories, ({one, many}) => ({
	organization: one(organizations, {
		fields: [customer_categories.organization_id],
		references: [organizations.id]
	}),
	customers: many(customers),
}));

export const customer_contactsRelations = relations(customer_contacts, ({one, many}) => ({
	customer: one(customers, {
		fields: [customer_contacts.customer_id],
		references: [customers.id]
	}),
	support_tickets: many(support_tickets),
}));

export const customer_notesRelations = relations(customer_notes, ({one}) => ({
	user: one(users, {
		fields: [customer_notes.author_id],
		references: [users.id]
	}),
	customer: one(customers, {
		fields: [customer_notes.customer_id],
		references: [customers.id]
	}),
}));

export const leadsRelations = relations(leads, ({one, many}) => ({
	customers: many(customers, {
		relationName: "customers_converted_from_lead_id_leads_id"
	}),
	customer: one(customers, {
		fields: [leads.converted_customer_id],
		references: [customers.id],
		relationName: "leads_converted_customer_id_customers_id"
	}),
	currency: one(currencies, {
		fields: [leads.currency_id],
		references: [currencies.id]
	}),
	organization: one(organizations, {
		fields: [leads.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [leads.owner_user_id],
		references: [users.id]
	}),
	lead_source: one(lead_sources, {
		fields: [leads.source_id],
		references: [lead_sources.id]
	}),
	opportunities: many(opportunities),
}));

export const customs_costsRelations = relations(customs_costs, ({one}) => ({
	currency: one(currencies, {
		fields: [customs_costs.currency_id],
		references: [currencies.id]
	}),
	customs_declaration: one(customs_declarations, {
		fields: [customs_costs.customs_declaration_id],
		references: [customs_declarations.id]
	}),
	landed_cost: one(landed_costs, {
		fields: [customs_costs.landed_cost_id],
		references: [landed_costs.id]
	}),
}));

export const customs_declarationsRelations = relations(customs_declarations, ({one, many}) => ({
	customs_costs: many(customs_costs),
	currency: one(currencies, {
		fields: [customs_declarations.currency_id],
		references: [currencies.id]
	}),
	organization: one(organizations, {
		fields: [customs_declarations.organization_id],
		references: [organizations.id]
	}),
	shipment: one(shipments, {
		fields: [customs_declarations.shipment_id],
		references: [shipments.id]
	}),
	customs_documents: many(customs_documents),
}));

export const landed_costsRelations = relations(landed_costs, ({one, many}) => ({
	customs_costs: many(customs_costs),
	expenses: many(expenses),
	handling_costs: many(handling_costs),
	inspection_costs: many(inspection_costs),
	landed_cost_items: many(landed_cost_items),
	currency: one(currencies, {
		fields: [landed_costs.currency_id],
		references: [currencies.id]
	}),
	organization: one(organizations, {
		fields: [landed_costs.organization_id],
		references: [organizations.id]
	}),
	purchase_order: one(purchase_orders, {
		fields: [landed_costs.purchase_order_id],
		references: [purchase_orders.id]
	}),
	shipment: one(shipments, {
		fields: [landed_costs.shipment_id],
		references: [shipments.id]
	}),
	user: one(users, {
		fields: [landed_costs.calculated_by],
		references: [users.id]
	}),
	local_transport_costs: many(local_transport_costs),
	other_procurement_costs: many(other_procurement_costs),
	shipping_costs: many(shipping_costs),
}));

export const shipmentsRelations = relations(shipments, ({one, many}) => ({
	customs_declarations: many(customs_declarations),
	import_documents: many(import_documents),
	landed_costs: many(landed_costs),
	purchase_receipts: many(purchase_receipts),
	shipment_items: many(shipment_items),
	shipment_trackings: many(shipment_tracking),
	carrier: one(carriers, {
		fields: [shipments.carrier_id],
		references: [carriers.id]
	}),
	country_destination_country_id: one(countries, {
		fields: [shipments.destination_country_id],
		references: [countries.id],
		relationName: "shipments_destination_country_id_countries_id"
	}),
	shipping_method: one(shipping_methods, {
		fields: [shipments.shipping_method_id],
		references: [shipping_methods.id]
	}),
	organization: one(organizations, {
		fields: [shipments.organization_id],
		references: [organizations.id]
	}),
	country_origin_country_id: one(countries, {
		fields: [shipments.origin_country_id],
		references: [countries.id],
		relationName: "shipments_origin_country_id_countries_id"
	}),
	purchase_order: one(purchase_orders, {
		fields: [shipments.purchase_order_id],
		references: [purchase_orders.id]
	}),
	shipping_costs: many(shipping_costs),
}));

export const customs_documentsRelations = relations(customs_documents, ({one}) => ({
	customs_declaration: one(customs_declarations, {
		fields: [customs_documents.customs_declaration_id],
		references: [customs_declarations.id]
	}),
	document: one(documents, {
		fields: [customs_documents.document_id],
		references: [documents.id]
	}),
}));

export const deliveriesRelations = relations(deliveries, ({one, many}) => ({
	delivery_address: one(delivery_addresses, {
		fields: [deliveries.delivery_address_id],
		references: [delivery_addresses.id]
	}),
	customer: one(customers, {
		fields: [deliveries.customer_id],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [deliveries.driver_user_id],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [deliveries.organization_id],
		references: [organizations.id]
	}),
	sales_order: one(sales_orders, {
		fields: [deliveries.sales_order_id],
		references: [sales_orders.id]
	}),
	warehouse: one(warehouses, {
		fields: [deliveries.warehouse_id],
		references: [warehouses.id]
	}),
	delivery_confirmations: many(delivery_confirmations),
	delivery_items: many(delivery_items),
	delivery_trackings: many(delivery_tracking),
	proof_of_deliveries: many(proof_of_delivery),
}));

export const delivery_addressesRelations = relations(delivery_addresses, ({one, many}) => ({
	deliveries: many(deliveries),
	city: one(cities, {
		fields: [delivery_addresses.city_id],
		references: [cities.id]
	}),
	country: one(countries, {
		fields: [delivery_addresses.country_id],
		references: [countries.id]
	}),
	customer: one(customers, {
		fields: [delivery_addresses.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [delivery_addresses.organization_id],
		references: [organizations.id]
	}),
	warehouse: one(warehouses, {
		fields: [delivery_addresses.warehouse_id],
		references: [warehouses.id]
	}),
}));

export const sales_ordersRelations = relations(sales_orders, ({one, many}) => ({
	deliveries: many(deliveries),
	invoices: many(invoices),
	procurement_requests: many(procurement_requests),
	projects: many(projects),
	sales_order_documents: many(sales_order_documents),
	sales_order_items: many(sales_order_items),
	sales_order_payments: many(sales_order_payments),
	sales_order_status_histories: many(sales_order_status_history),
	customer_address_billing_address_id: one(customer_addresses, {
		fields: [sales_orders.billing_address_id],
		references: [customer_addresses.id],
		relationName: "sales_orders_billing_address_id_customer_addresses_id"
	}),
	branch: one(branches, {
		fields: [sales_orders.branch_id],
		references: [branches.id]
	}),
	currency: one(currencies, {
		fields: [sales_orders.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [sales_orders.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [sales_orders.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [sales_orders.owner_user_id],
		references: [users.id]
	}),
	quotation: one(quotations, {
		fields: [sales_orders.quotation_id],
		references: [quotations.id]
	}),
	customer_address_shipping_address_id: one(customer_addresses, {
		fields: [sales_orders.shipping_address_id],
		references: [customer_addresses.id],
		relationName: "sales_orders_shipping_address_id_customer_addresses_id"
	}),
	stock_reservations: many(stock_reservations),
	warranties: many(warranties),
}));

export const warehousesRelations = relations(warehouses, ({one, many}) => ({
	deliveries: many(deliveries),
	delivery_addresses: many(delivery_addresses),
	inventories: many(inventory),
	inventory_movements: many(inventory_movements),
	purchase_receipts: many(purchase_receipts),
	serial_numbers: many(serial_numbers),
	stock_adjustments: many(stock_adjustments),
	stock_transfers_from_warehouse_id: many(stock_transfers, {
		relationName: "stock_transfers_from_warehouse_id_warehouses_id"
	}),
	stock_transfers_to_warehouse_id: many(stock_transfers, {
		relationName: "stock_transfers_to_warehouse_id_warehouses_id"
	}),
	warehouse_locations: many(warehouse_locations),
	branch: one(branches, {
		fields: [warehouses.branch_id],
		references: [branches.id]
	}),
	city: one(cities, {
		fields: [warehouses.city_id],
		references: [cities.id]
	}),
	user: one(users, {
		fields: [warehouses.manager_user_id],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [warehouses.organization_id],
		references: [organizations.id]
	}),
}));

export const delivery_confirmationsRelations = relations(delivery_confirmations, ({one, many}) => ({
	delivery: one(deliveries, {
		fields: [delivery_confirmations.delivery_id],
		references: [deliveries.id]
	}),
	proof_of_deliveries: many(proof_of_delivery),
}));

export const delivery_itemsRelations = relations(delivery_items, ({one}) => ({
	delivery: one(deliveries, {
		fields: [delivery_items.delivery_id],
		references: [deliveries.id]
	}),
	product: one(products, {
		fields: [delivery_items.product_id],
		references: [products.id]
	}),
	sales_order_item: one(sales_order_items, {
		fields: [delivery_items.sales_order_item_id],
		references: [sales_order_items.id]
	}),
}));

export const sales_order_itemsRelations = relations(sales_order_items, ({one, many}) => ({
	delivery_items: many(delivery_items),
	sales_order: one(sales_orders, {
		fields: [sales_order_items.sales_order_id],
		references: [sales_orders.id]
	}),
	product: one(products, {
		fields: [sales_order_items.product_id],
		references: [products.id]
	}),
	service: one(services, {
		fields: [sales_order_items.service_id],
		references: [services.id]
	}),
	tax: one(taxes, {
		fields: [sales_order_items.tax_id],
		references: [taxes.id]
	}),
	serial_numbers: many(serial_numbers),
	stock_reservations: many(stock_reservations),
}));

export const delivery_trackingRelations = relations(delivery_tracking, ({one}) => ({
	delivery: one(deliveries, {
		fields: [delivery_tracking.delivery_id],
		references: [deliveries.id]
	}),
}));

export const document_linksRelations = relations(document_links, ({one}) => ({
	document: one(documents, {
		fields: [document_links.document_id],
		references: [documents.id]
	}),
}));

export const document_typesRelations = relations(document_types, ({one, many}) => ({
	organization: one(organizations, {
		fields: [document_types.organization_id],
		references: [organizations.id]
	}),
	documents: many(documents),
}));

export const document_versionsRelations = relations(document_versions, ({one}) => ({
	document: one(documents, {
		fields: [document_versions.document_id],
		references: [documents.id]
	}),
	user: one(users, {
		fields: [document_versions.created_by],
		references: [users.id]
	}),
}));

export const exchange_ratesRelations = relations(exchange_rates, ({one}) => ({
	currency_from_currency_id: one(currencies, {
		fields: [exchange_rates.from_currency_id],
		references: [currencies.id],
		relationName: "exchange_rates_from_currency_id_currencies_id"
	}),
	currency_to_currency_id: one(currencies, {
		fields: [exchange_rates.to_currency_id],
		references: [currencies.id],
		relationName: "exchange_rates_to_currency_id_currencies_id"
	}),
}));

export const expense_categoriesRelations = relations(expense_categories, ({one, many}) => ({
	organization: one(organizations, {
		fields: [expense_categories.organization_id],
		references: [organizations.id]
	}),
	expense_category: one(expense_categories, {
		fields: [expense_categories.parent_id],
		references: [expense_categories.id],
		relationName: "expense_categories_parent_id_expense_categories_id"
	}),
	expense_categories: many(expense_categories, {
		relationName: "expense_categories_parent_id_expense_categories_id"
	}),
	expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({one}) => ({
	expense_category: one(expense_categories, {
		fields: [expenses.category_id],
		references: [expense_categories.id]
	}),
	currency: one(currencies, {
		fields: [expenses.currency_id],
		references: [currencies.id]
	}),
	landed_cost: one(landed_costs, {
		fields: [expenses.landed_cost_id],
		references: [landed_costs.id]
	}),
	organization: one(organizations, {
		fields: [expenses.organization_id],
		references: [organizations.id]
	}),
	supplier: one(suppliers, {
		fields: [expenses.supplier_id],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [expenses.paid_by],
		references: [users.id]
	}),
}));

export const handling_costsRelations = relations(handling_costs, ({one}) => ({
	currency: one(currencies, {
		fields: [handling_costs.currency_id],
		references: [currencies.id]
	}),
	landed_cost: one(landed_costs, {
		fields: [handling_costs.landed_cost_id],
		references: [landed_costs.id]
	}),
}));

export const import_documentsRelations = relations(import_documents, ({one}) => ({
	document: one(documents, {
		fields: [import_documents.document_id],
		references: [documents.id]
	}),
	shipment: one(shipments, {
		fields: [import_documents.shipment_id],
		references: [shipments.id]
	}),
}));

export const inspection_costsRelations = relations(inspection_costs, ({one}) => ({
	currency: one(currencies, {
		fields: [inspection_costs.currency_id],
		references: [currencies.id]
	}),
	document: one(documents, {
		fields: [inspection_costs.report_document_id],
		references: [documents.id]
	}),
	landed_cost: one(landed_costs, {
		fields: [inspection_costs.landed_cost_id],
		references: [landed_costs.id]
	}),
}));

export const installation_itemsRelations = relations(installation_items, ({one}) => ({
	installation: one(installations, {
		fields: [installation_items.installation_id],
		references: [installations.id]
	}),
	product: one(products, {
		fields: [installation_items.product_id],
		references: [products.id]
	}),
	serial_number: one(serial_numbers, {
		fields: [installation_items.serial_number_id],
		references: [serial_numbers.id]
	}),
}));

export const serial_numbersRelations = relations(serial_numbers, ({one, many}) => ({
	installation_items: many(installation_items),
	maintenance_contract_items: many(maintenance_contract_items),
	inventory_batch: one(inventory_batches, {
		fields: [serial_numbers.batch_id],
		references: [inventory_batches.id]
	}),
	organization: one(organizations, {
		fields: [serial_numbers.organization_id],
		references: [organizations.id]
	}),
	purchase_order_item: one(purchase_order_items, {
		fields: [serial_numbers.purchase_order_item_id],
		references: [purchase_order_items.id]
	}),
	product: one(products, {
		fields: [serial_numbers.product_id],
		references: [products.id]
	}),
	sales_order_item: one(sales_order_items, {
		fields: [serial_numbers.sales_order_item_id],
		references: [sales_order_items.id]
	}),
	warehouse: one(warehouses, {
		fields: [serial_numbers.warehouse_id],
		references: [warehouses.id]
	}),
	support_tickets: many(support_tickets),
	warranties: many(warranties),
}));

export const installation_reportsRelations = relations(installation_reports, ({one}) => ({
	user: one(users, {
		fields: [installation_reports.author_user_id],
		references: [users.id]
	}),
	installation: one(installations, {
		fields: [installation_reports.installation_id],
		references: [installations.id]
	}),
}));

export const installation_tasksRelations = relations(installation_tasks, ({one}) => ({
	installation: one(installations, {
		fields: [installation_tasks.installation_id],
		references: [installations.id]
	}),
	technician: one(technicians, {
		fields: [installation_tasks.technician_id],
		references: [technicians.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	installations: many(installations),
	project_items: many(project_items),
	customer: one(customers, {
		fields: [projects.customer_id],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [projects.manager_user_id],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [projects.organization_id],
		references: [organizations.id]
	}),
	sales_order: one(sales_orders, {
		fields: [projects.sales_order_id],
		references: [sales_orders.id]
	}),
}));

export const inventoryRelations = relations(inventory, ({one, many}) => ({
	inventory_batch: one(inventory_batches, {
		fields: [inventory.batch_id],
		references: [inventory_batches.id]
	}),
	warehouse_location: one(warehouse_locations, {
		fields: [inventory.location_id],
		references: [warehouse_locations.id]
	}),
	organization: one(organizations, {
		fields: [inventory.organization_id],
		references: [organizations.id]
	}),
	product: one(products, {
		fields: [inventory.product_id],
		references: [products.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventory.warehouse_id],
		references: [warehouses.id]
	}),
	stock_reservations: many(stock_reservations),
}));

export const inventory_batchesRelations = relations(inventory_batches, ({one, many}) => ({
	inventories: many(inventory),
	organization: one(organizations, {
		fields: [inventory_batches.organization_id],
		references: [organizations.id]
	}),
	product: one(products, {
		fields: [inventory_batches.product_id],
		references: [products.id]
	}),
	supplier: one(suppliers, {
		fields: [inventory_batches.supplier_id],
		references: [suppliers.id]
	}),
	serial_numbers: many(serial_numbers),
}));

export const warehouse_locationsRelations = relations(warehouse_locations, ({one, many}) => ({
	inventories: many(inventory),
	inventory_movements: many(inventory_movements),
	warehouse: one(warehouses, {
		fields: [warehouse_locations.warehouse_id],
		references: [warehouses.id]
	}),
}));

export const inventory_movementsRelations = relations(inventory_movements, ({one}) => ({
	warehouse_location: one(warehouse_locations, {
		fields: [inventory_movements.location_id],
		references: [warehouse_locations.id]
	}),
	organization: one(organizations, {
		fields: [inventory_movements.organization_id],
		references: [organizations.id]
	}),
	product: one(products, {
		fields: [inventory_movements.product_id],
		references: [products.id]
	}),
	user: one(users, {
		fields: [inventory_movements.moved_by],
		references: [users.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventory_movements.warehouse_id],
		references: [warehouses.id]
	}),
}));

export const invoice_itemsRelations = relations(invoice_items, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoice_items.invoice_id],
		references: [invoices.id]
	}),
	product: one(products, {
		fields: [invoice_items.product_id],
		references: [products.id]
	}),
	service: one(services, {
		fields: [invoice_items.service_id],
		references: [services.id]
	}),
	tax: one(taxes, {
		fields: [invoice_items.tax_id],
		references: [taxes.id]
	}),
}));

export const taxesRelations = relations(taxes, ({one, many}) => ({
	invoice_items: many(invoice_items),
	quotation_items: many(quotation_items),
	sales_order_items: many(sales_order_items),
	country: one(countries, {
		fields: [taxes.country_id],
		references: [countries.id]
	}),
	organization: one(organizations, {
		fields: [taxes.organization_id],
		references: [organizations.id]
	}),
}));

export const landed_cost_itemsRelations = relations(landed_cost_items, ({one}) => ({
	landed_cost: one(landed_costs, {
		fields: [landed_cost_items.landed_cost_id],
		references: [landed_costs.id]
	}),
	purchase_order_item: one(purchase_order_items, {
		fields: [landed_cost_items.purchase_order_item_id],
		references: [purchase_order_items.id]
	}),
	product: one(products, {
		fields: [landed_cost_items.product_id],
		references: [products.id]
	}),
}));

export const purchase_order_itemsRelations = relations(purchase_order_items, ({one, many}) => ({
	landed_cost_items: many(landed_cost_items),
	purchase_order: one(purchase_orders, {
		fields: [purchase_order_items.purchase_order_id],
		references: [purchase_orders.id]
	}),
	product: one(products, {
		fields: [purchase_order_items.product_id],
		references: [products.id]
	}),
	serial_numbers: many(serial_numbers),
	shipment_items: many(shipment_items),
}));

export const lead_sourcesRelations = relations(lead_sources, ({one, many}) => ({
	organization: one(organizations, {
		fields: [lead_sources.organization_id],
		references: [organizations.id]
	}),
	leads: many(leads),
}));

export const local_transport_costsRelations = relations(local_transport_costs, ({one}) => ({
	currency: one(currencies, {
		fields: [local_transport_costs.currency_id],
		references: [currencies.id]
	}),
	landed_cost: one(landed_costs, {
		fields: [local_transport_costs.landed_cost_id],
		references: [landed_costs.id]
	}),
}));

export const login_logsRelations = relations(login_logs, ({one}) => ({
	user: one(users, {
		fields: [login_logs.user_id],
		references: [users.id]
	}),
}));

export const maintenance_contract_itemsRelations = relations(maintenance_contract_items, ({one}) => ({
	maintenance_contract: one(maintenance_contracts, {
		fields: [maintenance_contract_items.maintenance_contract_id],
		references: [maintenance_contracts.id]
	}),
	product: one(products, {
		fields: [maintenance_contract_items.product_id],
		references: [products.id]
	}),
	serial_number: one(serial_numbers, {
		fields: [maintenance_contract_items.serial_number_id],
		references: [serial_numbers.id]
	}),
}));

export const maintenance_contractsRelations = relations(maintenance_contracts, ({one, many}) => ({
	maintenance_contract_items: many(maintenance_contract_items),
	currency: one(currencies, {
		fields: [maintenance_contracts.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [maintenance_contracts.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [maintenance_contracts.organization_id],
		references: [organizations.id]
	}),
	maintenance_interventions: many(maintenance_interventions),
	maintenance_schedules: many(maintenance_schedules),
}));

export const maintenance_interventionsRelations = relations(maintenance_interventions, ({one, many}) => ({
	maintenance_contract: one(maintenance_contracts, {
		fields: [maintenance_interventions.contract_id],
		references: [maintenance_contracts.id]
	}),
	customer: one(customers, {
		fields: [maintenance_interventions.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [maintenance_interventions.organization_id],
		references: [organizations.id]
	}),
	maintenance_schedule: one(maintenance_schedules, {
		fields: [maintenance_interventions.schedule_id],
		references: [maintenance_schedules.id]
	}),
	technician: one(technicians, {
		fields: [maintenance_interventions.technician_id],
		references: [technicians.id]
	}),
	support_ticket: one(support_tickets, {
		fields: [maintenance_interventions.ticket_id],
		references: [support_tickets.id]
	}),
	maintenance_reports: many(maintenance_reports),
}));

export const maintenance_schedulesRelations = relations(maintenance_schedules, ({one, many}) => ({
	maintenance_interventions: many(maintenance_interventions),
	maintenance_contract: one(maintenance_contracts, {
		fields: [maintenance_schedules.maintenance_contract_id],
		references: [maintenance_contracts.id]
	}),
	technician: one(technicians, {
		fields: [maintenance_schedules.technician_id],
		references: [technicians.id]
	}),
}));

export const support_ticketsRelations = relations(support_tickets, ({one, many}) => ({
	maintenance_interventions: many(maintenance_interventions),
	service_requests: many(service_requests),
	user: one(users, {
		fields: [support_tickets.assigned_to],
		references: [users.id]
	}),
	customer_contact: one(customer_contacts, {
		fields: [support_tickets.contact_id],
		references: [customer_contacts.id]
	}),
	customer: one(customers, {
		fields: [support_tickets.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [support_tickets.organization_id],
		references: [organizations.id]
	}),
	serial_number: one(serial_numbers, {
		fields: [support_tickets.related_serial_number_id],
		references: [serial_numbers.id]
	}),
	warranty_claims: many(warranty_claims),
}));

export const maintenance_reportsRelations = relations(maintenance_reports, ({one}) => ({
	maintenance_intervention: one(maintenance_interventions, {
		fields: [maintenance_reports.intervention_id],
		references: [maintenance_interventions.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	organization: one(organizations, {
		fields: [notifications.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [notifications.user_id],
		references: [users.id]
	}),
}));

export const opportunitiesRelations = relations(opportunities, ({one, many}) => ({
	currency: one(currencies, {
		fields: [opportunities.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [opportunities.customer_id],
		references: [customers.id]
	}),
	lead: one(leads, {
		fields: [opportunities.lead_id],
		references: [leads.id]
	}),
	organization: one(organizations, {
		fields: [opportunities.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [opportunities.owner_user_id],
		references: [users.id]
	}),
	opportunity_items: many(opportunity_items),
	procurement_requests: many(procurement_requests),
	quotations: many(quotations),
}));

export const opportunity_itemsRelations = relations(opportunity_items, ({one}) => ({
	opportunity: one(opportunities, {
		fields: [opportunity_items.opportunity_id],
		references: [opportunities.id]
	}),
	product: one(products, {
		fields: [opportunity_items.product_id],
		references: [products.id]
	}),
	service: one(services, {
		fields: [opportunity_items.service_id],
		references: [services.id]
	}),
}));

export const other_procurement_costsRelations = relations(other_procurement_costs, ({one}) => ({
	currency: one(currencies, {
		fields: [other_procurement_costs.currency_id],
		references: [currencies.id]
	}),
	landed_cost: one(landed_costs, {
		fields: [other_procurement_costs.landed_cost_id],
		references: [landed_costs.id]
	}),
}));

export const payment_methodsRelations = relations(payment_methods, ({one, many}) => ({
	organization: one(organizations, {
		fields: [payment_methods.organization_id],
		references: [organizations.id]
	}),
	payments: many(payments),
	purchase_order_payments: many(purchase_order_payments),
}));

export const payment_termsRelations = relations(payment_terms, ({one, many}) => ({
	organization: one(organizations, {
		fields: [payment_terms.organization_id],
		references: [organizations.id]
	}),
	purchase_orders: many(purchase_orders),
	quotation_terms: many(quotation_terms),
	supplier_payment_terms: many(supplier_payment_terms),
}));

export const paymentsRelations = relations(payments, ({one, many}) => ({
	currency: one(currencies, {
		fields: [payments.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [payments.customer_id],
		references: [customers.id]
	}),
	invoice: one(invoices, {
		fields: [payments.invoice_id],
		references: [invoices.id]
	}),
	payment_method: one(payment_methods, {
		fields: [payments.payment_method_id],
		references: [payment_methods.id]
	}),
	organization: one(organizations, {
		fields: [payments.organization_id],
		references: [organizations.id]
	}),
	sales_order_payments: many(sales_order_payments),
}));

export const procurement_approvalsRelations = relations(procurement_approvals, ({one}) => ({
	user: one(users, {
		fields: [procurement_approvals.approver_id],
		references: [users.id]
	}),
	procurement_quote: one(procurement_quotes, {
		fields: [procurement_approvals.procurement_quote_id],
		references: [procurement_quotes.id]
	}),
	procurement_request: one(procurement_requests, {
		fields: [procurement_approvals.procurement_request_id],
		references: [procurement_requests.id]
	}),
}));

export const procurement_quotesRelations = relations(procurement_quotes, ({one, many}) => ({
	procurement_approvals: many(procurement_approvals),
	procurement_comparisons: many(procurement_comparisons),
	procurement_quote_items: many(procurement_quote_items),
	currency: one(currencies, {
		fields: [procurement_quotes.currency_id],
		references: [currencies.id]
	}),
	procurement_request: one(procurement_requests, {
		fields: [procurement_quotes.procurement_request_id],
		references: [procurement_requests.id]
	}),
	shipping_term: one(shipping_terms, {
		fields: [procurement_quotes.shipping_term_id],
		references: [shipping_terms.id]
	}),
	supplier: one(suppliers, {
		fields: [procurement_quotes.supplier_id],
		references: [suppliers.id]
	}),
	purchase_orders: many(purchase_orders),
}));

export const procurement_requestsRelations = relations(procurement_requests, ({one, many}) => ({
	procurement_approvals: many(procurement_approvals),
	procurement_comparisons: many(procurement_comparisons),
	procurement_quotes: many(procurement_quotes),
	procurement_request_items: many(procurement_request_items),
	opportunity: one(opportunities, {
		fields: [procurement_requests.opportunity_id],
		references: [opportunities.id]
	}),
	organization: one(organizations, {
		fields: [procurement_requests.organization_id],
		references: [organizations.id]
	}),
	sales_order: one(sales_orders, {
		fields: [procurement_requests.sales_order_id],
		references: [sales_orders.id]
	}),
	user: one(users, {
		fields: [procurement_requests.requested_by],
		references: [users.id]
	}),
	purchase_orders: many(purchase_orders),
}));

export const procurement_comparisonsRelations = relations(procurement_comparisons, ({one}) => ({
	procurement_quote: one(procurement_quotes, {
		fields: [procurement_comparisons.selected_quote_id],
		references: [procurement_quotes.id]
	}),
	procurement_request: one(procurement_requests, {
		fields: [procurement_comparisons.procurement_request_id],
		references: [procurement_requests.id]
	}),
	user: one(users, {
		fields: [procurement_comparisons.compared_by],
		references: [users.id]
	}),
}));

export const procurement_quote_itemsRelations = relations(procurement_quote_items, ({one}) => ({
	product: one(products, {
		fields: [procurement_quote_items.product_id],
		references: [products.id]
	}),
	procurement_quote: one(procurement_quotes, {
		fields: [procurement_quote_items.procurement_quote_id],
		references: [procurement_quotes.id]
	}),
	procurement_request_item: one(procurement_request_items, {
		fields: [procurement_quote_items.procurement_request_item_id],
		references: [procurement_request_items.id]
	}),
}));

export const procurement_request_itemsRelations = relations(procurement_request_items, ({one, many}) => ({
	procurement_quote_items: many(procurement_quote_items),
	currency: one(currencies, {
		fields: [procurement_request_items.currency_id],
		references: [currencies.id]
	}),
	product: one(products, {
		fields: [procurement_request_items.product_id],
		references: [products.id]
	}),
	procurement_request: one(procurement_requests, {
		fields: [procurement_request_items.procurement_request_id],
		references: [procurement_requests.id]
	}),
	unit: one(units, {
		fields: [procurement_request_items.unit_id],
		references: [units.id]
	}),
}));

export const shipping_termsRelations = relations(shipping_terms, ({many}) => ({
	procurement_quotes: many(procurement_quotes),
	purchase_orders: many(purchase_orders),
	quotation_terms: many(quotation_terms),
}));

export const unitsRelations = relations(units, ({many}) => ({
	procurement_request_items: many(procurement_request_items),
	product_units: many(product_units),
	quotation_items: many(quotation_items),
}));

export const product_brandsRelations = relations(product_brands, ({one, many}) => ({
	organization: one(organizations, {
		fields: [product_brands.organization_id],
		references: [organizations.id]
	}),
	product_models: many(product_models),
	products: many(products),
}));

export const product_categoriesRelations = relations(product_categories, ({one, many}) => ({
	organization: one(organizations, {
		fields: [product_categories.organization_id],
		references: [organizations.id]
	}),
	product_category: one(product_categories, {
		fields: [product_categories.parent_id],
		references: [product_categories.id],
		relationName: "product_categories_parent_id_product_categories_id"
	}),
	product_categories: many(product_categories, {
		relationName: "product_categories_parent_id_product_categories_id"
	}),
	product_subcategories: many(product_subcategories),
	products: many(products),
}));

export const product_imagesRelations = relations(product_images, ({one}) => ({
	product: one(products, {
		fields: [product_images.product_id],
		references: [products.id]
	}),
}));

export const product_modelsRelations = relations(product_models, ({one, many}) => ({
	product_brand: one(product_brands, {
		fields: [product_models.brand_id],
		references: [product_brands.id]
	}),
	products: many(products),
}));

export const product_servicesRelations = relations(product_services, ({one}) => ({
	product: one(products, {
		fields: [product_services.product_id],
		references: [products.id]
	}),
	service: one(services, {
		fields: [product_services.service_id],
		references: [services.id]
	}),
}));

export const product_specificationsRelations = relations(product_specifications, ({one}) => ({
	product: one(products, {
		fields: [product_specifications.product_id],
		references: [products.id]
	}),
}));

export const product_subcategoriesRelations = relations(product_subcategories, ({one, many}) => ({
	product_category: one(product_categories, {
		fields: [product_subcategories.category_id],
		references: [product_categories.id]
	}),
	products: many(products),
}));

export const product_unitsRelations = relations(product_units, ({one, many}) => ({
	unit: one(units, {
		fields: [product_units.unit_id],
		references: [units.id]
	}),
	products: many(products),
}));

export const project_itemsRelations = relations(project_items, ({one}) => ({
	product: one(products, {
		fields: [project_items.product_id],
		references: [products.id]
	}),
	project: one(projects, {
		fields: [project_items.project_id],
		references: [projects.id]
	}),
	service: one(services, {
		fields: [project_items.service_id],
		references: [services.id]
	}),
}));

export const proof_of_deliveryRelations = relations(proof_of_delivery, ({one}) => ({
	delivery_confirmation: one(delivery_confirmations, {
		fields: [proof_of_delivery.confirmation_id],
		references: [delivery_confirmations.id]
	}),
	delivery: one(deliveries, {
		fields: [proof_of_delivery.delivery_id],
		references: [deliveries.id]
	}),
	document: one(documents, {
		fields: [proof_of_delivery.document_id],
		references: [documents.id]
	}),
}));

export const purchase_order_paymentsRelations = relations(purchase_order_payments, ({one}) => ({
	currency: one(currencies, {
		fields: [purchase_order_payments.currency_id],
		references: [currencies.id]
	}),
	payment_method: one(payment_methods, {
		fields: [purchase_order_payments.payment_method_id],
		references: [payment_methods.id]
	}),
	purchase_order: one(purchase_orders, {
		fields: [purchase_order_payments.purchase_order_id],
		references: [purchase_orders.id]
	}),
}));

export const purchase_order_status_historyRelations = relations(purchase_order_status_history, ({one}) => ({
	purchase_order: one(purchase_orders, {
		fields: [purchase_order_status_history.purchase_order_id],
		references: [purchase_orders.id]
	}),
	user: one(users, {
		fields: [purchase_order_status_history.changed_by],
		references: [users.id]
	}),
}));

export const purchase_receiptsRelations = relations(purchase_receipts, ({one}) => ({
	organization: one(organizations, {
		fields: [purchase_receipts.organization_id],
		references: [organizations.id]
	}),
	purchase_order: one(purchase_orders, {
		fields: [purchase_receipts.purchase_order_id],
		references: [purchase_orders.id]
	}),
	shipment: one(shipments, {
		fields: [purchase_receipts.shipment_id],
		references: [shipments.id]
	}),
	user: one(users, {
		fields: [purchase_receipts.received_by],
		references: [users.id]
	}),
	warehouse: one(warehouses, {
		fields: [purchase_receipts.warehouse_id],
		references: [warehouses.id]
	}),
}));

export const quotation_approvalsRelations = relations(quotation_approvals, ({one}) => ({
	user: one(users, {
		fields: [quotation_approvals.approver_id],
		references: [users.id]
	}),
	quotation: one(quotations, {
		fields: [quotation_approvals.quotation_id],
		references: [quotations.id]
	}),
}));

export const quotationsRelations = relations(quotations, ({one, many}) => ({
	quotation_approvals: many(quotation_approvals),
	quotation_items: many(quotation_items),
	quotation_terms: many(quotation_terms),
	quotation_versions: many(quotation_versions),
	currency: one(currencies, {
		fields: [quotations.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [quotations.customer_id],
		references: [customers.id]
	}),
	opportunity: one(opportunities, {
		fields: [quotations.opportunity_id],
		references: [opportunities.id]
	}),
	organization: one(organizations, {
		fields: [quotations.organization_id],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [quotations.owner_user_id],
		references: [users.id]
	}),
	quotation_status: one(quotation_statuses, {
		fields: [quotations.status_id],
		references: [quotation_statuses.id]
	}),
	sales_orders: many(sales_orders),
}));

export const quotation_itemsRelations = relations(quotation_items, ({one}) => ({
	product: one(products, {
		fields: [quotation_items.product_id],
		references: [products.id]
	}),
	quotation: one(quotations, {
		fields: [quotation_items.quotation_id],
		references: [quotations.id]
	}),
	service: one(services, {
		fields: [quotation_items.service_id],
		references: [services.id]
	}),
	tax: one(taxes, {
		fields: [quotation_items.tax_id],
		references: [taxes.id]
	}),
	unit: one(units, {
		fields: [quotation_items.unit_id],
		references: [units.id]
	}),
}));

export const quotation_termsRelations = relations(quotation_terms, ({one}) => ({
	payment_term: one(payment_terms, {
		fields: [quotation_terms.payment_term_id],
		references: [payment_terms.id]
	}),
	quotation: one(quotations, {
		fields: [quotation_terms.quotation_id],
		references: [quotations.id]
	}),
	shipping_term: one(shipping_terms, {
		fields: [quotation_terms.shipping_term_id],
		references: [shipping_terms.id]
	}),
}));

export const quotation_versionsRelations = relations(quotation_versions, ({one}) => ({
	quotation: one(quotations, {
		fields: [quotation_versions.quotation_id],
		references: [quotations.id]
	}),
	user: one(users, {
		fields: [quotation_versions.changed_by],
		references: [users.id]
	}),
}));

export const quotation_statusesRelations = relations(quotation_statuses, ({many}) => ({
	quotations: many(quotations),
}));

export const refundsRelations = relations(refunds, ({one}) => ({
	currency: one(currencies, {
		fields: [refunds.currency_id],
		references: [currencies.id]
	}),
	customer: one(customers, {
		fields: [refunds.customer_id],
		references: [customers.id]
	}),
	invoice: one(invoices, {
		fields: [refunds.invoice_id],
		references: [invoices.id]
	}),
	organization: one(organizations, {
		fields: [refunds.organization_id],
		references: [organizations.id]
	}),
}));

export const role_permissionsRelations = relations(role_permissions, ({one}) => ({
	permission: one(permissions, {
		fields: [role_permissions.permission_id],
		references: [permissions.id]
	}),
	role: one(roles, {
		fields: [role_permissions.role_id],
		references: [roles.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	role_permissions: many(role_permissions),
}));

export const rolesRelations = relations(roles, ({one, many}) => ({
	role_permissions: many(role_permissions),
	organization: one(organizations, {
		fields: [roles.organization_id],
		references: [organizations.id]
	}),
	user_roles: many(user_roles),
}));

export const sales_activitiesRelations = relations(sales_activities, ({one}) => ({
	organization: one(organizations, {
		fields: [sales_activities.organization_id],
		references: [organizations.id]
	}),
	activity_type: one(activity_types, {
		fields: [sales_activities.activity_type_id],
		references: [activity_types.id]
	}),
	user: one(users, {
		fields: [sales_activities.user_id],
		references: [users.id]
	}),
}));

export const sales_order_documentsRelations = relations(sales_order_documents, ({one}) => ({
	document: one(documents, {
		fields: [sales_order_documents.document_id],
		references: [documents.id]
	}),
	sales_order: one(sales_orders, {
		fields: [sales_order_documents.sales_order_id],
		references: [sales_orders.id]
	}),
}));

export const sales_order_paymentsRelations = relations(sales_order_payments, ({one}) => ({
	currency: one(currencies, {
		fields: [sales_order_payments.currency_id],
		references: [currencies.id]
	}),
	payment: one(payments, {
		fields: [sales_order_payments.payment_id],
		references: [payments.id]
	}),
	sales_order: one(sales_orders, {
		fields: [sales_order_payments.sales_order_id],
		references: [sales_orders.id]
	}),
}));

export const sales_order_status_historyRelations = relations(sales_order_status_history, ({one}) => ({
	sales_order: one(sales_orders, {
		fields: [sales_order_status_history.sales_order_id],
		references: [sales_orders.id]
	}),
	user: one(users, {
		fields: [sales_order_status_history.changed_by],
		references: [users.id]
	}),
}));

export const service_categoriesRelations = relations(service_categories, ({one, many}) => ({
	organization: one(organizations, {
		fields: [service_categories.organization_id],
		references: [organizations.id]
	}),
	services: many(services),
}));

export const service_requestsRelations = relations(service_requests, ({one}) => ({
	customer: one(customers, {
		fields: [service_requests.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [service_requests.organization_id],
		references: [organizations.id]
	}),
	support_ticket: one(support_tickets, {
		fields: [service_requests.converted_ticket_id],
		references: [support_tickets.id]
	}),
}));

export const shipment_itemsRelations = relations(shipment_items, ({one}) => ({
	purchase_order_item: one(purchase_order_items, {
		fields: [shipment_items.purchase_order_item_id],
		references: [purchase_order_items.id]
	}),
	product: one(products, {
		fields: [shipment_items.product_id],
		references: [products.id]
	}),
	shipment: one(shipments, {
		fields: [shipment_items.shipment_id],
		references: [shipments.id]
	}),
}));

export const shipment_trackingRelations = relations(shipment_tracking, ({one}) => ({
	shipment: one(shipments, {
		fields: [shipment_tracking.shipment_id],
		references: [shipments.id]
	}),
}));

export const shipping_methodsRelations = relations(shipping_methods, ({many}) => ({
	shipments: many(shipments),
	shipping_costs: many(shipping_costs),
}));

export const shipping_costsRelations = relations(shipping_costs, ({one}) => ({
	carrier: one(carriers, {
		fields: [shipping_costs.carrier_id],
		references: [carriers.id]
	}),
	currency: one(currencies, {
		fields: [shipping_costs.currency_id],
		references: [currencies.id]
	}),
	landed_cost: one(landed_costs, {
		fields: [shipping_costs.landed_cost_id],
		references: [landed_costs.id]
	}),
	shipping_method: one(shipping_methods, {
		fields: [shipping_costs.shipping_method_id],
		references: [shipping_methods.id]
	}),
	shipment: one(shipments, {
		fields: [shipping_costs.shipment_id],
		references: [shipments.id]
	}),
}));

export const stock_adjustmentsRelations = relations(stock_adjustments, ({one}) => ({
	organization: one(organizations, {
		fields: [stock_adjustments.organization_id],
		references: [organizations.id]
	}),
	product: one(products, {
		fields: [stock_adjustments.product_id],
		references: [products.id]
	}),
	user: one(users, {
		fields: [stock_adjustments.adjusted_by],
		references: [users.id]
	}),
	warehouse: one(warehouses, {
		fields: [stock_adjustments.warehouse_id],
		references: [warehouses.id]
	}),
}));

export const stock_reservationsRelations = relations(stock_reservations, ({one}) => ({
	inventory: one(inventory, {
		fields: [stock_reservations.inventory_id],
		references: [inventory.id]
	}),
	sales_order: one(sales_orders, {
		fields: [stock_reservations.sales_order_id],
		references: [sales_orders.id]
	}),
	sales_order_item: one(sales_order_items, {
		fields: [stock_reservations.sales_order_item_id],
		references: [sales_order_items.id]
	}),
}));

export const stock_transfersRelations = relations(stock_transfers, ({one}) => ({
	user_approved_by: one(users, {
		fields: [stock_transfers.approved_by],
		references: [users.id],
		relationName: "stock_transfers_approved_by_users_id"
	}),
	warehouse_from_warehouse_id: one(warehouses, {
		fields: [stock_transfers.from_warehouse_id],
		references: [warehouses.id],
		relationName: "stock_transfers_from_warehouse_id_warehouses_id"
	}),
	organization: one(organizations, {
		fields: [stock_transfers.organization_id],
		references: [organizations.id]
	}),
	user_requested_by: one(users, {
		fields: [stock_transfers.requested_by],
		references: [users.id],
		relationName: "stock_transfers_requested_by_users_id"
	}),
	warehouse_to_warehouse_id: one(warehouses, {
		fields: [stock_transfers.to_warehouse_id],
		references: [warehouses.id],
		relationName: "stock_transfers_to_warehouse_id_warehouses_id"
	}),
}));

export const supplier_addressesRelations = relations(supplier_addresses, ({one}) => ({
	city: one(cities, {
		fields: [supplier_addresses.city_id],
		references: [cities.id]
	}),
	country: one(countries, {
		fields: [supplier_addresses.country_id],
		references: [countries.id]
	}),
	supplier: one(suppliers, {
		fields: [supplier_addresses.supplier_id],
		references: [suppliers.id]
	}),
}));

export const supplier_categoriesRelations = relations(supplier_categories, ({one, many}) => ({
	organization: one(organizations, {
		fields: [supplier_categories.organization_id],
		references: [organizations.id]
	}),
	suppliers: many(suppliers),
}));

export const supplier_contactsRelations = relations(supplier_contacts, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplier_contacts.supplier_id],
		references: [suppliers.id]
	}),
}));

export const supplier_documentsRelations = relations(supplier_documents, ({one}) => ({
	document: one(documents, {
		fields: [supplier_documents.document_id],
		references: [documents.id]
	}),
	supplier: one(suppliers, {
		fields: [supplier_documents.supplier_id],
		references: [suppliers.id]
	}),
}));

export const supplier_evaluationsRelations = relations(supplier_evaluations, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplier_evaluations.supplier_id],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [supplier_evaluations.evaluated_by],
		references: [users.id]
	}),
}));

export const supplier_historiesRelations = relations(supplier_histories, ({one}) => ({
	currency: one(currencies, {
		fields: [supplier_histories.currency_id],
		references: [currencies.id]
	}),
	supplier: one(suppliers, {
		fields: [supplier_histories.supplier_id],
		references: [suppliers.id]
	}),
}));

export const supplier_payment_termsRelations = relations(supplier_payment_terms, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplier_payment_terms.supplier_id],
		references: [suppliers.id]
	}),
	payment_term: one(payment_terms, {
		fields: [supplier_payment_terms.payment_term_id],
		references: [payment_terms.id]
	}),
}));

export const supplier_productsRelations = relations(supplier_products, ({one}) => ({
	currency: one(currencies, {
		fields: [supplier_products.currency_id],
		references: [currencies.id]
	}),
	product: one(products, {
		fields: [supplier_products.product_id],
		references: [products.id]
	}),
	supplier: one(suppliers, {
		fields: [supplier_products.supplier_id],
		references: [suppliers.id]
	}),
}));

export const supplier_quote_itemsRelations = relations(supplier_quote_items, ({one}) => ({
	product: one(products, {
		fields: [supplier_quote_items.product_id],
		references: [products.id]
	}),
	supplier_quote: one(supplier_quotes, {
		fields: [supplier_quote_items.supplier_quote_id],
		references: [supplier_quotes.id]
	}),
}));

export const supplier_quotesRelations = relations(supplier_quotes, ({one, many}) => ({
	supplier_quote_items: many(supplier_quote_items),
	currency: one(currencies, {
		fields: [supplier_quotes.currency_id],
		references: [currencies.id]
	}),
	organization: one(organizations, {
		fields: [supplier_quotes.organization_id],
		references: [organizations.id]
	}),
	supplier: one(suppliers, {
		fields: [supplier_quotes.supplier_id],
		references: [suppliers.id]
	}),
}));

export const system_settingsRelations = relations(system_settings, ({one}) => ({
	organization: one(organizations, {
		fields: [system_settings.organization_id],
		references: [organizations.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	user_assignee_id: one(users, {
		fields: [tasks.assignee_id],
		references: [users.id],
		relationName: "tasks_assignee_id_users_id"
	}),
	user_created_by: one(users, {
		fields: [tasks.created_by],
		references: [users.id],
		relationName: "tasks_created_by_users_id"
	}),
	organization: one(organizations, {
		fields: [tasks.organization_id],
		references: [organizations.id]
	}),
}));

export const user_rolesRelations = relations(user_roles, ({one}) => ({
	user_assigned_by: one(users, {
		fields: [user_roles.assigned_by],
		references: [users.id],
		relationName: "user_roles_assigned_by_users_id"
	}),
	branch: one(branches, {
		fields: [user_roles.branch_id],
		references: [branches.id]
	}),
	role: one(roles, {
		fields: [user_roles.role_id],
		references: [roles.id]
	}),
	user_user_id: one(users, {
		fields: [user_roles.user_id],
		references: [users.id],
		relationName: "user_roles_user_id_users_id"
	}),
}));

export const user_sessionsRelations = relations(user_sessions, ({one}) => ({
	user: one(users, {
		fields: [user_sessions.user_id],
		references: [users.id]
	}),
}));

export const warrantiesRelations = relations(warranties, ({one, many}) => ({
	customer: one(customers, {
		fields: [warranties.customer_id],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [warranties.organization_id],
		references: [organizations.id]
	}),
	product: one(products, {
		fields: [warranties.product_id],
		references: [products.id]
	}),
	serial_number: one(serial_numbers, {
		fields: [warranties.serial_number_id],
		references: [serial_numbers.id]
	}),
	sales_order: one(sales_orders, {
		fields: [warranties.sales_order_id],
		references: [sales_orders.id]
	}),
	warranty_claims: many(warranty_claims),
}));

export const warranty_claimsRelations = relations(warranty_claims, ({one}) => ({
	support_ticket: one(support_tickets, {
		fields: [warranty_claims.ticket_id],
		references: [support_tickets.id]
	}),
	warranty: one(warranties, {
		fields: [warranty_claims.warranty_id],
		references: [warranties.id]
	}),
}));