import { mysqlTable, AnyMySqlColumn, foreignKey, primaryKey, char, decimal, date, mysqlEnum, datetime, varchar, index, text, unique, json, int, bigint, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accounts_payable = mysqlTable("accounts_payable", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id),
	purchase_order_id: char({ length: 36 }).references(() => purchase_orders.id),
	original_amount: decimal({ precision: 18, scale: 4 }).notNull(),
	balance_due: decimal({ precision: 18, scale: 4 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	due_date: date({ mode: 'string' }),
	status: mysqlEnum(['open','partial','paid','cancelled']).default('open').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "accounts_payable_id"}),
]);

export const accounts_receivable = mysqlTable("accounts_receivable", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	invoice_id: char({ length: 36 }).notNull().references(() => invoices.id),
	original_amount: decimal({ precision: 18, scale: 4 }).notNull(),
	balance_due: decimal({ precision: 18, scale: 4 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	due_date: date({ mode: 'string' }),
	aging_bucket: varchar({ length: 32 }),
	status: mysqlEnum(['open','partial','closed','written_off']).default('open').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "accounts_receivable_id"}),
]);

export const activities = mysqlTable("activities", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	activity_type_id: char({ length: 36 }).references(() => activity_types.id),
	subject: varchar({ length: 255 }).notNull(),
	description: text(),
	entity_type: varchar({ length: 64 }),
	entity_id: char({ length: 36 }),
	owner_user_id: char({ length: 36 }).references(() => users.id),
	due_at: datetime({ mode: 'string', fsp: 3 }),
	completed_at: datetime({ mode: 'string', fsp: 3 }),
	status: mysqlEnum(['planned','done','cancelled']).default('planned').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_activities_org").on(table.organization_id, table.due_at),
	index("idx_activities_entity").on(table.entity_type, table.entity_id),
	primaryKey({ columns: [table.id], name: "activities_id"}),
]);

export const activity_types = mysqlTable("activity_types", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: varchar({ length: 64 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "activity_types_id"}),
	unique("uq_activity_types_code").on(table.code),
]);

export const appointments = mysqlTable("appointments", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	start_at: datetime({ mode: 'string', fsp: 3 }).notNull(),
	end_at: datetime({ mode: 'string', fsp: 3 }).notNull(),
	location: varchar({ length: 255 }),
	meeting_type: mysqlEnum(['in_person','online','phone']).default('in_person').notNull(),
	organizer_id: char({ length: 36 }).references(() => users.id),
	customer_id: char({ length: 36 }).references(() => customers.id),
	status: mysqlEnum(['scheduled','completed','cancelled','no_show']).default('scheduled').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_appointments_org_start").on(table.organization_id, table.start_at),
	primaryKey({ columns: [table.id], name: "appointments_id"}),
]);

export const audit_logs = mysqlTable("audit_logs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).references(() => organizations.id),
	user_id: char({ length: 36 }).references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	action: varchar({ length: 64 }).notNull(),
	entity_type: varchar({ length: 64 }).notNull(),
	entity_id: char({ length: 36 }),
	old_values: json(),
	new_values: json(),
	ip_address: varchar({ length: 64 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_audit_logs_org_created").on(table.organization_id, table.created_at),
	index("idx_audit_logs_entity").on(table.entity_type, table.entity_id),
	primaryKey({ columns: [table.id], name: "audit_logs_id"}),
]);

export const branches = mysqlTable("branches", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['office','warehouse','mixed']).default('office').notNull(),
	address: text(),
	city_id: char({ length: 36 }).references(() => cities.id),
	phone: varchar({ length: 64 }),
	manager_user_id: char({ length: 36 }).references((): AnyMySqlColumn => users.id),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_branches_organization").on(table.organization_id),
	primaryKey({ columns: [table.id], name: "branches_id"}),
	unique("uq_branches_org_code").on(table.organization_id, table.code),
]);

export const carriers = mysqlTable("carriers", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 64 }),
	contact_email: varchar({ length: 255 }),
	contact_phone: varchar({ length: 64 }),
	tracking_url_template: varchar({ length: 512 }),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_carriers_org").on(table.organization_id),
	primaryKey({ columns: [table.id], name: "carriers_id"}),
]);

export const cities = mysqlTable("cities", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	country_id: char({ length: 36 }).notNull().references(() => countries.id),
	name: varchar({ length: 255 }).notNull(),
	region: varchar({ length: 255 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "cities_id"}),
	unique("uq_cities_country_name_region").on(table.country_id, table.name, table.region),
]);

export const comments = mysqlTable("comments", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	entity_type: varchar({ length: 64 }).notNull(),
	entity_id: char({ length: 36 }).notNull(),
	author_id: char({ length: 36 }).references(() => users.id),
	body: text().notNull(),
	parent_comment_id: char({ length: 36 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_comments_entity").on(table.entity_type, table.entity_id, table.created_at),
	foreignKey({
			columns: [table.parent_comment_id],
			foreignColumns: [table.id],
			name: "fk_comments_parent"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.id], name: "comments_id"}),
]);

export const commissioning_tests = mysqlTable("commissioning_tests", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	installation_id: char({ length: 36 }).notNull().references(() => installations.id, { onDelete: "cascade" } ),
	test_name: varchar({ length: 255 }).notNull(),
	checklist: json(),
	result: mysqlEnum(['pass','fail','partial']),
	performed_by: char({ length: 36 }).references(() => technicians.id),
	performed_at: datetime({ mode: 'string', fsp: 3 }),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "commissioning_tests_id"}),
]);

export const contract_items = mysqlTable("contract_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	contract_id: char({ length: 36 }).notNull().references(() => contracts.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	service_id: char({ length: 36 }).references(() => services.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }),
	unit_price: decimal({ precision: 18, scale: 4 }),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "contract_items_id"}),
]);

export const contracts = mysqlTable("contracts", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	contract_number: varchar({ length: 64 }).notNull(),
	customer_id: char({ length: 36 }).references(() => customers.id),
	supplier_id: char({ length: 36 }).references(() => suppliers.id),
	title: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	start_date: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	end_date: date({ mode: 'string' }),
	status: mysqlEnum(['draft','active','expired','terminated']).default('draft').notNull(),
	document_id: char({ length: 36 }).references(() => documents.id),
	total_value: decimal({ precision: 18, scale: 4 }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "contracts_id"}),
	unique("uq_contracts_org_number").on(table.organization_id, table.contract_number),
]);

export const countries = mysqlTable("countries", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: char({ length: 2 }).notNull(),
	code3: char({ length: 3 }),
	name: varchar({ length: 255 }).notNull(),
	phone_code: varchar({ length: 16 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "countries_id"}),
	unique("uq_countries_code").on(table.code),
]);

export const currencies = mysqlTable("currencies", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: char({ length: 3 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	symbol: varchar({ length: 16 }).notNull(),
	decimal_places: int().default(2).notNull(),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "currencies_id"}),
	unique("uq_currencies_code").on(table.code),
]);

export const customer_addresses = mysqlTable("customer_addresses", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['billing','shipping','both']).default('both').notNull(),
	label: varchar({ length: 128 }),
	line1: varchar({ length: 255 }).notNull(),
	line2: varchar({ length: 255 }),
	city_id: char({ length: 36 }).references(() => cities.id),
	country_id: char({ length: 36 }).references(() => countries.id),
	postal_code: varchar({ length: 32 }),
	is_default: tinyint().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_customer_addresses_customer").on(table.customer_id),
	primaryKey({ columns: [table.id], name: "customer_addresses_id"}),
]);

export const customer_categories = mysqlTable("customer_categories", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customer_categories_id"}),
	unique("uq_customer_categories_org_code").on(table.organization_id, table.code),
]);

export const customer_contacts = mysqlTable("customer_contacts", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" } ),
	first_name: varchar({ length: 128 }).notNull(),
	last_name: varchar({ length: 128 }).notNull(),
	title: varchar({ length: 128 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 64 }),
	is_primary: tinyint().default(0).notNull(),
	is_decision_maker: tinyint().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_customer_contacts_customer").on(table.customer_id),
	primaryKey({ columns: [table.id], name: "customer_contacts_id"}),
]);

export const customer_notes = mysqlTable("customer_notes", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" } ),
	author_id: char({ length: 36 }).references(() => users.id),
	note: text().notNull(),
	is_pinned: tinyint().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_customer_notes_customer").on(table.customer_id),
	primaryKey({ columns: [table.id], name: "customer_notes_id"}),
]);

export const customers = mysqlTable("customers", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	category_id: char({ length: 36 }).references(() => customer_categories.id),
	code: varchar({ length: 64 }).notNull(),
	type: mysqlEnum(['individual','organization']).default('organization').notNull(),
	name: varchar({ length: 255 }).notNull(),
	legal_name: varchar({ length: 255 }),
	tax_id: varchar({ length: 64 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 64 }),
	website: varchar({ length: 255 }),
	owner_user_id: char({ length: 36 }).references(() => users.id),
	status: mysqlEnum(['active','inactive','blocked']).default('active').notNull(),
	converted_from_lead_id: char({ length: 36 }).references((): AnyMySqlColumn => leads.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_customers_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "customers_id"}),
	unique("uq_customers_org_code").on(table.organization_id, table.code),
]);

export const customs_costs = mysqlTable("customs_costs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	landed_cost_id: char({ length: 36 }).notNull().references(() => landed_costs.id, { onDelete: "cascade" } ),
	customs_declaration_id: char({ length: 36 }).references(() => customs_declarations.id),
	duties_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	vat_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	other_fees: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customs_costs_id"}),
]);

export const customs_declarations = mysqlTable("customs_declarations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	shipment_id: char({ length: 36 }).references(() => shipments.id),
	declaration_number: varchar({ length: 128 }),
	regime: varchar({ length: 64 }),
	declared_value: decimal({ precision: 18, scale: 4 }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	status: mysqlEnum(['draft','submitted','cleared','rejected']).default('draft').notNull(),
	cleared_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customs_declarations_id"}),
]);

export const customs_documents = mysqlTable("customs_documents", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	customs_declaration_id: char({ length: 36 }).notNull().references(() => customs_declarations.id, { onDelete: "cascade" } ),
	document_id: char({ length: 36 }).notNull().references(() => documents.id),
	doc_kind: varchar({ length: 64 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customs_documents_id"}),
]);

export const deliveries = mysqlTable("deliveries", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	delivery_number: varchar({ length: 64 }).notNull(),
	sales_order_id: char({ length: 36 }).references(() => sales_orders.id),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	warehouse_id: char({ length: 36 }).references(() => warehouses.id),
	delivery_address_id: char({ length: 36 }).references(() => delivery_addresses.id),
	scheduled_at: datetime({ mode: 'string', fsp: 3 }),
	delivered_at: datetime({ mode: 'string', fsp: 3 }),
	driver_user_id: char({ length: 36 }).references(() => users.id),
	status: mysqlEnum(['planned','in_transit','delivered','failed','cancelled']).default('planned').notNull(),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_deliveries_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "deliveries_id"}),
	unique("uq_deliveries_org_number").on(table.organization_id, table.delivery_number),
]);

export const delivery_addresses = mysqlTable("delivery_addresses", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	label: varchar({ length: 128 }),
	line1: varchar({ length: 255 }).notNull(),
	line2: varchar({ length: 255 }),
	city_id: char({ length: 36 }).references(() => cities.id),
	country_id: char({ length: 36 }).references(() => countries.id),
	contact_name: varchar({ length: 255 }),
	contact_phone: varchar({ length: 64 }),
	customer_id: char({ length: 36 }).references(() => customers.id),
	warehouse_id: char({ length: 36 }).references(() => warehouses.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "delivery_addresses_id"}),
]);

export const delivery_confirmations = mysqlTable("delivery_confirmations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	delivery_id: char({ length: 36 }).notNull().references(() => deliveries.id, { onDelete: "cascade" } ),
	confirmed_by_name: varchar({ length: 255 }),
	confirmed_at: datetime({ mode: 'string', fsp: 3 }),
	status: mysqlEnum(['accepted','accepted_with_remarks','rejected']).default('accepted').notNull(),
	remarks: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "delivery_confirmations_id"}),
]);

export const delivery_items = mysqlTable("delivery_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	delivery_id: char({ length: 36 }).notNull().references(() => deliveries.id, { onDelete: "cascade" } ),
	sales_order_item_id: char({ length: 36 }).references(() => sales_order_items.id),
	product_id: char({ length: 36 }).references(() => products.id),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	serial_number_ids: json(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "delivery_items_id"}),
]);

export const delivery_tracking = mysqlTable("delivery_tracking", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	delivery_id: char({ length: 36 }).notNull().references(() => deliveries.id, { onDelete: "cascade" } ),
	status: varchar({ length: 64 }).notNull(),
	latitude: decimal({ precision: 10, scale: 7 }),
	longitude: decimal({ precision: 10, scale: 7 }),
	location_label: varchar({ length: 255 }),
	recorded_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	notes: text(),
},
(table) => [
	index("idx_delivery_tracking_delivery").on(table.delivery_id, table.recorded_at),
	primaryKey({ columns: [table.id], name: "delivery_tracking_id"}),
]);

export const document_links = mysqlTable("document_links", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	document_id: char({ length: 36 }).notNull().references(() => documents.id, { onDelete: "cascade" } ),
	entity_type: varchar({ length: 64 }).notNull(),
	entity_id: char({ length: 36 }).notNull(),
	role: varchar({ length: 64 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_document_links_entity").on(table.entity_type, table.entity_id),
	primaryKey({ columns: [table.id], name: "document_links_id"}),
	unique("uq_document_links").on(table.document_id, table.entity_type, table.entity_id),
]);

export const document_types = mysqlTable("document_types", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	allowed_mime_types: json(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "document_types_id"}),
	unique("uq_document_types_org_code").on(table.organization_id, table.code),
]);

export const document_versions = mysqlTable("document_versions", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	document_id: char({ length: 36 }).notNull().references(() => documents.id, { onDelete: "cascade" } ),
	version_number: int().notNull(),
	file_url: varchar({ length: 512 }).notNull(),
	change_notes: text(),
	created_by: char({ length: 36 }).references(() => users.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "document_versions_id"}),
	unique("uq_document_versions").on(table.document_id, table.version_number),
]);

export const documents = mysqlTable("documents", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	document_type_id: char({ length: 36 }).references(() => document_types.id),
	title: varchar({ length: 255 }).notNull(),
	file_name: varchar({ length: 255 }).notNull(),
	file_url: varchar({ length: 512 }).notNull(),
	mime_type: varchar({ length: 128 }),
	file_size: bigint({ mode: "number" }),
	uploaded_by: char({ length: 36 }).references(() => users.id),
	checksum: varchar({ length: 128 }),
	status: mysqlEnum(['active','archived','deleted']).default('active').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_documents_org").on(table.organization_id),
	primaryKey({ columns: [table.id], name: "documents_id"}),
]);

export const exchange_rates = mysqlTable("exchange_rates", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	from_currency_id: char({ length: 36 }).notNull().references(() => currencies.id),
	to_currency_id: char({ length: 36 }).notNull().references(() => currencies.id),
	rate: decimal({ precision: 18, scale: 8 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	rate_date: date({ mode: 'string' }).notNull(),
	source: varchar({ length: 64 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "exchange_rates_id"}),
	unique("uq_exchange_rates_pair_date").on(table.from_currency_id, table.to_currency_id, table.rate_date),
]);

export const expense_categories = mysqlTable("expense_categories", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	parent_id: char({ length: 36 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	foreignKey({
			columns: [table.parent_id],
			foreignColumns: [table.id],
			name: "fk_expense_categories_parent"
		}),
	primaryKey({ columns: [table.id], name: "expense_categories_id"}),
	unique("uq_expense_categories_org_code").on(table.organization_id, table.code),
]);

export const expenses = mysqlTable("expenses", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	category_id: char({ length: 36 }).references(() => expense_categories.id),
	title: varchar({ length: 255 }).notNull(),
	amount: decimal({ precision: 18, scale: 4 }).notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expense_date: date({ mode: 'string' }).notNull(),
	supplier_id: char({ length: 36 }).references(() => suppliers.id, { onDelete: "set null", onUpdate: "cascade" } ),
	landed_cost_id: char({ length: 36 }).references(() => landed_costs.id),
	paid_by: char({ length: 36 }).references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	status: mysqlEnum(['draft','approved','paid','rejected']).default('draft').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "expenses_id"}),
]);

export const handling_costs = mysqlTable("handling_costs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	landed_cost_id: char({ length: 36 }).notNull().references(() => landed_costs.id, { onDelete: "cascade" } ),
	location: varchar({ length: 255 }),
	amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "handling_costs_id"}),
]);

export const import_documents = mysqlTable("import_documents", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	shipment_id: char({ length: 36 }).notNull().references(() => shipments.id, { onDelete: "cascade" } ),
	document_id: char({ length: 36 }).notNull().references(() => documents.id),
	doc_kind: varchar({ length: 64 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "import_documents_id"}),
]);

export const inspection_costs = mysqlTable("inspection_costs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	landed_cost_id: char({ length: 36 }).notNull().references(() => landed_costs.id, { onDelete: "cascade" } ),
	inspection_place: mysqlEnum(['origin','destination','transit']).default('origin').notNull(),
	inspector: varchar({ length: 255 }),
	amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	inspected_at: date({ mode: 'string' }),
	report_document_id: char({ length: 36 }).references(() => documents.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "inspection_costs_id"}),
]);

export const installation_items = mysqlTable("installation_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	installation_id: char({ length: 36 }).notNull().references(() => installations.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	serial_number_id: char({ length: 36 }).references(() => serial_numbers.id),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	installed_at: datetime({ mode: 'string', fsp: 3 }),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "installation_items_id"}),
]);

export const installation_reports = mysqlTable("installation_reports", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	installation_id: char({ length: 36 }).notNull().references(() => installations.id, { onDelete: "cascade" } ),
	author_user_id: char({ length: 36 }).references(() => users.id),
	summary: text(),
	findings: text(),
	document_ids: json(),
	reported_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "installation_reports_id"}),
]);

export const installation_tasks = mysqlTable("installation_tasks", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	installation_id: char({ length: 36 }).notNull().references(() => installations.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	technician_id: char({ length: 36 }).references(() => technicians.id),
	status: mysqlEnum(['todo','in_progress','done','blocked']).default('todo').notNull(),
	due_at: datetime({ mode: 'string', fsp: 3 }),
	completed_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "installation_tasks_id"}),
]);

export const installations = mysqlTable("installations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	project_id: char({ length: 36 }).notNull().references(() => projects.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	site_location: text(),
	scheduled_at: datetime({ mode: 'string', fsp: 3 }),
	completed_at: datetime({ mode: 'string', fsp: 3 }),
	status: mysqlEnum(['planned','ongoing','completed','failed']).default('planned').notNull(),
	lead_technician_id: char({ length: 36 }).references(() => technicians.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "installations_id"}),
]);

export const inventory = mysqlTable("inventory", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	warehouse_id: char({ length: 36 }).notNull().references(() => warehouses.id),
	location_id: char({ length: 36 }).references(() => warehouse_locations.id),
	product_id: char({ length: 36 }).notNull().references(() => products.id),
	batch_id: char({ length: 36 }).references(() => inventory_batches.id),
	quantity_on_hand: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	quantity_reserved: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	quantity_available: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_inventory_org_product").on(table.organization_id, table.product_id),
	primaryKey({ columns: [table.id], name: "inventory_id"}),
	unique("uq_inventory_stock").on(table.warehouse_id, table.location_id, table.product_id, table.batch_id),
]);

export const inventory_batches = mysqlTable("inventory_batches", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	product_id: char({ length: 36 }).notNull().references(() => products.id),
	batch_number: varchar({ length: 128 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	manufactured_at: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expires_at: date({ mode: 'string' }),
	supplier_id: char({ length: 36 }).references(() => suppliers.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "inventory_batches_id"}),
	unique("uq_inventory_batches").on(table.organization_id, table.product_id, table.batch_number),
]);

export const inventory_movements = mysqlTable("inventory_movements", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	product_id: char({ length: 36 }).notNull().references(() => products.id),
	warehouse_id: char({ length: 36 }).notNull().references(() => warehouses.id),
	location_id: char({ length: 36 }).references(() => warehouse_locations.id),
	movement_type: mysqlEnum(['in','out','transfer','adjustment','reserve','unreserve']).notNull(),
	quantity: decimal({ precision: 18, scale: 4 }).notNull(),
	reference_type: varchar({ length: 64 }),
	reference_id: char({ length: 36 }),
	moved_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	moved_by: char({ length: 36 }).references(() => users.id),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_inventory_movements_org").on(table.organization_id, table.moved_at),
	index("idx_inventory_movements_ref").on(table.reference_type, table.reference_id),
	primaryKey({ columns: [table.id], name: "inventory_movements_id"}),
]);

export const invoice_items = mysqlTable("invoice_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	invoice_id: char({ length: 36 }).notNull().references(() => invoices.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	service_id: char({ length: 36 }).references(() => services.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	tax_id: char({ length: 36 }).references(() => taxes.id),
	line_total: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "invoice_items_id"}),
]);

export const invoices = mysqlTable("invoices", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	invoice_number: varchar({ length: 64 }).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	sales_order_id: char({ length: 36 }).references(() => sales_orders.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	issue_date: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	due_date: date({ mode: 'string' }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	subtotal: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	tax_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	total_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	amount_paid: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	status: mysqlEnum(['draft','issued','partially_paid','paid','overdue','cancelled']).default('draft').notNull(),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_invoices_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "invoices_id"}),
	unique("uq_invoices_org_number").on(table.organization_id, table.invoice_number),
]);

export const landed_cost_items = mysqlTable("landed_cost_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	landed_cost_id: char({ length: 36 }).notNull().references(() => landed_costs.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	purchase_order_item_id: char({ length: 36 }).references(() => purchase_order_items.id),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	goods_cost: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	allocated_costs: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	unit_landed_cost: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	total_landed_cost: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "landed_cost_items_id"}),
]);

export const landed_costs = mysqlTable("landed_costs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	reference: varchar({ length: 64 }).notNull(),
	purchase_order_id: char({ length: 36 }).references(() => purchase_orders.id),
	shipment_id: char({ length: 36 }).references(() => shipments.id),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	goods_cost: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	total_additional_costs: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	total_landed_cost: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	status: mysqlEnum(['draft','calculated','posted']).default('draft').notNull(),
	calculated_at: datetime({ mode: 'string', fsp: 3 }),
	calculated_by: char({ length: 36 }).references(() => users.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "landed_costs_id"}),
	unique("uq_landed_costs_org_reference").on(table.organization_id, table.reference),
]);

export const lead_sources = mysqlTable("lead_sources", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "lead_sources_id"}),
	unique("uq_lead_sources_org_code").on(table.organization_id, table.code),
]);

export const leads = mysqlTable("leads", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	source_id: char({ length: 36 }).references(() => lead_sources.id),
	company_name: varchar({ length: 255 }),
	contact_name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 64 }),
	status: mysqlEnum(['new','contacted','qualified','converted','lost']).default('new').notNull(),
	owner_user_id: char({ length: 36 }).references(() => users.id),
	estimated_value: decimal({ precision: 18, scale: 4 }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	converted_customer_id: char({ length: 36 }).references((): AnyMySqlColumn => customers.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_leads_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "leads_id"}),
]);

export const local_transport_costs = mysqlTable("local_transport_costs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	landed_cost_id: char({ length: 36 }).notNull().references(() => landed_costs.id, { onDelete: "cascade" } ),
	from_location: varchar({ length: 255 }),
	to_location: varchar({ length: 255 }),
	amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	provider: varchar({ length: 255 }),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "local_transport_costs_id"}),
]);

export const login_logs = mysqlTable("login_logs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	user_id: char({ length: 36 }).references(() => users.id),
	email_attempted: varchar({ length: 255 }),
	success: tinyint().notNull(),
	failure_reason: varchar({ length: 255 }),
	ip_address: varchar({ length: 64 }),
	user_agent: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_login_logs_created").on(table.created_at),
	primaryKey({ columns: [table.id], name: "login_logs_id"}),
]);

export const maintenance_contract_items = mysqlTable("maintenance_contract_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	maintenance_contract_id: char({ length: 36 }).notNull().references(() => maintenance_contracts.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	serial_number_id: char({ length: 36 }).references(() => serial_numbers.id),
	coverage_level: varchar({ length: 64 }),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "maintenance_contract_items_id"}),
]);

export const maintenance_contracts = mysqlTable("maintenance_contracts", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	contract_number: varchar({ length: 64 }).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	start_date: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	end_date: date({ mode: 'string' }),
	sla_hours: int(),
	status: mysqlEnum(['draft','active','expired','cancelled']).default('draft').notNull(),
	amount: decimal({ precision: 18, scale: 4 }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "maintenance_contracts_id"}),
	unique("uq_maintenance_contracts_org_number").on(table.organization_id, table.contract_number),
]);

export const maintenance_interventions = mysqlTable("maintenance_interventions", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	ticket_id: char({ length: 36 }).references(() => support_tickets.id),
	schedule_id: char({ length: 36 }).references(() => maintenance_schedules.id),
	contract_id: char({ length: 36 }).references(() => maintenance_contracts.id),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	technician_id: char({ length: 36 }).references(() => technicians.id),
	started_at: datetime({ mode: 'string', fsp: 3 }),
	ended_at: datetime({ mode: 'string', fsp: 3 }),
	intervention_type: mysqlEnum(['preventive','corrective','inspection']).default('corrective').notNull(),
	status: mysqlEnum(['planned','done','cancelled']).default('planned').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "maintenance_interventions_id"}),
]);

export const maintenance_reports = mysqlTable("maintenance_reports", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	intervention_id: char({ length: 36 }).notNull().references(() => maintenance_interventions.id, { onDelete: "cascade" } ),
	summary: text(),
	actions_taken: text(),
	parts_used: json(),
	document_ids: json(),
	reported_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "maintenance_reports_id"}),
]);

export const maintenance_schedules = mysqlTable("maintenance_schedules", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	maintenance_contract_id: char({ length: 36 }).notNull().references(() => maintenance_contracts.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	frequency: mysqlEnum(['monthly','quarterly','yearly','custom']).default('quarterly').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	next_due_at: date({ mode: 'string' }),
	technician_id: char({ length: 36 }).references(() => technicians.id),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "maintenance_schedules_id"}),
]);

export const notifications = mysqlTable("notifications", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	user_id: char({ length: 36 }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	channel: mysqlEnum(['in_app','email','sms']).default('in_app').notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text(),
	entity_type: varchar({ length: 64 }),
	entity_id: char({ length: 36 }),
	is_read: tinyint().default(0).notNull(),
	sent_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	read_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_notifications_user_read").on(table.user_id, table.is_read),
	primaryKey({ columns: [table.id], name: "notifications_id"}),
]);

export const opportunities = mysqlTable("opportunities", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	lead_id: char({ length: 36 }).references(() => leads.id),
	name: varchar({ length: 255 }).notNull(),
	stage: mysqlEnum(['qualification','proposal','negotiation','won','lost']).default('qualification').notNull(),
	probability: int().default(0).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expected_close_date: date({ mode: 'string' }),
	amount: decimal({ precision: 18, scale: 4 }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	owner_user_id: char({ length: 36 }).references(() => users.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_opportunities_org_stage").on(table.organization_id, table.stage),
	primaryKey({ columns: [table.id], name: "opportunities_id"}),
]);

export const opportunity_items = mysqlTable("opportunity_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	opportunity_id: char({ length: 36 }).notNull().references(() => opportunities.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	service_id: char({ length: 36 }).references(() => services.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	line_total: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_opportunity_items_opportunity").on(table.opportunity_id),
	primaryKey({ columns: [table.id], name: "opportunity_items_id"}),
]);

export const organizations = mysqlTable("organizations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	name: varchar({ length: 255 }).notNull(),
	legal_name: varchar({ length: 255 }),
	tax_id: varchar({ length: 64 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 64 }),
	website: varchar({ length: 255 }),
	logo_url: varchar({ length: 512 }),
	default_currency_id: char({ length: 36 }).references(() => currencies.id),
	country_id: char({ length: 36 }).references(() => countries.id),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_organizations_name").on(table.name),
	primaryKey({ columns: [table.id], name: "organizations_id"}),
]);

export const other_procurement_costs = mysqlTable("other_procurement_costs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	landed_cost_id: char({ length: 36 }).notNull().references(() => landed_costs.id, { onDelete: "cascade" } ),
	cost_type: varchar({ length: 64 }).notNull(),
	amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "other_procurement_costs_id"}),
]);

export const payment_methods = mysqlTable("payment_methods", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "payment_methods_id"}),
	unique("uq_payment_methods_org_code").on(table.organization_id, table.code),
]);

export const payment_terms = mysqlTable("payment_terms", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	days_due: int().default(0).notNull(),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_payment_terms_organization").on(table.organization_id),
	primaryKey({ columns: [table.id], name: "payment_terms_id"}),
]);

export const payments = mysqlTable("payments", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	invoice_id: char({ length: 36 }).references(() => invoices.id),
	payment_method_id: char({ length: 36 }).references(() => payment_methods.id),
	amount: decimal({ precision: 18, scale: 4 }).notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	paid_at: datetime({ mode: 'string', fsp: 3 }).notNull(),
	reference: varchar({ length: 128 }),
	status: mysqlEnum(['pending','confirmed','failed','reversed']).default('confirmed').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_payments_org").on(table.organization_id, table.paid_at),
	primaryKey({ columns: [table.id], name: "payments_id"}),
]);

export const permissions = mysqlTable("permissions", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	module: varchar({ length: 64 }).notNull(),
	action: varchar({ length: 64 }).notNull(),
	code: varchar({ length: 128 }).notNull(),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "permissions_id"}),
	unique("uq_permissions_code").on(table.code),
]);

export const procurement_approvals = mysqlTable("procurement_approvals", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	procurement_request_id: char({ length: 36 }).notNull().references(() => procurement_requests.id, { onDelete: "cascade" } ),
	procurement_quote_id: char({ length: 36 }).references(() => procurement_quotes.id),
	approver_id: char({ length: 36 }).references(() => users.id),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	decision_at: datetime({ mode: 'string', fsp: 3 }),
	comments: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "procurement_approvals_id"}),
]);

export const procurement_comparisons = mysqlTable("procurement_comparisons", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	procurement_request_id: char({ length: 36 }).notNull().references(() => procurement_requests.id, { onDelete: "cascade" } ),
	compared_by: char({ length: 36 }).references(() => users.id),
	compared_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	criteria: json(),
	scores: json(),
	selected_quote_id: char({ length: 36 }).references(() => procurement_quotes.id),
	recommendation: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "procurement_comparisons_id"}),
]);

export const procurement_quote_items = mysqlTable("procurement_quote_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	procurement_quote_id: char({ length: 36 }).notNull().references(() => procurement_quotes.id, { onDelete: "cascade" } ),
	procurement_request_item_id: char({ length: 36 }).references(() => procurement_request_items.id),
	product_id: char({ length: 36 }).references(() => products.id),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	lead_time_days: int(),
	notes: text(),
	line_total: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "procurement_quote_items_id"}),
]);

export const procurement_quotes = mysqlTable("procurement_quotes", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	procurement_request_id: char({ length: 36 }).notNull().references(() => procurement_requests.id, { onDelete: "cascade" } ),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id),
	quote_number: varchar({ length: 64 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	quote_date: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	valid_until: date({ mode: 'string' }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	shipping_term_id: char({ length: 36 }).references(() => shipping_terms.id),
	lead_time_days: int(),
	status: mysqlEnum(['received','shortlisted','selected','rejected']).default('received').notNull(),
	total_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "procurement_quotes_id"}),
]);

export const procurement_request_items = mysqlTable("procurement_request_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	procurement_request_id: char({ length: 36 }).notNull().references(() => procurement_requests.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	unit_id: char({ length: 36 }).references(() => units.id),
	target_unit_price: decimal({ precision: 18, scale: 4 }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "procurement_request_items_id"}),
]);

export const procurement_requests = mysqlTable("procurement_requests", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	request_number: varchar({ length: 64 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	requested_by: char({ length: 36 }).references(() => users.id),
	opportunity_id: char({ length: 36 }).references(() => opportunities.id),
	sales_order_id: char({ length: 36 }).references(() => sales_orders.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	needed_by: date({ mode: 'string' }),
	status: mysqlEnum(['draft','open','quoted','compared','approved','closed','cancelled']).default('draft').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_procurement_requests_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "procurement_requests_id"}),
	unique("uq_procurement_requests_org_number").on(table.organization_id, table.request_number),
]);

export const product_brands = mysqlTable("product_brands", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	name: varchar({ length: 255 }).notNull(),
	logo_url: varchar({ length: 512 }),
	website: varchar({ length: 255 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_brands_id"}),
	unique("uq_product_brands_org_name").on(table.organization_id, table.name),
]);

export const product_categories = mysqlTable("product_categories", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	parent_id: char({ length: 36 }),
	sort_order: int().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	foreignKey({
			columns: [table.parent_id],
			foreignColumns: [table.id],
			name: "fk_product_categories_parent"
		}),
	primaryKey({ columns: [table.id], name: "product_categories_id"}),
	unique("uq_product_categories_org_code").on(table.organization_id, table.code),
]);

export const product_images = mysqlTable("product_images", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	product_id: char({ length: 36 }).notNull().references(() => products.id, { onDelete: "cascade" } ),
	url: varchar({ length: 512 }).notNull(),
	alt_text: varchar({ length: 255 }),
	is_primary: tinyint().default(0).notNull(),
	sort_order: int().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_product_images_product").on(table.product_id),
	primaryKey({ columns: [table.id], name: "product_images_id"}),
]);

export const product_models = mysqlTable("product_models", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	brand_id: char({ length: 36 }).notNull().references(() => product_brands.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	manufacturer_sku: varchar({ length: 128 }),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_product_models_brand").on(table.brand_id),
	primaryKey({ columns: [table.id], name: "product_models_id"}),
]);

export const product_services = mysqlTable("product_services", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	product_id: char({ length: 36 }).notNull().references(() => products.id, { onDelete: "cascade" } ),
	service_id: char({ length: 36 }).notNull().references(() => services.id, { onDelete: "cascade" } ),
	is_required: tinyint().default(0).notNull(),
	default_quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_services_id"}),
	unique("uq_product_services").on(table.product_id, table.service_id),
]);

export const product_specifications = mysqlTable("product_specifications", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	product_id: char({ length: 36 }).notNull().references(() => products.id, { onDelete: "cascade" } ),
	spec_key: varchar({ length: 128 }).notNull(),
	spec_value: varchar({ length: 512 }).notNull(),
	unit: varchar({ length: 32 }),
	sort_order: int().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_product_specifications_product").on(table.product_id),
	primaryKey({ columns: [table.id], name: "product_specifications_id"}),
]);

export const product_subcategories = mysqlTable("product_subcategories", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	category_id: char({ length: 36 }).notNull().references(() => product_categories.id, { onDelete: "cascade" } ),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_subcategories_id"}),
	unique("uq_product_subcategories_cat_code").on(table.category_id, table.code),
]);

export const product_units = mysqlTable("product_units", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	symbol: varchar({ length: 32 }),
	unit_id: char({ length: 36 }).references(() => units.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_units_id"}),
	unique("uq_product_units_code").on(table.code),
]);

export const products = mysqlTable("products", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	sku: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category_id: char({ length: 36 }).references(() => product_categories.id, { onDelete: "set null", onUpdate: "cascade" } ),
	subcategory_id: char({ length: 36 }).references(() => product_subcategories.id, { onDelete: "set null", onUpdate: "cascade" } ),
	brand_id: char({ length: 36 }).references(() => product_brands.id),
	model_id: char({ length: 36 }).references(() => product_models.id),
	unit_id: char({ length: 36 }).references(() => product_units.id),
	base_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	cost_price: decimal({ precision: 18, scale: 4 }),
	is_serialized: tinyint().default(0).notNull(),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_products_org_active").on(table.organization_id, table.is_active),
	primaryKey({ columns: [table.id], name: "products_id"}),
	unique("uq_products_org_sku").on(table.organization_id, table.sku),
]);

export const project_items = mysqlTable("project_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	project_id: char({ length: 36 }).notNull().references(() => projects.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	service_id: char({ length: 36 }).references(() => services.id),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "project_items_id"}),
]);

export const projects = mysqlTable("projects", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	project_number: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	sales_order_id: char({ length: 36 }).references(() => sales_orders.id),
	manager_user_id: char({ length: 36 }).references(() => users.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	start_date: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	end_date: date({ mode: 'string' }),
	status: mysqlEnum(['planned','in_progress','on_hold','completed','cancelled']).default('planned').notNull(),
	site_address: text(),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "projects_id"}),
	unique("uq_projects_org_number").on(table.organization_id, table.project_number),
]);

export const proof_of_delivery = mysqlTable("proof_of_delivery", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	delivery_id: char({ length: 36 }).notNull().references(() => deliveries.id, { onDelete: "cascade" } ),
	confirmation_id: char({ length: 36 }).references(() => delivery_confirmations.id),
	document_id: char({ length: 36 }).references(() => documents.id),
	proof_type: mysqlEnum(['signature','photo','document']).default('document').notNull(),
	captured_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "proof_of_delivery_id"}),
]);

export const purchase_order_items = mysqlTable("purchase_order_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	purchase_order_id: char({ length: 36 }).notNull().references(() => purchase_orders.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	quantity_received: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	line_total: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "purchase_order_items_id"}),
]);

export const purchase_order_payments = mysqlTable("purchase_order_payments", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	purchase_order_id: char({ length: 36 }).notNull().references(() => purchase_orders.id, { onDelete: "cascade" } ),
	amount: decimal({ precision: 18, scale: 4 }).notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	payment_method_id: char({ length: 36 }).references(() => payment_methods.id),
	paid_at: datetime({ mode: 'string', fsp: 3 }),
	reference: varchar({ length: 128 }),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "purchase_order_payments_id"}),
]);

export const purchase_order_status_history = mysqlTable("purchase_order_status_history", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	purchase_order_id: char({ length: 36 }).notNull().references(() => purchase_orders.id, { onDelete: "cascade" } ),
	from_status: varchar({ length: 64 }),
	to_status: varchar({ length: 64 }).notNull(),
	changed_by: char({ length: 36 }).references(() => users.id),
	changed_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	notes: text(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "purchase_order_status_history_id"}),
]);

export const purchase_orders = mysqlTable("purchase_orders", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	po_number: varchar({ length: 64 }).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id),
	procurement_request_id: char({ length: 36 }).references(() => procurement_requests.id),
	procurement_quote_id: char({ length: 36 }).references(() => procurement_quotes.id),
	status: mysqlEnum(['draft','sent','confirmed','partial','received','closed','cancelled']).default('draft').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	order_date: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expected_date: date({ mode: 'string' }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	shipping_term_id: char({ length: 36 }).references(() => shipping_terms.id),
	payment_term_id: char({ length: 36 }).references(() => payment_terms.id),
	subtotal: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	tax_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	total_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	buyer_user_id: char({ length: 36 }).references(() => users.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_purchase_orders_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "purchase_orders_id"}),
	unique("uq_purchase_orders_org_number").on(table.organization_id, table.po_number),
]);

export const purchase_receipts = mysqlTable("purchase_receipts", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	purchase_order_id: char({ length: 36 }).notNull().references(() => purchase_orders.id),
	receipt_number: varchar({ length: 64 }).notNull(),
	warehouse_id: char({ length: 36 }).references(() => warehouses.id),
	received_at: datetime({ mode: 'string', fsp: 3 }),
	received_by: char({ length: 36 }).references(() => users.id),
	shipment_id: char({ length: 36 }).references(() => shipments.id),
	notes: text(),
	status: mysqlEnum(['draft','confirmed']).default('draft').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "purchase_receipts_id"}),
	unique("uq_purchase_receipts_org_number").on(table.organization_id, table.receipt_number),
]);

export const quotation_approvals = mysqlTable("quotation_approvals", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	quotation_id: char({ length: 36 }).notNull().references(() => quotations.id, { onDelete: "cascade" } ),
	approver_id: char({ length: 36 }).references(() => users.id),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	decision_at: datetime({ mode: 'string', fsp: 3 }),
	comments: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quotation_approvals_id"}),
]);

export const quotation_items = mysqlTable("quotation_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	quotation_id: char({ length: 36 }).notNull().references(() => quotations.id, { onDelete: "cascade" } ),
	line_number: int().default(1).notNull(),
	product_id: char({ length: 36 }).references(() => products.id),
	service_id: char({ length: 36 }).references(() => services.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	unit_id: char({ length: 36 }).references(() => units.id),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	discount_percent: decimal({ precision: 7, scale: 4 }).default('0.0000').notNull(),
	tax_id: char({ length: 36 }).references(() => taxes.id),
	line_total: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quotation_items_id"}),
]);

export const quotation_statuses = mysqlTable("quotation_statuses", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	is_final: tinyint().default(0).notNull(),
	sort_order: int().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quotation_statuses_id"}),
	unique("uq_quotation_statuses_code").on(table.code),
]);

export const quotation_terms = mysqlTable("quotation_terms", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	quotation_id: char({ length: 36 }).notNull().references(() => quotations.id, { onDelete: "cascade" } ),
	payment_term_id: char({ length: 36 }).references(() => payment_terms.id),
	shipping_term_id: char({ length: 36 }).references(() => shipping_terms.id),
	warranty_text: text(),
	delivery_lead_time_days: int(),
	additional_terms: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quotation_terms_id"}),
	unique("uq_quotation_terms_quotation").on(table.quotation_id),
]);

export const quotation_versions = mysqlTable("quotation_versions", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	quotation_id: char({ length: 36 }).notNull().references(() => quotations.id, { onDelete: "cascade" } ),
	version_number: int().notNull(),
	snapshot: json().notNull(),
	changed_by: char({ length: 36 }).references(() => users.id),
	change_reason: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quotation_versions_id"}),
	unique("uq_quotation_versions").on(table.quotation_id, table.version_number),
]);

export const quotations = mysqlTable("quotations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	quote_number: varchar({ length: 64 }).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	opportunity_id: char({ length: 36 }).references(() => opportunities.id),
	status_id: char({ length: 36 }).references(() => quotation_statuses.id),
	version: int().default(1).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	issue_date: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	valid_until: date({ mode: 'string' }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	exchange_rate: decimal({ precision: 18, scale: 8 }),
	subtotal: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	tax_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	total_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	owner_user_id: char({ length: 36 }).references(() => users.id),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_quotations_org_status").on(table.organization_id, table.status_id),
	primaryKey({ columns: [table.id], name: "quotations_id"}),
	unique("uq_quotations_org_number").on(table.organization_id, table.quote_number),
]);

export const refunds = mysqlTable("refunds", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	invoice_id: char({ length: 36 }).notNull().references(() => invoices.id),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	amount: decimal({ precision: 18, scale: 4 }).notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	reason: text(),
	status: mysqlEnum(['draft','issued','applied']).default('draft').notNull(),
	refunded_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "refunds_id"}),
]);

export const role_permissions = mysqlTable("role_permissions", {
	role_id: char({ length: 36 }).notNull().references(() => roles.id, { onDelete: "cascade" } ),
	permission_id: char({ length: 36 }).notNull().references(() => permissions.id, { onDelete: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.role_id, table.permission_id], name: "role_permissions_role_id_permission_id"}),
]);

export const roles = mysqlTable("roles", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	is_system: tinyint().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "roles_id"}),
	unique("uq_roles_org_code").on(table.organization_id, table.code),
]);

export const sales_activities = mysqlTable("sales_activities", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	activity_type_id: char({ length: 36 }).references(() => activity_types.id),
	subject: varchar({ length: 255 }).notNull(),
	description: text(),
	related_type: varchar({ length: 64 }),
	related_id: char({ length: 36 }),
	user_id: char({ length: 36 }).references(() => users.id),
	scheduled_at: datetime({ mode: 'string', fsp: 3 }),
	completed_at: datetime({ mode: 'string', fsp: 3 }),
	outcome: varchar({ length: 255 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_sales_activities_org").on(table.organization_id, table.scheduled_at),
	index("idx_sales_activities_related").on(table.related_type, table.related_id),
	primaryKey({ columns: [table.id], name: "sales_activities_id"}),
]);

export const sales_order_documents = mysqlTable("sales_order_documents", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	sales_order_id: char({ length: 36 }).notNull().references(() => sales_orders.id, { onDelete: "cascade" } ),
	document_id: char({ length: 36 }).notNull().references(() => documents.id),
	doc_kind: varchar({ length: 64 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sales_order_documents_id"}),
]);

export const sales_order_items = mysqlTable("sales_order_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	sales_order_id: char({ length: 36 }).notNull().references(() => sales_orders.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	service_id: char({ length: 36 }).references(() => services.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	quantity_delivered: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	tax_id: char({ length: 36 }).references(() => taxes.id),
	line_total: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sales_order_items_id"}),
]);

export const sales_order_payments = mysqlTable("sales_order_payments", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	sales_order_id: char({ length: 36 }).notNull().references(() => sales_orders.id, { onDelete: "cascade" } ),
	payment_id: char({ length: 36 }).references(() => payments.id),
	payment_type: mysqlEnum(['deposit','partial','balance']).default('partial').notNull(),
	amount: decimal({ precision: 18, scale: 4 }).notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	paid_at: datetime({ mode: 'string', fsp: 3 }),
	reference: varchar({ length: 128 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sales_order_payments_id"}),
]);

export const sales_order_status_history = mysqlTable("sales_order_status_history", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	sales_order_id: char({ length: 36 }).notNull().references(() => sales_orders.id, { onDelete: "cascade" } ),
	from_status: varchar({ length: 64 }),
	to_status: varchar({ length: 64 }).notNull(),
	changed_by: char({ length: 36 }).references(() => users.id),
	changed_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	notes: text(),
},
(table) => [
	index("idx_sales_order_status_history_order").on(table.sales_order_id, table.changed_at),
	primaryKey({ columns: [table.id], name: "sales_order_status_history_id"}),
]);

export const sales_orders = mysqlTable("sales_orders", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	order_number: varchar({ length: 64 }).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	quotation_id: char({ length: 36 }).references(() => quotations.id),
	branch_id: char({ length: 36 }).references(() => branches.id),
	status: mysqlEnum(['pending','confirmed','in_progress','partially_delivered','delivered','cancelled']).default('pending').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	order_date: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	requested_delivery_date: date({ mode: 'string' }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	subtotal: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	tax_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	total_amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	billing_address_id: char({ length: 36 }).references(() => customer_addresses.id),
	shipping_address_id: char({ length: 36 }).references(() => customer_addresses.id),
	owner_user_id: char({ length: 36 }).references(() => users.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_sales_orders_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "sales_orders_id"}),
	unique("uq_sales_orders_org_number").on(table.organization_id, table.order_number),
]);

export const serial_numbers = mysqlTable("serial_numbers", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	product_id: char({ length: 36 }).notNull().references(() => products.id),
	serial_number: varchar({ length: 128 }).notNull(),
	batch_id: char({ length: 36 }).references(() => inventory_batches.id),
	warehouse_id: char({ length: 36 }).references(() => warehouses.id),
	status: mysqlEnum(['in_stock','reserved','shipped','installed','returned','scrapped']).default('in_stock').notNull(),
	purchase_order_item_id: char({ length: 36 }).references(() => purchase_order_items.id),
	sales_order_item_id: char({ length: 36 }).references(() => sales_order_items.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "serial_numbers_id"}),
	unique("uq_serial_numbers_org_serial").on(table.organization_id, table.serial_number),
]);

export const service_categories = mysqlTable("service_categories", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "service_categories_id"}),
	unique("uq_service_categories_org_code").on(table.organization_id, table.code),
]);

export const service_requests = mysqlTable("service_requests", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	request_type: varchar({ length: 64 }),
	description: text(),
	status: mysqlEnum(['new','assigned','completed','cancelled']).default('new').notNull(),
	converted_ticket_id: char({ length: 36 }).references(() => support_tickets.id),
	requested_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "service_requests_id"}),
]);

export const services = mysqlTable("services", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category_id: char({ length: 36 }).references(() => service_categories.id),
	base_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	billing_type: mysqlEnum(['fixed','hourly','per_unit']).default('fixed').notNull(),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "services_id"}),
	unique("uq_services_org_code").on(table.organization_id, table.code),
]);

export const shipment_items = mysqlTable("shipment_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	shipment_id: char({ length: 36 }).notNull().references(() => shipments.id, { onDelete: "cascade" } ),
	purchase_order_item_id: char({ length: 36 }).references(() => purchase_order_items.id),
	product_id: char({ length: 36 }).references(() => products.id),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	weight_kg: decimal({ precision: 18, scale: 4 }),
	volume_cbm: decimal({ precision: 18, scale: 4 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "shipment_items_id"}),
]);

export const shipment_tracking = mysqlTable("shipment_tracking", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	shipment_id: char({ length: 36 }).notNull().references(() => shipments.id, { onDelete: "cascade" } ),
	status: varchar({ length: 64 }).notNull(),
	location: varchar({ length: 255 }),
	event_at: datetime({ mode: 'string', fsp: 3 }).notNull(),
	description: text(),
	source: mysqlEnum(['manual','api','carrier']).default('manual').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_shipment_tracking_shipment").on(table.shipment_id, table.event_at),
	primaryKey({ columns: [table.id], name: "shipment_tracking_id"}),
]);

export const shipments = mysqlTable("shipments", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	shipment_number: varchar({ length: 64 }).notNull(),
	purchase_order_id: char({ length: 36 }).references(() => purchase_orders.id),
	carrier_id: char({ length: 36 }).references(() => carriers.id),
	shipping_method_id: char({ length: 36 }).references(() => shipping_methods.id),
	container_number: varchar({ length: 128 }),
	bl_number: varchar({ length: 128 }),
	origin_country_id: char({ length: 36 }).references(() => countries.id),
	destination_country_id: char({ length: 36 }).references(() => countries.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	etd: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eta: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	atd: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ata: date({ mode: 'string' }),
	status: mysqlEnum(['booked','in_transit','arrived','cleared','delivered','cancelled']).default('booked').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_shipments_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "shipments_id"}),
	unique("uq_shipments_org_number").on(table.organization_id, table.shipment_number),
]);

export const shipping_costs = mysqlTable("shipping_costs", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	landed_cost_id: char({ length: 36 }).notNull().references(() => landed_costs.id, { onDelete: "cascade" } ),
	shipment_id: char({ length: 36 }).references(() => shipments.id),
	shipping_method_id: char({ length: 36 }).references(() => shipping_methods.id),
	carrier_id: char({ length: 36 }).references(() => carriers.id),
	amount: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "shipping_costs_id"}),
]);

export const shipping_methods = mysqlTable("shipping_methods", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "shipping_methods_id"}),
	unique("uq_shipping_methods_code").on(table.code),
]);

export const shipping_terms = mysqlTable("shipping_terms", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	incoterm_version: varchar({ length: 32 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "shipping_terms_id"}),
	unique("uq_shipping_terms_code").on(table.code),
]);

export const stock_adjustments = mysqlTable("stock_adjustments", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	warehouse_id: char({ length: 36 }).notNull().references(() => warehouses.id),
	product_id: char({ length: 36 }).notNull().references(() => products.id),
	quantity_before: decimal({ precision: 18, scale: 4 }).notNull(),
	quantity_after: decimal({ precision: 18, scale: 4 }).notNull(),
	reason: mysqlEnum(['loss','damage','count','other']).default('other').notNull(),
	adjusted_by: char({ length: 36 }).references(() => users.id),
	adjusted_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "stock_adjustments_id"}),
]);

export const stock_reservations = mysqlTable("stock_reservations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	inventory_id: char({ length: 36 }).notNull().references(() => inventory.id),
	sales_order_id: char({ length: 36 }).references(() => sales_orders.id),
	sales_order_item_id: char({ length: 36 }).references(() => sales_order_items.id),
	quantity: decimal({ precision: 18, scale: 4 }).notNull(),
	status: mysqlEnum(['active','released','fulfilled']).default('active').notNull(),
	reserved_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	expires_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "stock_reservations_id"}),
]);

export const stock_transfers = mysqlTable("stock_transfers", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	transfer_number: varchar({ length: 64 }).notNull(),
	from_warehouse_id: char({ length: 36 }).notNull().references(() => warehouses.id),
	to_warehouse_id: char({ length: 36 }).notNull().references(() => warehouses.id),
	status: mysqlEnum(['draft','in_transit','completed','cancelled']).default('draft').notNull(),
	transferred_at: datetime({ mode: 'string', fsp: 3 }),
	requested_by: char({ length: 36 }).references(() => users.id),
	approved_by: char({ length: 36 }).references(() => users.id),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "stock_transfers_id"}),
	unique("uq_stock_transfers_org_number").on(table.organization_id, table.transfer_number),
]);

export const supplier_addresses = mysqlTable("supplier_addresses", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['hq','warehouse','factory','billing']).default('hq').notNull(),
	line1: varchar({ length: 255 }).notNull(),
	line2: varchar({ length: 255 }),
	city_id: char({ length: 36 }).references(() => cities.id),
	country_id: char({ length: 36 }).references(() => countries.id),
	is_default: tinyint().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_addresses_id"}),
]);

export const supplier_categories = mysqlTable("supplier_categories", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_categories_id"}),
	unique("uq_supplier_categories_org_code").on(table.organization_id, table.code),
]);

export const supplier_contacts = mysqlTable("supplier_contacts", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	first_name: varchar({ length: 128 }).notNull(),
	last_name: varchar({ length: 128 }).notNull(),
	title: varchar({ length: 128 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 64 }),
	is_primary: tinyint().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_contacts_id"}),
]);

export const supplier_documents = mysqlTable("supplier_documents", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	document_id: char({ length: 36 }).notNull().references(() => documents.id),
	doc_kind: varchar({ length: 64 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expires_at: date({ mode: 'string' }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_documents_id"}),
]);

export const supplier_evaluations = mysqlTable("supplier_evaluations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	evaluated_by: char({ length: 36 }).references(() => users.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	evaluated_at: date({ mode: 'string' }).notNull(),
	quality_score: int(),
	delivery_score: int(),
	price_score: int(),
	overall_score: decimal({ precision: 5, scale: 2 }),
	comments: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_evaluations_id"}),
]);

export const supplier_histories = mysqlTable("supplier_histories", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	event_type: varchar({ length: 64 }).notNull(),
	entity_type: varchar({ length: 64 }),
	entity_id: char({ length: 36 }),
	summary: text(),
	amount: decimal({ precision: 18, scale: 4 }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	occurred_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("idx_supplier_histories_supplier").on(table.supplier_id, table.occurred_at),
	primaryKey({ columns: [table.id], name: "supplier_histories_id"}),
]);

export const supplier_payment_terms = mysqlTable("supplier_payment_terms", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	payment_term_id: char({ length: 36 }).notNull().references(() => payment_terms.id),
	is_default: tinyint().default(0).notNull(),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_payment_terms_id"}),
]);

export const supplier_products = mysqlTable("supplier_products", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).notNull().references(() => products.id),
	supplier_sku: varchar({ length: 128 }),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	moq: decimal({ precision: 18, scale: 4 }),
	lead_time_days: int(),
	is_available: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_products_id"}),
	unique("uq_supplier_products").on(table.supplier_id, table.product_id),
]);

export const supplier_quote_items = mysqlTable("supplier_quote_items", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	supplier_quote_id: char({ length: 36 }).notNull().references(() => supplier_quotes.id, { onDelete: "cascade" } ),
	product_id: char({ length: 36 }).references(() => products.id),
	description: text(),
	quantity: decimal({ precision: 18, scale: 4 }).default('1.0000').notNull(),
	unit_price: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	lead_time_days: int(),
	line_total: decimal({ precision: 18, scale: 4 }).default('0.0000').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_quote_items_id"}),
]);

export const supplier_quotes = mysqlTable("supplier_quotes", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	supplier_id: char({ length: 36 }).notNull().references(() => suppliers.id),
	quote_number: varchar({ length: 64 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	quote_date: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	valid_until: date({ mode: 'string' }),
	currency_id: char({ length: 36 }).references(() => currencies.id),
	status: mysqlEnum(['draft','received','selected','rejected','expired']).default('received').notNull(),
	notes: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "supplier_quotes_id"}),
	unique("uq_supplier_quotes_org_number").on(table.organization_id, table.quote_number),
]);

export const suppliers = mysqlTable("suppliers", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	category_id: char({ length: 36 }).references(() => supplier_categories.id),
	country_id: char({ length: 36 }).references(() => countries.id),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 64 }),
	website: varchar({ length: 255 }),
	tax_id: varchar({ length: 64 }),
	rating: decimal({ precision: 5, scale: 2 }),
	status: mysqlEnum(['active','inactive','blacklisted']).default('active').notNull(),
	preferred: tinyint().default(0).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_by: char({ length: 36 }),
	updated_by: char({ length: 36 }),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_suppliers_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "suppliers_id"}),
	unique("uq_suppliers_org_code").on(table.organization_id, table.code),
]);

export const support_tickets = mysqlTable("support_tickets", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	ticket_number: varchar({ length: 64 }).notNull(),
	customer_id: char({ length: 36 }).notNull().references(() => customers.id),
	contact_id: char({ length: 36 }).references(() => customer_contacts.id),
	subject: varchar({ length: 255 }).notNull(),
	description: text(),
	priority: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	status: mysqlEnum(['open','in_progress','waiting','resolved','closed']).default('open').notNull(),
	assigned_to: char({ length: 36 }).references(() => users.id),
	related_serial_number_id: char({ length: 36 }).references(() => serial_numbers.id),
	opened_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	closed_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_support_tickets_org_status").on(table.organization_id, table.status),
	primaryKey({ columns: [table.id], name: "support_tickets_id"}),
	unique("uq_support_tickets_org_number").on(table.organization_id, table.ticket_number),
]);

export const system_settings = mysqlTable("system_settings", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" } ),
	key: varchar({ length: 128 }).notNull(),
	value: json(),
	description: text(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "system_settings_id"}),
	unique("uq_system_settings_org_key").on(table.organization_id, table.key),
]);

export const tasks = mysqlTable("tasks", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	assignee_id: char({ length: 36 }).references(() => users.id),
	created_by: char({ length: 36 }).references(() => users.id),
	priority: mysqlEnum(['low','medium','high']).default('medium').notNull(),
	status: mysqlEnum(['todo','in_progress','done','cancelled']).default('todo').notNull(),
	due_at: datetime({ mode: 'string', fsp: 3 }),
	entity_type: varchar({ length: 64 }),
	entity_id: char({ length: 36 }),
	completed_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_tasks_org_status").on(table.organization_id, table.status),
	index("idx_tasks_entity").on(table.entity_type, table.entity_id),
	primaryKey({ columns: [table.id], name: "tasks_id"}),
]);

export const taxes = mysqlTable("taxes", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).references(() => organizations.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	rate: decimal({ precision: 7, scale: 4 }).default('0.0000').notNull(),
	tax_type: mysqlEnum(['vat','customs','withholding','other']).default('vat').notNull(),
	country_id: char({ length: 36 }).references(() => countries.id),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_taxes_organization").on(table.organization_id),
	primaryKey({ columns: [table.id], name: "taxes_id"}),
]);

export const technicians = mysqlTable("technicians", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	user_id: char({ length: 36 }).references(() => users.id),
	first_name: varchar({ length: 128 }).notNull(),
	last_name: varchar({ length: 128 }).notNull(),
	phone: varchar({ length: 64 }),
	email: varchar({ length: 255 }),
	skills: json(),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "technicians_id"}),
]);

export const units = mysqlTable("units", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	symbol: varchar({ length: 32 }),
	unit_type: mysqlEnum(['count','weight','length','volume','other']).default('count').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "units_id"}),
	unique("uq_units_code").on(table.code),
]);

export const user_roles = mysqlTable("user_roles", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	user_id: char({ length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	role_id: char({ length: 36 }).notNull().references(() => roles.id, { onDelete: "cascade" } ),
	branch_id: char({ length: 36 }).references(() => branches.id),
	assigned_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	assigned_by: char({ length: 36 }).references(() => users.id),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_roles_id"}),
	unique("uq_user_roles").on(table.user_id, table.role_id, table.branch_id),
]);

export const user_sessions = mysqlTable("user_sessions", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	user_id: char({ length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	token_hash: varchar({ length: 255 }).notNull(),
	ip_address: varchar({ length: 64 }),
	user_agent: text(),
	started_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	expires_at: datetime({ mode: 'string', fsp: 3 }).notNull(),
	revoked_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_user_sessions_user").on(table.user_id),
	primaryKey({ columns: [table.id], name: "user_sessions_id"}),
]);

export const users = mysqlTable("users", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id, { onDelete: "set null" } ),
	branch_id: char({ length: 36 }).references((): AnyMySqlColumn => branches.id),
	email: varchar({ length: 255 }).notNull(),
	password_hash: varchar({ length: 255 }).notNull(),
	first_name: varchar({ length: 128 }).notNull(),
	last_name: varchar({ length: 128 }).notNull(),
	phone: varchar({ length: 64 }),
	avatar_url: varchar({ length: 512 }),
	is_active: tinyint().default(1).notNull(),
	last_login_at: datetime({ mode: 'string', fsp: 3 }),
	email_verified_at: datetime({ mode: 'string', fsp: 3 }),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("idx_users_organization").on(table.organization_id),
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("uq_users_email").on(table.email),
]);

export const warehouse_locations = mysqlTable("warehouse_locations", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	warehouse_id: char({ length: 36 }).notNull().references(() => warehouses.id, { onDelete: "cascade" } ),
	code: varchar({ length: 64 }).notNull(),
	aisle: varchar({ length: 64 }),
	rack: varchar({ length: 64 }),
	shelf: varchar({ length: 64 }),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "warehouse_locations_id"}),
	unique("uq_warehouse_locations").on(table.warehouse_id, table.code),
]);

export const warehouses = mysqlTable("warehouses", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	branch_id: char({ length: 36 }).references(() => branches.id),
	code: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: text(),
	city_id: char({ length: 36 }).references(() => cities.id),
	manager_user_id: char({ length: 36 }).references(() => users.id),
	is_active: tinyint().default(1).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	deleted_at: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "warehouses_id"}),
	unique("uq_warehouses_org_code").on(table.organization_id, table.code),
]);

export const warranties = mysqlTable("warranties", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	organization_id: char({ length: 36 }).notNull().references(() => organizations.id),
	product_id: char({ length: 36 }).references(() => products.id),
	serial_number_id: char({ length: 36 }).references(() => serial_numbers.id),
	customer_id: char({ length: 36 }).references(() => customers.id),
	sales_order_id: char({ length: 36 }).references(() => sales_orders.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	start_date: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	end_date: date({ mode: 'string' }),
	warranty_type: mysqlEnum(['manufacturer','seller','extended']).default('seller').notNull(),
	terms: text(),
	status: mysqlEnum(['active','expired','void']).default('active').notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "warranties_id"}),
]);

export const warranty_claims = mysqlTable("warranty_claims", {
	id: char({ length: 36 }).default(sql`(uuid())`).notNull(),
	warranty_id: char({ length: 36 }).notNull().references(() => warranties.id, { onDelete: "cascade" } ),
	ticket_id: char({ length: 36 }).references(() => support_tickets.id),
	claim_number: varchar({ length: 64 }).notNull(),
	description: text(),
	status: mysqlEnum(['submitted','approved','rejected','fulfilled']).default('submitted').notNull(),
	resolution: text(),
	claimed_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	created_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updated_at: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "warranty_claims_id"}),
]);
