/**
 * Mock data for OneClickModelGeneration prototype
 */

export interface DataObject {
  id: string;
  name: string;
  type: 'Model' | 'Table';
  source: string;
  sourceProvider: 'snowflake' | 'dbt' | 'db_connection';
  tags: string[];
  author: string;
  lastModified: string;
}

export const dataObjects: DataObject[] = [
  { id: '1',  name: 'Sales Analytics Model',       type: 'Model', source: 'Sales_Integration',        sourceProvider: 'snowflake',    tags: ['Analysis', 'Sales'],      author: 'Alice Styles',  lastModified: '3 days ago' },
  { id: '2',  name: 'Inventory Model',              type: 'Model', source: 'Inventory_Integration',    sourceProvider: 'dbt',          tags: ['Sales'],                  author: 'Mark Rivera',   lastModified: '20 days ago' },
  { id: '3',  name: 'fact_orders',                  type: 'Table', source: 'snowflake_prod_connection', sourceProvider: 'snowflake',    tags: [],                         author: 'Priya Patel',   lastModified: '1 month ago' },
  { id: '4',  name: 'Customer Segments Model',      type: 'Model', source: 'CRM_Integration',          sourceProvider: 'snowflake',    tags: ['Analysis', 'CRM'],        author: 'David Chen',    lastModified: '5 days ago' },
  { id: '5',  name: 'dim_products',                 type: 'Table', source: 'snowflake_prod_connection', sourceProvider: 'snowflake',    tags: [],                         author: 'Priya Patel',   lastModified: '45 days ago' },
  { id: '6',  name: 'Marketing Attribution Model',  type: 'Model', source: 'Marketing_dbt',            sourceProvider: 'dbt',          tags: ['Marketing', 'Analysis'],  author: 'Sarah Kim',     lastModified: '2 weeks ago' },
  { id: '7',  name: 'dim_customers',                type: 'Table', source: 'postgres_prod',            sourceProvider: 'db_connection', tags: [],                         author: 'Alice Styles',  lastModified: '3 months ago' },
  { id: '8',  name: 'Finance Model',                type: 'Model', source: 'Finance_Integration',      sourceProvider: 'snowflake',    tags: ['Finance'],                author: 'Mark Rivera',   lastModified: '1 week ago' },
  { id: '9',  name: 'fact_transactions',            type: 'Table', source: 'postgres_prod',            sourceProvider: 'db_connection', tags: [],                         author: 'David Chen',    lastModified: '2 months ago' },
  { id: '10', name: 'HR Analytics Model',           type: 'Model', source: 'HR_Integration',           sourceProvider: 'snowflake',    tags: ['HR'],                     author: 'Sarah Kim',     lastModified: '4 days ago' },
  { id: '11', name: 'dim_employees',                type: 'Table', source: 'postgres_prod',            sourceProvider: 'db_connection', tags: [],                         author: 'David Chen',    lastModified: '2 weeks ago' },
  { id: '12', name: 'Supply Chain Model',           type: 'Model', source: 'ERP_Integration',          sourceProvider: 'dbt',          tags: ['Operations'],             author: 'Priya Patel',   lastModified: '6 days ago' },
  { id: '13', name: 'fact_returns',                 type: 'Table', source: 'snowflake_prod_connection', sourceProvider: 'snowflake',    tags: [],                         author: 'Mark Rivera',   lastModified: '3 weeks ago' },
  { id: '14', name: 'Revenue Forecast Model',       type: 'Model', source: 'Finance_Integration',      sourceProvider: 'snowflake',    tags: ['Finance', 'Analysis'],    author: 'Alice Styles',  lastModified: '1 day ago' },
  { id: '15', name: 'dim_stores',                   type: 'Table', source: 'snowflake_prod_connection', sourceProvider: 'snowflake',    tags: [],                         author: 'Priya Patel',   lastModified: '5 weeks ago' },
  { id: '16', name: 'Product Performance Model',    type: 'Model', source: 'Sales_Integration',        sourceProvider: 'snowflake',    tags: ['Sales', 'Analysis'],      author: 'David Chen',    lastModified: '10 days ago' },
  { id: '17', name: 'fact_web_events',              type: 'Table', source: 'Marketing_dbt',            sourceProvider: 'dbt',          tags: [],                         author: 'Sarah Kim',     lastModified: '1 month ago' },
  { id: '18', name: 'Customer Lifetime Value Model',type: 'Model', source: 'CRM_Integration',          sourceProvider: 'snowflake',    tags: ['CRM', 'Marketing'],       author: 'Alice Styles',  lastModified: '8 days ago' },
];

export interface DataConnection {
  id: string;
  name: string;
  color: string;
  source: 'Snowflake' | 'Redshift' | 'BigQuery' | 'Databricks';
  created: string;
  modified: string;
  tags: string[];
  tables: number;
  desc: string;
  author: string;
}

export const dataConnections: DataConnection[] = [
  { id: 'c01', name: 'Snowflake Production',         color: '#2770EF', source: 'Snowflake',  created: '4 Mar 2018',  modified: '2 May 2024',  tags: ['Core', 'Production'],                  tables: 84,  desc: 'Primary production Snowflake warehouse serving all enterprise analytics workloads across sales, finance, and operations.',        author: 'Alice Styles' },
  { id: 'c02', name: 'Sales and Revenue',    color: '#2770EF', source: 'Snowflake',  created: '11 Jun 2019', modified: '18 Jan 2025', tags: ['Sales', 'Revenue', 'CRM'],             tables: 42,  desc: 'Consolidated sales pipeline, quota attainment, and ARR data sourced from Salesforce and billing systems via Snowflake.',          author: 'David Chen' },
  { id: 'c03', name: 'Marketing Analytics Hub',      color: '#E8572A', source: 'Redshift',   created: '22 Aug 2019', modified: '30 Oct 2024', tags: ['Marketing', 'Attribution', 'Campaigns'], tables: 29, desc: 'Multi-touch attribution, campaign spend, and lead funnel data aggregated from paid channels into Redshift.',                     author: 'Sarah Kim' },
  { id: 'c04', name: 'Product Telemetry — BigQuery', color: '#4285F4', source: 'BigQuery',   created: '3 Feb 2020',  modified: '14 Mar 2025', tags: ['Product', 'Usage', 'Events'],          tables: 67,  desc: 'High-volume clickstream and feature usage events streamed from the product backend into BigQuery via Pub/Sub.',                   author: 'Priya Patel' },
  { id: 'c05', name: 'Finance & Billing DW',         color: '#2770EF', source: 'Snowflake',  created: '17 Apr 2020', modified: '5 Feb 2025',  tags: ['Finance', 'Billing', 'Revenue'],       tables: 36,  desc: 'Stripe billing records, invoice history, and subscription lifecycle data loaded nightly into the Snowflake finance schema.',       author: 'Mark Rivera' },
  { id: 'c06', name: 'Customer 360 — Redshift',      color: '#E8572A', source: 'Redshift',   created: '9 Jul 2020',  modified: '22 Nov 2024', tags: ['Customer', 'CRM', 'Support'],          tables: 51,  desc: 'Unified customer profile combining CRM, support tickets, and product usage signals into a single Redshift cluster.',               author: 'Alice Styles' },
  { id: 'c07', name: 'Lakehouse — Databricks',       color: '#FF3621', source: 'Databricks', created: '30 Sep 2020', modified: '8 Apr 2025',  tags: ['Lakehouse', 'ML', 'Operations'],       tables: 118, desc: 'Delta Lake on Databricks serving feature store, ML training data, and operational ODS tables for real-time scoring pipelines.',   author: 'James Okafor' },
  { id: 'c08', name: 'Supply Chain & Inventory',     color: '#FF3621', source: 'Databricks', created: '14 Jan 2021', modified: '27 Jan 2025', tags: ['Operations', 'Inventory', 'Logistics'], tables: 33, desc: 'ERP-sourced inventory levels, purchase orders, and logistics data processed through Databricks and landed in the gold layer.',    author: 'Priya Patel' },
  { id: 'c09', name: 'Growth Experiments — BQ',      color: '#4285F4', source: 'BigQuery',   created: '5 Mar 2021',  modified: '19 Dec 2024', tags: ['Growth', 'Experimentation', 'Product'], tables: 24, desc: 'A/B test assignments, experiment metrics, and rollout analytics stored in BigQuery by the growth engineering team.',              author: 'Sarah Kim' },
  { id: 'c10', name: 'HR & Workforce Analytics',     color: '#2770EF', source: 'Snowflake',  created: '20 May 2021', modified: '3 Mar 2025',  tags: ['HR', 'Workforce', 'People Ops'],       tables: 19,  desc: 'Headcount, attrition, compensation, and recruiting funnel data from Workday and Greenhouse, unified in Snowflake.',               author: 'David Chen' },
  { id: 'c11', name: 'Ad Platform — Redshift',       color: '#E8572A', source: 'Redshift',   created: '8 Aug 2021',  modified: '11 Feb 2025', tags: ['Marketing', 'Advertising', 'Spend'],   tables: 22,  desc: 'Google Ads, Meta, and LinkedIn campaign data consolidated into Redshift for cross-channel spend and ROAS reporting.',             author: 'Mark Rivera' },
  { id: 'c12', name: 'Snowflake Staging',            color: '#2770EF', source: 'Snowflake',  created: '1 Oct 2021',  modified: '25 Apr 2025', tags: ['Staging', 'Dev', 'QA'],                tables: 78,  desc: 'Non-production Snowflake environment mirroring the production schema, used for model development and QA validation.',             author: 'James Okafor' },
  { id: 'c13', name: 'E-commerce Transactions',      color: '#4285F4', source: 'BigQuery',   created: '16 Dec 2021', modified: '7 May 2025',  tags: ['E-commerce', 'Orders', 'Payments'],    tables: 45,  desc: 'Order lifecycle, cart abandonment, payment events, and refund data from Shopify streamed into BigQuery for revenue analytics.',   author: 'Alice Styles' },
  { id: 'c14', name: 'Security & Audit Logs',        color: '#FF3621', source: 'Databricks', created: '7 Feb 2022',  modified: '30 Mar 2025', tags: ['Security', 'Audit', 'Compliance'],     tables: 12,  desc: 'IAM access logs, audit trail, and anomaly detection features processed in Databricks to support compliance and SIEM pipelines.',  author: 'Priya Patel' },
  { id: 'c15', name: 'Partner Data Exchange',        color: '#E8572A', source: 'Redshift',   created: '22 Apr 2022', modified: '16 Jan 2025', tags: ['Partners', 'External', 'Revenue'],     tables: 17,  desc: 'Inbound partner-sourced deal registrations, co-sell activity, and marketplace transactions synced into the Redshift data warehouse.', author: 'Sarah Kim' },
  { id: 'c16', name: 'Data Science Feature Store',   color: '#FF3621', source: 'Databricks', created: '10 Jun 2022', modified: '21 Apr 2025', tags: ['ML', 'Features', 'Data Science'],      tables: 58,  desc: 'Curated feature tables managed by the data science team on Databricks, serving real-time and batch inference for production models.', author: 'James Okafor' },
  { id: 'c17', name: 'Snowflake — APAC Region',      color: '#2770EF', source: 'Snowflake',  created: '3 Sep 2022',  modified: '9 May 2025',  tags: ['APAC', 'Regional', 'Production'],      tables: 61,  desc: 'Regional Snowflake deployment for APAC markets, hosting localised transaction, support, and customer data in compliance with data residency requirements.', author: 'David Chen' },
  { id: 'c18', name: 'IoT Sensor Streams — BQ',      color: '#4285F4', source: 'BigQuery',   created: '19 Nov 2022', modified: '2 Feb 2025',  tags: ['IoT', 'Sensors', 'Operations'],        tables: 38,  desc: 'Real-time telemetry from factory floor sensors and connected devices, ingested via Dataflow into BigQuery for operational monitoring.', author: 'Mark Rivera' },
];

export const mockDatasets: Record<string, any> = {
  retail: {
    tables: [
      { name: 'customers', rows: 15000, columns: 12 },
      { name: 'orders', rows: 85000, columns: 8 },
      { name: 'products', rows: 5000, columns: 10 },
      { name: 'categories', rows: 25, columns: 3 },
      { name: 'order_items', rows: 250000, columns: 5 },
      { name: 'payments', rows: 85000, columns: 6 },
    ],
  },
};

export const mockAIResponses = [
  "Based on the dataset structure, I suggest creating relationships between orders and customers via customer_id, and between orders and products through order_items table.",
  "I've identified several fields that could benefit from indexing: customer_id, order_date, and product_id for faster queries.",
  "Consider adding a calculated field for total_order_value by aggregating order_items. This will improve dashboard performance.",
  "Your schema looks well-normalized. The order_items junction table properly handles the many-to-many relationship between orders and products.",
];
